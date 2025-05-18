/**
 * Routes index
 *
 * Exports all route modules for easy importing and registration.
 */

import { Express } from "express";
import authRoutes from "./auth.routes";
import customerRoutes from "./customer.routes";
import tierRoutes from "./tier.routes";
import rewardRoutes from "./reward.routes";
import transactionRoutes from "./transaction.routes";
import membershipCardRoutes from "./membershipCard.routes";

/**
 * Register all API routes with the Express application
 * @param app Express application
 */
export function registerRoutes(app: Express): void {
  // API version prefix
  const apiPrefix = "/api/v1";

  // Register routes with their respective prefixes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/customers`, customerRoutes);
  app.use(`${apiPrefix}/tiers`, tierRoutes);
  app.use(`${apiPrefix}/rewards`, rewardRoutes);
  app.use(`${apiPrefix}/transactions`, transactionRoutes);
  app.use(`${apiPrefix}/cards`, membershipCardRoutes);
}

export {
  authRoutes,
  customerRoutes,
  tierRoutes,
  rewardRoutes,
  transactionRoutes,
  membershipCardRoutes,
};
