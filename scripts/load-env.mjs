/**
 * Carga variables desde process.env y back/.env (scripts locales / CI).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACK_ROOT = path.resolve(__dirname, '..');

let merged = null;

function parseDotenv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadEnv() {
  if (merged) return merged;
  merged = parseDotenv(path.join(BACK_ROOT, '.env'));
  return merged;
}

function resolve(keys) {
  loadEnv();
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  for (const k of keys) {
    const v = merged[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

export function envOrThrow(name) {
  const value = resolve([name]);
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Defínela en el shell o en back/.env`
    );
  }
  return value;
}

export function getSupabaseServiceConfig() {
  return {
    url: envOrThrow('SUPABASE_URL'),
    serviceRoleKey: envOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
  };
}
