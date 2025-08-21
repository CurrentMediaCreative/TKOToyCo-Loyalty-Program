import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export interface LogConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  enableConsole: boolean;
  enableFile: boolean;
  sanitizeData: boolean;
}

export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  success: boolean;
  errorCount: number;
  timestamp: Date;
}

// Default configuration
const defaultConfig: LogConfig = {
  level: process.env.LOG_LEVEL as LogConfig['level'] || 'info',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true,
  sanitizeData: true,
};

// Sensitive data patterns to sanitize
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /credit.*card/i,
  /ssn/i,
  /social.*security/i,
  /email/i,
  /phone/i,
  /address/i,
];

// Customer data fields that should be sanitized
const CUSTOMER_SENSITIVE_FIELDS = [
  'email',
  'emails',
  'phone',
  'firstName',
  'lastName',
  'address',
  'city',
  'province',
  'country',
];

/**
 * Sanitizes sensitive data from log entries
 */
export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Check if key matches sensitive patterns
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key)) ||
                       CUSTOMER_SENSITIVE_FIELDS.includes(key);
    
    if (isSensitive) {
      if (typeof value === 'string') {
        sanitized[key] = value.length > 0 ? '[REDACTED]' : '';
      } else if (Array.isArray(value)) {
        sanitized[key] = value.length > 0 ? ['[REDACTED]'] : [];
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Creates a Winston logger instance with proper configuration
 */
export function createLogger(config: Partial<LogConfig> = {}): winston.Logger {
  const finalConfig = { ...defaultConfig, ...config };
  
  const transports: winston.transport[] = [];
  
  // Console transport for development
  if (finalConfig.enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length > 0 ? 
              `\n${JSON.stringify(finalConfig.sanitizeData ? sanitizeLogData(meta) : meta, null, 2)}` : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })
        ),
      })
    );
  }
  
  // File transport for production
  if (finalConfig.enableFile) {
    transports.push(
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format.printf((info) => {
            if (finalConfig.sanitizeData && info.meta) {
              info.meta = sanitizeLogData(info.meta);
            }
            return JSON.stringify(info);
          })
        ),
      })
    );
    
    // Separate error log file
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }
  
  return winston.createLogger({
    level: finalConfig.level,
    transports,
    exitOnError: false,
  });
}

// Global logger instance
export const logger = createLogger();

/**
 * Logs error with context and stack trace
 */
export function logError(error: Error, context?: any): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context: context ? sanitizeLogData(context) : undefined,
  };
  
  logger.error('Application Error', errorInfo);
}

/**
 * Logs performance metrics
 */
export function logPerformance(metrics: PerformanceMetrics): void {
  const sanitizedMetrics = sanitizeLogData(metrics);
  
  if (metrics.duration > 5000) { // Log slow operations as warnings
    logger.warn('Slow Operation Detected', sanitizedMetrics);
  } else {
    logger.info('Performance Metrics', sanitizedMetrics);
  }
}

/**
 * Logs customer operation with sanitized data
 */
export function logCustomerOperation(operation: string, customerId: string, details?: any): void {
  const logData = {
    operation,
    customerId,
    details: details ? sanitizeLogData(details) : undefined,
    timestamp: new Date().toISOString(),
  };
  
  logger.info('Customer Operation', logData);
}

/**
 * Logs order processing with sanitized data
 */
export function logOrderProcessing(operation: string, orderId: string, details?: any): void {
  const logData = {
    operation,
    orderId,
    details: details ? sanitizeLogData(details) : undefined,
    timestamp: new Date().toISOString(),
  };
  
  logger.info('Order Processing', logData);
}

/**
 * Logs webhook processing
 */
export function logWebhookProcessing(topic: string, eventId: string, status: string, details?: any): void {
  const logData = {
    topic,
    eventId,
    status,
    details: details ? sanitizeLogData(details) : undefined,
    timestamp: new Date().toISOString(),
  };
  
  logger.info('Webhook Processing', logData);
}

/**
 * Logs API request/response with sanitization
 */
export function logApiCall(method: string, url: string, status: number, duration: number, error?: Error): void {
  const logData = {
    method,
    url: url.replace(/\/\d+/g, '/:id'), // Replace IDs in URLs for privacy
    status,
    duration,
    error: error ? { message: error.message, name: error.name } : undefined,
    timestamp: new Date().toISOString(),
  };
  
  if (error || status >= 400) {
    logger.error('API Call Failed', logData);
  } else if (duration > 2000) {
    logger.warn('Slow API Call', logData);
  } else {
    logger.info('API Call', logData);
  }
}

/**
 * Replaces console.log calls with proper logging
 * Use this function to replace existing console.log statements
 */
export function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, data ? sanitizeLogData(data) : undefined);
  }
}

/**
 * Creates a child logger with additional context
 */
export function createContextLogger(context: Record<string, any>): winston.Logger {
  return logger.child(sanitizeLogData(context));
}

export default logger;
