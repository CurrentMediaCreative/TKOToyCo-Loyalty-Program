/**
 * Transaction routes
 *
 * Defines the routes for transaction-related operations.
 */

import { Router } from "express";
import container from "../utils/container";
import { ITransactionController } from "../interfaces/controllers";
import { authenticate, authorize, UserRole } from "../middleware/auth";

const router = Router();
const transactionController = container.resolve<ITransactionController>(
  "transactionController"
);

// Protected routes - require authentication
router.use(authenticate);

// Customer routes - accessible by customers for their own data
router.get("/customer/me", transactionController.getByCustomer);

// Admin/Staff routes - require higher privileges
router.use(authorize([UserRole.ADMIN, UserRole.STAFF]));
router.get("/", transactionController.getAll);
router.get("/:id", transactionController.getById);
router.post("/", transactionController.create);
router.put("/:id", transactionController.update);
router.delete("/:id", transactionController.delete);
router.get("/customer/:customerId", transactionController.getByCustomer);
router.get("/date-range", transactionController.getByDateRange);
router.get("/status/:status", transactionController.getByStatus);
router.get("/:id/items", transactionController.getItems);
router.post("/process", transactionController.processTransaction);
router.post("/:id/cancel", transactionController.cancelTransaction);
router.get("/summary", transactionController.getSummary);

export default router;
