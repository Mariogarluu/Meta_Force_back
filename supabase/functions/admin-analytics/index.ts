/**
 * =============================================================================
 * EDGE FUNCTION: admin-analytics
 * =============================================================================
 * Expone endpoints de analíticas globales exclusivamente para SUPERADMIN.
 * Usa el service_role key para bypasar RLS y leer todas las tablas necesarias.
 * 
 * Verifica el JWT del usuario autenticado antes de responder.
 * Si el usuario no es SUPERADMIN, devuelve 403 Forbidden.
 * 
 * GET /functions/v1/admin-analytics
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, preflight } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // =============================================
  // 1) Autenticar al usuario desde el JWT
  // =============================================
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  // Usar cliente con el token del usuario para verificar identidad
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // =============================================
  // 2) Verificar que el usuario es SUPERADMIN
  //    (usando cliente service_role para saltarse RLS)
  // =============================================
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: roleData, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError || !roleData || roleData.role !== "SUPERADMIN") {
    return jsonResponse({ error: "Forbidden: SUPERADMIN role required" }, 403);
  }

  // =============================================
  // 3) Obtener todos los datos analíticos
  //    (service_role bypasa RLS automáticamente)
  // =============================================
  try {
    const [
      { data: users, error: usersErr },
      { data: userRoles, error: rolesErr },
      { data: bodyWeights, error: bwErr },
      { data: exerciseRecords, error: erErr },
      { data: exercises, error: exErr },
      { data: subscriptions, error: subErr },
    ] = await Promise.all([
      adminClient
        .from("User")
        .select("id, email, name, createdAt")
        .order("createdAt", { ascending: false }),
      adminClient
        .from("user_roles")
        .select("user_id, role"),
      adminClient
        .from("BodyWeightRecord")
        .select("id, userId, weight, date")
        .order("date", { ascending: true }),
      adminClient
        .from("ExerciseRecord")
        .select("id, userId, exerciseId, weight, reps, date")
        .order("date", { ascending: true }),
      adminClient
        .from("Exercise")
        .select("id, name")
        .order("name", { ascending: true }),
      adminClient
        .from("subscriptions")
        .select("id, user_id, plan_id, status, created_at"),
    ]);

    // Verificar errores
    const errors = [usersErr, rolesErr, bwErr, erErr, exErr, subErr].filter(Boolean);
    if (errors.length > 0) {
      console.error("Analytics query errors:", errors);
      return jsonResponse({
        error: "Error fetching analytics data",
        details: errors.map((e) => e?.message),
      }, 500);
    }

    // =============================================
    // 4) Enriquecer datos con roles y nombres de ejercicios
    // =============================================
    const roleMap = new Map((userRoles ?? []).map((r) => [r.user_id, r.role]));
    const enrichedUsers = (users ?? []).map((u) => ({
      ...u,
      role: roleMap.get(u.id) || "USER",
    }));

    const exerciseMap = new Map((exercises ?? []).map((e) => [e.id, e.name]));
    const enrichedExerciseRecords = (exerciseRecords ?? []).map((r) => ({
      ...r,
      exerciseName: exerciseMap.get(r.exerciseId) || "?",
    }));

    return jsonResponse({
      users: enrichedUsers,
      roles: userRoles ?? [],
      bodyWeights: bodyWeights ?? [],
      exerciseRecords: enrichedExerciseRecords,
      exercises: exercises ?? [],
      subscriptions: subscriptions ?? [],
    });
  } catch (err) {
    console.error("Unexpected error in admin-analytics:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
