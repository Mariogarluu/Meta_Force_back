/**
 * =============================================================================
 * REGISTRO DE USUARIOS (AUTH REGISTER)
 * =============================================================================
 * Esta Edge Function gestiona el proceso de alta de nuevos usuarios.
 * Realiza las siguientes tareas:
 * 1. Valida los datos de entrada (email, password, nombre).
 * 2. Crea el usuario en Supabase Auth con privilegios administrativos.
 * 3. Establece metadatos de rol (USER) y estado (PENDING) iniciales.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";

/**
 * Orquesta dinámicamente la transacción de registro en Supabase Auth y anexa
 * metadatos fundacionales necesarios para la lógica de dominio.
 * 
 * @param req - La solicitud HTTP Deno native Request.
 * @returns Response object modelado en formato JSON indicando la estructura del user id o el error asociado.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!serviceKey || !url) {
    return jsonResponse({ message: "Servidor mal configurado" }, 500);
  }

  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "JSON inválido" }, 400);
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!email || !password || password.length < 8) {
    return jsonResponse({ message: "Email y contraseña (mín. 8) requeridos" }, 400);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || "Nuevo Usuario" },
    app_metadata: { role: "USER", status: "PENDING" },
  });

  if (error || !data.user) {
    return jsonResponse({ message: error?.message ?? "No se pudo registrar" }, 400);
  }

  return new Response(JSON.stringify({ userId: data.user.id, email: data.user.email }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
