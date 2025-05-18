/**
 * Swagger middleware
 *
 * Configures and serves Swagger UI documentation.
 */

import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import logger from "../utils/logger";

/**
 * Set up Swagger documentation middleware
 * @param app Express application
 */
export function setupSwagger(app: Express): void {
  try {
    // Load Swagger document
    const swaggerDocument = YAML.load(
      path.join(__dirname, "../docs/swagger.yaml")
    );

    // Serve Swagger UI
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "TKO Toy Co Loyalty Program API Documentation",
      })
    );

    logger.info("Swagger documentation available at /api-docs");
  } catch (error) {
    logger.error("Failed to set up Swagger documentation:", error);
  }
}
