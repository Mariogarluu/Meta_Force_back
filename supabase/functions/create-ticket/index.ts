import { createId } from "npm:@paralleldrive/cuid2@2.2.2";
import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";

type AttachmentInput = {
  filename: string;
  contentType?: string;
  base64: string;
};

/**
 * POST público: crea un ticket de contacto (misma semántica que POST /api/tickets con JSON).
 * Adjuntos: base64 (máx. 5). Rutas en Storage: `<ticketId>/<timestamp>_<nombre>`.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "JSON inválido" }, 400);
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const centerId = String(body.centerId ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const description = String(body.description ?? "").trim();
  const phone = body.phone != null && String(body.phone).trim() !== ""
    ? String(body.phone).trim()
    : null;

  if (!name || !email || !centerId || !subject || !description) {
    return jsonResponse({ message: "Faltan campos requeridos" }, 400);
  }

  const sb = getSupabaseAdmin();

  const { data: center, error: cErr } = await sb.from("Center").select("id").eq("id", centerId)
    .maybeSingle();
  if (cErr || !center) {
    return jsonResponse({ message: "Centro no encontrado" }, 404);
  }

  const ticketId = createId();
  const { error: insErr } = await sb.from("Ticket").insert({
    id: ticketId,
    name,
    email,
    phone,
    centerId,
    subject,
    description,
    attachments: [],
    status: "pending",
  });

  if (insErr) {
    if (insErr.code === "23503") {
      return jsonResponse({ message: "Centro no encontrado" }, 404);
    }
    return jsonResponse({ message: insErr.message }, 500);
  }

  const uploadedUrls: string[] = [];
  const attachments = Array.isArray(body.attachments)
    ? (body.attachments as AttachmentInput[])
    : [];

  for (const att of attachments.slice(0, 5)) {
    if (!att?.filename || !att?.base64) continue;
    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(att.base64), (c) => c.charCodeAt(0));
    } catch {
      continue;
    }
    const safeName = String(att.filename).replace(/[^\w.\-]+/g, "_");
    const path = `${ticketId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await sb.storage.from("tickets").upload(path, bytes, {
      contentType: att.contentType ?? "application/octet-stream",
      upsert: false,
    });
    if (upErr) continue;
    const { data: pub } = sb.storage.from("tickets").getPublicUrl(path);
    uploadedUrls.push(pub.publicUrl);
  }

  let ticketRow: Record<string, unknown> | null = null;
  if (uploadedUrls.length > 0) {
    const { data, error } = await sb.from("Ticket").update({ attachments: uploadedUrls }).eq(
      "id",
      ticketId,
    ).select("*").single();
    if (error) return jsonResponse({ message: error.message }, 500);
    ticketRow = data as Record<string, unknown>;
  } else {
    const { data, error } = await sb.from("Ticket").select("*").eq("id", ticketId).single();
    if (error) return jsonResponse({ message: error.message }, 500);
    ticketRow = data as Record<string, unknown>;
  }

  const { data: centerRow } = await sb.from("Center").select("id, name, city, country").eq(
    "id",
    centerId,
  ).single();

  const out = { ...ticketRow, center: centerRow };

  return new Response(JSON.stringify(out), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
