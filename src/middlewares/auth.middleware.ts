import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types/index.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import { config } from '../config/index.js';

// Predefined demo credentials for testing
const VALID_TOKENS: Record<string, { userId: string; role: UserRole }> = {
  'admin-token-123': { userId: 'usr-admin-01', role: 'admin' },
  'editor-token-456': { userId: 'usr-editor-01', role: 'editor' },
  'member-token-789': { userId: 'usr-member-01', role: 'member' },
};

/**
 * Gatekeeper Authentication Middleware (401 check)
 * Verifies that the client provided a valid Authorization header
 */
export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('Missing Authorization header. Expected: Bearer <token>');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new UnauthorizedError('Malformed Authorization header. Format must be: Bearer <token>');
  }

  const token = parts[1];
  const userContext = VALID_TOKENS[token];

  if (!userContext) {
    throw new UnauthorizedError('Invalid, expired, or unrecognized authentication token');
  }

  req.auth = {
    userId: userContext.userId,
    role: userContext.role,
    token,
  };

  next();
};

/**
 * Gatekeeper Authorization Middleware (403 check)
 * Verifies that the authenticated user possesses the required role
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      throw new UnauthorizedError('Authentication required prior to role evaluation');
    }

    if (!allowedRoles.includes(req.auth.role)) {
      throw new ForbiddenError(
        `Forbidden: Role '${req.auth.role}' is not authorized to access this resource. Required: [${allowedRoles.join(', ')}]`
      );
    }

    next();
  };
};
