import express, { Application, Request, Response, NextFunction } from 'express';

const app: Application = express();

// Ruta de prueba absoluta (Hello World)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Meta-Force API Secure Gateway (BARE METAL MODE)',
    version: '1.0.0',
    env: process.env.NODE_ENV
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

export default app;