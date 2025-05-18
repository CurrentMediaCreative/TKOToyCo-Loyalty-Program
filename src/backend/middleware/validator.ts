/**
 * Request validation middleware
 *
 * Provides validation middleware for Express request data.
 */

import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errors";

// Define ValidationChain interface until we install express-validator
interface ValidationChain {
  run(req: Request): Promise<any>;
}

// Define ValidationError interface
interface ValidationErrorItem {
  param: string;
  msg: string;
}

// Mock validationResult until we install express-validator
function validationResult(req: Request) {
  return {
    isEmpty: () => true,
    array: (): ValidationErrorItem[] => [],
  };
}

/**
 * Validate request data against validation chains
 * @param validations Array of validation chains
 * @returns Express middleware function
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Get validation errors
    const errors = validationResult(req);

    // If no errors, continue
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors: Record<string, string[]> = {};

    errors.array().forEach((error: ValidationErrorItem) => {
      const field = error.param;

      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }

      formattedErrors[field].push(error.msg);
    });

    // Create validation error
    const validationError = new ValidationError(
      "Validation failed",
      formattedErrors
    );

    // Pass error to error handler
    next(validationError);
  };
}

/**
 * Sanitize request data
 * @param req Express request object
 * @returns Sanitized data
 */
export function sanitize(req: Request): Record<string, any> {
  const sanitized: Record<string, any> = {};

  // Copy only validated fields from body
  const validFields = Object.keys(req.body).filter((key) => {
    return typeof req.body[key] !== "undefined" && req.body[key] !== null;
  });

  validFields.forEach((field) => {
    sanitized[field] = req.body[field];
  });

  return sanitized;
}
