import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import { rateLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';
import apiRouter from './routes/index.js';

export const createApp = (): Application => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS enablement for client-server integration
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing (Syntactic Gatekeeper Step 1)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Request Auditing / Logging
  app.use(requestLogger);

  // Global Rate Limiting (Protects API against abuse - 429)
  app.use(rateLimiter);

  // Mount API versioned router
  app.use(config.apiPrefix, apiRouter);

  // Fallback 404 handler for unknown routes
  app.use(notFoundHandler);

  // Centralized Error Handling Middleware (Catches all AppErrors and unexpected errors)
  app.use(errorHandler);

  return app;
};

export const app = createApp();
