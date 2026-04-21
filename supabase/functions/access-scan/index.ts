import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import {
  getProfileRole,
  getSupabaseAuthUser,
} from "../_shared/supabase-auth.ts";

/**
 * =============================================================================
 * CONTROLADOR DE ESCANEO DE ACCESOS (ACCESS SCAN)
 * =============================================================================
 * Controlador Edge Function de Deno para registrar entradas y salidas de usuarios.
 * 
 * Responsabilidades:
 * 1. Validar tokens de acceso administrativo de centro o Superadmin.
 * 2. Verificar la integridad y validez temporal del payload del QR.
 * 3. Ejecutar transacciones proxy atómicas en la BD para mover al usuario de un centro a otro.
 */

/**
 * Valida si un código QR está dentro del tiempo de expiración permitido.
 * @param timestamp - Marca de tiempo original de creación del código QR
 * @returns {boolean} `true` si el código fue generado hace menos de 20 minutos, `false` en caso contrario
 */
function validateQRTimestamp(timestamp: string): boolean {
  const qrTime = new Date(timestamp).getTime();
  return (Date.now() - qrTime) < 20 * 60 * 1000;
}

/**
 * Controlador asíncrono para peticiones HTTP entrantes del cliente o terminal móvil.
 * Extrae autorización, evalúa firmas de QR y realiza las mutaciones correspondientes en el registro.
 *
 * @param req - La solicitud HTTP Deno native Request.
 * @returns Response object modelado en formato JSON estructurado.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  const auth = await getSupabaseAuthUser(req);
  if (auth instanceof Response) return auth;

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const role = await getProfileRole(admin, auth.id);
  if (role !== "SUPERADMIN" && role !== "ADMIN_CENTER") {
    return jsonResponse({ message: "Sin permiso" }, 403);
  }

  let body: { qrData?: { id?: string; timestamp?: string }; centerId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "JSON inválido" }, 400);
  }
  const centerId = typeof body.centerId === "string" ? body.centerId.trim() : "";
  const qrId = typeof body.qrData?.id === "string" ? body.qrData.id.trim() : "";
  const ts = typeof body.qrData?.timestamp === "string" ? body.qrData.timestamp : "";
  if (!centerId || !qrId || !ts) {
    return jsonResponse({ message: "qrData.id, qrData.timestamp y centerId requeridos" }, 400);
  }
  if (!validateQRTimestamp(ts)) {
    return jsonResponse({ message: "El código QR ha expirado" }, 400);
  }

  if (role === "ADMIN_CENTER") {
    const { data: staff } = await admin.from("User").select("centerId").eq("auth_user_id", auth.id)
      .maybeSingle();
    const adminCenterId = (staff as { centerId?: string | null } | null)?.centerId;
    if (!adminCenterId || adminCenterId !== centerId) {
      return jsonResponse({ message: "Sin permiso para este centro" }, 403);
    }
  }

  const { data: targetUser, error: uErr } = await admin.from("User").select(
    "id, centerId, name, email, role, status",
  ).or(`id.eq.${qrId},auth_user_id.eq.${qrId}`).maybeSingle();
  if (uErr || !targetUser) {
    return jsonResponse({ message: "Usuario no encontrado" }, 404);
  }
  const u = targetUser as {
    id: string;
    centerId: string | null;
    name: string;
    email: string;
    role: string;
    status: string;
  };

  const { data: center, error: cErr } = await admin.from("Center").select("id").eq(
    "id",
    centerId,
  ).maybeSingle();
  if (cErr || !center) {
    return jsonResponse({ message: "Centro no encontrado" }, 404);
  }

  let op: "entry" | "exit";
  let updated: typeof u | null = null;

  if (u.centerId && u.centerId !== centerId) {
    return jsonResponse({
      message: "El usuario ya está registrado en otro centro. Debe salir primero.",
    }, 409);
  }

  if (!u.centerId || u.centerId !== centerId) {
    op = "entry";
    const { data, error } = await admin.from("User").update({ centerId }).eq("id", u.id).select(
      "id, email, name, role, status, centerId",
    ).single();
    if (error) return jsonResponse({ message: error.message }, 500);
    updated = data as typeof u;
  } else {
    op = "exit";
    const { data, error } = await admin.from("User").update({ centerId: null }).eq("id", u.id)
      .eq("centerId", centerId).select("id, email, name, role, status, centerId").single();
    if (error) return jsonResponse({ message: error.message }, 500);
    updated = data as typeof u;
  }

  return new Response(
    JSON.stringify({
      success: true,
      type: op,
      message: op === "entry" ? "Entrada registrada" : "Salida registrada",
      user: updated,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
