/**
 * Auth routes
 *
 * Defines the routes for authentication and user management.
 */

import { Router } from "express";
import container from "../utils/container";
import { IAuthController } from "../interfaces/controllers";
import { authenticate } from "../middleware/auth";

const router = Router();
const authController = container.resolve<IAuthController>("authController");

// Public routes - accessible without authentication
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);

// Protected routes - require authentication
router.use(authenticate);
router.post("/logout", authController.logout);
router.get("/me", authController.getCurrentUser);
router.post("/change-password", authController.changePassword);

export default router;
