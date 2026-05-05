/**
 * Simple in-memory rate limiter for Supabase Edge Functions.
 *
 * NOTA: Este limitador vive en memoria dentro del runtime de la función.
 * Eso significa que:
 * - No comparte estado entre instancias (escala horizontal).
 * - Se reinicia cuando la función se recicla.
 *
 * Aun así proporciona una primera capa de protección frente a abusos
 * accidentales y ataques básicos, especialmente combinada con RLS y
 * validaciones en base de datos.
 */

type Bucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  /**
   * Clave única por \"sujeto\" a limitar, por ejemplo:
   * - `ai-chat:<userId>`
   * - `auth-register:<ip>`
   * - `create-ticket:<email>`
   */
  key: string;
  /** Máximo número de peticiones permitidas en la ventana. */
  limit: number;
  /** Duración de la ventana en milisegundos. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

/**
 * Verifica e incrementa el contador del bucket en memoria.
 * Devuelve si la petición está permitida y cuántas quedan disponibles.
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(config.key);

  if (!current || now >= current.expiresAt) {
    buckets.set(config.key, {
      count: 1,
      expiresAt: now + config.windowMs,
    });
    return { allowed: true, remaining: Math.max(0, config.limit - 1) };
  }

  if (current.count >= config.limit) {
    return { allowed: false, remaining: 0 };
  }

  const nextCount = current.count + 1;
  current.count = nextCount;
  buckets.set(config.key, current);

  return { allowed: true, remaining: Math.max(0, config.limit - nextCount) };
}

/**
 * Obtiene un identificador simple del cliente a partir de cabeceras típicas
 * de proxy/CDN. Si no se encuentra, usa el valor por defecto proporcionado.
 */
export function getClientIdentifier(req: Request, fallback: string): string {
  const headers = req.headers;
  const xff = headers.get("x-forwarded-for") ?? headers.get("X-Forwarded-For");
  const cf = headers.get("cf-connecting-ip") ?? headers.get("CF-Connecting-IP");
  const real = headers.get("x-real-ip") ?? headers.get("X-Real-IP");

  const ip =
    (xff?.split(",")[0].trim()) ||
    (cf?.trim()) ||
    (real?.trim()) ||
    fallback;

  return ip;
}

