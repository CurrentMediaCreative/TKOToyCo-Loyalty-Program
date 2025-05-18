/**
 * Membership Card routes
 *
 * Defines the routes for membership card-related operations.
 */

import { Router } from "express";
import container from "../utils/container";
import { IMembershipCardController } from "../interfaces/controllers";
import { authenticate, authorize, UserRole } from "../middleware/auth";

const router = Router();
const membershipCardController = container.resolve<IMembershipCardController>(
  "membershipCardController"
);

// Protected routes - require authentication
router.use(authenticate);

// Customer routes - accessible by customers for their own data
router.get("/customer/me", membershipCardController.getByCustomer);

// Admin/Staff routes - require higher privileges
router.use(authorize([UserRole.ADMIN, UserRole.STAFF]));
router.get("/", membershipCardController.getAll);
router.get("/:id", membershipCardController.getById);
router.post("/", membershipCardController.create);
router.put("/:id", membershipCardController.update);
router.delete("/:id", membershipCardController.delete);
router.get("/customer/:customerId", membershipCardController.getByCustomer);
router.get("/number/:number", membershipCardController.getByNumber);
router.get("/status/:status", membershipCardController.getByStatus);
router.post("/:id/activate", membershipCardController.activateCard);
router.post("/:id/deactivate", membershipCardController.deactivateCard);
router.post("/:id/replace", membershipCardController.replaceCard);
router.post("/:id/link/:customerId", membershipCardController.linkToCustomer);

export default router;
