/**
 * =============================================================================
 * ENVÍO DE EMAIL DE SUSCRIPCIÓN (SUBSCRIPTION-EMAIL)
 * =============================================================================
 * Edge Function que envía un email de confirmación de suscripción con la
 * factura adjunta en PDF. Si la factura aún no tiene PDF generado, invoca
 * internamente a la función `invoice-pdf` para crearlo.
 */
import { corsHeaders, jsonResponse, preflight } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase-admin.ts";
import { Resend } from "https://esm.sh/resend@3.3.0?target=deno&no-check";

type SubscriptionEmailPayload = {
  subscription_id?: string;
};

type InvoiceRow = {
  id: string;
  subscription_id: string;
  number: string | null;
  issue_date: string | null;
  customer_snapshot: Record<string, unknown>;
  issuer_snapshot: Record<string, unknown>;
  subtotal: number;
  tax_total: number;
  total: number;
  pdf_path: string | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  duration_id: string;
  start_date: string;
  end_date: string;
};

type PlanRow = {
  id: string;
  code: string;
  name: string;
};

type DurationRow = {
  id: string;
  months: number;
  label: string;
};

function getEnvOrThrow(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} no configurada en el entorno de la función.`);
  }
  return value;
}

async function ensureInvoicePdf(
  sb: ReturnType<typeof getSupabaseAdmin>,
  invoice: InvoiceRow,
): Promise<{ invoice: InvoiceRow; pdfPath: string }> {
  if (invoice.pdf_path) {
    return { invoice, pdfPath: invoice.pdf_path };
  }

  const supabaseUrl = getEnvOrThrow("SUPABASE_URL");
  const serviceRoleKey = getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY");

  const base = supabaseUrl.replace(/\/+$/, "");
  const resp = await fetch(`${base}/functions/v1/invoice-pdf`, {
    method: "POST",
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ invoice_id: invoice.id }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Error al generar PDF de factura: ${resp.status} ${text}`,
    );
  }

  let json: { path?: string } | null = null;
  try {
    json = (await resp.json()) as { path?: string };
  } catch {
    // ignoramos, confiamos en que invoice.pdf_path fue actualizado por invoice-pdf
  }

  const pathFromResponse = json?.path ?? null;

  // Volver a leer la factura para obtener el pdf_path actualizado si fuera necesario
  const { data: refreshed, error: refErr } = await sb
    .from("invoices")
    .select("*")
    .eq("id", invoice.id)
    .single<InvoiceRow>();

  if (refErr || !refreshed) {
    throw new Error(
      `Factura no encontrada tras generar PDF: ${refErr?.message ?? "not found"}`,
    );
  }

  const finalPath = refreshed.pdf_path ?? pathFromResponse;
  if (!finalPath) {
    throw new Error(
      "No se pudo determinar la ruta del PDF de la factura tras generar el archivo.",
    );
  }

  return { invoice: refreshed, pdfPath: finalPath };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  let body: SubscriptionEmailPayload;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "JSON inválido" }, 400);
  }

  const subscriptionId = body.subscription_id;
  if (!subscriptionId) {
    return jsonResponse({ message: "subscription_id requerido" }, 400);
  }

  const sb = getSupabaseAdmin();

  // 1) Recuperar suscripción
  const { data: subscription, error: subErr } = await sb
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single<SubscriptionRow>();
  if (subErr || !subscription) {
    return jsonResponse(
      { message: subErr?.message ?? "Suscripción no encontrada" },
      404,
    );
  }

  // 2) Recuperar factura asociada (última por fecha de emisión)
  const { data: invoice, error: invErr } = await sb
    .from("invoices")
    .select("*")
    .eq("subscription_id", subscription.id)
    .order("issue_date", { ascending: false })
    .limit(1)
    .single<InvoiceRow>();
  if (invErr || !invoice) {
    return jsonResponse(
      { message: invErr?.message ?? "Factura asociada no encontrada" },
      404,
    );
  }

  // 3) Asegurar que el PDF existe (invoice-pdf puede actualizar pdf_path)
  let pdfPath: string;
  try {
    const result = await ensureInvoicePdf(sb, invoice);
    pdfPath = result.pdfPath;
  } catch (err) {
    console.error(err);
    return jsonResponse(
      { message: (err as Error).message ?? "No se pudo generar el PDF de la factura" },
      500,
    );
  }

  // 4) Recuperar plan y duración para el resumen
  const { data: plan, error: planErr } = await sb
    .from("subscription_plans")
    .select("id, code, name")
    .eq("id", subscription.plan_id)
    .single<PlanRow>();
  if (planErr || !plan) {
    return jsonResponse(
      { message: planErr?.message ?? "Plan no encontrado" },
      404,
    );
  }

  const { data: duration, error: durErr } = await sb
    .from("plan_durations")
    .select("id, months, label")
    .eq("id", subscription.duration_id)
    .single<DurationRow>();
  if (durErr || !duration) {
    return jsonResponse(
      { message: durErr?.message ?? "Duración no encontrada" },
      404,
    );
  }

  const customer = invoice.customer_snapshot as {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };

  const recipientEmail = customer.email ?? "";
  if (!recipientEmail) {
    return jsonResponse(
      {
        message:
          "El snapshot del cliente no contiene email. No se puede enviar el correo.",
      },
      500,
    );
  }

  const endDate = new Date(subscription.end_date);
  const issueDate = invoice.issue_date
    ? new Date(invoice.issue_date)
    : new Date();

  const validUntil = endDate.toLocaleDateString("es-ES");
  const durationLabel = `${duration.label} (${duration.months} meses)`;
  const planLabel = `${plan.name} (${plan.code})`;
  const invoiceNumber = invoice.number ?? invoice.id;

  // 5) Descargar el PDF desde Storage
  const { data: file, error: dlErr } = await sb.storage
    .from("invoices")
    .download(pdfPath);
  if (dlErr || !file) {
    return jsonResponse(
      { message: dlErr?.message ?? "No se pudo descargar el PDF de la factura" },
      500,
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64Pdf = toBase64(new Uint8Array(arrayBuffer));

  // 6) Enviar email con Resend
  let resend: Resend;
  try {
    const apiKey = getEnvOrThrow("RESEND_API_KEY");
    resend = new Resend(apiKey);
  } catch (err) {
    return jsonResponse(
      { message: (err as Error).message ?? "Error de configuración de Resend" },
      500,
    );
  }

  const from = getEnvOrThrow("RESEND_FROM");
  const subject = `Tu suscripción a Meta Force - Factura ${invoiceNumber}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827;">
      <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">
        ¡Gracias por tu suscripción a Meta Force!
      </h1>
      <p style="margin: 0 0 8px 0;">Hola ${customer.name ?? ""},</p>
      <p style="margin: 0 0 8px 0;">
        Te confirmamos tu suscripción al plan <strong>${planLabel}</strong> con una duración de
        <strong>${durationLabel}</strong>.
      </p>
      <p style="margin: 0 0 8px 0;">
        Tu suscripción es <strong>válida hasta ${validUntil}</strong>.
      </p>
      <p style="margin: 0 0 8px 0;">
        Adjuntamos la factura en PDF para tus registros.
      </p>
      <p style="margin: 16px 0 0 0; font-size: 12px; color: #6b7280;">
        Nº de factura: <strong>${invoiceNumber}</strong><br />
        Fecha de emisión: ${issueDate.toLocaleDateString("es-ES")}
      </p>
    </div>
  `;

  const { data: emailData, error: emailErr } = await resend.emails.send({
    from,
    to: [recipientEmail],
    subject,
    html,
    attachments: [
      {
        filename: `factura-${invoiceNumber}.pdf`,
        content: base64Pdf,
        contentType: "application/pdf",
      },
    ],
  });

  if (emailErr) {
    console.error(emailErr);
    return jsonResponse(
      { message: emailErr.message ?? "No se pudo enviar el email" },
      500,
    );
  }

  return jsonResponse(
    {
      id: emailData?.id ?? null,
      to: recipientEmail,
      invoice_id: invoice.id,
      subscription_id: subscription.id,
    },
    200,
  );
});

