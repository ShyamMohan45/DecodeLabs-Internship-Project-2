import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../errors/AppError.js';

interface ValidationTargets {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

export const validateRequest = (schema: ZodType<ValidationTargets>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Safely assign sanitized and coerced values (compatible with Express 4 and Express 5)
      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        try {
          Object.defineProperty(req, 'query', {
            value: parsed.query,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        } catch {
          Object.assign(req.query, parsed.query);
        }
      }
      if (parsed.params !== undefined) {
        try {
          Object.defineProperty(req, 'params', {
            value: parsed.params,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        } catch {
          Object.assign(req.params, parsed.params);
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          rule: err.code,
        }));
        next(new ValidationError('Syntactic validation failed for request payload or parameters', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
