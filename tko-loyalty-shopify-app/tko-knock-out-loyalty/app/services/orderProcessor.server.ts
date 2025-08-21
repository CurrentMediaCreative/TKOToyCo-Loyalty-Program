import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import {
  createOrUpdateCustomer,
  getCustomerByShopifyId,
} from "./customer.server";
import { createBonusPointsTransaction } from "./pointTransaction.server";
import { calculateBonusPoints } from "./pointEvent.server";
import {
  fetchProductCollections,
  isBinderPOSOrder,
} from "./collections.server";
import { createOrUpdateOrder } from "./order.server";
import { logger } from "../utils/logger.server";
import { withRetry } from "../utils/errorHandler.server";
import { measurePerformance } from "../utils/performance.server";

interface OrderLineItem {
  id: string;
  product_id: string;
  variant_id: string;
  title: string;
  quantity: number;
  price: string;
  total_discount: string;
  product_exists: boolean;
  variant_title?: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
}

interface ShopifyOrder {
  id: number;
  email?: string;
  created_at: string;
  updated_at: string;
  number: number;
  note?: string;
  token: string;
  gateway?: string;
  test: boolean;
  total_price: string;
  subtotal_price: string;
  total_weight: number;
  total_tax: string;
  taxes_included: boolean;
  currency: string;
  financial_status: string;
  confirmed: boolean;
  total_discounts: string;
  buyer_accepts_marketing: boolean;
  name: string;
  referring_site?: string;
  landing_site?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  total_price_usd?: string;
  checkout_token?: string;
  reference?: string;
  user_id?: number;
  location_id?: number;
  source_identifier?: string;
  source_url?: string;
  processed_at: string;
  device_id?: number;
  phone?: string;
  customer_locale?: string;
  app_id?: number;
  browser_ip?: string;
  landing_site_ref?: string;
  order_number: number;
  discount_applications: any[];
  discount_codes: any[];
  note_attributes: any[];
  payment_gateway_names: string[];
  processing_method: string;
  checkout_id?: number;
  source_name: string;
  fulfillment_status?: string;
  tax_lines: any[];
  tags: string;
  contact_email?: string;
  order_status_url: string;
  presentment_currency: string;
  total_line_items_price_set: any;
  total_discounts_set: any;
  total_shipping_price_set: any;
  subtotal_price_set: any;
  total_price_set: any;
  total_tax_set: any;
  line_items: OrderLineItem[];
  shipping_lines: any[];
  billing_address?: any;
  shipping_address?: any;
  fulfillments: any[];
  client_details?: any;
  refunds: any[];
  customer?: {
    id: number;
    email?: string;
    accepts_marketing: boolean;
    created_at: string;
    updated_at: string;
    first_name?: string;
    last_name?: string;
    orders_count: number;
    state: string;
    total_spent: string;
    last_order_id?: number;
    note?: string;
    verified_email: boolean;
    multipass_identifier?: string;
    tax_exempt: boolean;
    phone?: string;
    tags: string;
    last_order_name?: string;
    currency: string;
    accepts_marketing_updated_at: string;
    marketing_opt_in_level?: string;
    tax_exemptions: any[];
    admin_graphql_api_id: string;
    default_address?: any;
  };
}

/**
 * Shared order processing logic for both webhooks and manual sync
 * Processes a fulfilled order for points calculation and database storage
 */
