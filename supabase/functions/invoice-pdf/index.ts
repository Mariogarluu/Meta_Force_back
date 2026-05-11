/**
 * =============================================================================
 * GENERACIÓN DE FACTURAS PDF (INVOICE-PDF)
 * =============================================================================
 * Edge Function que genera el PDF de una factura a partir de los datos
 * persistidos en Postgres, lo sube al bucket privado `invoices` y devuelve
 * una URL firmada de descarga.
 */
import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import {
  PDFDocument,
  StandardFonts,
} from "https://esm.sh/pdf-lib@1.17.1?target=deno&no-check";

type InvoicePayload = {
  invoice_id?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  let body: InvoicePayload;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "JSON inválido" }, 400);
  }

  const invoiceId = body.invoice_id;
  if (!invoiceId) {
    return jsonResponse({ message: "invoice_id requerido" }, 400);
  }

  const sb = getSupabaseAdmin();

  // 1) Recuperar factura
  const { data: invoice, error: invErr } = await sb
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (invErr || !invoice) {
    return jsonResponse(
      { message: invErr?.message ?? "Factura no encontrada" },
      404,
    );
  }

  // 2) Recuperar suscripción, plan y duración
  const { data: subscription, error: subErr } = await sb
    .from("subscriptions")
    .select("*")
    .eq("id", invoice.subscription_id)
    .single();
  if (subErr || !subscription) {
    return jsonResponse(
      { message: subErr?.message ?? "Suscripción no encontrada" },
      404,
    );
  }

  const { data: plan, error: planErr } = await sb
    .from("subscription_plans")
    .select("code, name")
    .eq("id", subscription.plan_id)
    .single();
  if (planErr || !plan) {
    return jsonResponse(
      { message: planErr?.message ?? "Plan no encontrado" },
      404,
    );
  }

  const { data: duration, error: durErr } = await sb
    .from("plan_durations")
    .select("months, label")
    .eq("id", subscription.duration_id)
    .single();
  if (durErr || !duration) {
    return jsonResponse(
      { message: durErr?.message ?? "Duración no encontrada" },
      404,
    );
  }

  // Snapshots emisor / cliente
  const customer = invoice.customer_snapshot as Record<string, unknown>;
  const issuer = invoice.issuer_snapshot as Record<string, unknown>;

  const issueDate = new Date(invoice.issue_date ?? new Date());
  const startDate = new Date(subscription.start_date);
  const endDate = new Date(subscription.end_date);

  // 3) Generar PDF sencillo con pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const drawText = (
    text: string,
    x: number,
    y: number,
    size = 11,
    options: { bold?: boolean } = {},
  ) => {
    page.drawText(text, {
      x,
      y,
      size,
      font,
    });
  };

  let cursorY = 800;

  // Emisor
  drawText(String(issuer.legal_name ?? "Meta Force"), 40, cursorY, 16);
  cursorY -= 16;
  if (issuer.tax_id) {
    drawText(`NIF: ${issuer.tax_id}`, 40, cursorY);
    cursorY -= 14;
  }
  if (issuer.address) {
    drawText(String(issuer.address), 40, cursorY);
    cursorY -= 14;
  }
  if (issuer.email) {
    drawText(String(issuer.email), 40, cursorY);
    cursorY -= 14;
  }
  if (issuer.phone) {
    drawText(String(issuer.phone), 40, cursorY);
    cursorY -= 14;
  }

  // Datos factura
  cursorY -= 16;
  drawText("FACTURA", 400, 800, 18);
  drawText(`Nº: ${invoice.number ?? invoice.id}`, 400, 780);
  drawText(
    `Fecha: ${issueDate.toLocaleDateString("es-ES")}`,
    400,
    766,
  );

  // Cliente
  cursorY -= 20;
  drawText("Cliente", 40, cursorY, 13);
  cursorY -= 16;
  if (customer.name) {
    drawText(String(customer.name), 40, cursorY);
    cursorY -= 14;
  }
  if (customer.email) {
    drawText(String(customer.email), 40, cursorY);
    cursorY -= 14;
  }

  // Detalle suscripción
  cursorY -= 20;
  drawText("Detalle de la suscripción", 40, cursorY, 13);
  cursorY -= 16;
  drawText(
    `Modalidad: ${plan.name} (${plan.code})`,
    40,
    cursorY,
  );
  cursorY -= 14;
  drawText(
    `Duración: ${duration.label} (${duration.months} meses)`,
    40,
    cursorY,
  );
  cursorY -= 14;
  drawText(
    `Periodo: ${startDate.toLocaleDateString("es-ES")} - ${endDate.toLocaleDateString("es-ES")}`,
    40,
    cursorY,
  );

  // Importes
  cursorY -= 24;
  drawText("Importes", 40, cursorY, 13);
  cursorY -= 16;

  const subtotal = Number(invoice.subtotal ?? 0);
  const taxTotal = Number(invoice.tax_total ?? 0);
  const total = Number(invoice.total ?? 0);

  drawText(`Base imponible: ${subtotal.toFixed(2)} €`, 40, cursorY);
  cursorY -= 14;
  drawText(`IVA: ${taxTotal.toFixed(2)} €`, 40, cursorY);
  cursorY -= 14;
  drawText(
    `Total: ${total.toFixed(2)} €`,
    40,
    cursorY,
  );
  cursorY -= 24;

  drawText(
    `Válido hasta: ${endDate.toLocaleDateString("es-ES")}`,
    40,
    cursorY,
  );

  const pdfBytes = await pdfDoc.save();

  // 4) Subir a Storage
  const year = issueDate.getFullYear().toString();
  const numberSafe = String(invoice.number ?? invoice.id).replace(
    /[^a-zA-Z0-9_-]+/g,
    "_",
  );
  const path = `${year}/${numberSafe}.pdf`;

  const { error: uploadError } = await sb.storage
    .from("invoices")
    .upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadError) {
    return jsonResponse({ message: uploadError.message }, 500);
  }

  // 5) Actualizar pdf_path
  const { error: updErr } = await sb
    .from("invoices")
    .update({ pdf_path: path })
    .eq("id", invoiceId);
  if (updErr) {
    return jsonResponse({ message: updErr.message }, 500);
  }

  // 6) URL firmada
  const { data: signed, error: signErr } = await sb.storage
    .from("invoices")
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 días
  if (signErr || !signed) {
    return jsonResponse(
      { message: signErr?.message ?? "No se pudo firmar la URL" },
      500,
    );
  }

  return new Response(
    JSON.stringify({
      url: signed.signedUrl,
      path,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});

