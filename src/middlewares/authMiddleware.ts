import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { User } from '../models';

/**
 * Middleware to protect routes that require authentication.
 * It verifies the JWT token from the cookies and attaches the user to the request object.
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      throw new UnauthorizedError('Not authenticated, no token provided.');
    }

    const decoded = verifyAccessToken(accessToken);
    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
        throw new UnauthorizedError('Invalid token payload.');
    }

    const currentUser = await User.findByPk(decoded.userId);
    if (!currentUser) {
      throw new UnauthorizedError('User belonging to this token no longer exists.');
    }

    // Attach user to the request object
    req.user = currentUser;
    next();
  } catch (error) {
    // Forward the error to the Express error handler
    next(error);
  }
};

