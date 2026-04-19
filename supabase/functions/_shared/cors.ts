/**
 * =============================================================================
 * CONFIGURACIÓN DE CORS Y RESPUESTAS (CORS UTILS)
 * =============================================================================
 * Define las cabeceras estándar para permitir peticiones entre dominios (CORS)
 * y proporciona funciones helper para normalizar las respuestas JSON.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

/**
 * Crea una respuesta HTTP con formato JSON y cabeceras CORS incluidas.
 * 
 * @param body - Contenido de la respuesta.
 * @param status - Código de estado HTTP (por defecto 200).
 * @returns Instancia de Response configurada para el Edge.
 */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Genera una respuesta de éxito rápida para peticiones OPTIONS (preflight).
 * Obligatorio para peticiones desde navegadores web.
 */
export function preflight(): Response {
  return new Response("ok", { headers: corsHeaders });
}
