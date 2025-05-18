/**
 * Structured logging utility
 *
 * Provides a consistent logging interface with different log levels,
 * structured output, and configurable transports.
 */

import winston from "winston";
import path from "path";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "info";
};

// Define colors for each log level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  // Add colors
  winston.format.colorize({ all: true }),
  // Define the format of the message showing the timestamp, the level and the message
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console(),
  // File transport for all logs
  new winston.transports.File({
    filename: path.join("logs", "all.log"),
  }),
  // File transport for error logs
  new winston.transports.File({
    filename: path.join("logs", "error.log"),
    level: "error",
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

/**
 * Log an error message
 * @param message Message to log
 * @param meta Additional metadata
 */
export function error(message: string, meta?: any): void {
  logger.error(message, meta);
}

/**
 * Log a warning message
 * @param message Message to log
 * @param meta Additional metadata
 */
export function warn(message: string, meta?: any): void {
  logger.warn(message, meta);
}

/**
 * Log an info message
 * @param message Message to log
 * @param meta Additional metadata
 */
export function info(message: string, meta?: any): void {
  logger.info(message, meta);
}

/**
 * Log an HTTP request
 * @param message Message to log
 * @param meta Additional metadata
 */
export function http(message: string, meta?: any): void {
  logger.http(message, meta);
}

/**
 * Log a debug message
 * @param message Message to log
 * @param meta Additional metadata
 */
export function debug(message: string, meta?: any): void {
  logger.debug(message, meta);
}

/**
 * Log an object with pretty formatting
 * @param obj Object to log
 * @param label Optional label for the object
 */
export function logObject(obj: any, label?: string): void {
  const message = label
    ? `${label}:\n${JSON.stringify(obj, null, 2)}`
    : JSON.stringify(obj, null, 2);
  logger.debug(message);
}

/**
 * Create a child logger with additional context
 * @param context Context to add to all log messages
 * @returns Child logger instance
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

// Export the logger instance
export default {
  error,
  warn,
  info,
  http,
  debug,
  logObject,
  createChildLogger,
};
