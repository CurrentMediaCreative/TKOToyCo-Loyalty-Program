import { json } from '@remix-run/node';
import { logError, logger } from './logger.server.js';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingFields: string[];
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  customerId?: string;
  orderId?: string;
  eventId?: string;
  requestId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Standard error codes for the application
 */
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  
  // External API errors
  SHOPIFY_API_ERROR: 'SHOPIFY_API_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Business logic errors
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  INVALID_TIER: 'INVALID_TIER',
  EVENT_EXPIRED: 'EVENT_EXPIRED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Creates a standardized error response for API endpoints
 */
export function createErrorResponse(
  message: string, 
  code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
  status: number = 500,
  details?: any
): Response {
  const errorResponse = {
    success: false,
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
  
  logger.error('API Error Response', { 
    message, 
    code, 
    status, 
    details: details ? JSON.stringify(details) : undefined 
  });
  
  return json(errorResponse, { status });
}

/**
 * Handles service layer errors and returns standardized result
 */
export function handleServiceError<T>(
  error: unknown, 
  context?: ErrorContext
): ServiceResult<T> {
  let message = 'An unexpected error occurred';
  let code: ErrorCode = ErrorCodes.INTERNAL_ERROR;
  
  if (error instanceof Error) {
    message = error.message;
    
    // Map specific error types to codes
    if (error.name === 'ValidationError') {
      code = ErrorCodes.VALIDATION_ERROR;
    } else if (error.message.includes('not found')) {
      code = ErrorCodes.RECORD_NOT_FOUND;
    } else if (error.message.includes('duplicate') || error.message.includes('unique constraint')) {
      code = ErrorCodes.DUPLICATE_RECORD;
    } else if (error.message.includes('timeout')) {
      code = ErrorCodes.TIMEOUT_ERROR;
    } else if (error.message.includes('rate limit')) {
      code = ErrorCodes.RATE_LIMIT_EXCEEDED;
    }
  }
  
  // Log the error with context
  logError(error instanceof Error ? error : new Error(String(error)), context);
  
  return {
    success: false,
    error: message,
    code,
  };
}

/**
 * Validates required fields in an object
 */
export function validateRequired(data: any, fields: string[]): ValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data provided'],
      missingFields: fields,
    };
  }
  
  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
      errors.push(`${field} is required`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    missingFields,
  };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format (basic validation)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates numeric values
 */
export function validateNumeric(value: any, options: {
  min?: number;
  max?: number;
  integer?: boolean;
} = {}): ValidationResult {
  const errors: string[] = [];
  
  const num = Number(value);
  if (isNaN(num)) {
    errors.push('Value must be a valid number');
    return { isValid: false, errors, missingFields: [] };
  }
  
  if (options.integer && !Number.isInteger(num)) {
    errors.push('Value must be an integer');
  }
  
  if (options.min !== undefined && num < options.min) {
    errors.push(`Value must be at least ${options.min}`);
  }
  
  if (options.max !== undefined && num > options.max) {
    errors.push(`Value must be at most ${options.max}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    missingFields: [],
  };
}

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): ServiceResult<T> {
  try {
    if (!jsonString || jsonString.trim() === '') {
      return { success: true, data: defaultValue };
    }
    
    const parsed = JSON.parse(jsonString);
    return { success: true, data: parsed };
  } catch (error) {
    logError(
      new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`),
      { jsonString: jsonString.substring(0, 100) + '...' }
    );
    
    return {
      success: false,
      error: 'Invalid JSON format',
      code: ErrorCodes.INVALID_FORMAT,
      data: defaultValue,
    };
  }
}

/**
 * Wraps async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<ServiceResult<T>> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    return handleServiceError<T>(error, context);
  }
}

/**
 * Validates Shopify ID format
 */
export function validateShopifyId(id: any): ValidationResult {
  const errors: string[] = [];
  
  if (!id) {
    errors.push('Shopify ID is required');
  } else {
    const numId = Number(id);
    if (isNaN(numId) || numId <= 0) {
      errors.push('Shopify ID must be a positive number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    missingFields: errors.length > 0 ? ['id'] : [],
  };
}

/**
 * Validates date range
 */
export function validateDateRange(startDate: any, endDate: any): ValidationResult {
  const errors: string[] = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    errors.push('Start date is invalid');
  }
  
  if (isNaN(end.getTime())) {
    errors.push('End date is invalid');
  }
  
  if (errors.length === 0 && start >= end) {
    errors.push('Start date must be before end date');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    missingFields: [],
  };
}

/**
 * Creates a validation error response
 */
export function createValidationErrorResponse(validation: ValidationResult): Response {
  return createErrorResponse(
    'Validation failed',
    ErrorCodes.VALIDATION_ERROR,
    400,
    {
      errors: validation.errors,
      missingFields: validation.missingFields,
    }
  );
}

/**
 * Handles database constraint errors
 */
export function handleDatabaseError(error: any): ServiceResult<null> {
  let message = 'Database operation failed';
  let code: ErrorCode = ErrorCodes.DATABASE_ERROR;
  
  if (error?.code === 'P2002') {
    message = 'Record already exists';
    code = ErrorCodes.DUPLICATE_RECORD;
  } else if (error?.code === 'P2025') {
    message = 'Record not found';
    code = ErrorCodes.RECORD_NOT_FOUND;
  } else if (error?.code === 'P2003') {
    message = 'Foreign key constraint failed';
    code = ErrorCodes.VALIDATION_ERROR;
  }
  
  logError(error instanceof Error ? error : new Error(String(error)));
  
  return {
    success: false,
    error: message,
    code,
  };
}

/**
 * Retry wrapper for operations that might fail temporarily
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  context?: ErrorContext
): Promise<ServiceResult<T>> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
        logger.info('Operation succeeded after retry', {
          attempt,
          maxRetries,
          context,
        });
      }
      
      return { success: true, data: result };
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        logger.warn('Operation failed, retrying', {
          attempt,
          maxRetries,
          error: error instanceof Error ? error.message : String(error),
          context,
        });
        
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  return handleServiceError<T>(lastError, context);
}

export default {
  createErrorResponse,
  handleServiceError,
  validateRequired,
  validateEmail,
  validatePhone,
  validateNumeric,
  safeJsonParse,
  withErrorHandling,
  validateShopifyId,
  validateDateRange,
  createValidationErrorResponse,
  handleDatabaseError,
  withRetry,
  ErrorCodes,
};
