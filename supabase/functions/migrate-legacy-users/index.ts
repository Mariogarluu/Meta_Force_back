/**
 * =============================================================================
 * MIGRACIÓN DE USUARIOS LEGACY (MIGRATE LEGACY USERS)
 * =============================================================================
 * Esta Edge Function automatiza la migración de usuarios desde el sistema legacy
 * hacia Supabase Auth. Gestiona la creación de identidades, vinculación de
 * perfiles y migración opcional de datos históricos.
 * 
 * Responsabilidades:
 * 1. Validar el secreto de migración para asegurar la petición.
 * 2. Crear usuarios en Supabase Auth con contraseñas temporales.
 * 3. Vincular registros de la tabla 'User' con los nuevos UUIDs de Auth.
 * 4. Migrar datos relacionados (Notificaciones, Entrenamientos, Dietas, etc.).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-migrate-secret",
}

type LegacyUserRow = {
  id: string
  email: string
  name: string
  role: string
  status: string
}

/**
 * Manejador principal para el proceso de migración masiva.
 * 
 * @param req - Solicitud HTTP con parámetros de límite, dryRun y migrateData.
 * @returns Respuesta con los resultados detallados de cada usuario procesado.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const migrateSecret = Deno.env.get("MIGRATE_SECRET") ?? ""
  const providedSecret = req.headers.get("x-migrate-secret") ?? ""
  if (!migrateSecret || providedSecret !== migrateSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  try {
    const body = await req.json().catch(() => ({}))
    const limit = typeof body.limit === "number" ? Math.min(body.limit, 200) : 50
    const migrateData = body.migrateData !== false
    const dryRun = body.dryRun === true

    const { data: legacyUsers, error: legacyErr } = await admin
      .from("User")
      .select("id,email,name,role,status")
      .is("auth_user_id", null)
      .order("createdAt", { ascending: false })
      .limit(limit)

    if (legacyErr) throw legacyErr

    const results: Array<Record<string, unknown>> = []

    for (const u of (legacyUsers ?? []) as LegacyUserRow[]) {
      const legacyUserId = u.id
      const email = u.email
      const tempPassword = crypto.randomUUID() + "Aa1!"

      if (dryRun) {
        results.push({ legacyUserId, email, action: "dryRun" })
        continue
      }

      const { data: created, error: createErr } = await admin.auth.admin
        .createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { name: u.name, legacy_user_id: legacyUserId },
        })

      if (createErr || !created.user) {
        results.push({
          legacyUserId,
          email,
          action: "createUser_failed",
          error: createErr?.message ?? "unknown",
        })
        continue
      }

      const authUserId = created.user.id

      const { error: linkErr } = await admin
        .from("User")
        .update({ auth_user_id: authUserId })
        .eq("id", legacyUserId)

      if (linkErr) {
        results.push({
          legacyUserId,
          email,
          authUserId,
          action: "link_failed",
          error: linkErr.message,
        })
        continue
      }

      const { error: profileErr } = await admin
        .from("profiles")
        .upsert({
          id: authUserId,
          legacy_user_id: legacyUserId,
          email,
          name: u.name,
          role: u.role,
          status: u.status,
        })

      if (profileErr) {
        results.push({
          legacyUserId,
          email,
          authUserId,
          action: "profile_upsert_failed",
          error: profileErr.message,
        })
        continue
      }

      const { error: mapErr } = await admin
        .from("legacy_user_map")
        .upsert({ legacy_user_id: legacyUserId, auth_user_id: authUserId })

      if (mapErr) {
        results.push({
          legacyUserId,
          email,
          authUserId,
          action: "legacy_map_failed",
          error: mapErr.message,
        })
        continue
      }

      if (migrateData) {
        const authUserIdText = authUserId

        const updates = await Promise.all([
          admin.from("Notification").update({ userId: authUserIdText }).eq("userId", legacyUserId),
          admin.from("Workout").update({ userId: authUserIdText }).eq("userId", legacyUserId),
          admin.from("Diet").update({ userId: authUserIdText }).eq("userId", legacyUserId),
          admin.from("ExerciseLog").update({ userId: authUserIdText }).eq("userId", legacyUserId),
          admin.from("UserMeasurement").update({ userId: authUserIdText }).eq("userId", legacyUserId),
          admin.from("BodyWeightRecord").update({ userId: authUserIdText }).eq("userId", legacyUserId),
          admin.from("ExerciseRecord").update({ userId: authUserIdText }).eq("userId", legacyUserId),
          admin.from("AiChatSession").update({ userId: authUserIdText }).eq("userId", legacyUserId),
          admin.from("_GymClassToUser").update({ B: authUserIdText }).eq("B", legacyUserId),
          admin.from("ClassTrainer").update({ trainerId: authUserIdText }).eq("trainerId", legacyUserId),
        ])

        const updateErrors = updates
          .map((r) => r.error?.message)
          .filter(Boolean)

        if (updateErrors.length) {
          results.push({
            legacyUserId,
            email,
            authUserId,
            action: "data_migration_partial_errors",
            errors: updateErrors,
          })
          continue
        }
      }

      results.push({
        legacyUserId,
        email,
        authUserId,
        tempPassword,
        action: migrateData ? "migrated_with_data" : "migrated_identity_only",
      })
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
