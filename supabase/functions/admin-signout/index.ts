import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { getProfileRole, getSupabaseAuthUser } from "../_shared/supabase-auth.ts";

type Body = { user_id?: string };

/**
 * Fuerza (best-effort) la invalidación de sesiones de un usuario.
 *
 * Nota: supabase-js expone `auth.admin.signOut(jwt, scope)` (requiere JWT),
 * pero para cerrar sesiones por user_id usamos el endpoint admin del Auth server.
 * Si el endpoint no existe en tu versión, se devuelve 200 pero sin efecto.
 */
async function adminLogoutByUserId(userId: string): Promise<void> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.");

  // Endpoint de GoTrue admin (varía por versión). Best-effort.
  const res = await fetch(`${url}/auth/v1/admin/users/${userId}/logout`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
  });

  // Si no existe, no rompemos: se considera non-blocking.
  if (!res.ok) {
    await res.body?.cancel().catch(() => undefined);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  const ctx = await getSupabaseAuthUser(req);
  if (ctx instanceof Response) return ctx;

  const sbAdmin = getSupabaseAdmin();
  const role = await getProfileRole(sbAdmin, ctx.id);
  if (role !== "SUPERADMIN") {
    return jsonResponse({ message: "Forbidden" }, 403);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "Invalid JSON" }, 400);
  }

  const userId = body.user_id;
  if (!userId) return jsonResponse({ message: "Missing user_id" }, 400);

  try {
    await adminLogoutByUserId(userId);
  } catch (e) {
    // Non-blocking: si falla el endpoint, no bloqueamos el cambio de rol.
    return jsonResponse({ ok: false, message: (e as Error).message }, 200);
  }

  return jsonResponse({ ok: true }, 200);
});

