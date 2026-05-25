/**
 * =============================================================================
 * FIRMA DE QR DE ACCESO (QR-SIGN)
 * =============================================================================
 * Edge Function que genera un JWT corto firmado (HS256) con la información
 * mínima necesaria para validar el acceso de un cliente al centro:
 * { user_id, plan_code, end_date, role, exp }.
 *
 * - Autenticación: requiere JWT válido (verify_jwt = true en config.toml).
 * - Rol: se obtiene desde la tabla profiles (campo role).
 * - Suscripción: utiliza la última suscripción activa del usuario.
 */
import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import {
  getProfileRole,
  getSupabaseAuthUser,
  type AuthUserCtx,
} from "../_shared/supabase-auth.ts";

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  duration_id: string;
  start_date: string;
  end_date: string;
  status: string;
};

type PlanRow = {
  id: string;
  code: string;
  name: string;
};

type DurationRow = {
  id: string;
  months: number;
  label: string;
};

function getEnvOrThrow(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} no configurada en el entorno de la función.`);
  }
  return value;
}

function base64UrlEncode(input: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < input.length; i++) {
    binary += String.fromCharCode(input[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signJwtHS256(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const headerJson = JSON.stringify({ alg: "HS256", typ: "JWT" });
  const payloadJson = JSON.stringify(payload);

  const headerB64 = base64UrlEncode(encoder.encode(headerJson));
  const payloadB64 = base64UrlEncode(encoder.encode(payloadJson));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data),
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  return `${data}.${signatureB64}`;
}

async function resolveUserContext(
  req: Request,
): Promise<{ ctx: AuthUserCtx; errorResponse?: Response }> {
  const auth = await getSupabaseAuthUser(req);
  if (auth instanceof Response) {
    return { ctx: null as unknown as AuthUserCtx, errorResponse: auth };
  }
  return { ctx: auth };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  // 1) Validar usuario autenticado
  const { ctx, errorResponse } = await resolveUserContext(req);
  if (errorResponse) return errorResponse;

  const admin = getSupabaseAdmin();

  // 2) Recuperar rol del perfil
  const role = (await getProfileRole(admin as any, ctx.id)) ?? "CLIENT";

  // Bypassear la suscripción para el personal administrativo y entrenadores (staff)
  if (role === "SUPERADMIN" || role === "ADMIN_CENTER" || role === "TRAINER") {
    const payload = {
      user_id: ctx.id,
      plan_code: "staff",
      end_date: "9999-12-31", // Fecha de fin virtual
      role,
    };

    const now = Math.floor(Date.now() / 1000);
    const ttlSeconds = 15 * 60; // 15 minutos
    const exp = now + ttlSeconds;

    const secret = getEnvOrThrow("JWT_QR_SECRET");

    const fullPayload = {
      ...payload,
      exp,
    };

    let token: string;
    try {
      token = await signJwtHS256(fullPayload, secret);
    } catch (err) {
      console.error(err);
      return jsonResponse(
        { message: (err as Error).message ?? "No se pudo firmar el JWT" },
        500,
      );
    }

    return jsonResponse(
      {
        token,
        ...payload,
        exp,
        plan_name: "Acceso Personal (Staff)",
        duration_label: "Ilimitado",
        duration_months: 999,
      },
      200,
    );
  }

  // 3) Recuperar última suscripción activa (por fecha de fin más lejana)
  const { data: subscription, error: subErr } = await admin
    .from("subscriptions")
    .select("id, user_id, plan_id, duration_id, start_date, end_date, status")
    .eq("user_id", ctx.id)
    .eq("status", "active")
    .order("end_date", { ascending: false })
    .limit(1)
    .single<SubscriptionRow>();

  if (subErr || !subscription) {
    return jsonResponse(
      { message: "No se encontró una suscripción activa para este usuario." },
      404,
    );
  }

  // 4) Recuperar plan para obtener plan_code
  const { data: plan, error: planErr } = await admin
    .from("subscription_plans")
    .select("id, code, name")
    .eq("id", subscription.plan_id)
    .single<PlanRow>();

  if (planErr || !plan) {
    return jsonResponse(
      { message: planErr?.message ?? "Plan de suscripción no encontrado" },
      404,
    );
  }

  // 4b) Recuperar duración para mostrar modalidad más descriptiva
  const { data: duration, error: durErr } = await admin
    .from("plan_durations")
    .select("id, months, label")
    .eq("id", subscription.duration_id)
    .single<DurationRow>();

  if (durErr || !duration) {
    return jsonResponse(
      { message: durErr?.message ?? "Duración de suscripción no encontrada" },
      404,
    );
  }

  const endDate = new Date(subscription.end_date);
  const payload = {
    user_id: ctx.id,
    plan_code: plan.code,
    end_date: subscription.end_date, // YYYY-MM-DD (date en Postgres)
    role,
  };

  // 5) Firmar JWT con expiración corta
  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = 15 * 60; // 15 minutos
  const exp = now + ttlSeconds;

  const secret = getEnvOrThrow("JWT_QR_SECRET");

  const fullPayload = {
    ...payload,
    exp,
  };

  let token: string;
  try {
    token = await signJwtHS256(fullPayload, secret);
  } catch (err) {
    console.error(err);
    return jsonResponse(
      { message: (err as Error).message ?? "No se pudo firmar el JWT" },
      500,
    );
  }

  return jsonResponse(
    {
      token,
      ...payload,
      exp,
      // Campos adicionales de ayuda para la app cliente (no forman parte del JWT)
      plan_name: plan.name,
      duration_label: duration.label,
      duration_months: duration.months,
    },
    200,
  );
});

