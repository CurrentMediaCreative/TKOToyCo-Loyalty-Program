/**
 * Error handling middleware
 *
 * Provides global error handling for Express applications.
 */

import { Request, Response, NextFunction } from "express";
import { AppError, formatErrorResponse } from "../utils/errors";
import logger from "../utils/logger";

/**
 * Handle 404 errors for routes that don't exist
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
}

/**
 * Global error handler middleware
 * @param error Error object
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Set default status code if not set
  error.statusCode = error.statusCode || 500;

  // Log the error
  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${error.message}`, {
      error: error.stack,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} - ${error.message}`, {
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }

  // Format the error response
  const errorResponse = formatErrorResponse(error);

  // Send the error response
  res.status(error.statusCode).json(errorResponse);
}

/**
 * Async handler to catch errors in async route handlers
 * @param fn Async route handler function
 * @returns Express middleware function
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request logger middleware
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log request
  logger.http(`[${req.method}] ${req.path} - Request received`, {
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
  });

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "http";

    logger[logLevel](`[${req.method}] ${req.path} - Response sent`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
