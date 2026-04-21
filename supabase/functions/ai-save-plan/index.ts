import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { getSupabaseAuthUser } from "../_shared/supabase-auth.ts";
import { resolveAppUserId } from "../_shared/resolve-app-user-id.ts";
import {
  type AiGeneratedPlan,
  saveAiPlan,
} from "../_shared/save-ai-plan.ts";

/**
 * =============================================================================
 * GUARDADO DE PLANES GENERADOS POR IA (AI SAVE PLAN)
 * =============================================================================
 * Controlador Edge Function para el parseo y almacenamiento de rutinas inferidas.
 * 
 * Responsabilidades:
 * 1. Recibir un plan de entrenamiento estructurado en formato JSON.
 * 2. Autenticar la identidad origen de la petición.
 * 3. Ejecutar sub-procedimientos de transacción anidados para estructurar y persistir 
 *    todo el árbol relacional completo en Prisma (workouts/exercises).
 */

/**
 * Endpoint de red POST diseñado para atrapar el request.
 * Convierte un esquema JSON al árbol relacional DB mediante subconsultas asociadas.
 *
 * @param req - Objeto de solicitud HTTP Request.
 * @returns Confirmación o rechazo con código HTTP acorde al éxito de inserción.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  const uAuth = await getSupabaseAuthUser(req);
  if (uAuth instanceof Response) return uAuth;
  const sbAdmin = getSupabaseAdmin();
  const userId = await resolveAppUserId(sbAdmin, uAuth.id);
  if (!userId) {
    return jsonResponse({ message: "Perfil de aplicación no encontrado" }, 403);
  }

  let body: { plan?: AiGeneratedPlan };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "JSON inválido" }, 400);
  }
  const plan = body.plan;
  if (!plan?.type || !plan.name || !plan.days) {
    return jsonResponse({ message: "Estructura de plan inválida" }, 400);
  }

  try {
    const saved = await saveAiPlan(sbAdmin, userId, plan);
    return new Response(JSON.stringify(saved), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error guardando plan";
    return jsonResponse({ message: msg }, 500);
  }
});
