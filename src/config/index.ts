import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: '/api/v1',
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '60', 10), // 60 requests per minute
  },
  auth: {
    // Demo token for protected routes
    validBearerToken: process.env.API_BEARER_TOKEN || 'demo-admin-token-xyz123',
    adminRole: 'admin',
  },
};
