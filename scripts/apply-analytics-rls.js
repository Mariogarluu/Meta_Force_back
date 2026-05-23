/**
 * Script de migración: Políticas RLS del superadmin
 * Ejecuta cada sentencia SQL individualmente usando la API de Supabase
 * con service_role key (que bypasa RLS para las tablas de datos).
 * 
 * Para DDL (CREATE FUNCTION, CREATE POLICY, etc.) necesitamos pg directo.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qybgnrlszozjhimewkel.supabase.co';
const SERVICE_KEY = 'REDACTED_JWT';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ============================================================
// SENTENCIAS SQL a ejecutar (divididas para ejecutar por partes)
// Cada sentencia se ejecuta como una llamada RPC separada
// Usaremos una función auxiliar que ejecuta SQL raw via REST
// ============================================================

async function execSQL(sql, description) {
  console.log(`\n▶ ${description}...`);
  
  // Usar el endpoint de Supabase para ejecutar SQL via RPC
  // Necesitamos la URL del endpoint de database/query (solo disponible con PAT)
  // Alternativa: usar el endpoint pg directamente
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_sql: sql })
  });
  
  const text = await response.text();
  if (response.ok) {
    console.log(`  ✅ OK`);
  } else {
    console.error(`  ❌ Error (${response.status}): ${text}`);
  }
  return response.ok;
}

// Verificar conexión básica
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
  
  // La RPC exec_migration_sql no existe, vamos a intentar con el endpoint correcto
  console.log('\n📋 Trying database query endpoint...');
  
  const testSql = 'SELECT current_user, version()';
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_sql: testSql })
  });
  console.log('Response:', r.status, await r.text());
}

main().catch(console.error);
