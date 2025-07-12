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
  console.log(
    `🎯 Starting bonus points calculation for ${orderLineItems.length} line items`,
  );
  console.log(`📍 Order type: ${isInstoreOrder ? "in-store" : "online"}`);

  let totalBonusPoints = 0;
  const activeEvents = await getActivePointEvents();
  const appliedEvents: Array<{ eventId: string; pointsAwarded: number }> = [];

  console.log(`🎪 Found ${activeEvents.length} active point events`);

  if (activeEvents.length === 0) {
    console.log(`ℹ️ No active events found - no bonus points will be awarded`);
    return {
      totalBonusPoints: 0,
      appliedEvents: [],
    };
  }

  for (const event of activeEvents) {
    console.log(`\n🎪 Evaluating event: "${event.name}" (${event.eventType})`);
    console.log(`   📅 Active: ${event.startDate} to ${event.endDate}`);
    console.log(
      `   📺 Channel: ${event.channel} | Bonus: ${event.bonusPercentage}%`,
    );

    // Check if event applies to this order channel
    if (
      (event.channel === "online" && isInstoreOrder) ||
      (event.channel === "instore" && !isInstoreOrder)
    ) {
      console.log(
        `   ⏭️ Skipping - channel mismatch (event: ${event.channel}, order: ${isInstoreOrder ? "instore" : "online"})`,
      );
      continue;
    }

    let eventBonusPoints = 0;
    let qualifyingItems = 0;
    let qualifyingAmount = 0;

    // For store-wide events, apply to all products
    if (event.eventType === "store-wide") {
      console.log(
        `   🌍 Store-wide event - applying to all ${orderLineItems.length} items`,
      );

      for (const lineItem of orderLineItems) {
        const lineItemTotal = lineItem.price * lineItem.quantity;
        const itemBonus = (lineItemTotal * event.bonusPercentage) / 100;
        eventBonusPoints += itemBonus;
        qualifyingItems++;
        qualifyingAmount += lineItemTotal;

        console.log(
          `     ✅ Product ${lineItem.productId}: $${lineItemTotal.toFixed(2)} → +${itemBonus.toFixed(2)} bonus`,
        );
      }
    }

    // For collection-based events, check if products are in the collections
    if (event.eventType === "collections" && event.collections) {
      let eventCollections: string[] = [];

      try {
        eventCollections = JSON.parse(event.collections) as string[];
        console.log(
          `   📂 Collection-based event targeting collections: [${eventCollections.join(", ")}]`,
        );
      } catch (error) {
        console.error(`   ❌ Error parsing event collections:`, error);
        console.log(`   ⏭️ Skipping event due to collection parsing error`);
        continue;
      }

      for (const lineItem of orderLineItems) {
        console.log(`     🔍 Checking product ${lineItem.productId}:`);
        console.log(
          `       Product collections: [${lineItem.collections.join(", ") || "none"}]`,
        );

        // Check if this product is in any of the event collections
        const matchingCollections = lineItem.collections.filter(
          (collectionId) => eventCollections.includes(collectionId),
        );

        if (matchingCollections.length > 0) {
          const lineItemTotal = lineItem.price * lineItem.quantity;
          const itemBonus = (lineItemTotal * event.bonusPercentage) / 100;
          eventBonusPoints += itemBonus;
          qualifyingItems++;
          qualifyingAmount += lineItemTotal;

          console.log(
            `       ✅ MATCH! Collections: [${matchingCollections.join(", ")}]`,
          );
          console.log(
            `       💰 $${lineItemTotal.toFixed(2)} → +${itemBonus.toFixed(2)} bonus`,
          );
        } else {
          console.log(`       ❌ No matching collections`);
        }
      }
    }

    // For product-specific events, check if any products match
    if (event.eventType === "product-specific" && event.productIds) {
      let eventProductIds: string[] = [];

      try {
        eventProductIds = JSON.parse(event.productIds) as string[];
        console.log(
          `   🎯 Product-specific event targeting products: [${eventProductIds.join(", ")}]`,
        );
      } catch (error) {
        console.error(`   ❌ Error parsing event product IDs:`, error);
        console.log(`   ⏭️ Skipping event due to product ID parsing error`);
        continue;
      }

      for (const lineItem of orderLineItems) {
        console.log(`     🔍 Checking product ${lineItem.productId}`);

        if (eventProductIds.includes(lineItem.productId)) {
          const lineItemTotal = lineItem.price * lineItem.quantity;
          const itemBonus = (lineItemTotal * event.bonusPercentage) / 100;
          eventBonusPoints += itemBonus;
          qualifyingItems++;
          qualifyingAmount += lineItemTotal;

          console.log(`       ✅ MATCH! Product in event list`);
          console.log(
            `       💰 $${lineItemTotal.toFixed(2)} → +${itemBonus.toFixed(2)} bonus`,
          );
        } else {
          console.log(`       ❌ Product not in event list`);
        }
      }
    }

    // Log event results
    if (eventBonusPoints > 0) {
      // Round up bonus points as per user requirement
      const roundedPoints = Math.ceil(eventBonusPoints);
      totalBonusPoints += roundedPoints;
      appliedEvents.push({ eventId: event.id, pointsAwarded: roundedPoints });

      console.log(
        `   🎉 Event qualified! ${qualifyingItems} items, $${qualifyingAmount.toFixed(2)} total`,
      );
      console.log(
        `   🏆 Raw bonus: ${eventBonusPoints.toFixed(2)} → Rounded: ${roundedPoints} points`,
      );

      // Update event statistics
      try {
        await updatePointEventStats(event.id, roundedPoints);
        console.log(`   📊 Event statistics updated`);
      } catch (error) {
        console.error(`   ❌ Error updating event statistics:`, error);
      }
    } else {
      console.log(`   ❌ Event did not qualify - no matching items found`);
    }
  }

  console.log(`\n🏁 Bonus calculation complete:`);
  console.log(`   🎁 Total bonus points: ${totalBonusPoints}`);
  console.log(`   🎪 Events applied: ${appliedEvents.length}`);

  if (appliedEvents.length > 0) {
    appliedEvents.forEach((event, index) => {
      console.log(
        `     ${index + 1}. Event ${event.eventId}: ${event.pointsAwarded} points`,
      );
    });
  }

  return {
    totalBonusPoints,
    appliedEvents,
  };
}
