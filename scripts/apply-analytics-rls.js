/**
 * Script de migración: políticas RLS del superadmin.
 * Usa SUPABASE_SERVICE_ROLE_KEY solo en local/CI (nunca en el repo).
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/apply-analytics-rls.js
 */

import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceConfig, loadEnv } from './load-env.mjs';

loadEnv();

const { url: SUPABASE_URL, serviceRoleKey: SERVICE_KEY } =
  getSupabaseServiceConfig();

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function execSQL(sql, description) {
  console.log(`\n▶ ${description}...`);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration_sql`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_sql: sql }),
  });

  const text = await response.text();
  if (response.ok) {
    console.log('  ✅ OK');
  } else {
    console.error(`  ❌ Error (${response.status}): ${text}`);
  }
  return response.ok;
}

async function testConnection() {
  console.log('🔍 Testing connection...');
  const { data, error } = await supabase.from('user_roles').select('user_id').limit(1);
  if (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
  console.log('✅ Connected! user_roles rows found:', data?.length ?? 0);
  return true;
}

async function main() {
  const connected = await testConnection();
  if (!connected) {
    console.error('Cannot proceed without connection');
    process.exit(1);
  }

  console.log('\n📋 Trying database query endpoint...');

  const testSql = 'SELECT current_user, version()';
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration_sql`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_sql: testSql }),
  });
  console.log('Response:', r.status, await r.text());
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
