import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  createOrUpdateCustomer,
  getCustomerByShopifyId,
} from "../services/customer.server";
import { addPendingOrder } from "../services/pendingOrder.server";
import {
  WebhookProcessor,
  WebhookPerformanceMonitor,
} from "../services/webhookProcessor.server";
import { processFulfilledOrder } from "../services/orderProcessor.server";

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
  sku?: string;
  taxable?: boolean;
  requires_shipping?: boolean;
  fulfillment_service?: string;
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

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, admin, payload } = await authenticate.webhook(request);

    // Initialize webhook processor with duplicate prevention and performance monitoring
    const processor = new WebhookProcessor(request, topic, shop, admin);

    // Parse the order data from the webhook payload
    const orderData: ShopifyOrder = payload as ShopifyOrder;

    // Validate required fields
    WebhookProcessor.validatePayload(orderData, ["id", "total_price"]);

    // Check if order should be skipped
    const skipCheck = WebhookProcessor.shouldSkipOrder(orderData);
    if (skipCheck.skip) {
      console.log(`Skipping order ${orderData.id} - ${skipCheck.reason}`);
      return new Response(`Order skipped: ${skipCheck.reason}`, {
        status: 200,
      });
    }

    // Log order details for debugging
    WebhookProcessor.logOrderDetails(orderData);

    // Process webhook with duplicate prevention and error handling
    const result = await processor.processWebhook(async (admin) => {
      const orderId = orderData.id.toString();
      const customerName = orderData.customer
        ? `${orderData.customer.first_name || ""} ${orderData.customer.last_name || ""}`.trim() ||
          "Unknown"
        : "No customer";
      const customerEmail = orderData.customer?.email || "No email";

      // CRITICAL FIX: Check if order is already fulfilled and process immediately
      if (orderData.fulfillment_status === "fulfilled") {
        console.log(`🚀 Order ${orderData.name} is already fulfilled - processing immediately`);
        console.log(`   👤 Customer: ${customerName} (${customerEmail})`);
        console.log(`   💰 Order total: $${parseFloat(orderData.total_price).toFixed(2)}`);
        
        // Process the fulfilled order immediately using the shared logic
        const processResult = await processFulfilledOrder(orderData, admin);
        
        console.log(`✅ Order ${orderData.name} processed immediately - customer data updated`);
        
        return {
          status: "fulfilled_immediately",
          bonusPoints: processResult.bonusPoints,
          appliedEvents: processResult.appliedEvents,
          customerId: processResult.customerId,
        };
      } else {
        console.log(`⏳ Order ${orderData.name} not yet fulfilled - adding to pending queue`);
        
        // Get or create customer first to get the customer ID
        let loyaltyCustomer = await getCustomerByShopifyId(
          orderData.customer!.id,
        );

        if (!loyaltyCustomer) {
          // FIXED: Use Shopify GraphQL API to get accurate customer total spend
          // This replaces the broken webhook payload logic that was showing $0.00
          let totalSpend = 0;
          let numberOfOrders = 0;
          
          try {
            console.log(`🔍 Fetching accurate customer data from Shopify API for pending order...`);
            
            const customerQuery = `
              query GetCustomerForLoyalty($customerId: ID!) {
                customer(id: $customerId) {
                  id
                  amountSpent {
                    amount
                    currencyCode
                  }
                  numberOfOrders
                }
              }
            `;
            
            const response = await admin.graphql(customerQuery, {
              variables: { customerId: `gid://shopify/Customer/${orderData.customer!.id}` }
            });
            
            const result = await response.json();
            
            if (result.data?.customer) {
              const shopifyCustomer = result.data.customer;
              // FIXED: Use correct GraphQL fields - amountSpent.amount contains the spend amount
              totalSpend = parseFloat(shopifyCustomer.amountSpent?.amount || "0");
              // FIXED: Convert numberOfOrders to integer for consistency
              numberOfOrders = parseInt(shopifyCustomer.numberOfOrders?.toString() || "0", 10);
              
              console.log(`✅ Shopify API customer data for pending order:`);
              console.log(`   💰 Accurate total spend: $${totalSpend.toFixed(2)} → ${totalSpend} points`);
              console.log(`   📦 Number of orders: ${numberOfOrders}`);
            } else {
              throw new Error(`No customer data returned from Shopify API`);
            }
          } catch (error) {
            console.error(`❌ Error fetching customer data from Shopify API:`, error);
            console.log(`⚠️ Falling back to webhook payload data (may be inaccurate)`);
            
            // Fallback to webhook data if API fails
            const rawTotalSpendFromWebhook = parseFloat(orderData.customer!.total_spent || "0");
            const currentOrderAmount = parseFloat(orderData.total_price);
            totalSpend = rawTotalSpendFromWebhook + currentOrderAmount;
            numberOfOrders = orderData.customer!.orders_count || 0;
            
            console.log(`   📊 Fallback total spend: $${totalSpend.toFixed(2)} → ${totalSpend} points`);
          }

          const createdCustomer = await createOrUpdateCustomer({
            shopifyId: orderData.customer!.id,
            email: orderData.customer!.email,
            firstName: orderData.customer!.first_name,
            lastName: orderData.customer!.last_name,
            totalSpend: totalSpend,
            lastOrderDate: new Date(orderData.created_at),
            admin,
          });
          
          // Type assertion to handle the emails field requirement
          loyaltyCustomer = {
            ...createdCustomer,
            emails: createdCustomer.email ? [createdCustomer.email] : [],
          } as any;
        }

        await addPendingOrder({
          shopifyOrderId: orderId,
          customerId: loyaltyCustomer!.id,
          orderData,
        });

        console.log(`⏳ Order ${orderData.name} added to pending queue`);
        console.log(
          `   📋 Fulfillment status: ${orderData.fulfillment_status || "unfulfilled"}`,
        );
        console.log(`   👤 Customer: ${customerName} (${customerEmail})`);
        console.log(
          `   💰 Order total: $${parseFloat(orderData.total_price).toFixed(2)}`,
        );

        return {
          status: "pending",
          fulfillmentStatus: orderData.fulfillment_status,
          customerId: loyaltyCustomer!.id,
        };
      }
    }, orderData);

    // Log performance metrics
    WebhookPerformanceMonitor.logPerformance(
      topic,
      result.processingTime || 0,
      result.success,
    );

    // Return standardized response
    return processor.createResponse(result);
  } catch (error) {
    console.error("Error processing order webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
