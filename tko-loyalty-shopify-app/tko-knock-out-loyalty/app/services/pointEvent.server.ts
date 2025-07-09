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
  collections,
  productIds,
  channel = "both",
  bonusPercentage,
  isActive = true,
}: {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  eventType: "store-wide" | "collections" | "product-specific";
  collections?: string[]; // Array of collection IDs for collection-based events
  productIds?: string[]; // Array of product IDs for product-specific events
  channel?: "online" | "instore" | "both";
  bonusPercentage: number;
  isActive?: boolean;
}) {
  // Convert arrays to JSON strings if provided
  const collectionsString = collections ? JSON.stringify(collections) : null;
  const productIdsString = productIds ? JSON.stringify(productIds) : null;

  return prisma.pointEvent.create({
    data: {
      name,
      description,
      startDate,
      endDate,
      eventType,
      collections: collectionsString,
      productIds: productIdsString,
      channel,
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
  collections,
  productIds,
  channel,
  bonusPercentage,
  isActive,
}: {
  id: string;
  name?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date;
  eventType?: "store-wide" | "collections" | "product-specific";
  collections?: string[] | null; // Array of collection IDs for collection-based events
  productIds?: string[] | null; // Array of product IDs for product-specific events
  channel?: "online" | "instore" | "both";
  bonusPercentage?: number;
  isActive?: boolean;
}) {
  // Convert arrays to JSON strings if provided
  const collectionsString = collections
    ? JSON.stringify(collections)
    : undefined;
  const productIdsString = productIds ? JSON.stringify(productIds) : undefined;

  return prisma.pointEvent.update({
    where: { id },
    data: {
      name,
      description,
      startDate,
      endDate,
      eventType,
      collections: collectionsString,
      productIds: productIdsString,
      channel,
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
 * This function will be called from the order fulfillment webhook
 */
export async function calculateBonusPoints({
  orderLineItems,
  isInstoreOrder = false,
}: {
  orderLineItems: Array<{
    productId: string;
    price: number;
    quantity: number;
    collections: string[]; // Collection IDs that this product belongs to
  }>;
  isInstoreOrder?: boolean;
}) {
  let totalBonusPoints = 0;
  const activeEvents = await getActivePointEvents();
  const appliedEvents: Array<{ eventId: string; pointsAwarded: number }> = [];

  for (const event of activeEvents) {
    // Check if event applies to this order channel
    if (
      (event.channel === "online" && isInstoreOrder) ||
      (event.channel === "instore" && !isInstoreOrder)
    ) {
      continue; // Skip this event
    }

    let eventBonusPoints = 0;

    // For store-wide events, apply to all products
    if (event.eventType === "store-wide") {
      for (const lineItem of orderLineItems) {
        const lineItemTotal = lineItem.price * lineItem.quantity;
        eventBonusPoints += (lineItemTotal * event.bonusPercentage) / 100;
      }
    }

    // For collection-based events, check if products are in the collections
    if (event.eventType === "collections" && event.collections) {
      const eventCollections = JSON.parse(event.collections) as string[];

      for (const lineItem of orderLineItems) {
        // Check if this product is in any of the event collections
        const isInEventCollection = lineItem.collections.some((collectionId) =>
          eventCollections.includes(collectionId),
        );

        if (isInEventCollection) {
          const lineItemTotal = lineItem.price * lineItem.quantity;
          eventBonusPoints += (lineItemTotal * event.bonusPercentage) / 100;
        }
      }
    }

    // For product-specific events, check if any products match
    if (event.eventType === "product-specific" && event.productIds) {
      const eventProductIds = JSON.parse(event.productIds) as string[];

      for (const lineItem of orderLineItems) {
        if (eventProductIds.includes(lineItem.productId)) {
          const lineItemTotal = lineItem.price * lineItem.quantity;
          eventBonusPoints += (lineItemTotal * event.bonusPercentage) / 100;
        }
      }
    }

    if (eventBonusPoints > 0) {
      // Round up bonus points as per user requirement
      const roundedPoints = Math.ceil(eventBonusPoints);
      totalBonusPoints += roundedPoints;
      appliedEvents.push({ eventId: event.id, pointsAwarded: roundedPoints });

      // Update event statistics
      await updatePointEventStats(event.id, roundedPoints);
    }
  }

  return {
    totalBonusPoints,
    appliedEvents,
  };
}
