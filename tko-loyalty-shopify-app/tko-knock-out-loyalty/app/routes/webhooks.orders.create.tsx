import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  createOrUpdateCustomer,
  getCustomerByShopifyId,
} from "../services/customer.server";
import { createPointTransaction } from "../services/pointTransaction.server";
import { calculateBonusPoints } from "../services/pointEvent.server";
import {
  fetchProductCollections,
  isBinderPOSOrder,
} from "../services/collections.server";
import {
  addPendingOrder,
  removePendingOrder,
} from "../services/pendingOrder.server";

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
 * Process a fulfilled order for points calculation
 */
async function processFulfilledOrder(orderData: ShopifyOrder, admin: any) {
  console.log(`Processing fulfilled order ${orderData.id}`);

  const customer = orderData.customer!;
  const orderAmount = parseFloat(orderData.total_price);
  const orderId = orderData.id.toString();

  // Fetch reliable customer data using GraphQL API (same pattern as dashboard)
  let totalSpend = 0;
  try {
    const customerResponse = await admin.graphql(
      `#graphql
        query getCustomer($id: ID!) {
          customer(id: $id) {
            amountSpent {
              amount
            }
          }
        }`,
      { variables: { id: customer.admin_graphql_api_id } },
    );

    const customerData = await customerResponse.json();
    totalSpend = parseFloat(
      customerData.data?.customer?.amountSpent?.amount || "0",
    );
    console.log(`Fetched reliable customer total spend: ${totalSpend}`);
  } catch (error) {
    console.error("Error fetching customer data via GraphQL:", error);
    // Fallback to 0 if GraphQL fails
    totalSpend = 0;
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
        admin,
      });
    } else {
      loyaltyCustomer = await createOrUpdateCustomer({
        shopifyId: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        totalSpend: totalSpend,
        lastOrderDate: new Date(orderData.created_at),
        admin,
      });
    }
  } catch (error) {
    console.error(`Error creating/updating customer ${customer.id}:`, error);
    throw error;
  }

  // Calculate base points (1 point per dollar spent)
  const basePoints = Math.floor(orderAmount);

  // Create base point transaction
  if (basePoints > 0) {
    await createPointTransaction({
      customerId: loyaltyCustomer.id,
      type: "earn",
      amount: basePoints,
      orderId,
      description: `Points earned from order #${orderData.order_number}`,
    });
  }

  // Extract product IDs and fetch their collections
  const productIds = orderData.line_items.map((item) =>
    item.product_id.toString(),
  );
  let productCollections: Record<string, string[]> = {};

  try {
    productCollections = await fetchProductCollections(admin, productIds);
  } catch (error) {
    console.error("Error fetching product collections:", error);
    // Continue without collection data - bonus points will be skipped
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

  // Calculate bonus points
  let bonusPoints = 0;
  let appliedEvents: Array<{ eventId: string; pointsAwarded: number }> = [];

  if (orderLineItems.length > 0) {
    try {
      const bonusResult = await calculateBonusPoints({
        orderLineItems,
        isInstoreOrder,
      });
      bonusPoints = bonusResult.totalBonusPoints;
      appliedEvents = bonusResult.appliedEvents;
    } catch (error) {
      console.error("Error calculating bonus points:", error);
      // Continue without bonus points
    }
  }

  // Create bonus point transactions
  for (const appliedEvent of appliedEvents) {
    await createPointTransaction({
      customerId: loyaltyCustomer.id,
      type: "bonus",
      amount: appliedEvent.pointsAwarded,
      orderId,
      eventId: appliedEvent.eventId,
      description: `Bonus points from event for order #${orderData.order_number}`,
    });
  }

  console.log(
    `Order ${orderId} processed: ${basePoints} base points + ${bonusPoints} bonus points`,
  );

  return {
    basePoints,
    bonusPoints,
    appliedEvents,
    customerId: loyaltyCustomer.id,
  };
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, admin, payload } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);

    // Parse the order data from the webhook payload
    const orderData: ShopifyOrder = payload as ShopifyOrder;

    console.log(
      `Processing order ${orderData.id} for customer ${orderData.customer?.id}`,
    );

    // Skip test orders
    if (orderData.test) {
      console.log(`Skipping test order ${orderData.id}`);
      return new Response("Test order skipped", { status: 200 });
    }

    // Skip orders without a customer
    if (!orderData.customer) {
      console.log(`Skipping order ${orderData.id} - no customer associated`);
      return new Response("No customer associated", { status: 200 });
    }

    const orderId = orderData.id.toString();

    // Check fulfillment status
    const isFulfilled = orderData.fulfillment_status === "fulfilled";

    if (isFulfilled) {
      // Process fulfilled order immediately
      try {
        // Remove from pending orders if it exists
        await removePendingOrder(orderId);

        // Process the order
        const result = await processFulfilledOrder(orderData, admin);

        return new Response(
          JSON.stringify({
            success: true,
            orderId,
            status: "fulfilled",
            pointsAwarded: result,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      } catch (error) {
        console.error(`Error processing fulfilled order ${orderId}:`, error);
        return new Response("Error processing fulfilled order", {
          status: 500,
        });
      }
    } else {
      // Add to pending orders queue
      try {
        // Get or create customer first to get the customer ID
        let loyaltyCustomer = await getCustomerByShopifyId(
          orderData.customer.id,
        );

        if (!loyaltyCustomer) {
          // Fetch reliable customer data using GraphQL API for pending orders too
          let totalSpend = 0;
          try {
            const customerResponse = await admin.graphql(
              `#graphql
                query getCustomer($id: ID!) {
                  customer(id: $id) {
                    amountSpent {
                      amount
                    }
                  }
                }`,
              { variables: { id: orderData.customer.admin_graphql_api_id } },
            );

            const customerData = await customerResponse.json();
            totalSpend = parseFloat(
              customerData.data?.customer?.amountSpent?.amount || "0",
            );
            console.log(
              `Fetched reliable customer total spend for pending order: ${totalSpend}`,
            );
          } catch (error) {
            console.error(
              "Error fetching customer data via GraphQL for pending order:",
              error,
            );
            // Fallback to 0 if GraphQL fails
            totalSpend = 0;
          }

          loyaltyCustomer = await createOrUpdateCustomer({
            shopifyId: orderData.customer.id,
            email: orderData.customer.email,
            firstName: orderData.customer.first_name,
            lastName: orderData.customer.last_name,
            totalSpend: totalSpend,
            lastOrderDate: new Date(orderData.created_at),
            admin,
          });
        }

        await addPendingOrder({
          shopifyOrderId: orderId,
          customerId: loyaltyCustomer.id,
          orderData,
        });

        console.log(
          `Order ${orderId} added to pending queue (fulfillment status: ${orderData.fulfillment_status})`,
        );

        return new Response(
          JSON.stringify({
            success: true,
            orderId,
            status: "pending",
            fulfillmentStatus: orderData.fulfillment_status,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      } catch (error) {
        console.error(`Error adding order ${orderId} to pending queue:`, error);
        return new Response("Error adding to pending queue", { status: 500 });
      }
    }
  } catch (error) {
    console.error("Error processing order webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
