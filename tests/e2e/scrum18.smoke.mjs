// Smoke E2E SCRUM-18: flujo completo de suscripciones y facturación
// Ejecutar con:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//   SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... \
//   node back/tests/e2e/scrum18.smoke.mjs

import { createClient } from '@supabase/supabase-js';

function envOrThrow(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required for this test`);
  }
  return value;
}

async function main() {
  const SUPABASE_URL = envOrThrow('SUPABASE_URL');
  const SUPABASE_ANON_KEY = envOrThrow('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = envOrThrow('SUPABASE_SERVICE_ROLE_KEY');
  const SUPERADMIN_EMAIL = envOrThrow('SUPERADMIN_EMAIL');
  const SUPERADMIN_PASSWORD = envOrThrow('SUPERADMIN_PASSWORD');

  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('1) Login como SUPERADMIN...');
  const { data: loginData, error: loginError } =
    await supabaseAnon.auth.signInWithPassword({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
    });
  if (loginError) throw loginError;

  const superadminUser = loginData.user;
  console.log('   OK, user id =', superadminUser.id);

  console.log('2) Localizar plan STANDARD 6m...');
  const { data: plans, error: plansError } = await supabaseAnon
    .from('subscription_plans')
    .select('id, code, name')
    .eq('code', 'standard')
    .limit(1);
  if (plansError) throw plansError;
  const plan = plans?.[0];
  if (!plan) throw new Error('Plan "standard" no encontrado');

  const { data: durations, error: durError } = await supabaseAnon
    .from('plan_durations')
    .select('id, months, label')
    .eq('months', 6)
    .limit(1);
  if (durError) throw durError;
  const duration = durations?.[0];
  if (!duration) throw new Error('Duración 6 meses no encontrada');

  console.log('   Plan:', plan, 'Duración:', duration);

  console.log('3) Crear usuario cliente de prueba (service role)...');
  const testEmail = `scrum18-client+${Date.now()}@example.com`;
  const testPassword = 'Scrum18.test.1234';
  const { data: created, error: createErr } =
    await supabaseService.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
  if (createErr) throw createErr;
  const clientUser = created.user;
  console.log('   Cliente creado:', clientUser.id, testEmail);

  console.log('4) Crear oferta especial de prueba...');
  const { data: offers, error: offerErr } = await supabaseAnon
    .from('special_offers')
    .insert({
      name: 'SCRUM18 Smoke Offer',
      plan_id: plan.id,
      duration_id: duration.id,
      discount_type: 'percent',
      discount_value: 10,
      active: true,
    })
    .select('id')
    .single();
  if (offerErr) throw offerErr;
  const offerId = offers.id;
  console.log('   Oferta creada:', offerId);

  console.log('5) SUPERADMIN registra suscripción vía RPC register_subscription...');
  const { data: regData, error: regError } = await supabaseAnon.rpc(
    'register_subscription',
    {
      p_user_id: clientUser.id,
      p_plan_id: plan.id,
      p_duration_id: duration.id,
      p_offer_id: offerId,
    },
  );
  if (regError) throw regError;

  const first = Array.isArray(regData) ? regData[0] : regData;
  if (!first) throw new Error('register_subscription no devolvió resultado');
  const subscriptionId = first.subscription_id;
  const invoiceId = first.invoice_id;
  console.log('   Suscripción creada:', subscriptionId, 'Factura:', invoiceId);

  console.log('6) Verificar que la factura existe y tiene número correlativo...');
  const { data: invoice, error: invoiceErr } = await supabaseService
    .from('invoices')
    .select('id, number, pdf_path')
    .eq('id', invoiceId)
    .single();
  if (invoiceErr) throw invoiceErr;
  console.log('   Factura:', invoice);
  if (!invoice.number) {
    throw new Error('La factura no tiene número asignado');
  }

  console.log('7) Esperar a que pg_net dispare invoice-pdf y subscription-email...');
  await new Promise((resolve) => setTimeout(resolve, 8000));

  console.log('8) Forzar regeneración de PDF y reenvío de email (botones front)...');
  const { error: pdfErr } = await supabaseService.functions.invoke('invoice-pdf', {
    body: { invoice_id: invoiceId },
  });
  if (pdfErr) throw pdfErr;
  const { error: mailErr } = await supabaseService.functions.invoke(
    'subscription-email',
    { body: { subscription_id: subscriptionId } },
  );
  if (mailErr) throw mailErr;
  console.log('   invoice-pdf y subscription-email invocados correctamente.');

  console.log('9) Login como cliente y obtener QR firmado...');
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error: clientLoginErr } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (clientLoginErr) throw clientLoginErr;

  const { data: qrData, error: qrErr } = await client.functions.invoke('qr-sign');
  if (qrErr) throw qrErr;
  console.log('   QR payload:', qrData);

  if (!qrData?.token || !qrData?.end_date) {
    throw new Error('qr-sign no devolvió token o end_date');
  }

  console.log('✅ SCRUM-18 smoke test completado con éxito.');
}

main().catch((err) => {
  console.error('❌ SCRUM-18 smoke test falló:', err);
  process.exitCode = 1;
});

