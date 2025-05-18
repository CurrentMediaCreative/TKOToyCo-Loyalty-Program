/**
 * Logger utility for the TKO Toy Co Loyalty Program
 */

const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure log directory exists
const logDir = path.resolve(process.env.LOG_FILE_PATH || "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create console format
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    ({ level, message, timestamp, ...meta }) =>
      `${timestamp} ${level}: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
      }`
  )
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "loyalty-program" },
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Write logs to file
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],
  exitOnError: false,
});

// Create a stream object for Morgan HTTP request logging
const stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = { logger, stream };
