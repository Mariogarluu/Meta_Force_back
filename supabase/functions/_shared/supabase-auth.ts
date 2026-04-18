import { createClient } from "npm:@supabase/supabase-js@2";

export type AuthUserCtx = { id: string; email: string | undefined };

/**
 * Valida el JWT de Supabase (Gateway con verify_jwt=true) y devuelve el usuario.
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

export async function getProfileRole(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  const { data } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  return (data as { role?: string } | null)?.role ?? null;
}
