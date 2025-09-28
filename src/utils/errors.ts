/**
 * Base class for all custom application errors.
 */
export class AppError extends Error {
    public readonly statusCode: number;
  
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  export class BadRequestError extends AppError {
    constructor(message = 'Bad Request') {
      super(message, 400);
    }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
      super(message, 401);
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
      super(message, 404);
    }
  }
  
  export class ConflictError extends AppError {
    constructor(message = 'Conflict') {
      super(message, 409);
    }
  }
  
  