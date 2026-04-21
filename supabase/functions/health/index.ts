/**
 * =============================================================================
 * PUNTO DE CONTROL DE SALUD (HEALTH CHECK)
 * =============================================================================
 * Esta Edge Function permite verificar la disponibilidad del sistema.
 * Es utilizada por servicios externos y el frontend para confirmar que el
 * backend nativo de Supabase está operativo.
 * 
 * El servidor Deno utiliza Deno.serve para escuchar peticiones HTTP.
 * La lógica de validación asegura que solo se acepten peticiones GET,
 * retornando un estado 200 OK si el servicio está activo o 405 si el método
 * no es permitido.
 */
import { jsonResponse, preflight } from "../_shared/cors.ts";

/**
 * Manejador principal para el endpoint de Health Check.
 * Resuelve comprobaciones de integridad emitiendo un acuse de recibo de sistema.
 * 
 * @param req - La solicitud HTTP Deno native Request.
 * @returns Response JSON con estado 200 y mensaje ok.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "GET") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }
  return jsonResponse({ ok: true, service: "meta-force-edge" });
});
