/**
 * Modo META_FORCE_API_MODE=supabase: la API Express queda en sunset (410 Gone).
 * El cliente debe usar Supabase (PostgREST, Auth, Edge Functions).
 */
import express, { type Application, type Request, type Response } from 'express';

const app: Application = express();
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Meta-Force API sunset — use Supabase',
    mode: 'supabase',
    docs: 'https://supabase.com/docs',
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', mode: 'supabase', timestamp: new Date().toISOString() });
});

app.use('/api', (_req: Request, res: Response) => {
  res.status(410).json({
    error: true,
    code: 'API_SUNSET',
    message:
      'Las rutas /api de Express están retiradas. Usa @supabase/supabase-js (Auth, from(), functions.invoke).',
  });
});

export default app;
