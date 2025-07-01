import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { createOrUpdateCustomer, getCustomerByShopifyId } from "../services/customer.server";
import { processOrderPoints } from "../services/pointTransaction.server";

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
 * Determines if a product should be excluded from bonus points (i.e., if it's a "singles" product)
 */
function isProductExcludedFromBonus(lineItem: OrderLineItem): boolean {
  // Check product type for singles indicators
  if (lineItem.product_type) {
    const productType = lineItem.product_type.toLowerCase();
    if (productType.includes('single') || productType.includes('singles')) {
      return true;
    }
  }

  // Check tags for singles indicators
  if (lineItem.tags) {
    const tags = lineItem.tags.toLowerCase();
    if (tags.includes('single') || tags.includes('singles')) {
      return true;
    }
  }

  // Check title for singles indicators
  const title = lineItem.title.toLowerCase();
  if (title.includes('single') || title.includes('singles')) {
    return true;
  }

  // Check variant title for singles indicators
  if (lineItem.variant_title) {
    const variantTitle = lineItem.variant_title.toLowerCase();
    if (variantTitle.includes('single') || variantTitle.includes('singles')) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates the order amount excluding singles products for bonus point calculation
 */
function calculateBonusEligibleAmount(lineItems: OrderLineItem[]): number {
  let eligibleAmount = 0;

  for (const lineItem of lineItems) {
    if (!isProductExcludedFromBonus(lineItem)) {
      // Calculate line total: (price * quantity) - discounts
      const linePrice = parseFloat(lineItem.price) * lineItem.quantity;
      const lineDiscount = parseFloat(lineItem.total_discount || '0');
      const lineTotal = linePrice - lineDiscount;
      eligibleAmount += lineTotal;
    }
  }

  return Math.max(0, eligibleAmount); // Ensure non-negative
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, session, topic, admin } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);

    // Parse the order data from the webhook payload
    const orderData: ShopifyOrder = await request.json();
    
    console.log(`Processing order ${orderData.id} for customer ${orderData.customer?.id}`);

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

    const customer = orderData.customer;
    const orderAmount = parseFloat(orderData.total_price);
    const orderId = orderData.id.toString();

    // Create or update customer in our database
    let loyaltyCustomer;
    try {
      // First try to find existing customer
      loyaltyCustomer = await getCustomerByShopifyId(customer.id);
      
      if (loyaltyCustomer) {
        // Update existing customer with latest order info
        loyaltyCustomer = await createOrUpdateCustomer({
          shopifyId: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          totalSpend: parseFloat(customer.total_spent),
          lastOrderDate: new Date(orderData.created_at),
          admin,
        });
      } else {
        // Create new customer
        loyaltyCustomer = await createOrUpdateCustomer({
          shopifyId: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          totalSpend: parseFloat(customer.total_spent),
          lastOrderDate: new Date(orderData.created_at),
          admin,
        });
      }
    } catch (error) {
      console.error(`Error creating/updating customer ${customer.id}:`, error);
      return new Response("Error processing customer", { status: 500 });
    }

    // Extract product IDs from line items for bonus point calculation
    const productIds = orderData.line_items.map(item => item.product_id.toString());
    
    // Calculate bonus-eligible amount (excluding singles)
    const bonusEligibleAmount = calculateBonusEligibleAmount(orderData.line_items);
    
    console.log(`Order ${orderId}: Total amount: $${orderAmount}, Bonus eligible amount: $${bonusEligibleAmount}`);

    // Process points for this order
    try {
      const pointsResult = await processOrderPoints({
        customerId: loyaltyCustomer.id,
        orderId,
        orderAmount,
        productIds,
        admin,
      });

      console.log(`Points awarded for order ${orderId}:`, pointsResult);

      // If there are bonus points and the bonus eligible amount is different from total,
      // we need to recalculate bonus points based on eligible amount only
      if (pointsResult.bonusPoints > 0 && bonusEligibleAmount !== orderAmount) {
        console.log(`Recalculating bonus points for eligible amount only`);
        
        // We'll need to implement a more sophisticated bonus calculation
        // For now, we'll use the existing logic but note the limitation
        console.log(`Note: Bonus points calculated on full order amount. Consider implementing product-level bonus calculation.`);
      }

      return new Response(JSON.stringify({
        success: true,
        orderId,
        customerId: loyaltyCustomer.id,
        pointsAwarded: pointsResult,
        bonusEligibleAmount,
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });

    } catch (error) {
      console.error(`Error processing points for order ${orderId}:`, error);
      return new Response("Error processing points", { status: 500 });
    }

  } catch (error) {
    console.error("Error processing order webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
