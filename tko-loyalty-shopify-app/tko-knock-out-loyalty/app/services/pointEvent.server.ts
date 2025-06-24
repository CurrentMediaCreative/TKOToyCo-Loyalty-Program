import prisma from "../db.server";

/**
 * Get all point events
 */
export async function getPointEvents() {
  return prisma.pointEvent.findMany({
    orderBy: {
      startDate: "desc",
    },
  });
}

/**
 * Get active point events (current date is between start and end date)
 */
export async function getActivePointEvents() {
  const now = new Date();
  return prisma.pointEvent.findMany({
    where: {
      isActive: true,
      startDate: {
        lte: now,
      },
      endDate: {
        gte: now,
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });
}

/**
 * Get a point event by ID
 */
export async function getPointEventById(id: string) {
  return prisma.pointEvent.findUnique({
    where: { id },
  });
}

/**
 * Create a new point event
 */
export async function createPointEvent({
  name,
  description,
  startDate,
  endDate,
  eventType,
  productIds,
  bonusPercentage,
  isActive = true,
}: {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  eventType: "store-wide" | "product-specific";
  productIds?: string[]; // Array of product IDs for product-specific events
  bonusPercentage: number;
  isActive?: boolean;
}) {
  // Convert productIds array to JSON string if provided
  const productIdsString = productIds ? JSON.stringify(productIds) : null;

  return prisma.pointEvent.create({
    data: {
      name,
      description,
      startDate,
      endDate,
      eventType,
      productIds: productIdsString,
      bonusPercentage,
      isActive,
    },
  });
}

/**
 * Update an existing point event
 */
export async function updatePointEvent({
  id,
  name,
  description,
  startDate,
  endDate,
  eventType,
  productIds,
  bonusPercentage,
  isActive,
}: {
  id: string;
  name?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date;
  eventType?: "store-wide" | "product-specific";
  productIds?: string[] | null; // Array of product IDs for product-specific events
  bonusPercentage?: number;
  isActive?: boolean;
}) {
  // Convert productIds array to JSON string if provided
  const productIdsString = productIds ? JSON.stringify(productIds) : undefined;

  return prisma.pointEvent.update({
    where: { id },
    data: {
      name,
      description,
      startDate,
      endDate,
      eventType,
      productIds: productIdsString,
      bonusPercentage,
      isActive,
    },
  });
}

/**
 * Delete a point event
 */
export async function deletePointEvent(id: string) {
  return prisma.pointEvent.delete({
    where: { id },
  });
}

/**
 * Update point event statistics when it's used
 */
export async function updatePointEventStats(
  eventId: string,
  pointsAwarded: number,
) {
  const event = await prisma.pointEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return null;
  }

  return prisma.pointEvent.update({
    where: { id: eventId },
    data: {
      usageCount: { increment: 1 },
      pointsAwarded: { increment: pointsAwarded },
      lastUsed: new Date(),
    },
  });
}

/**
 * Calculate bonus points for a purchase based on active events
 */
export async function calculateBonusPoints({
  purchaseAmount,
  productIds,
}: {
  purchaseAmount: number;
  productIds?: string[]; // Product IDs in the purchase
}) {
  let bonusPoints = 0;
  const activeEvents = await getActivePointEvents();

  for (const event of activeEvents) {
    // For store-wide events, apply to the entire purchase
    if (event.eventType === "store-wide") {
      bonusPoints += (purchaseAmount * event.bonusPercentage) / 100;
      continue;
    }

    // For product-specific events, check if any products match
    if (
      event.eventType === "product-specific" &&
      event.productIds &&
      productIds
    ) {
      const eventProductIds = JSON.parse(event.productIds) as string[];

      // Find matching products
      const matchingProducts = productIds.filter((id) =>
        eventProductIds.includes(id),
      );

      if (matchingProducts.length > 0) {
        // For simplicity, apply to the entire purchase amount
        // In a real implementation, you would calculate the amount for matching products only
        bonusPoints += (purchaseAmount * event.bonusPercentage) / 100;
      }
    }
  }

  return Math.round(bonusPoints * 100) / 100; // Round to 2 decimal places
}
