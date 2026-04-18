import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { getSupabaseAuthUser } from "../_shared/supabase-auth.ts";
import { resolveAppUserId } from "../_shared/resolve-app-user-id.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();

  const uAuth = await getSupabaseAuthUser(req);
  if (uAuth instanceof Response) return uAuth;
  const sb = getSupabaseAdmin();
  const userId = await resolveAppUserId(sb, uAuth.id);
  if (!userId) {
    return jsonResponse({ message: "Perfil de aplicación no encontrado" }, 403);
  }

  if (req.method === "GET") {
    const { data: sessions, error } = await sb.from("AiChatSession").select("*").eq(
      "userId",
      userId,
    ).order("updatedAt", { ascending: false }).limit(10);
    if (error) {
      return jsonResponse({ message: "Error cargando historial" }, 500);
    }
    const ids = (sessions ?? []).map((s) => (s as { id: string }).id);
    if (!ids.length) return jsonResponse([], 200);

    const { data: allMsgs, error: mErr } = await sb.from("AiChatMessage").select("*").in(
      "sessionId",
      ids,
    ).order("createdAt", { ascending: true });
    if (mErr) {
      return jsonResponse({ message: "Error cargando mensajes" }, 500);
    }
    const bySession: Record<string, unknown[]> = {};
    for (const id of ids) bySession[id] = [];
    for (const m of allMsgs ?? []) {
      const sid = (m as { sessionId: string }).sessionId;
      if (!bySession[sid]) bySession[sid] = [];
      bySession[sid].push(m);
    }

    const out = (sessions ?? []).map((s) => {
      const row = s as { id: string };
      return { ...s, messages: bySession[row.id] ?? [] };
    });
    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      return jsonResponse({ message: "Se requiere el ID de la sesión" }, 400);
    }

    const { data: session, error: fErr } = await sb.from("AiChatSession").select(
      "id, userId",
    ).eq("id", sessionId).maybeSingle();
    if (fErr || !session) {
      return jsonResponse({ message: "Sesión no encontrada" }, 403);
    }
    if ((session as { userId: string }).userId !== userId) {
      return jsonResponse(
        { message: "No tienes permiso para eliminar esta sesión" },
        403,
      );
    }

    await sb.from("AiChatMessage").delete().eq("sessionId", sessionId);
    const { error: dErr } = await sb.from("AiChatSession").delete().eq("id", sessionId);
    if (dErr) {
      return jsonResponse({ message: "Error al eliminar la sesión" }, 500);
    }
    return jsonResponse({ success: true, message: "Sesión eliminada correctamente" });
  }

  return jsonResponse({ message: "Method not allowed" }, 405);
});
