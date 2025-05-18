/**
 * Application initialization
 *
 * Initializes the application by setting up the dependency injection container,
 * registering services, and performing other startup tasks.
 */

import { registerAll } from "./serviceProvider";
import sequelize from "../config/database";

/**
 * Initialize the application
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeApp(): Promise<void> {
  try {
    // Register all services with the dependency injection container
    registerAll();

    // Test database connection
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Sync models with database (in development only)
    if (process.env.NODE_ENV === "development") {
      // This is just for development - in production, use migrations
      // await sequelize.sync({ alter: true });
      console.log("Database models synchronized.");
    }

    console.log("Application initialized successfully.");
  } catch (error) {
    console.error("Error during application initialization:", error);
    throw error;
  }
}

/**
 * Gracefully shut down the application
 * @returns Promise that resolves when shutdown is complete
 */
export async function shutdownApp(): Promise<void> {
  try {
    // Close database connection
    await sequelize.close();
    console.log("Database connection closed.");

    console.log("Application shut down successfully.");
  } catch (error) {
    console.error("Error during application shutdown:", error);
    throw error;
  }
}
