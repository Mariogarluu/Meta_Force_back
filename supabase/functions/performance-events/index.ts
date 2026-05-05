import { jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { getSupabaseAuthUser } from "../_shared/supabase-auth.ts";
import { resolveAppUserId } from "../_shared/resolve-app-user-id.ts";
import { callGroq } from "../_shared/groq.ts";
import { createId } from "npm:@paralleldrive/cuid2@2.2.2";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type Severity = "info" | "success" | "warning" | "critical";

type DetectKind = "BODY_WEIGHT" | "EXERCISE_RECORD";

type DetectRequest = {
  action: "detect";
  kind: DetectKind;
  recordId: string;
};

type ListRequest = {
  action: "list";
};

type AckRequest = {
  action: "ack";
  id: string;
};

type RequestBody = DetectRequest | ListRequest | AckRequest;

async function detectForBodyWeight(
  sb: SupabaseClient,
  userId: string,
  recordId: string,
) {
  const { data: latest, error: latestErr } = await sb.from("BodyWeightRecord")
    .select("id, weight, date")
    .eq("userId", userId)
    .order("date", { ascending: false })
    .limit(30);
  if (latestErr || !latest?.length) return;

  const sorted = [...latest].sort((a, b) =>
    new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime()
  );

  const points = sorted.map((r) => ({
    t: new Date(String(r.date)).getTime(),
    w: Number((r as { weight: number }).weight),
  }));
  if (points.length < 4) return;

  const first = points[0];
  const last = points[points.length - 1];
  const days = (last.t - first.t) / (1000 * 60 * 60 * 24) || 1;
  const slope = (last.w - first.w) / days;

  const severity: Severity = slope < -0.05 ? "warning" : "info";

  const payload = {
    summary: slope < 0
      ? "Tu peso corporal ha bajado de forma sostenida en las últimas semanas."
      : "Tu peso corporal se ha mantenido estable o con ligera variación.",
    slopePerDay: slope,
    fromKg: first.w,
    toKg: last.w,
    days,
    lastRecordId: recordId,
  };

  await insertEventAndMaybeCoachMessage(
    sb,
    userId,
    "WEIGHT_REGRESSION",
    severity,
    payload,
  );
}

function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

async function detectForExerciseRecord(
  sb: SupabaseClient,
  userId: string,
  recordId: string,
) {
  const { data: rec, error: recErr } = await sb.from("ExerciseRecord")
    .select("id, exerciseId, weight, reps, date")
    .eq("id", recordId)
    .maybeSingle();
  if (recErr || !rec) return;

  const exerciseId = (rec as { exerciseId: string }).exerciseId;
  if (!exerciseId) return;

  const { data: history, error: histErr } = await sb.from("ExerciseRecord")
    .select("id, weight, reps, date")
    .eq("userId", userId)
    .eq("exerciseId", exerciseId)
    .order("date", { ascending: true });
  if (histErr || !history?.length) return;

  const ordered = [...history];
  const oneRms = ordered.map((r) =>
    estimate1RM(
      Number((r as { weight: number }).weight),
      Number((r as { reps: number }).reps),
    )
  );

  const exerciseName = await lookupExerciseName(sb, exerciseId);

  const newIdx = ordered.findIndex((r) => (r as { id: string }).id === recordId);
  if (newIdx === -1) return;
  const prevMax = Math.max(...oneRms.slice(0, newIdx));
  const new1RM = oneRms[newIdx];

  if (newIdx > 0 && new1RM > prevMax) {
    await insertEventAndMaybeCoachMessage(
      sb,
      userId,
      "PR_1RM",
      "success",
      {
        summary:
          `Has batido tu 1RM en ${exerciseName} (+${new1RM - prevMax} kg).`,
        exerciseId,
        exerciseName,
        prev1RM: prevMax,
        new1RM,
        deltaKg: new1RM - prevMax,
      },
    );
  }

  const recentWindow = ordered.slice(-5);
  if (recentWindow.length >= 3) {
    const recent1RMs = recentWindow.map((r) =>
      estimate1RM(
        Number((r as { weight: number }).weight),
        Number((r as { reps: number }).reps),
      )
    );
    const maxRecent = Math.max(...recent1RMs);
    const allMax = Math.max(...oneRms);
    const sameMax = Math.abs(maxRecent - allMax) < 1e-6;
    const lastDates = recentWindow.map((r) =>
      new Date(String((r as { date: string }).date)).getTime()
    );
    const spanDays = (Math.max(...lastDates) - Math.min(...lastDates)) /
      (1000 * 60 * 60 * 24);

    if (sameMax && spanDays >= 14) {
      await insertEventAndMaybeCoachMessage(
        sb,
        userId,
        "PLATEAU_EXERCISE",
        "warning",
        {
          summary:
            `Llevas varias sesiones sin mejorar tu 1RM en ${exerciseName}.`,
          exerciseId,
          exerciseName,
          sessionsCount: recentWindow.length,
          daysSpan: spanDays,
        },
      );
    }
  }
}

async function lookupExerciseName(
  sb: SupabaseClient,
  exerciseId: string,
): Promise<string> {
  const { data, error } = await sb.from("Exercise").select("name").eq(
    "id",
    exerciseId,
  ).maybeSingle();
  if (error || !data) return "Ejercicio";
  return (data as { name?: string }).name ?? "Ejercicio";
}

async function insertEventAndMaybeCoachMessage(
  sb: SupabaseClient,
  userId: string,
  kind: string,
  severity: Severity,
  payload: Record<string, unknown>,
) {
  const id = createId();
  const nowIso = new Date().toISOString();
  const { error } = await sb.from("PerformanceEvent").insert({
    id,
    userId,
    kind,
    severity,
    payload,
    createdAt: nowIso,
  });
  if (error) {
    console.warn("[performance-events] insert event error:", error.message);
    return;
  }

  if (severity === "info") return;

  try {
    const { data: user, error: userErr } = await sb.from("User").select(
      "name, gender, birthDate, height, currentWeight",
    ).eq("id", userId).maybeSingle();
    if (userErr) {
      console.warn("[performance-events] user fetch error:", userErr.message);
    }

    const profile = user
      ? JSON.stringify(user)
      : "{}";

    const systemPrompt =
      'Eres "MetaForce Coach". Da una respuesta breve (máximo 4 frases) reaccionando a un evento de rendimiento y sugiere el siguiente paso práctico.';
    const userPrompt =
      `EVENTO: ${kind}\nSEVERIDAD: ${severity}\nUSUARIO: ${profile}\nDETALLE: ${JSON.stringify(
        payload,
      )}\n\nRedacta un mensaje corto y motivador para el usuario.`;

    const text = await callGroq(systemPrompt, userPrompt);

    const { data: lastSession } = await sb.from("AiChatSession").select(
      "id",
    ).eq("userId", userId).order("updatedAt", { ascending: false }).limit(1)
      .maybeSingle();

    let sessionId: string;
    if (lastSession && (lastSession as { id?: string }).id) {
      sessionId = (lastSession as { id: string }).id;
    } else {
      sessionId = createId();
      const { error: sErr } = await sb.from("AiChatSession").insert({
        id: sessionId,
        userId,
        title: "Seguimiento automático",
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      if (sErr) {
        console.warn(
          "[performance-events] create session error:",
          sErr.message,
        );
        return;
      }
    }

    const { error: mErr } = await sb.from("AiChatMessage").insert({
      id: createId(),
      sessionId,
      role: "model",
      content: text,
    });
    if (mErr) {
      console.warn(
        "[performance-events] insert coach message error:",
        mErr.message,
      );
    }

    const { error: uErr } = await sb.from("AiChatSession").update({
      updatedAt: new Date().toISOString(),
    }).eq("id", sessionId);
    if (uErr) {
      console.warn(
        "[performance-events] update session error:",
        uErr.message,
      );
    }

    const { error: eErr } = await sb.from("PerformanceEvent").update({
      consumedByAiAt: new Date().toISOString(),
    }).eq("id", id);
    if (eErr) {
      console.warn(
        "[performance-events] mark consumed error:",
        eErr.message,
      );
    }
  } catch (e) {
    console.warn("[performance-events] coach message failed:", e);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return preflight();

    if (req.method !== "POST") {
      return jsonResponse({ message: "Method not allowed" }, 405);
    }

    const auth = await getSupabaseAuthUser(req);
    if (auth instanceof Response) return auth;
    const sb = getSupabaseAdmin();
    const userId = await resolveAppUserId(sb, auth.id);
    if (!userId) {
      return jsonResponse({ message: "Perfil de aplicación no encontrado" }, 403);
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ message: "JSON inválido" }, 400);
    }

    if (body.action === "detect") {
      if (!body.recordId) {
        return jsonResponse({ message: "recordId requerido" }, 400);
      }
      if (body.kind === "BODY_WEIGHT") {
        await detectForBodyWeight(sb, userId, body.recordId);
      } else if (body.kind === "EXERCISE_RECORD") {
        await detectForExerciseRecord(sb, userId, body.recordId);
      }
      return jsonResponse({ ok: true });
    }

    if (body.action === "list") {
      const { data, error } = await sb.from("PerformanceEvent").select(
        "id, kind, severity, payload, createdAt, acknowledgedAt",
      ).eq("userId", userId).order("createdAt", { ascending: false }).limit(20);
      if (error) {
        return jsonResponse({ message: "Error listando eventos" }, 500);
      }
      return jsonResponse(data ?? []);
    }

    if (body.action === "ack") {
      if (!body.id) {
        return jsonResponse({ message: "id requerido" }, 400);
      }
      const { error } = await sb.from("PerformanceEvent").update({
        acknowledgedAt: new Date().toISOString(),
      }).eq("id", body.id).eq("userId", userId);
      if (error) {
        return jsonResponse({ message: "Error marcando evento" }, 500);
      }
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ message: "Acción no soportada" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[performance-events] UNCAUGHT:", msg);
    return jsonResponse({ message: `Error interno: ${msg}` }, 500);
  }
});

