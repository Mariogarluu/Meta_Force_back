/**
 * =============================================================================
 * GESTIÓN ADMINISTRATIVA DE SUPABASE (SUPABASE ADMIN)
 * =============================================================================
 * Provee un cliente de Supabase con privilegios de 'service_role'.
 * Se utiliza para operaciones que requieren saltarse las políticas RLS,
 * como la gestión administrativa de usuarios o triggers complejos.
 */
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

let _admin: SupabaseClient | null = null;

/**
 * Inicializa o recupera el cliente de administración de Supabase.
 * Utiliza variables de entorno para una configuración segura en el Edge.
 * 
 * @returns Instancia de SupabaseClient con rol de servicio.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.");
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
