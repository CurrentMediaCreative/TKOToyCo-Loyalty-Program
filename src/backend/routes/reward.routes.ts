/**
 * Reward routes
 *
 * Defines the routes for reward-related operations.
 */

import { Router } from "express";
import container from "../utils/container";
import { IRewardController } from "../interfaces/controllers";
import { authenticate, authorize, UserRole } from "../middleware/auth";

const router = Router();
const rewardController =
  container.resolve<IRewardController>("rewardController");

// Public routes - accessible without authentication
router.get("/", rewardController.getAll);
router.get("/:id", rewardController.getById);
router.get("/tier/:tierId", rewardController.getByTier);
router.get("/category/:category", rewardController.getByCategory);
router.get("/status/:status", rewardController.getByStatus);

// Protected routes - require authentication
router.use(authenticate);

// Customer routes - accessible by customers for their own data
router.get("/customer/me", rewardController.getCustomerRewards);
router.post("/redeem/:id", rewardController.redeemReward);

// Admin/Staff routes - require higher privileges
router.use(authorize([UserRole.ADMIN, UserRole.STAFF]));
router.post("/", rewardController.create);
router.put("/:id", rewardController.update);
router.delete("/:id", rewardController.delete);
router.get("/customer/:customerId", rewardController.getCustomerRewards);
router.post("/issue", rewardController.issueReward);
router.post("/cancel/:id", rewardController.cancelReward);

export default router;
