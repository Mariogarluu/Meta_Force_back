import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Devuelve el PK de public."User" (text) para el usuario autenticado en Supabase Auth.
 */
export async function resolveAppUserId(
  admin: SupabaseClient,
  authUserId: string,
): Promise<string | null> {
  const { data } = await admin.from("User").select("id").eq("auth_user_id", authUserId).maybeSingle();
  if ((data as { id?: string } | null)?.id) return (data as { id: string }).id;
  const { data: byPk } = await admin.from("User").select("id").eq("id", authUserId).maybeSingle();
  return (byPk as { id?: string } | null)?.id ?? null;
}
