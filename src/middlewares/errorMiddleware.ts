import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Global error handling middleware.
 * Catches all errors passed via next(error) and formats a consistent JSON response.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error for debugging purposes
  console.error(`❌ ERROR: ${err.message}`);
  console.error(err.stack);

  if (err instanceof AppError) {
    // If it's a known, operational error, send the specific status and message
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // For any other unexpected errors, send a generic 500 response
  return res.status(500).json({
    status: 'error',
    message: 'An unexpected internal server error occurred.',
  });
};
