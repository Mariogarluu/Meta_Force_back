import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Cliente de Supabase para uso en el backend.
 * Utilizado para interactuar con Storage y gestionar identidades.
 */
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);
