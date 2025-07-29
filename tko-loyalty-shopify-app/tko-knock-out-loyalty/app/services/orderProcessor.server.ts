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
  if (!orderData.customer) {
    console.log(`⚠️ Order ${orderData.name} has no customer - skipping`);
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

  console.log(
    `📦 Processing fulfilled order ${orderName} ($${orderAmount.toFixed(2)})`,
  );
  console.log(
    `👤 Customer: ${customerName} (${customerEmail}) - ID: ${customer.id}`,
  );

  // Use customer total spend from webhook payload (no API call needed)
  const rawTotalSpend = parseFloat(customer.total_spent || "0");
  // Round to nearest dollar for points calculation
  const totalSpend = Math.round(rawTotalSpend);
  console.log(
    `💰 Customer total spend: $${rawTotalSpend.toFixed(2)} → ${totalSpend} points`,
  );

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
    console.error(`Error creating/updating customer ${customer.id}:`, error);
    throw error;
  }

  // Save the order to our database
  try {
    console.log(`💾 Saving order #${orderData.order_number} to database`);
    await createOrUpdateOrder(orderData, loyaltyCustomer.id);
    console.log(`✅ Order #${orderData.order_number} saved to database`);
  } catch (error) {
    console.error(`❌ Error saving order #${orderData.order_number}:`, error);
    // Continue with points processing even if order save fails
  }

  // Note: Base/spend points are handled by the existing loyalty system
  // This webhook only handles bonus points from events

  // Extract product IDs and fetch their collections with enhanced error handling
  const productIds = orderData.line_items.map((item) =>
    item.product_id.toString(),
  );
  let productCollections: Record<string, string[]> = {};
  let collectionFetchSuccess = false;

  console.log(`🔍 Fetching collections for ${productIds.length} products...`);

  try {
    productCollections = await fetchProductCollections(admin, productIds);
    collectionFetchSuccess = true;
    console.log(
      `✅ Successfully fetched collections for ${Object.keys(productCollections).length} products`,
    );
  } catch (error) {
    console.error("❌ Error fetching product collections:", error);
    console.log(
      "⚠️ Continuing without collection data - collection-based events will be skipped",
    );
  }

  // Prepare line items for bonus calculation (include ALL products)
  const orderLineItems = orderData.line_items.map((item) => ({
    productId: item.product_id.toString(),
    price: parseFloat(item.price),
    quantity: item.quantity,
    collections: productCollections[item.product_id.toString()] || [],
  }));

  // Check if this is an in-store order (BinderPOS)
  const isInstoreOrder = isBinderPOSOrder(orderData.note || null);

  // Enhanced product logging with collection identification issues
  console.log(`🛍️ Products in order (${orderLineItems.length} items):`);
  let productsWithoutCollections = 0;

  orderData.line_items.forEach((item, index) => {
    const collections = productCollections[item.product_id.toString()] || [];
    console.log(
      `  ${index + 1}. ${item.title} (ID: ${item.product_id}) - $${parseFloat(item.price).toFixed(2)} x${item.quantity}`,
    );

    if (collections.length > 0) {
      console.log(`     ✅ Collections: [${collections.join(", ")}]`);
    } else {
      console.log(`     ⚠️ No collections found`);
      productsWithoutCollections++;
    }
  });

  if (productsWithoutCollections > 0) {
    console.log(
      `⚠️ ${productsWithoutCollections} products have no collection data - may affect collection-based events`,
    );
  }

  // Check for existing bonus point transactions to prevent duplicates
  console.log(
    `🔍 Checking for existing bonus point transactions for order ${orderId}...`,
  );
  let existingBonusTransactions: any[] = [];

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

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

    await prisma.$disconnect();

    if (existingBonusTransactions.length > 0) {
      console.log(
        `⚠️ Found ${existingBonusTransactions.length} existing bonus transactions for this order:`,
      );
      existingBonusTransactions.forEach((transaction, index) => {
        const eventName = transaction.event?.name || "Unknown Event";
        console.log(
          `  ${index + 1}. ${eventName}: ${transaction.amount} points`,
        );
      });
    } else {
      console.log(
        `✅ No existing bonus transactions found - proceeding with calculation`,
      );
    }
  } catch (error) {
    console.error("❌ Error checking existing transactions:", error);
    console.log(
      "⚠️ Continuing with bonus calculation (duplicate check failed)",
    );
  }

  // Calculate bonus points with enhanced error handling
  let bonusPoints = 0;
  let appliedEvents: Array<{ eventId: string; pointsAwarded: number }> = [];
  let eventNames: string[] = [];

  if (orderLineItems.length > 0) {
    try {
      console.log(
        `🧮 Calculating bonus points for ${isInstoreOrder ? "in-store" : "online"} order...`,
      );

      const bonusResult = await calculateBonusPoints({
        orderLineItems,
        isInstoreOrder,
      });

      bonusPoints = bonusResult.totalBonusPoints;
      appliedEvents = bonusResult.appliedEvents;

      console.log(
        `✅ Bonus calculation completed: ${bonusPoints} total bonus points from ${appliedEvents.length} events`,
      );

      // Get event names for logging
      if (appliedEvents.length > 0) {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        try {
          const events = await prisma.pointEvent.findMany({
            where: { id: { in: appliedEvents.map((e) => e.eventId) } },
            select: { id: true, name: true },
          });
          eventNames = events.map((e) => e.name);
        } catch (error) {
          console.error("❌ Error fetching event names:", error);
        } finally {
          await prisma.$disconnect();
        }
      }
    } catch (error) {
      console.error("❌ Error calculating bonus points:", error);
      console.log("⚠️ Continuing without bonus points");
    }
  }

  // Enhanced event logging
  if (appliedEvents.length > 0) {
    console.log(`🎯 Applied point events:`);
    appliedEvents.forEach((event, index) => {
      const eventName = eventNames[index] || `Event ${event.eventId}`;
      console.log(`  • ${eventName}: +${event.pointsAwarded} bonus points`);
    });
  } else {
    console.log(`🎯 No point events qualified for this order`);
    if (!collectionFetchSuccess) {
      console.log(
        `   ℹ️ Collection data unavailable - collection-based events were skipped`,
      );
    }
  }

  // Create bonus point transactions with enhanced error handling and duplicate prevention
  let transactionErrors = 0;
  let transactionsCreated = 0;

  for (const appliedEvent of appliedEvents) {
    try {
      // Double-check for existing transaction for this specific event
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const existingTransaction = await prisma.pointTransaction.findFirst({
        where: {
          customerId: loyaltyCustomer.id,
          orderId: orderId,
          eventId: appliedEvent.eventId,
          type: "bonus",
        },
      });

      await prisma.$disconnect();

      if (existingTransaction) {
        console.log(
          `⚠️ Skipping duplicate bonus transaction for event ${appliedEvent.eventId} (${appliedEvent.pointsAwarded} points)`,
        );
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
      console.log(
        `✅ Created bonus transaction: ${appliedEvent.pointsAwarded} points`,
      );
    } catch (error) {
      console.error(
        `❌ Error creating bonus transaction for event ${appliedEvent.eventId}:`,
        error,
      );
      transactionErrors++;
    }
  }

  if (transactionErrors > 0) {
    console.log(`⚠️ ${transactionErrors} bonus transactions failed to create`);
  }

  if (transactionsCreated > 0) {
    console.log(
      `✅ Successfully created ${transactionsCreated} bonus point transactions`,
    );
  }

  // Enhanced final logging
  console.log(`✅ Order ${orderName} processed successfully:`);
  console.log(`   🎁 Bonus points: ${bonusPoints}`);
  console.log(`   🏆 Total bonus points awarded: ${bonusPoints}`);
  console.log(
    `   📍 Order type: ${isInstoreOrder ? "In-store (BinderPOS)" : "Online"}`,
  );

  return {
    bonusPoints,
    appliedEvents,
    customerId: loyaltyCustomer.id,
  };
}
