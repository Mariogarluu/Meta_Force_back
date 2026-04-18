import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !serviceKey) {
    return jsonResponse({ message: "Servidor mal configurado" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ message: "No autorizado" }, 401);
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "JSON inválido" }, 400);
  }
  const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body.newPassword === "string" ? body.newPassword : "";
  if (!current || !next || next.length < 8) {
    return jsonResponse({ message: "Contraseña actual y nueva (mín. 8) requeridas" }, 400);
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user?.email) {
    return jsonResponse({ message: "Sesión inválida" }, 401);
  }

  const signIn = await createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.signInWithPassword({ email: user.email, password: current });
  if (signIn.error) {
    return jsonResponse({ message: "Contraseña actual incorrecta" }, 400);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
    password: next,
  });
  if (updErr) {
    return jsonResponse({ message: updErr.message }, 500);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
