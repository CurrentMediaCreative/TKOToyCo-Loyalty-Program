/**
 * Centralized Webhook Processing Service
 *
 * Implements Shopify webhook best practices:
 * - Duplicate event prevention using X-Shopify-Event-Id
 * - Idempotent processing
 * - Performance optimization (<5 second response time)
 * - Comprehensive error handling and logging
 *
 * Based on Shopify documentation:
 * https://shopify.dev/docs/apps/webhooks/best-practices
 */

import {
  isDuplicateEvent,
  markEventProcessing,
  markEventCompleted,
  markEventFailed,
  extractWebhookHeaders,
  validateWebhookTiming,
} from "../utils/webhookSecurity";
import { logger } from "../utils/logger.server";
import { measurePerformance } from "../utils/performance.server";

export interface WebhookProcessingResult {
  success: boolean;
  orderId: string;
  status: string;
  pointsAwarded?: any;
  error?: string;
  processingTime?: number;
}

export interface WebhookContext {
  eventId: string;
  topic: string;
  shop: string;
  orderId?: string;
  customerId?: string;
}

/**
 * Base webhook processor with duplicate prevention and error handling
 */
export class WebhookProcessor {
  private startTime: number;
  private context: WebhookContext;

  constructor(
    private request: Request,
    private topic: string,
    private shop: string,
    private admin: any,
  ) {
    this.startTime = Date.now();

    // Extract webhook headers
    const headers = extractWebhookHeaders(request);

    this.context = {
      eventId: headers.eventId || `fallback-${Date.now()}-${Math.random()}`,
      topic: headers.topic || topic,
      shop: headers.shop || shop,
    };

    // Validate webhook timing
    if (headers.triggeredAt) {
      const timing = validateWebhookTiming(headers.triggeredAt);
      if (timing.isDelayed) {
        logger.warn("Processing delayed webhook", {
          operation: "WebhookProcessor",
          eventId: this.context.eventId,
          delayMinutes: timing.delayMinutes,
          topic: this.context.topic
        });
      }
    }
  }

  /**
   * Process webhook with duplicate prevention and error handling
   */
  async processWebhook<T>(
    processor: (admin: any) => Promise<T>,
    payload: any,
  ): Promise<WebhookProcessingResult> {
    const { eventId, topic, shop } = this.context;

    try {
      // Check for duplicate events
      const isDuplicate = await isDuplicateEvent(eventId);
      if (isDuplicate) {
        logger.info("Skipping duplicate webhook event", {
          operation: "processWebhook",
          eventId,
          topic,
          orderId: payload.id?.toString() || "unknown"
        });
        return {
          success: true,
          orderId: payload.id?.toString() || "unknown",
          status: "duplicate_skipped",
          processingTime: Date.now() - this.startTime,
        };
      }

      // Extract order and customer IDs for tracking
      this.context.orderId = payload.id?.toString();
      this.context.customerId = payload.customer?.id?.toString();

      // Mark event as processing
      await markEventProcessing(
        eventId,
        topic,
        shop,
        this.context.orderId,
        this.context.customerId,
      );

      logger.info("Processing webhook", {
        operation: "processWebhook",
        topic,
        eventId,
        orderId: this.context.orderId,
        customerId: this.context.customerId
      });

      // Process the webhook
      const result = await measurePerformance(async () => {
        return await processor(this.admin);
      }, `webhook-${topic}`);

      // Mark as completed
      await markEventCompleted(eventId, result);

      const processingTime = Date.now() - this.startTime;
      logger.info("Webhook processed successfully", {
        operation: "processWebhook",
        topic,
        eventId,
        processingTime,
        orderId: this.context.orderId
      });

      return {
        success: true,
        orderId: this.context.orderId || "unknown",
        status: "completed",
        pointsAwarded: result,
        processingTime,
      };
    } catch (error) {
      // Mark as failed
      await markEventFailed(eventId, error as Error);

      const processingTime = Date.now() - this.startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Webhook processing failed", {
        operation: "processWebhook",
        topic,
        eventId,
        processingTime,
        orderId: this.context.orderId,
        error: errorMessage
      });

