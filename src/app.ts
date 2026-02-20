import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import { xssSanitizer } from './middleware/xssSanitizer.js';
import { noCache } from './middleware/no-cache.js';
import { logger } from './utils/logger.js';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import centerRoutes from './modules/centers/centers.routes.js';
import userCenterRouter from './modules/users/user-center.routes.js';
import classRoutes from './modules/classes/classes.routes.js';
import userClassRouter from './modules/users/user-class.routes.js';
import machineRoutes from './modules/machines/machines.routes.js';
import accessRoutes from './modules/access/access.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import ticketRoutes from './modules/tickets/tickets.routes.js';
import exerciseRoutes from './modules/exercises/exercises.routes.js';
import workoutRoutes from './modules/workouts/workouts.routes.js';
import mealRoutes from './modules/meals/meals.routes.js';
import dietRoutes from './modules/diets/diets.routes.js';
import membershipRoutes from './modules/memberships/memberships.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';

const app: Application = express();
const isDev = process.env['NODE_ENV'] === 'development';

// Configuración para Vercel (Proxy)
app.set('trust proxy', 1);

// Helper para compatibilidad ESM/CJS (CRÍTICO PARA VERCEL)
const getSafe = (pkg: any) => (pkg && pkg.default) ? pkg.default : pkg;

const helmetSafe = getSafe(helmet);
const corsSafe = getSafe(cors);
const rateLimitSafe = getSafe(rateLimit);
const hppSafe = getSafe(hpp);
const cookieParserSafe = getSafe(cookieParser);

// 1. WHITELIST DE ORÍGENES (CORS)
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'https://meta-force.vercel.app'
];

if (process.env['FRONTEND_URL']) {
  allowedOrigins.push(process.env['FRONTEND_URL']);
}

// 2. SEGURIDAD HTTP (HELMET)
app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    return next();
  }
  // @ts-ignore
  helmetSafe({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://vercel.live", "https://vercel.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:", "https://vercel.live"],
        imgSrc: ["'self'", "data:", "https:", "validator.swagger.io", "https://vercel.com", "https://assets.vercel.com"],
        fontSrc: ["'self'", "data:", "https:", "https://assets.vercel.com"],
        connectSrc: isDev
          ? ["'self'", "http://localhost:*", "ws://localhost:*", "https:", "data:", "https://vercel.live", "wss://*.pusher.com"]
          : ["'self'", "https:", "data:", "https://vercel.live", "wss://*.pusher.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'", "https://vercel.live"],
        upgradeInsecureRequests: isDev ? null : [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    }
  })(req, res, next);
});

// 3. CONFIGURACIÓN CORS
const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Permitir acceso sin origen (apps nativas Android) y orígenes permitidos
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin === 'https://vercel.live') {
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
};

app.use(corsSafe(corsOptions));

// 4. PARSERS (ANTES DE SEGURIDAD DE BODY)
app.use(morgan('dev'));
// @ts-ignore
app.use(cookieParserSafe());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. SANITIZACIÓN Y RATE LIMITING
app.use(noCache);
// @ts-ignore
app.use(hppSafe());
app.use(xssSanitizer);

const limiter = rateLimitSafe({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests' }
});

const authLimiter = rateLimitSafe({
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

// 6. RUTAS BASE

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Meta-Force API Secure Gateway',
    version: '1.0.0',
    docs: '/api-docs',
    env: process.env.NODE_ENV
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: isDev ? 'dev' : 'prod'
  });
});

// 7. SWAGGER UI (documentación API)
const swaggerUiDefault = getSafe(swaggerUi);
try {
  app.use('/api-docs', swaggerUiDefault.serve, swaggerUiDefault.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Meta-Force API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    }
  }));
} catch (error) {
  logger.error('Error al inicializar Swagger:', error);
  app.get('/api-docs', (_req: Request, res: Response) => res.status(503).send('Documentación no disponible'));
}

// RUTAS API
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/users', userCenterRouter);
app.use('/api/users', userClassRouter);
app.use('/api/centers', centerRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/ai', aiRoutes);

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