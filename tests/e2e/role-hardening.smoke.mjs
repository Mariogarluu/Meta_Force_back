import { createClient } from '@supabase/supabase-js';

function envOrThrow(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const url = envOrThrow('SUPABASE_URL');
  const anon = envOrThrow('SUPABASE_ANON_KEY');
  const superEmail = envOrThrow('E2E_SUPERADMIN_EMAIL');
  const superPass = envOrThrow('E2E_SUPERADMIN_PASSWORD');

  const client = createClient(url, anon, { auth: { persistSession: false } });

  console.log('1) Login como SUPERADMIN...');
  const { data: login, error: loginErr } = await client.auth.signInWithPassword({
    email: superEmail,
    password: superPass,
  });
  if (loginErr) throw loginErr;
  const superId = login.user.id;

  console.log('2) Llamar get_my_role (debe devolver SUPERADMIN)...');
  const { data: roleRows, error: roleErr } = await client.rpc('get_my_role');
  if (roleErr) throw roleErr;
  const role = Array.isArray(roleRows) ? roleRows[0]?.role : roleRows?.role;
  if (role !== 'SUPERADMIN') throw new Error(`Expected SUPERADMIN, got ${role}`);

  console.log('3) Cambiar mi propio rol a SUPERADMIN (idempotente) via admin_set_user_role...');
  const { error: setErr } = await client.rpc('admin_set_user_role', {
    p_user_id: superId,
    p_role: 'SUPERADMIN',
  });
  if (setErr) throw setErr;

  console.log('✅ role-hardening smoke completado.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

