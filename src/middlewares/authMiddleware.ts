import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { User } from '../models';

/**
 * Protects routes by verifying the access token sent in the 'accessToken' cookie.
 * If the token is invalid or missing, it throws an UnauthorizedError.
 * If the user belonging to the token no longer exists, it throws an UnauthorizedError.
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 * @param {NextFunction} next - The Express next function
 * @throws {UnauthorizedError} If the token is invalid, missing, or the user no longer exists
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the access token from the cookies
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      throw new UnauthorizedError('Not authenticated, no token provided.');
    }

    // Verify the access token
    const decoded = verifyAccessToken(accessToken);
    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
        throw new UnauthorizedError('Invalid token payload.');
    }

    // Find the user associated with the token
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
