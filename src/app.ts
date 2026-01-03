import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/error.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { env } from './config/env.js';
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
import membershipRoutes from './modules/memberships/memberships.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import exerciseRoutes from './modules/exercises/exercises.routes.js';
import workoutRoutes from './modules/workouts/workouts.routes.js';
import mealRoutes from './modules/meals/meals.routes.js';
import dietRoutes from './modules/diets/diets.routes.js';

const app = express();

app.set('trust proxy', 1);

app.use((helmet as any)({
  contentSecurityPolicy: false,
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use('/api/health', healthRoutes);

if (env.NODE_ENV !== 'test') {
  app.use(generalLimiter);
}

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    message: 'Meta-Force API está funcionando correctamente',
    version: '1.0.0',
    docs: '/api-docs'
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

const swaggerOptions = {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.min.js',
  ],
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

if (env.NODE_ENV !== 'test') {
  app.use('/api/auth', authLimiter, authRoutes);
} else {
  app.use('/api/auth', authRoutes);
}

app.use('/api/users', usersRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/users', userCenterRouter);
app.use('/api/classes', classRoutes);
app.use('/api/users', userClassRouter);
app.use('/api/machines', machineRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/memberships', membershipRoutes);
app.use(errorHandler);

export default app;