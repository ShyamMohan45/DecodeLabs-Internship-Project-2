import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../errors/AppError.js';
import { config } from '../config/index.js';

interface ClientHitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}

export const createRateLimiter = (options?: RateLimitOptions) => {
  const windowMs = options?.windowMs ?? config.rateLimit.windowMs;
  const maxRequests = options?.maxRequests ?? config.rateLimit.maxRequests;
  const customMessage = options?.message ?? 'Rate limit exceeded. Too many requests from this IP, please try again later.';

  // In-memory sliding window store
  const clientStore = new Map<string, ClientHitRecord>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = clientStore.get(clientIp);
    if (!record) {
      record = { timestamps: [] };
      clientStore.set(clientIp, record);
    }

    // Filter out timestamps outside current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    const resetTimeSeconds = Math.ceil((windowMs - (now - (record.timestamps[0] || now))) / 1000);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining - 1));
    res.setHeader('X-RateLimit-Reset', resetTimeSeconds);

    if (record.timestamps.length >= maxRequests) {
      res.setHeader('Retry-After', resetTimeSeconds);
      throw new TooManyRequestsError(customMessage, {
        limit: maxRequests,
        windowMs,
        retryAfterSeconds: resetTimeSeconds,
      });
    }

    record.timestamps.push(now);
    next();
  };
};

// Global default rate limiter
export const rateLimiter = createRateLimiter();
