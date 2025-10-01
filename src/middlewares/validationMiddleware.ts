import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { BadRequestError } from '../utils/errors';

/**
 * Middleware that validates the request body, params, or query against a Zod schema.
 * @param schema The Zod schema to validate against.
 */
export const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      // Format Zod errors into a user-friendly message
      const errorMessages = error.errors.map((e: any) => e.message).join(', ');
      next(new BadRequestError(errorMessages));
    }
  };
