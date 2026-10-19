import { Router } from 'express';
import userRoutes from './user.routes.js';
import postRoutes from './post.routes.js';
import { createRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const apiRouter = Router();

// Health Check Endpoint (200 OK)
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'Project 2: Backend RESTful API',
      version: '1.0.0',
    },
  });
});

// Resource Routers
apiRouter.use('/users', userRoutes);
apiRouter.use('/posts', postRoutes);

// Simulation Endpoints for HTTP Status Demonstration
// 1. Unhandled internal error to demonstrate 500 status code response
apiRouter.get('/simulate/internal-error', () => {
  throw new Error('Simulated database/system unhandled exception to verify 500 handler');
});

// 2. Strict rate limiter demonstration (allow only 2 requests per 10 seconds)
const strictRateLimiter = createRateLimiter({
  windowMs: 10 * 1000,
  maxRequests: 2,
  message: 'Custom rate limit: You have hit the test endpoint too frequently (max 2 reqs / 10s)',
});

apiRouter.get('/simulate/rate-limited', strictRateLimiter, (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Request passed within rate limit thresholds.',
    timestamp: new Date().toISOString(),
  });
});

export default apiRouter;
