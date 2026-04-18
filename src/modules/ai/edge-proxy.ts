import type { Request, Response } from 'express';

/**
 * Si SUPABASE_EDGE_FUNCTIONS_URL está definida (p. ej. https://xxx.supabase.co/functions/v1),
 * las rutas /api/ai/* reenvían a las Edge Functions equivalentes.
 * Las funciones `ai-*` usan verify_jwt=true: el Bearer debe ser el access_token de Supabase Auth
 * (no el JWT legacy Meta-force), salvo que despliegues con verify_jwt=false.
 */
function edgeBase(): string | null {
  const raw = process.env.SUPABASE_EDGE_FUNCTIONS_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

function authorizationFrom(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header;
  const cookie = req.cookies?.auth_token as string | undefined;
  if (cookie) return `Bearer ${cookie}`;
  return undefined;
}

export async function forwardAiChat(req: Request, res: Response, body: unknown): Promise<boolean> {
  const base = edgeBase();
  if (!base) return false;
  const auth = authorizationFrom(req);
  if (!auth) return false;
  const headers: Record<string, string> = {
    Authorization: auth,
    'Content-Type': 'application/json',
  };
  const anon = process.env.SUPABASE_ANON_KEY;
  if (anon) headers.apikey = anon;

  try {
    const r = await fetch(`${base}/ai-chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const text = await r.text();
    try {
      res.status(r.status).json(JSON.parse(text) as object);
    } catch {
      res.status(r.status).send(text);
    }
    return true;
  } catch {
    return false;
  }
}

export async function forwardAiSessionsGet(req: Request, res: Response): Promise<boolean> {
  const base = edgeBase();
  if (!base) return false;
  const auth = authorizationFrom(req);
  if (!auth) return false;
  const headers: Record<string, string> = { Authorization: auth };
  const anon = process.env.SUPABASE_ANON_KEY;
  if (anon) headers.apikey = anon;

  try {
    const r = await fetch(`${base}/ai-sessions`, { method: 'GET', headers });
    const text = await r.text();
    try {
      res.status(r.status).json(JSON.parse(text) as object);
    } catch {
      res.status(r.status).send(text);
    }
    return true;
  } catch {
    return false;
  }
}

export async function forwardAiSessionsDelete(
  req: Request,
  res: Response,
  sessionId: string,
): Promise<boolean> {
  const base = edgeBase();
  if (!base) return false;
  const auth = authorizationFrom(req);
  if (!auth) return false;
  const headers: Record<string, string> = { Authorization: auth };
  const anon = process.env.SUPABASE_ANON_KEY;
  if (anon) headers.apikey = anon;

  try {
    const url = `${base}/ai-sessions?sessionId=${encodeURIComponent(sessionId)}`;
    const r = await fetch(url, { method: 'DELETE', headers });
    const text = await r.text();
    try {
      res.status(r.status).json(JSON.parse(text) as object);
    } catch {
      res.status(r.status).send(text);
    }
    return true;
  } catch {
    return false;
  }
}

export async function forwardAiSavePlan(req: Request, res: Response, body: unknown): Promise<boolean> {
  const base = edgeBase();
  if (!base) return false;
  const auth = authorizationFrom(req);
  if (!auth) return false;
  const headers: Record<string, string> = {
    Authorization: auth,
    'Content-Type': 'application/json',
  };
  const anon = process.env.SUPABASE_ANON_KEY;
  if (anon) headers.apikey = anon;

  try {
    const r = await fetch(`${base}/ai-save-plan`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const text = await r.text();
    try {
      res.status(r.status).json(JSON.parse(text) as object);
    } catch {
      res.status(r.status).send(text);
    }
    return true;
  } catch {
    return false;
  }
}
