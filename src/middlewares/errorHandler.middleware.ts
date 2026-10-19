import { Request, Response, NextFunction } from 'express';
import { AppError, NotFoundError } from '../errors/AppError.js';
import { config } from '../config/index.js';

/**
 * 404 Not Found Handler for unmatched routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized Application Error Handling Middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle JSON parse syntax errors (e.g., malformed body)
  if ('type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'The request body contains invalid, unparseable JSON',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle known operational application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle unexpected system crashes / programmer errors (500)
  console.error('[UNHANDLED_EXCEPTION]', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred',
      ...(config.env === 'development' ? { stack: err.stack } : {}),
    },
    timestamp: new Date().toISOString(),
  });
};
