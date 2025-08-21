import prisma from "../db.server";
import { safeJsonParse } from "../utils/errorHandler.server.js";
import { validateCollectionsArray, validateProductIdsArray } from "../utils/validation.server.js";
import { logError, logOrderProcessing, debugLog, logger } from "../utils/logger.server.js";

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
  logOrderProcessing(
    'bonus-calculation', 
    'unknown', 
    `Starting bonus points calculation for ${orderLineItems.length} line items (${isInstoreOrder ? "in-store" : "online"})`
  );

  let totalBonusPoints = 0;
  const activeEvents = await getActivePointEvents();
  const appliedEvents: Array<{ eventId: string; pointsAwarded: number }> = [];

  logger.info('Active point events found', { 
    eventCount: activeEvents.length,
    orderType: isInstoreOrder ? "in-store" : "online"
  });

  if (activeEvents.length === 0) {
    logOrderProcessing('bonus-calculation', 'unknown', 'No active events found - no bonus points will be awarded');
    return {
      totalBonusPoints: 0,
      appliedEvents: [],
    };
  }

  for (const event of activeEvents) {
    logger.info('Evaluating point event', {
      eventName: event.name,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      channel: event.channel,
      bonusPercentage: event.bonusPercentage
    });

    // Check if event applies to this order channel
    if (
      (event.channel === "online" && isInstoreOrder) ||
      (event.channel === "instore" && !isInstoreOrder)
    ) {
      debugLog('Skipping event due to channel mismatch', {
        eventChannel: event.channel,
        orderType: isInstoreOrder ? "instore" : "online",
        eventName: event.name
      });
      continue;
    }

    let eventBonusPoints = 0;
    let qualifyingItems = 0;
    let qualifyingAmount = 0;

    // For store-wide events, apply to all products
    if (event.eventType === "store-wide") {
      logger.info('Processing store-wide event', {
        eventName: event.name,
        itemCount: orderLineItems.length
      });

      for (const lineItem of orderLineItems) {
        const lineItemTotal = lineItem.price * lineItem.quantity;
        const itemBonus = (lineItemTotal * event.bonusPercentage) / 100;
        eventBonusPoints += itemBonus;
        qualifyingItems++;
        qualifyingAmount += lineItemTotal;

        debugLog('Store-wide event applied to product', {
          productId: lineItem.productId,
          lineItemTotal,
          itemBonus,
          eventName: event.name
        });
      }
    }

    // For collection-based events, check if products are in the collections
    if (event.eventType === "collections" && event.collections) {
      // FIXED #003: Replace unsafe JSON.parse with proper error handling and validation
      const collectionsResult = safeJsonParse<string[]>(event.collections, []);
      
      if (!collectionsResult.success) {
        logError(
          new Error(`Failed to parse event collections: ${collectionsResult.error}`),
          { 
            operation: 'calculateBonusPoints',
            eventId: event.id,
            eventName: event.name,
            collectionsData: event.collections?.substring(0, 100) + '...'
          }
        );
        logOrderProcessing('bonus-calculation', 'unknown', `Skipping event ${event.name} due to collection parsing error`);
        continue;
      }

      // Validate that the parsed data is actually an array of strings
      const collectionsValidation = validateCollectionsArray(collectionsResult.data);
      if (!collectionsValidation.isValid) {
        logError(
          new Error(`Invalid collections data format: ${collectionsValidation.errors.join(', ')}`),
          { 
            operation: 'calculateBonusPoints',
            eventId: event.id,
            eventName: event.name,
            collectionsData: collectionsResult.data
          }
        );
        logOrderProcessing('bonus-calculation', 'unknown', `Skipping event ${event.name} due to invalid collections format`);
        continue;
      }

      const eventCollections = collectionsResult.data || [];
      logOrderProcessing('bonus-calculation', 'unknown', 
        `Collection-based event targeting collections: [${eventCollections.join(", ")}]`
      );

      for (const lineItem of orderLineItems) {
        debugLog('Checking product for collection event', {
          productId: lineItem.productId,
          productCollections: lineItem.collections,
          eventName: event.name
        });

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

          logger.info('Collection event match found', {
            productId: lineItem.productId,
            matchingCollections,
            lineItemTotal,
            itemBonus,
            eventName: event.name
          });
        } else {
          debugLog('No matching collections for product', {
            productId: lineItem.productId,
            eventName: event.name
          });
        }
      }
    }

    // For product-specific events, check if any products match
    if (event.eventType === "product-specific" && event.productIds) {
      // FIXED #003: Replace unsafe JSON.parse with proper error handling and validation
      const productIdsResult = safeJsonParse<string[]>(event.productIds, []);
      
      if (!productIdsResult.success) {
        logError(
          new Error(`Failed to parse event product IDs: ${productIdsResult.error}`),
          { 
            operation: 'calculateBonusPoints',
            eventId: event.id,
            eventName: event.name,
            productIdsData: event.productIds?.substring(0, 100) + '...'
          }
        );
        logOrderProcessing('bonus-calculation', 'unknown', `Skipping event ${event.name} due to product ID parsing error`);
        continue;
      }

      // Validate that the parsed data is actually an array of strings/numbers
      const productIdsValidation = validateProductIdsArray(productIdsResult.data);
      if (!productIdsValidation.isValid) {
        logError(
          new Error(`Invalid product IDs data format: ${productIdsValidation.errors.join(', ')}`),
          { 
            operation: 'calculateBonusPoints',
            eventId: event.id,
            eventName: event.name,
            productIdsData: productIdsResult.data
          }
        );
        logOrderProcessing('bonus-calculation', 'unknown', `Skipping event ${event.name} due to invalid product IDs format`);
        continue;
      }

      const eventProductIds = (productIdsResult.data || []).map(String); // Convert to strings for comparison
      logOrderProcessing('bonus-calculation', 'unknown', 
        `Product-specific event targeting products: [${eventProductIds.join(", ")}]`
      );

      for (const lineItem of orderLineItems) {
        debugLog('Checking product for product-specific event', {
          productId: lineItem.productId,
          eventName: event.name
        });

        if (eventProductIds.includes(lineItem.productId)) {
          const lineItemTotal = lineItem.price * lineItem.quantity;
          const itemBonus = (lineItemTotal * event.bonusPercentage) / 100;
          eventBonusPoints += itemBonus;
          qualifyingItems++;
          qualifyingAmount += lineItemTotal;

          logger.info('Product-specific event match found', {
            productId: lineItem.productId,
            lineItemTotal,
            itemBonus,
            eventName: event.name
          });
        } else {
          debugLog('Product not in event list', {
            productId: lineItem.productId,
            eventName: event.name
          });
        }
      }
    }

    // Log event results
    if (eventBonusPoints > 0) {
      // Round up bonus points as per user requirement
      const roundedPoints = Math.ceil(eventBonusPoints);
      totalBonusPoints += roundedPoints;
      appliedEvents.push({ eventId: event.id, pointsAwarded: roundedPoints });

      logger.info('Event qualified for bonus points', {
        eventName: event.name,
        eventId: event.id,
        qualifyingItems,
        qualifyingAmount,
        rawBonus: eventBonusPoints,
        roundedPoints
      });

      // Update event statistics
      try {
        await updatePointEventStats(event.id, roundedPoints);
        debugLog('Event statistics updated', { eventId: event.id });
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          operation: 'updatePointEventStats',
          eventId: event.id,
          eventName: event.name
        });
      }
    } else {
      debugLog('Event did not qualify - no matching items found', {
        eventName: event.name,
        eventId: event.id
      });
    }
  }

  logOrderProcessing('bonus-calculation', 'unknown', 
    `Bonus calculation complete: ${totalBonusPoints} total points from ${appliedEvents.length} events`
  );

  if (appliedEvents.length > 0) {
    logger.info('Applied events summary', {
      totalBonusPoints,
      appliedEvents: appliedEvents.map(event => ({
        eventId: event.eventId,
        pointsAwarded: event.pointsAwarded
      }))
    });
  }

  return {
    totalBonusPoints,
    appliedEvents,
  };
}
