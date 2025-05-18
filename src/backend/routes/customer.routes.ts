/**
 * Customer routes
 *
 * Defines the routes for customer-related operations.
 */

import { Router } from "express";
import container from "../utils/container";
import { ICustomerController } from "../interfaces/controllers";
import { authenticate, authorize, UserRole } from "../middleware/auth";

const router = Router();
const customerController =
  container.resolve<ICustomerController>("customerController");

// Public routes
router.get("/search", customerController.search);

// Protected routes - require authentication
router.use(authenticate);

// Customer routes - accessible by customers for their own data
router.get("/me", customerController.getById);
router.get("/me/transactions", customerController.getTransactions);
router.get("/me/rewards", customerController.getRewards);
router.get("/me/cards", customerController.getMembershipCards);

// Admin/Staff routes - require higher privileges
router.use(authorize([UserRole.ADMIN, UserRole.STAFF]));
router.get("/", customerController.getAll);
router.post("/", customerController.create);
router.get("/:id", customerController.getById);
router.put("/:id", customerController.update);
router.delete("/:id", customerController.delete);
router.get("/email/:email", customerController.getByEmail);
router.get("/phone/:phone", customerController.getByPhone);
router.get("/:id/transactions", customerController.getTransactions);
router.get("/:id/rewards", customerController.getRewards);
router.get("/:id/cards", customerController.getMembershipCards);
router.put("/:id/tier", customerController.updateTier);
router.put("/:id/points", customerController.updatePoints);

export default router;
