/**
 * TKO Toy Co Loyalty Program API
 *
 * Main application entry point
 */

import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
// @ts-ignore - Morgan types will be available after npm install
import morgan from "morgan";
import dotenv from "dotenv";
import { initializeApp, shutdownApp } from "./utils/init";
import { setupGlobalErrorHandlers } from "./utils/errors";
import {
  notFoundHandler,
  errorHandler,
  requestLogger,
} from "./middleware/errorHandler";
import logger from "./utils/logger";
import { registerRoutes } from "./routes";
import { setupSwagger } from "./middleware/swagger";

// Load environment variables
dotenv.config();

// Create Express application
const app: Express = express();
const port = process.env.PORT || 3000;

// Set up global error handlers
setupGlobalErrorHandlers();

// Initialize application
(async () => {
  try {
    await initializeApp();

    // Middleware
    app.use(helmet()); // Security headers
    app.use(cors()); // CORS
    app.use(express.json()); // Parse JSON bodies
    app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
    app.use(morgan("dev")); // HTTP request logging
    app.use(requestLogger); // Custom request logging

    // API Routes
    app.get("/api/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "success",
        message: "API is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    });

    // Register API routes
    registerRoutes(app);

    // Set up Swagger documentation
    setupSwagger(app);

    // 404 handler
    app.use(notFoundHandler);

    // Error handler
    app.use(errorHandler);

    // Start server
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Handle graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received. Shutting down gracefully...");
      await shutdownApp();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info("SIGINT received. Shutting down gracefully...");
      await shutdownApp();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start application:", error);
    process.exit(1);
  }
})();
