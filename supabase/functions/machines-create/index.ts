import { createClient } from "npm:@supabase/supabase-js@2";
import { createId } from "npm:@paralleldrive/cuid2@2.2.2";
import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import { getProfileRole, getSupabaseAuthUser } from "../_shared/supabase-auth.ts";

/**
 * Controlador Edge Function para el alta masiva de máquinas por centro.
 * Gestiona la inserción automática generando números de instancia consecutivos
 * basándose en la cantidad de máquinas existentes del mismo tipo en el gimnasio especificado.
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

  let body: {
    machineTypeId?: string;
    centerId?: string;
    quantity?: number;
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "JSON inválido" }, 400);
  }
  const machineTypeId = typeof body.machineTypeId === "string" ? body.machineTypeId : "";
  const centerId = typeof body.centerId === "string" ? body.centerId : "";
  const quantity = typeof body.quantity === "number" ? Math.min(50, Math.max(1, body.quantity)) : 1;
  const status = typeof body.status === "string" ? body.status : "operativa";
  if (!machineTypeId || !centerId) {
    return jsonResponse({ message: "machineTypeId y centerId requeridos" }, 400);
  }

  const { data: mt, error: mtErr } = await admin.from("MachineType").select("id, name").eq(
    "id",
    machineTypeId,
  ).maybeSingle();
  if (mtErr || !mt) return jsonResponse({ message: "Tipo de máquina no encontrado" }, 404);

  const { data: cen, error: cErr } = await admin.from("Center").select("id").eq("id", centerId)
    .maybeSingle();
  if (cErr || !cen) return jsonResponse({ message: "Centro no encontrado" }, 404);

  const { data: agg } = await admin.from("Machine").select("instanceNumber").eq(
    "machineTypeId",
    machineTypeId,
  ).eq("centerId", centerId).order("instanceNumber", { ascending: false }).limit(1).maybeSingle();

  const currentMax = (agg as { instanceNumber?: number } | null)?.instanceNumber ?? 0;
  const startNumber = currentMax + 1;

  const machines: unknown[] = [];
  for (let i = 0; i < quantity; i++) {
    const instanceNumber = startNumber + i;
    const id = createId();
    const { data: row, error } = await admin.from("Machine").insert({
      id,
      machineTypeId,
      centerId,
      instanceNumber,
      status,
    }).select("*").single();
    if (error) return jsonResponse({ message: error.message }, 500);
    machines.push(row);
  }

  return new Response(JSON.stringify({ machines }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
