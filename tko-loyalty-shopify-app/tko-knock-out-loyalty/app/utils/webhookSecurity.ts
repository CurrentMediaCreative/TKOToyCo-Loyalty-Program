/**
 * Webhook Security and Duplicate Prevention Utilities
 *
 * Based on Shopify webhook documentation:
 * https://shopify.dev/docs/apps/webhooks/best-practices
 *
 * Key Requirements:
 * - Use X-Shopify-Event-Id header for duplicate detection
 * - Implement idempotent webhook processing
 * - Ensure webhook responses within 5 seconds
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Webhook event tracking for duplicate prevention
 */
export interface WebhookEvent {
  id: string;
  eventId: string;
  topic: string;
  shop: string;
  processedAt: Date;
  status: "processing" | "completed" | "failed";
  orderId?: string;
  customerId?: string;
  errorMessage?: string;
}

/**
 * Check if a webhook event has already been processed
 * Uses X-Shopify-Event-Id header as recommended by Shopify
 */
export async function isDuplicateEvent(eventId: string): Promise<boolean> {
  if (!eventId) {
    console.warn("No X-Shopify-Event-Id header found in webhook request");
    return false;
  }

  try {
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      console.log(
        `🔄 Duplicate webhook event detected: ${eventId} (status: ${existingEvent.status})`,
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking for duplicate webhook event:", error);
    // If we can't check for duplicates, allow processing to continue
    // This prevents webhook failures due to database issues
    return false;
  }
}

/**
 * Mark webhook event as being processed
 * Creates a record to prevent duplicate processing
 */
export async function markEventProcessing(
  eventId: string,
  topic: string,
  shop: string,
  orderId?: string,
  customerId?: string,
): Promise<void> {
  if (!eventId) {
    console.warn("Cannot mark event as processing - no eventId provided");
    return;
  }

  try {
    await prisma.webhookEvent.create({
      data: {
        eventId,
        topic,
        shop,
        status: "processing",
        orderId,
        customerId,
        processedAt: new Date(),
      },
    });

    console.log(`📝 Marked webhook event ${eventId} as processing`);
  } catch (error) {
    console.error("Error marking webhook event as processing:", error);
    // Don't throw error - allow webhook processing to continue
    // The duplicate check will still work for subsequent attempts
  }
}

/**
 * Mark webhook event as completed successfully
 */
export async function markEventCompleted(
  eventId: string,
  result?: any,
): Promise<void> {
  if (!eventId) {
    return;
  }

  try {
    await prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: "completed",
        processedAt: new Date(),
        // Store result summary for debugging
        errorMessage: result ? JSON.stringify(result).substring(0, 500) : null,
      },
    });

    console.log(`✅ Marked webhook event ${eventId} as completed`);
  } catch (error) {
    console.error("Error marking webhook event as completed:", error);
    // Don't throw error - webhook was successful even if we can't update status
  }
}

/**
 * Mark webhook event as failed
 */
export async function markEventFailed(
  eventId: string,
  error: Error | string,
): Promise<void> {
  if (!eventId) {
    return;
  }

  try {
    const errorMessage = error instanceof Error ? error.message : error;

    await prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: "failed",
        processedAt: new Date(),
        errorMessage: errorMessage.substring(0, 500), // Limit error message length
      },
    });

    console.log(
      `❌ Marked webhook event ${eventId} as failed: ${errorMessage}`,
    );
  } catch (dbError) {
    console.error("Error marking webhook event as failed:", dbError);
    // Don't throw error - we don't want to mask the original webhook error
  }
}

/**
 * Get webhook event processing statistics
 * Useful for monitoring webhook performance
 */
export async function getWebhookStats(hours: number = 24): Promise<{
  total: number;
  completed: number;
  failed: number;
  processing: number;
  duplicates: number;
}> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [total, completed, failed, processing] = await Promise.all([
      prisma.webhookEvent.count({
        where: { processedAt: { gte: since } },
      }),
      prisma.webhookEvent.count({
        where: {
          processedAt: { gte: since },
          status: "completed",
        },
      }),
      prisma.webhookEvent.count({
        where: {
          processedAt: { gte: since },
          status: "failed",
        },
      }),
      prisma.webhookEvent.count({
        where: {
          processedAt: { gte: since },
          status: "processing",
        },
      }),
    ]);

    // Count duplicates by finding eventIds that appear more than once
    const duplicateEvents = await prisma.webhookEvent.groupBy({
      by: ["eventId"],
      where: { processedAt: { gte: since } },
      having: {
        eventId: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    return {
      total,
      completed,
      failed,
      processing,
      duplicates: duplicateEvents.length,
    };
  } catch (error) {
    console.error("Error getting webhook stats:", error);
    return {
      total: 0,
      completed: 0,
      failed: 0,
      processing: 0,
      duplicates: 0,
    };
  }
}

/**
 * Clean up old webhook events (older than 30 days)
 * Should be run periodically to prevent database bloat
 */
export async function cleanupOldWebhookEvents(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.webhookEvent.deleteMany({
      where: {
        processedAt: { lt: thirtyDaysAgo },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} old webhook events`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up old webhook events:", error);
    return 0;
  }
}

/**
 * Extract webhook headers for processing
 * Validates required headers according to Shopify documentation
 */
export function extractWebhookHeaders(request: Request): {
  eventId: string | null;
  topic: string | null;
  shop: string | null;
  webhookId: string | null;
  triggeredAt: string | null;
} {
  // Header names are case-insensitive according to Shopify docs
  const headers = request.headers;

  return {
    eventId:
      headers.get("X-Shopify-Event-Id") || headers.get("x-shopify-event-id"),
    topic: headers.get("X-Shopify-Topic") || headers.get("x-shopify-topic"),
    shop:
      headers.get("X-Shopify-Shop-Domain") ||
      headers.get("x-shopify-shop-domain"),
    webhookId:
      headers.get("X-Shopify-Webhook-Id") ||
      headers.get("x-shopify-webhook-id"),
    triggeredAt:
      headers.get("X-Shopify-Triggered-At") ||
      headers.get("x-shopify-triggered-at"),
  };
}

/**
 * Validate webhook timing to detect delays
 * Shopify recommends checking for delayed webhooks
 */
export function validateWebhookTiming(triggeredAt: string | null): {
  isDelayed: boolean;
  delayMinutes: number;
} {
  if (!triggeredAt) {
    return { isDelayed: false, delayMinutes: 0 };
  }

  try {
    const triggered = new Date(triggeredAt);
    const now = new Date();
    const delayMs = now.getTime() - triggered.getTime();
    const delayMinutes = Math.floor(delayMs / (1000 * 60));

    // Consider webhook delayed if it's more than 5 minutes old
    const isDelayed = delayMinutes > 5;

    if (isDelayed) {
      console.warn(`⚠️ Webhook is delayed by ${delayMinutes} minutes`);
    }

    return { isDelayed, delayMinutes };
  } catch (error) {
    console.error("Error parsing webhook triggered timestamp:", error);
    return { isDelayed: false, delayMinutes: 0 };
  }
}
