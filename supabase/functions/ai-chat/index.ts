import { createId } from "npm:@paralleldrive/cuid2@2.2.2";
import { callGroq } from "../_shared/groq.ts";
import { jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { getSupabaseAuthUser } from "../_shared/supabase-auth.ts";
import { resolveAppUserId } from "../_shared/resolve-app-user-id.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

/**
 * =============================================================================
 * ASISTENTE IA COACH (AI CHAT)
 * =============================================================================
 * Controlador Edge Function para el chat asistido por IA (MetaForce Coach).
 * 
 * Responsabilidades:
 * 1. Validar identidad e interactuar con el modelo LLM Gemini.
 * 2. Cargar perfil, medidas e historial de entrenamiento como contexto del prompt.
 * 3. Producir e inyectar respuestas formatadas, extrayendo estructuras de rutinas.
 * 4. Persistir la transcripción de la conversación (Prompt/Response) vinculada al usuario.
 */

/**
 * Controlador asíncrono para ingesta de consultas hacia el entrenador de IA.
 * Inicializa variables contextuales de usuario, delega el cálculo al LLM y parsea el resultado.
 *
 * @param req - Objeto de solicitud HTTP Request con payload JSON.
 * @returns Objeto Response con el texto de la IA y el JSON de plan generado si procede.
 */
Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return preflight();

    if (req.method !== "POST") {
      return jsonResponse({ message: "Method not allowed" }, 405);
    }

    console.log("[ai-chat] start request");

    const auth = await getSupabaseAuthUser(req);
    if (auth instanceof Response) {
      console.warn("[ai-chat] auth failed");
      return auth;
    }
    console.log("[ai-chat] auth ok user=", auth.id);

    const sb = getSupabaseAdmin();

    // Rate limiting por usuario autenticado para evitar abuso del chat de IA.
    const rl = checkRateLimit({
      key: `ai-chat:${auth.id}`,
      limit: 20,         // máx. 20 mensajes por minuto
      windowMs: 60_000,  // ventana de 1 minuto
    });
    if (!rl.allowed) {
      console.warn("[ai-chat] rate limit exceeded for", auth.id);
      return jsonResponse({
        message:
          "Has superado el límite de peticiones al chat de IA. Inténtalo de nuevo en unos minutos.",
      }, 429);
    }
    const userId = await resolveAppUserId(sb, auth.id);
    if (!userId) {
      console.warn("[ai-chat] app user not found for auth=", auth.id);
      return jsonResponse({ message: "Perfil de aplicación no encontrado" }, 403);
    }
    console.log("[ai-chat] resolved appUserId=", userId);

    let body: { message?: string; sessionId?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ message: "JSON inválido" }, 400);
    }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return jsonResponse({ message: "message requerido" }, 400);
    }
    const inputSessionId = typeof body.sessionId === "string"
      ? body.sessionId.trim()
      : undefined;

    let session: { id: string; userId: string; title: string | null } | null = null;

    if (inputSessionId) {
      const { data, error } = await sb.from("AiChatSession").select("id, userId, title").eq(
        "id",
        inputSessionId,
      ).eq("userId", userId).maybeSingle();
      if (error) console.warn("[ai-chat] session lookup error:", error.message);
      if (data) session = data as typeof session;
    }

    if (!session) {
      const newId = createId();
      const nowIso = new Date().toISOString();
      const { data, error } = await sb.from("AiChatSession").insert({
        id: newId,
        userId,
        title: "Nuevo Chat",
        createdAt: nowIso,
        updatedAt: nowIso,
      }).select("id, userId, title").single();
      if (error || !data) {
        console.error("[ai-chat] create session error:", error);
        return jsonResponse({ message: error?.message ?? "No se pudo crear sesión" }, 500);
      }
      session = data as typeof session;
    }
    console.log("[ai-chat] session id=", session.id);

    {
      const { error } = await sb.from("AiChatMessage").insert({
        id: createId(),
        sessionId: session.id,
        role: "user",
        content: message,
      });
      if (error) console.warn("[ai-chat] insert user msg error:", error.message);
    }

    const { data: sessionMsgs, error: sessionMsgsError } = await sb.from("AiChatMessage").select(
      "role, content, createdAt",
    ).eq("sessionId", session.id).order("createdAt", { ascending: true }).limit(20);
    if (sessionMsgsError) {
      console.warn("[ai-chat] sessionMsgs error:", sessionMsgsError.message);
    }

    const { data: user, error: userError } = await sb.from("User").select(
      "name, gender, birthDate, height, currentWeight, medicalNotes",
    ).eq("id", userId).maybeSingle();
    if (userError) console.warn("[ai-chat] user error:", userError.message);

    const { data: recentLogs, error: recentLogsError } = await sb.from(
      "ExerciseLog",
    ).select(
      "date, weight, reps, sets, exerciseId",
    ).eq("userId", userId).order("date", { ascending: false }).limit(10);
    if (recentLogsError) {
      console.warn("[ai-chat] recentLogs error:", recentLogsError.message);
    }

    const { data: lastWeights, error: bwErr } = await sb.from(
      "BodyWeightRecord",
    ).select("date, weight").eq("userId", userId).order("date", {
      ascending: false,
    }).limit(5);
    if (bwErr) {
      console.warn("[ai-chat] bodyWeight error:", bwErr.message);
    }

    const { data: lastExerciseRecords, error: erErr } = await sb.from(
      "ExerciseRecord",
    ).select(
      "date, weight, reps, exercise:Exercise(id, name)",
    ).eq("userId", userId).order("date", { ascending: false }).limit(10);
    if (erErr) {
      console.warn("[ai-chat] exerciseRecord error:", erErr.message);
    }

    const { data: recentEvents, error: evErr } = await sb.from(
      "PerformanceEvent",
    ).select("kind, severity, payload, createdAt").eq("userId", userId).order(
      "createdAt",
      { ascending: false },
    ).limit(5);
    if (evErr) {
      console.warn("[ai-chat] events error:", evErr.message);
    }

    const exIds = [...new Set((recentLogs ?? []).map((l) => l.exerciseId))];
    const exNameById: Record<string, string> = {};
    if (exIds.length) {
      const { data: exercises, error: exErr } = await sb.from("Exercise").select("id, name").in(
        "id",
        exIds,
      );
      if (exErr) console.warn("[ai-chat] exercises error:", exErr.message);
      for (const e of exercises ?? []) {
        exNameById[(e as { id: string }).id] = (e as { name: string }).name;
      }
    }

    let profileContext = "";
    if (user) {
      const u = user as Record<string, unknown>;
      const logLines = (recentLogs ?? []).map((l) => {
        const row = l as Record<string, unknown>;
        const en = exNameById[String(row.exerciseId)] ?? "?";
        const d = row.date ? new Date(String(row.date)).toLocaleDateString() : "";
        return `- ${en}: ${row.weight}kg x ${row.reps} reps (${row.sets} series) el ${d}`;
      }).join("\n") || "Sin historial reciente.";
      const bwLines = (lastWeights ?? []).map((w) => {
        const row = w as { date?: string; weight?: number };
        const d = row.date ? new Date(String(row.date)).toLocaleDateString() : "";
        return `- ${row.weight ?? "?"}kg el ${d}`;
      }).join("\n") || "Sin registros de peso recientes.";

      const exRecLines = (lastExerciseRecords ?? []).map((r) => {
        const row = r as {
          date?: string;
          weight?: number;
          reps?: number;
          exercise?: { id?: string; name?: string };
        };
        const d = row.date ? new Date(String(row.date)).toLocaleDateString() : "";
        const name = row.exercise?.name ?? "?";
        return `- ${name}: ${row.weight ?? "?"}kg x ${row.reps ?? "?"} reps el ${d}`;
      }).join("\n") || "Sin registros recientes en Performance.";

      const eventLines = (recentEvents ?? []).map((e) => {
        const row = e as {
          kind?: string;
          severity?: string;
          payload?: { summary?: string };
          createdAt?: string;
        };
        const d = row.createdAt
          ? new Date(String(row.createdAt)).toLocaleDateString()
          : "";
        const summary = row.payload?.summary ??
          "Evento de rendimiento registrado.";
        return `- [${row.severity ?? "info"}] ${row.kind ?? "EVENT"}: ${summary} (${d})`;
      }).join("\n") || "Sin eventos recientes.";

      profileContext = `DATOS DEL USUARIO:
        - Nombre: ${u.name}
        - Género: ${u.gender ?? "No especificado"}
        - Altura: ${u.height != null ? `${u.height}cm` : "No especificada"}
        - Peso actual: ${u.currentWeight != null ? `${u.currentWeight}kg` : "No especificado"}
        - Notas médicas/Otros: ${u.medicalNotes ?? "Ninguna"}
        
        HISTORIAL RECIENTE (LOGS PUROS):
        ${logLines}

        HISTORIAL DE PESO CORPORAL (Performance):
        ${bwLines}

        HISTORIAL DE EJERCICIOS (Performance):
        ${exRecLines}

        EVENTOS RECIENTES DE PERFORMANCE:
        ${eventLines}

        Usa estos datos para personalizar tus recomendaciones. Si el peso ha subido o bajado, o si tiene notas médicas, adapta la intensidad.`;
    }

    const systemPrompt = `
        Eres "MetaForce Coach", un asistente experto EXCLUSIVAMENTE en gimnasio, fitness, nutrición y salud deportiva.
        Tu tono es motivador, profesional y directo.
        
        ${profileContext}
        
        REGLAS CRÍTICAS:
        1. Si el usuario pregunta sobre CUALQUIER tema que no sea deporte, dieta o salud (ej: política, cine, matemáticas), DEBES rechazar responder educadamente.
        2. Puedes generar rutinas de entrenamiento y planes de nutrición. Si el usuario los solicita, debes responder con un mensaje explicativo y amigable en lenguaje natural (ej: "Vale, te he preparado el plan que me has pedido...") y añadir al final de tu respuesta un bloque de código conteniendo el JSON estructurado.
        
        El bloque de código debe ser estrictamente en formato \`\`\`json ... \`\`\` y contener un JSON válido y limpio (sin comentarios en su interior):
        {
            "plan": {
                "type": "WORKOUT",
                "name": "Nombre del Plan",
                "description": "Breve descripción",
                "days": [
                    {
                        "dayOfWeek": 1,
                        "items": [ 
                            {
                                "name": "Nombre Ejercicio o Comida",
                                "sets": 4, 
                                "reps": 10, 
                                "quantity": "1 porción", 
                                "notes": "Notas adicionales" 
                            }
                        ]
                    }
                ]
            }
        }

        Especificaciones del JSON:
        - "type": Debe ser "WORKOUT" para planes de entrenamiento, o "DIET" para planes de nutrición (dietas).
        - "dayOfWeek": Debe ser un número entero de 0 a 6 que represente el día de la semana (0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado). Usa estrictamente el número entero correcto para cada día solicitado.
        - "items": Array con los ejercicios (en WORKOUT) o comidas (en DIET) planificados para ese día.
    `;

    const historyContext = (sessionMsgs ?? []).map((m) => {
      const row = m as { role: string; content: string };
      return `${row.role === "user" ? "Usuario" : "Tu"}: ${row.content}`;
    }).join("\n");

    const fullPrompt = `${historyContext}\nUsuario: ${message}\nTu respuesta:`;

    let aiRawResponse: string;
    try {
      aiRawResponse = await callGroq(systemPrompt, fullPrompt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error IA";
      console.error("[ai-chat] callGroq failed:", msg, e instanceof Error ? e.stack : e);
      return jsonResponse({ message: msg }, 500);
    }

    let finalMessage = aiRawResponse;
    let generatedPlan: unknown;

    const jsonMatch = aiRawResponse.match(/```json([\s\S]*?)```/);
    if (jsonMatch?.[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]) as { plan?: unknown };
        if (parsed.plan) {
          generatedPlan = parsed.plan;
          finalMessage = aiRawResponse.replace(/```json[\s\S]*?```/, "(Ver rutina generada abajo)").trim();
        }
      } catch {
        console.warn("[ai-chat] fallo al parsear JSON de rutina");
      }
    }

    {
      const { error } = await sb.from("AiChatMessage").insert({
        id: createId(),
        sessionId: session.id,
        role: "model",
        content: finalMessage,
      });
      if (error) console.warn("[ai-chat] insert model msg error:", error.message);
    }

    {
      const { error } = await sb.from("AiChatSession").update({
        updatedAt: new Date().toISOString(),
      }).eq("id", session.id);
      if (error) console.warn("[ai-chat] update session error:", error.message);
    }

    const response: Record<string, unknown> = {
      message: finalMessage,
    };
    if (generatedPlan !== undefined) response.plan = generatedPlan;

    console.log("[ai-chat] success");
    return jsonResponse({
      sessionId: session.id,
      response,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[ai-chat] UNCAUGHT:", msg, stack);
    return jsonResponse({ message: `Error interno: ${msg}` }, 500);
  }
});
