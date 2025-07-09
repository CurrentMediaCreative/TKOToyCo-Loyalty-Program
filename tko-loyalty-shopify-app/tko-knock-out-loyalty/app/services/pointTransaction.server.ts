import prisma from "../db.server";
import { updateCustomerBonusPoints } from "./customer.server";
import { updatePointEventStats } from "./pointEvent.server";

/**
 * Get all point transactions
 */
export async function getPointTransactions() {
  return prisma.pointTransaction.findMany({
    include: {
      customer: true,
      event: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get point transactions for a specific customer
 */
export async function getCustomerPointTransactions(customerId: string) {
  return prisma.pointTransaction.findMany({
    where: {
      customerId,
    },
    include: {
      event: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get point transactions for a specific event
 */
export async function getEventPointTransactions(eventId: string) {
  return prisma.pointTransaction.findMany({
    where: {
      eventId,
    },
    include: {
      customer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Create a new point transaction (generic function)
 */
export async function createPointTransaction({
  customerId,
  type,
  amount,
  orderId,
  eventId,
  description,
}: {
  customerId: string;
  type: "earn" | "spend" | "bonus";
  amount: number;
  orderId?: string;
  eventId?: string;
  description?: string;
}) {
  return prisma.pointTransaction.create({
    data: {
      customerId,
      type,
      amount,
      orderId,
      eventId,
      description,
    },
  });
}

/**
 * Create a new spend points transaction
 */
export async function createSpendPointsTransaction({
  customerId,
  amount,
  orderId,
  description,
}: {
  customerId: string;
  amount: number;
  orderId?: string;
  description?: string;
}) {
  return prisma.pointTransaction.create({
    data: {
      customerId,
      type: "spend",
      amount,
      orderId,
      description: description || `Spend points from order ${orderId}`,
    },
  });
}

/**
 * Create a new bonus points transaction and update customer's bonus points
 */
export async function createBonusPointsTransaction({
  customerId,
  amount,
  orderId,
  eventId,
  description,
  admin,
}: {
  customerId: string;
  amount: number;
  orderId?: string;
  eventId?: string;
  description?: string;
  admin?: any; // Optional Shopify admin API context for metafield updates
}) {
  // Create the transaction
  const transaction = await prisma.pointTransaction.create({
    data: {
      customerId,
      type: "bonus",
      amount,
      orderId,
      eventId,
      description: description || `Bonus points${eventId ? " from event" : ""}`,
    },
    include: {
      customer: true,
    },
  });

  // Update the customer's bonus points
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (customer) {
    // We need to cast customer to include bonusPoints since TypeScript doesn't recognize it
    const typedCustomer = customer as unknown as { bonusPoints: number };
    const newBonusPoints = (typedCustomer.bonusPoints || 0) + amount;
    await updateCustomerBonusPoints(customerId, newBonusPoints, admin);
  }

  // Update the event stats if this transaction is associated with an event
  if (eventId) {
    await updatePointEventStats(eventId, amount);
  }

  return transaction;
}

/**
 * Get a summary of point transactions for a customer
 */
export async function getCustomerPointsSummary(customerId: string) {
  // Use raw queries for aggregation since TypeScript doesn't recognize the aggregate method
  const spendPointsResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM "PointTransaction"
    WHERE "customerId" = ${customerId} AND type = 'spend'
  `;

  const bonusPointsResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM "PointTransaction"
    WHERE "customerId" = ${customerId} AND type = 'bonus'
  `;

  // Extract the values from the query results with type assertions
  const spendPointsTotal = (spendPointsResult as any[])[0]?.total || 0;
  const bonusPointsTotal = (bonusPointsResult as any[])[0]?.total || 0;

  return {
    spendPoints: Number(spendPointsTotal),
    bonusPoints: Number(bonusPointsTotal),
    totalPoints: Number(spendPointsTotal) + Number(bonusPointsTotal),
  };
}

/**
 * Manually adjust customer bonus points (for admin use)
 */
export async function adjustCustomerBonusPoints({
  customerId,
  amount,
  reason,
  admin,
}: {
  customerId: string;
  amount: number; // Can be positive (add) or negative (subtract)
  reason: string;
  admin?: any; // Optional Shopify admin API context for metafield updates
}) {
  // Create the adjustment transaction
  const transaction = await prisma.pointTransaction.create({
    data: {
      customerId,
      type: "bonus",
      amount,
      description: `Manual adjustment: ${reason}`,
    },
    include: {
      customer: true,
    },
  });

  // Update the customer's bonus points
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (customer) {
    // We need to cast customer to include bonusPoints since TypeScript doesn't recognize it
    const typedCustomer = customer as unknown as { bonusPoints: number };
    const newBonusPoints = (typedCustomer.bonusPoints || 0) + amount;

    // Ensure bonus points don't go below 0
    const finalBonusPoints = Math.max(0, newBonusPoints);

    await updateCustomerBonusPoints(customerId, finalBonusPoints, admin);
  }

  return transaction;
}

/**
 * Get bonus point transactions only for a specific customer
 */
export async function getCustomerBonusPointTransactions(customerId: string) {
  return prisma.pointTransaction.findMany({
    where: {
      customerId,
      type: "bonus",
    },
    include: {
      event: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Process points for an order
 * This function handles both spend points and bonus points from events
 */
export async function processOrderPoints({
  customerId,
  orderId,
  orderAmount,
  productIds,
  admin,
}: {
  customerId: string;
  orderId: string;
  orderAmount: number;
  productIds?: string[];
  admin?: any; // Optional Shopify admin API context for metafield updates
}) {
  // Create spend points transaction (1:1 ratio with order amount)
  await createSpendPointsTransaction({
    customerId,
    amount: orderAmount,
    orderId,
    description: `Spend points from order ${orderId}`,
  });

  // Get active events that might apply to this order
  const now = new Date();
  const activeEvents = await prisma.pointEvent.findMany({
    where: {
      isActive: true,
      startDate: {
        lte: now,
      },
      endDate: {
        gte: now,
      },
    },
  });

  let totalBonusPoints = 0;

  // Process each active event
  for (const event of activeEvents) {
    let eventApplies = false;
    let bonusAmount = 0;

    // For store-wide events, apply to the entire purchase
    if (event.eventType === "store-wide") {
      eventApplies = true;
      bonusAmount = (orderAmount * event.bonusPercentage) / 100;
    }
    // For product-specific events, check if any products match
    else if (
      event.eventType === "product-specific" &&
      event.productIds &&
      productIds &&
      productIds.length > 0
    ) {
      const eventProductIds = JSON.parse(event.productIds) as string[];

      // Find matching products
      const matchingProducts = productIds.filter((id) =>
        eventProductIds.includes(id),
      );

      if (matchingProducts.length > 0) {
        eventApplies = true;
        // For simplicity, apply to the entire purchase amount
        // In a real implementation, you would calculate the amount for matching products only
        bonusAmount = (orderAmount * event.bonusPercentage) / 100;
      }
    }

    // If the event applies, create a bonus points transaction
    if (eventApplies && bonusAmount > 0) {
      // Round to 2 decimal places
      bonusAmount = Math.round(bonusAmount * 100) / 100;

      await createBonusPointsTransaction({
        customerId,
        amount: bonusAmount,
        orderId,
        eventId: event.id,
        description: `Bonus points from event: ${event.name}`,
        admin,
      });

      totalBonusPoints += bonusAmount;
    }
  }

  return {
    spendPoints: orderAmount,
    bonusPoints: totalBonusPoints,
    totalPoints: orderAmount + totalBonusPoints,
  };
}
