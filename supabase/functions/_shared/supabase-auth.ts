/**
 * =============================================================================
 * UTILIDADES DE AUTENTICACIÓN (SUPABASE AUTH UTILS)
 * =============================================================================
 * Este módulo compartido proporciona funciones de ayuda para la validación de
 * tokens JWT y la recuperación de roles de usuario en las Edge Functions.
 * 
 * Responsabilidades:
 * 1. Validar la identidad del usuario mediante el token de autorización.
 * 2. Recuperar el rol asignado al perfil del usuario desde la base de datos.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

export type AuthUserCtx = { id: string; email: string | undefined };

/**
 * Valida el JWT de la solicitud y devuelve el contexto del usuario autenticado.
 * 
 * @param req - Solicitud HTTP entrante con cabecera Authorization.
 * @returns Contexto del usuario (ID y email) o una Respuesta de error 401/500.
 */
export async function getSupabaseAuthUser(req: Request): Promise<
  AuthUserCtx | Response
> {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) {
    return new Response(JSON.stringify({ message: "Servidor mal configurado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ message: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ message: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { id: user.id, email: user.email };
}

/**
 * Obtiene el rol administrativo de un usuario específico.
 * 
 * @param admin - Cliente de Supabase con privilegios de service role.
 * @param userId - ID único del usuario a consultar.
 * @returns El nombre del rol (string) o null si no se encuentra.
 */
export async function getProfileRole(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  const { data } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  return (data as { role?: string } | null)?.role ?? null;
}
