/**
 * Tier routes
 *
 * Defines the routes for tier-related operations.
 */

import { Router } from "express";
import container from "../utils/container";
import { ITierController } from "../interfaces/controllers";
import { authenticate, authorize, UserRole } from "../middleware/auth";

const router = Router();
const tierController = container.resolve<ITierController>("tierController");

// Public routes - accessible without authentication
router.get("/", tierController.getAll);
router.get("/:id", tierController.getById);
router.get("/:id/benefits", tierController.getBenefits);

// Protected routes - require authentication and admin/staff privileges
router.use(authenticate);
router.use(authorize([UserRole.ADMIN, UserRole.STAFF]));

// Admin/Staff routes
router.post("/", tierController.create);
router.put("/:id", tierController.update);
router.delete("/:id", tierController.delete);
router.get("/:id/customers", tierController.getCustomers);
router.post("/:id/benefits", tierController.addBenefit);
router.delete("/:id/benefits/:benefitId", tierController.removeBenefit);
router.put("/:id/requirements", tierController.updateRequirements);

export default router;
