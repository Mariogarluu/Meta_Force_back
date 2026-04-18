import { jsonResponse, preflight } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "GET") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }
  return jsonResponse({ ok: true, service: "meta-force-edge" });
});