export async function processFulfilledOrder(
  orderData: ShopifyOrder,
  admin: AdminApiContext,
) {
  return await measurePerformance(async () => {
    if (!orderData.customer) {
      logger.warn("Order has no customer - skipping", {
        operation: "processFulfilledOrder",
        orderName: orderData.name,
        orderId: orderData.id
      });
      return { pointsAwarded: 0 };
    }

    const customer = orderData.customer;
    const orderAmount = parseFloat(orderData.total_price);
    const orderId = orderData.id.toString();
    const orderName = orderData.name; // e.g., "#1001"

    // Enhanced logging with customer details
    const customerName =
      `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
      "Unknown";
    const customerEmail = customer.email || "No email";

    logger.info("Processing fulfilled order", {
      operation: "processFulfilledOrder",
      orderName,
      orderAmount,
      customerId: customer.id,
      customerName,
      customerEmail
    });

    // FIXED: Use Shopify GraphQL API to get accurate customer total spend
    // This replaces the broken webhook payload logic that was showing $0.00
    let totalSpend = 0;
    let numberOfOrders = 0;
    let shopifyCreatedAt = null;
    let lastOrderDate = null;
    
    try {
      logger.info("Fetching accurate customer data from Shopify API", {
        operation: "processFulfilledOrder",
        customerId: customer.id
      });
      
      const customerQuery = `
        query GetCustomerForLoyalty($customerId: ID!) {
          customer(id: $customerId) {
            id
            email
            firstName
            lastName
            phone
            tags
            createdAt
            updatedAt
            amountSpent {
              amount
              currencyCode
            }
            numberOfOrders
            defaultAddress {
              city
              province
              country
            }
            lastOrder {
              processedAt
            }
          }
        }
      `;
      
      const customerResult = await withRetry(async () => {
        const response = await admin.graphql(customerQuery, {
          variables: { customerId: `gid://shopify/Customer/${customer.id}` }
        });
        
        const result: any = await response.json();
        
        if (result.errors && result.errors.length > 0) {
          throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }
        
        if (!result.data?.customer) {
          throw new Error("No customer data returned from Shopify API");
        }
        
        return result.data.customer;
      }, 3, 1000, { 
        operation: "processFulfilledOrder", 
        additionalData: { customerId: customer.id }
      });
      
      if (customerResult.success && customerResult.data) {
        const shopifyCustomer = customerResult.data;
        // FIXED: amountSpent.amount is in dollars, use directly for 1:1 points system
        const totalSpendDollars = parseFloat(shopifyCustomer.amountSpent?.amount || "0");
        totalSpend = Math.round(totalSpendDollars); // Round dollars to points (1:1 ratio)
        numberOfOrders = shopifyCustomer.numberOfOrders || 0;
        shopifyCreatedAt = shopifyCustomer.createdAt ? new Date(shopifyCustomer.createdAt) : null;
        lastOrderDate = shopifyCustomer.lastOrder?.processedAt ? new Date(shopifyCustomer.lastOrder.processedAt) : new Date(orderData.created_at);
        
        logger.info("Shopify API customer data retrieved successfully", {
          operation: "processFulfilledOrder",
          customerId: customer.id,
          totalSpendDollars,
          totalSpend,
          numberOfOrders,
          customerSince: shopifyCreatedAt?.toISOString(),
          lastOrder: lastOrderDate?.toISOString()
        });
      } else {
        throw new Error(customerResult.error || "Failed to fetch customer data");
      }
    } catch (error) {
      logger.error("Error fetching customer data from Shopify API", {
        operation: "processFulfilledOrder",
        customerId: customer.id,
        error: error instanceof Error ? error.message : String(error)
      });
      
      logger.warn("Falling back to webhook payload data", {
        operation: "processFulfilledOrder",
        customerId: customer.id
      });
      
      // Fallback to webhook data if API fails
      const rawTotalSpendFromWebhook = parseFloat(customer.total_spent || "0");
      const currentOrderAmount = parseFloat(orderData.total_price);
      totalSpend = Math.round(rawTotalSpendFromWebhook + currentOrderAmount);
      numberOfOrders = customer.orders_count || 0;
      lastOrderDate = new Date(orderData.created_at);
      
      logger.info("Fallback total spend calculated", {
        operation: "processFulfilledOrder",
        customerId: customer.id,
        fallbackTotalSpend: totalSpend,
        rawWebhookSpend: rawTotalSpendFromWebhook,
        currentOrderAmount
      });
    }

    // Create or update customer in our database
    let loyaltyCustomer;
    try {
      loyaltyCustomer = await getCustomerByShopifyId(customer.id);

      if (loyaltyCustomer) {
        loyaltyCustomer = await createOrUpdateCustomer({
          shopifyId: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          totalSpend: totalSpend,
          lastOrderDate: new Date(orderData.created_at),
          admin, // Keep admin for metafield updates with improved error handling
        });
      } else {
        loyaltyCustomer = await createOrUpdateCustomer({
          shopifyId: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          totalSpend: totalSpend,
          lastOrderDate: new Date(orderData.created_at),
          admin, // Keep admin for metafield updates with improved error handling
        });
      }
    } catch (error) {
      logger.error("Error creating/updating customer", {
        operation: "processFulfilledOrder",
        customerId: customer.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Save the order to our database
    try {
      logger.info("Saving order to database", {
        operation: "processFulfilledOrder",
        orderNumber: orderData.order_number,
        orderId: orderData.id
      });
      await createOrUpdateOrder(orderData, loyaltyCustomer.id);
      logger.info("Order saved to database successfully", {
        operation: "processFulfilledOrder",
        orderNumber: orderData.order_number
      });
    } catch (error) {
      logger.error("Error saving order to database", {
        operation: "processFulfilledOrder",
        orderNumber: orderData.order_number,
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue with points processing even if order save fails
    }

    // Note: Base/spend points are handled by the existing loyalty system
    // This webhook only handles bonus points from events

    // Extract product IDs and fetch their collections with enhanced error handling
    const productIds = orderData.line_items
      .filter((item) => item.product_id != null) // Filter out null/undefined product_ids
      .map((item) => item.product_id.toString());
    let productCollections: Record<string, string[]> = {};
    let collectionFetchSuccess = false;

    logger.info("Fetching product collections", {
      operation: "processFulfilledOrder",
      productCount: productIds.length
    });

    const collectionsResult = await fetchProductCollections(admin, productIds);
    if (collectionsResult.success && collectionsResult.data) {
      productCollections = collectionsResult.data;
      collectionFetchSuccess = true;
      logger.info("Successfully fetched product collections", {
        operation: "processFulfilledOrder",
        productsWithCollections: Object.keys(productCollections).length
      });
    } else {
      logger.error("Error fetching product collections", {
        operation: "processFulfilledOrder",
        error: collectionsResult.error
      });
      logger.warn("Continuing without collection data - collection-based events will be skipped", {
        operation: "processFulfilledOrder"
      });
    }

    // Prepare line items for bonus calculation (include ALL products with valid product_ids)
    const orderLineItems = orderData.line_items
      .filter((item) => item.product_id != null) // Filter out null/undefined product_ids
      .map((item) => ({
        productId: item.product_id.toString(),
        price: parseFloat(item.price),
        quantity: item.quantity,
        collections: productCollections[item.product_id.toString()] || [],
      }));

    // Check if this is an in-store order (BinderPOS)
    const isInstoreOrder = isBinderPOSOrder(orderData.note || null);

    // Enhanced product logging with collection identification issues
    logger.info("Products in order", {
      operation: "processFulfilledOrder",
      orderLineItemsCount: orderLineItems.length,
      isInstoreOrder
    });

    let productsWithoutCollections = 0;

    orderData.line_items.forEach((item, index) => {
      const collections = productCollections[item.product_id.toString()] || [];
      logger.debug("Product details", {
        operation: "processFulfilledOrder",
        productIndex: index + 1,
        productId: item.product_id,
        title: item.title,
        price: parseFloat(item.price),
        quantity: item.quantity,
        collectionsCount: collections.length,
        collections: collections
      });

      if (collections.length === 0) {
        productsWithoutCollections++;
      }
    });

    if (productsWithoutCollections > 0) {
      logger.warn("Products without collection data found", {
        operation: "processFulfilledOrder",
        productsWithoutCollections,
        totalProducts: orderData.line_items.length
      });
    }

    // OPTIMIZED: Use shared Prisma client for all database operations
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Check for existing bonus point transactions to prevent duplicates
    logger.info("Checking for existing bonus point transactions", {
      operation: "processFulfilledOrder",
      orderId,
      customerId: loyaltyCustomer.id
    });

    let existingBonusTransactions: any[] = [];

    try {
      existingBonusTransactions = await prisma.pointTransaction.findMany({
        where: {
          customerId: loyaltyCustomer.id,
          orderId: orderId,
          type: "bonus",
        },
        include: {
          event: {
            select: { id: true, name: true },
          },
        },
      });

      if (existingBonusTransactions.length > 0) {
        logger.warn("Found existing bonus transactions for order", {
          operation: "processFulfilledOrder",
          orderId,
          existingTransactionsCount: existingBonusTransactions.length,
          transactions: existingBonusTransactions.map(t => ({
            eventName: t.event?.name || "Unknown Event",
            amount: t.amount
          }))
        });
      } else {
        logger.info("No existing bonus transactions found - proceeding with calculation", {
          operation: "processFulfilledOrder",
          orderId
        });
      }
    } catch (error) {
      logger.error("Error checking existing transactions", {
        operation: "processFulfilledOrder",
        orderId,
        error: error instanceof Error ? error.message : String(error)
      });
      logger.warn("Continuing with bonus calculation despite duplicate check failure", {
        operation: "processFulfilledOrder",
        orderId
      });
    }

    // Calculate bonus points with enhanced error handling
    let bonusPoints = 0;
    let appliedEvents: Array<{ eventId: string; pointsAwarded: number }> = [];
    let eventNames: string[] = [];

    if (orderLineItems.length > 0) {
      try {
        logger.info("Calculating bonus points", {
          operation: "processFulfilledOrder",
          orderType: isInstoreOrder ? "in-store" : "online",
          orderLineItemsCount: orderLineItems.length
        });

        const bonusResult = await calculateBonusPoints({
          orderLineItems,
          isInstoreOrder,
        });

        bonusPoints = bonusResult.totalBonusPoints;
        appliedEvents = bonusResult.appliedEvents;

        logger.info("Bonus calculation completed", {
          operation: "processFulfilledOrder",
          bonusPoints,
          appliedEventsCount: appliedEvents.length
        });

        // OPTIMIZED: Get event names for logging using shared Prisma client
        if (appliedEvents.length > 0) {
          try {
            const events = await prisma.pointEvent.findMany({
              where: { id: { in: appliedEvents.map((e) => e.eventId) } },
              select: { id: true, name: true },
            });
            eventNames = events.map((e) => e.name);
          } catch (error) {
            logger.error("Error fetching event names", {
              operation: "processFulfilledOrder",
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      } catch (error) {
        logger.error("Error calculating bonus points", {
          operation: "processFulfilledOrder",
          error: error instanceof Error ? error.message : String(error)
        });
        logger.warn("Continuing without bonus points", {
          operation: "processFulfilledOrder"
        });
      }
    }

    // Enhanced event logging
    if (appliedEvents.length > 0) {
      logger.info("Applied point events", {
        operation: "processFulfilledOrder",
        appliedEvents: appliedEvents.map((event, index) => ({
          eventId: event.eventId,
          eventName: eventNames[index] || `Event ${event.eventId}`,
          pointsAwarded: event.pointsAwarded
        }))
      });
    } else {
      logger.info("No point events qualified for this order", {
        operation: "processFulfilledOrder",
        collectionDataAvailable: collectionFetchSuccess
      });
    }

    // OPTIMIZED: Batch check for existing transactions to prevent duplicates
    let transactionErrors = 0;
    let transactionsCreated = 0;

    // Get all existing transactions for these events in one query
    const existingEventTransactions = await prisma.pointTransaction.findMany({
      where: {
        customerId: loyaltyCustomer.id,
        orderId: orderId,
        eventId: { in: appliedEvents.map(e => e.eventId) },
        type: "bonus",
      },
      select: { eventId: true },
    });

    const existingEventIds = new Set(existingEventTransactions.map(t => t.eventId));

    for (const appliedEvent of appliedEvents) {
      try {
        // Check if transaction already exists using batched data
        if (existingEventIds.has(appliedEvent.eventId)) {
          logger.warn("Skipping duplicate bonus transaction", {
            operation: "processFulfilledOrder",
            eventId: appliedEvent.eventId,
            pointsAwarded: appliedEvent.pointsAwarded
          });
          continue;
        }

        await createBonusPointsTransaction({
          customerId: loyaltyCustomer.id,
          amount: appliedEvent.pointsAwarded,
          orderId,
          eventId: appliedEvent.eventId,
          description: `Bonus points from event for order #${orderData.order_number}`,
          admin,
        });

        transactionsCreated++;
        logger.info("Created bonus transaction", {
          operation: "processFulfilledOrder",
          eventId: appliedEvent.eventId,
          pointsAwarded: appliedEvent.pointsAwarded
        });
      } catch (error) {
        logger.error("Error creating bonus transaction", {
          operation: "processFulfilledOrder",
          eventId: appliedEvent.eventId,
          error: error instanceof Error ? error.message : String(error)
        });
        transactionErrors++;
      }
    }

    // Clean up Prisma client
    await prisma.$disconnect();

    if (transactionErrors > 0) {
      logger.warn("Some bonus transactions failed to create", {
        operation: "processFulfilledOrder",
        transactionErrors
      });
    }

    if (transactionsCreated > 0) {
      logger.info("Successfully created bonus point transactions", {
        operation: "processFulfilledOrder",
        transactionsCreated
      });
    }

    // Enhanced final logging
    logger.info("Order processed successfully", {
      operation: "processFulfilledOrder",
      orderName,
      bonusPoints,
      totalBonusPointsAwarded: bonusPoints,
      orderType: isInstoreOrder ? "In-store (BinderPOS)" : "Online",
      customerId: loyaltyCustomer.id
    });

    return {
      bonusPoints,
      appliedEvents,
      customerId: loyaltyCustomer.id,
    };
  }, "processFulfilledOrder");
}
