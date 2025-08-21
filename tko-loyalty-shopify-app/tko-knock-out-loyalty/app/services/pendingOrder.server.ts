import prisma from "../db.server";
import { logger } from "../utils/logger.server";

/**
 * Add an order to the pending orders queue
 */
export async function addPendingOrder({
  shopifyOrderId,
  customerId,
  orderData,
}: {
  shopifyOrderId: string;
  customerId: string;
  orderData: any;
}) {
  try {
    // @ts-ignore - PendingOrder model exists in database but TypeScript cache hasn't updated
    return await prisma.pendingOrder.create({
      data: {
        shopifyOrderId,
        customerId,
        orderData: JSON.stringify(orderData),
      },
    });
  } catch (error: any) {
    // If order already exists, update it
    if (error.code === "P2002") {
      // @ts-ignore - PendingOrder model exists in database but TypeScript cache hasn't updated
      return await prisma.pendingOrder.update({
        where: { shopifyOrderId },
        data: {
          orderData: JSON.stringify(orderData),
          updatedAt: new Date(),
        },
      });
    }
    throw error;
  }
}

/**
 * Get a pending order by Shopify order ID
 */
export async function getPendingOrder(shopifyOrderId: string) {
  return await prisma.pendingOrder.findUnique({
    where: { shopifyOrderId },
    include: {
      customer: true,
    },
  });
}

/**
 * Remove a pending order after processing
 */
export async function removePendingOrder(shopifyOrderId: string) {
  try {
    return await prisma.pendingOrder.delete({
      where: { shopifyOrderId },
    });
  } catch (error) {
    // Order might not exist, which is fine
    logger.info("Pending order not found for deletion", {
      operation: "removePendingOrder",
      shopifyOrderId
    });
    return null;
  }
}

/**
 * Get all pending orders for a customer
 */
export async function getPendingOrdersForCustomer(customerId: string) {
  return await prisma.pendingOrder.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get all pending orders (for cleanup/monitoring)
 */
export async function getAllPendingOrders() {
  return await prisma.pendingOrder.findMany({
    include: {
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Clean up old pending orders (older than 30 days)
 */
export async function cleanupOldPendingOrders() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await prisma.pendingOrder.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
    },
  });
}
