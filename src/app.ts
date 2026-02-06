import express, { Application, Request, Response, NextFunction } from 'express';
// @ts-ignore
import cors from 'cors';
// @ts-ignore
import helmet from 'helmet';
import morgan from 'morgan';
// @ts-ignore
import rateLimit from 'express-rate-limit';
// @ts-ignore
// @ts-ignore
import swaggerUi from 'swagger-ui-express';
// @ts-ignore
import hpp from 'hpp';
import { xssSanitizer } from './middleware/xssSanitizer.js';
import { noCache } from './middleware/no-cache.js';
import { logger } from './utils/logger.js';
import { swaggerSpec } from './config/swagger.js'; // Importamos la config real
import authRoutes from './modules/auth/auth.routes.js';

const app: Application = express();
const isDev = process.env['NODE_ENV'] === 'development';

// 1. WHITELIST DE ORÍGENES (CORS)
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'https://meta-force.vercel.app'
];

if (process.env['FRONTEND_URL']) {
  allowedOrigins.push(process.env['FRONTEND_URL']);
}

// 2. SEGURIDAD HTTP (HELMET) - Ajustado para Swagger
app.use(
  // @ts-ignore
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        // Swagger necesita 'unsafe-inline' y 'unsafe-eval' para funcionar correctamente en el navegador
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:*"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:", "validator.swagger.io"],
        fontSrc: ["'self'", "data:", "https:"],
        connectSrc: isDev
          ? ["'self'", "http://localhost:*", "ws://localhost:*", "https:"]
          : ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: isDev ? null : [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    }
  })
);

// 3. CONFIGURACIÓN CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`[CORS Blocked] Origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400
  })
);

// 4. CACHE, HPP Y RATE LIMITING
app.use(noCache);

// @ts-ignore
app.use(hpp());
app.use(xssSanitizer);

// @ts-ignore
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests' }
});

// @ts-ignore
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 intentos fallidos permitidos
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many login attempts, please try again after an hour' }
});

// Aplicar Rate Limit SOLO a rutas de API general
app.use('/api/', limiter);
// Aplicar Rate Limit estricto a Auth
app.use('/api/auth', authLimiter);

// 5. MIDDLEWARES BASE
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. RUTAS BASE

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Meta-Force API Secure Gateway',
    version: '1.0.0',
    docs: '/api-docs'
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: isDev ? 'dev' : 'prod'
  });
});

// 7. SWAGGER UI (RESTAURADO)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }', // Opcional: Estética
  customSiteTitle: "Meta-Force API Docs",
  // Opciones críticas para evitar bloqueos CSP en algunos navegadores
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// TODO: Importar Rutas
// import authRoutes from './routes/auth.routes.js';
app.use('/api/auth', authRoutes);

// 8. MANEJO DE 404
app.use((_req: Request, _res: Response, next: NextFunction) => {
  const error: any = new Error('Resource Not Found');
  error.status = 404;
  error.code = 'NOT_FOUND';
  next(error);
});

// 9. ERROR HANDLING
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message !== 'Not allowed by CORS' && err.status !== 404) {
    logger.error(`${err.status || 500} - ${err.message} - ${_req.originalUrl} - ${_req.method} - ${_req.ip}`);
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (message === 'Not allowed by CORS') {
    res.status(403).json({ error: true, message: 'CORS Policy Violation' });
    return;
  }

  res.status(status).json({
    error: true,
    message,
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  });
});

export default app;