      return {
        success: false,
        orderId: this.context.orderId || "unknown",
        status: "failed",
        error: errorMessage,
        processingTime,
      };
    }
  }

  /**
   * Create standardized webhook response
   */
  createResponse(result: WebhookProcessingResult): Response {
    const responseData = {
      success: result.success,
      orderId: result.orderId,
      status: result.status,
      eventId: this.context.eventId,
      processingTime: result.processingTime,
      ...(result.pointsAwarded && { pointsAwarded: result.pointsAwarded }),
      ...(result.error && { error: result.error }),
    };

    const statusCode = result.success ? 200 : 500;

    return new Response(JSON.stringify(responseData), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Validate webhook payload has required fields
   */
  static validatePayload(payload: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Check if order should be skipped (test orders, no customer, etc.)
   */
  static shouldSkipOrder(payload: any): { skip: boolean; reason?: string } {
    // Skip test orders
    if (payload.test) {
      return { skip: true, reason: "test_order" };
    }

    // Skip orders without a customer
    if (!payload.customer) {
      return { skip: true, reason: "no_customer" };
    }

    // Skip cancelled orders
    if (payload.cancelled_at) {
      return { skip: true, reason: "cancelled_order" };
    }

    return { skip: false };
  }

  /**
   * Extract customer information for logging
   */
  static getCustomerInfo(customer: any): {
    name: string;
    email: string;
    id: string;
  } {
    const firstName = customer?.first_name || "";
    const lastName = customer?.last_name || "";
    const name = `${firstName} ${lastName}`.trim() || "Unknown";
    const email = customer?.email || "No email";
    const id = customer?.id?.toString() || "Unknown";

    return { name, email, id };
  }

  /**
   * Log order details for debugging
   */
  static logOrderDetails(payload: any): void {
    const orderName = payload.name || `#${payload.number}`;
    const orderAmount = parseFloat(payload.total_price || "0");
    const customerInfo = this.getCustomerInfo(payload.customer);

    logger.info("Order details", {
      operation: "logOrderDetails",
      orderName,
      orderAmount,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerId: customerInfo.id,
      fulfillmentStatus: payload.fulfillment_status || "unfulfilled",
      financialStatus: payload.financial_status || "unknown"
    });
  }
}

/**
 * Performance monitoring utilities
 */
export class WebhookPerformanceMonitor {
  private static readonly PERFORMANCE_THRESHOLD_MS = 4000; // 4 seconds (under 5s requirement)
  private static readonly WARNING_THRESHOLD_MS = 2000; // 2 seconds warning

  /**
   * Check if processing time exceeds thresholds
   */
  static checkPerformance(processingTime: number): {
    isWithinThreshold: boolean;
    shouldWarn: boolean;
    message?: string;
  } {
    const isWithinThreshold = processingTime < this.PERFORMANCE_THRESHOLD_MS;
    const shouldWarn = processingTime > this.WARNING_THRESHOLD_MS;

    let message: string | undefined;
    if (!isWithinThreshold) {
      message = `⚠️ Webhook processing exceeded 4s threshold: ${processingTime}ms`;
    } else if (shouldWarn) {
      message = `⚠️ Webhook processing approaching threshold: ${processingTime}ms`;
    }

    return { isWithinThreshold, shouldWarn, message };
  }

  /**
   * Log performance metrics
   */
  static logPerformance(
    topic: string,
    processingTime: number,
    success: boolean,
  ): void {
    const performance = this.checkPerformance(processingTime);

    if (performance.message) {
      logger.warn("Webhook performance threshold exceeded", {
        operation: "logPerformance",
        topic,
        message: performance.message,
        processingTime,
        success
      });
    }

    logger.info("Webhook performance metrics", {
      operation: "logPerformance",
      topic,
      processingTime,
      success,
      withinThreshold: performance.isWithinThreshold,
      shouldWarn: performance.shouldWarn
    });
  }
}

/**
 * Webhook retry utilities for failed processing
 */
export class WebhookRetryHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

  /**
   * Determine if webhook should be retried based on error type
   */
  static shouldRetry(error: Error, attemptCount: number): boolean {
    if (attemptCount >= this.MAX_RETRIES) {
      return false;
    }

    // Retry on database connection errors, timeout errors, etc.
    const retryableErrors = [
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "database",
      "connection",
      "timeout",
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some((keyword) => errorMessage.includes(keyword));
  }

  /**
   * Get delay for retry attempt
   */
  static getRetryDelay(attemptCount: number): number {
    return (
      this.RETRY_DELAYS[attemptCount - 1] ||
      this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1]
    );
  }

  /**
   * Sleep for specified duration
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
