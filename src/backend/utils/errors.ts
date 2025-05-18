/**
 * Custom error classes and error handling utilities
 *
 * Provides standardized error types and handling mechanisms for the application.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

/**
 * Bad request error (400)
 */
export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

/**
 * Validation error (422)
 */
export class ValidationError extends AppError {
  public errors: Record<string, string[]>;

  constructor(
    message = "Validation failed",
    errors: Record<string, string[]> = {}
  ) {
    super(message, 422);
    this.errors = errors;
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409);
  }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, false);
  }
}

/**
 * Service unavailable error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable") {
    super(message, 503);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message = "Database error") {
    super(message, 500, false);
  }
}

/**
 * External API error
 */
export class ExternalAPIError extends AppError {
  constructor(message = "External API error") {
    super(message, 502);
  }
}

/**
 * Format error response for API
 * @param error Error object
 * @returns Formatted error response
 */
export function formatErrorResponse(error: any) {
  // Default error response
  const response: any = {
    success: false,
    message: error.message || "An error occurred",
    status: error.statusCode || 500,
  };

  // Add validation errors if present
  if (
    error instanceof ValidationError &&
    Object.keys(error.errors).length > 0
  ) {
    response.errors = error.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on("uncaughtException", (error: Error) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(error.name, error.message);
    console.error(error.stack);
    process.exit(1);
  });

  // Handle unhandled rejections
  process.on("unhandledRejection", (reason: any) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(reason);
    process.exit(1);
  });
}
