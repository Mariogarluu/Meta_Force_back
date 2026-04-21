import { createId } from "npm:@paralleldrive/cuid2@2.2.2";
import { callGemini } from "../_shared/gemini.ts";
import { jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { getSupabaseAuthUser } from "../_shared/supabase-auth.ts";
import { resolveAppUserId } from "../_shared/resolve-app-user-id.ts";

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
    const { data } = await sb.from("AiChatSession").select("id, userId, title").eq(
      "id",
      inputSessionId,
    ).eq("userId", userId).maybeSingle();
    if (data) session = data as typeof session;
  }

  if (!session) {
    const newId = createId();
    const { data, error } = await sb.from("AiChatSession").insert({
      id: newId,
      userId,
      title: "Nuevo Chat",
    }).select("id, userId, title").single();
    if (error || !data) {
      return jsonResponse({ message: error?.message ?? "No se pudo crear sesión" }, 500);
    }
    session = data as typeof session;
  }

  await sb.from("AiChatMessage").insert({
    id: createId(),
    sessionId: session.id,
    role: "user",
    content: message,
  });

  const { data: sessionMsgs } = await sb.from("AiChatMessage").select(
    "role, content, createdAt",
  ).eq("sessionId", session.id).order("createdAt", { ascending: true }).limit(20);

  const { data: user } = await sb.from("User").select(
    "name, gender, birthDate, height, currentWeight, medicalNotes",
  ).eq("id", userId).maybeSingle();

  const { data: recentLogs } = await sb.from("ExerciseLog").select(
    "date, weight, reps, sets, exerciseId",
  ).eq("userId", userId).order("date", { ascending: false }).limit(10);

  const exIds = [...new Set((recentLogs ?? []).map((l) => l.exerciseId))];
  const exNameById: Record<string, string> = {};
  if (exIds.length) {
    const { data: exercises } = await sb.from("Exercise").select("id, name").in(
      "id",
      exIds,
    );
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

    profileContext = `DATOS DEL USUARIO:
        - Nombre: ${u.name}
        - Género: ${u.gender ?? "No especificado"}
        - Altura: ${u.height != null ? `${u.height}cm` : "No especificada"}
        - Peso actual: ${u.currentWeight != null ? `${u.currentWeight}kg` : "No especificado"}
        - Notas médicas/Otros: ${u.medicalNotes ?? "Ninguna"}
        
        ÚLTIMO RENDIMIENTO (HISTORIAL):
        ${logLines}

        Usa estos datos para personalizar tus recomendaciones. Si el peso ha subido o bajado, o si tiene notas médicas, adapta la intensidad.`;
  }

  const systemPrompt = `
        Eres "MetaForce Coach", un asistente experto EXCLUSIVAMENTE en gimnasio, fitness, nutrición y salud deportiva.
        Tu tono es motivador, profesional y directo.
        
        ${profileContext}
        
        REGLAS CRÍTICAS:
        1. Si el usuario pregunta sobre CUALQUIER tema que no sea deporte, dieta o salud (ej: política, cine, matemáticas), DEBES rechazar responder educadamente.
        2. Puedes generar rutinas de ejercicios. Si el usuario pide una rutina, devuelve un JSON ESTRUCTURADO dentro de un bloque de código \`\`\`json ... \`\`\`.
        
        Estructura JSON:
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
    `;

  const historyContext = (sessionMsgs ?? []).map((m) => {
    const row = m as { role: string; content: string };
    return `${row.role === "user" ? "Usuario" : "Tu"}: ${row.content}`;
  }).join("\n");

  const fullPrompt = `${historyContext}\nUsuario: ${message}\nTu respuesta:`;

  let aiRawResponse: string;
  try {
    aiRawResponse = await callGemini(systemPrompt, fullPrompt);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error IA";
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
      console.warn("Fallo al parsear JSON de rutina en chat");
    }
  }

  await sb.from("AiChatMessage").insert({
    id: createId(),
    sessionId: session.id,
    role: "model",
    content: finalMessage,
  });

  await sb.from("AiChatSession").update({ updatedAt: new Date().toISOString() }).eq(
    "id",
    session.id,
  );

  const response: Record<string, unknown> = {
    message: finalMessage,
  };
  if (generatedPlan !== undefined) response.plan = generatedPlan;

  return jsonResponse({
    sessionId: session.id,
    response,
  });
});
