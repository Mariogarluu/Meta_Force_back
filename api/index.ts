import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (process.env.META_FORCE_API_MODE === 'supabase') {
    const { default: sunset } = await import('../src/supabase-sunset-app.js');
    return sunset(req, res);
  }
  const { default: app } = await import('../src/app.js');
  return app(req, res);
}