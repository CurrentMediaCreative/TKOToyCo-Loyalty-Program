import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

/**
 * Create or update an order in the database
 */
export async function createOrUpdateOrder(
  orderData: ShopifyOrder,
  customerId?: string,
) {
  try {
    console.log(`💾 Saving order #${orderData.order_number} to database`);

    // Calculate shipping amount from shipping lines
    const shippingAmount =
      orderData.shipping_lines?.reduce(
        (total, line) => total + parseFloat(line.price || "0"),
        0,
      ) || 0;

    // Check if order already exists
    const existingOrder = await prisma.order.findUnique({
      where: { shopifyId: BigInt(orderData.id) },
      include: { lineItems: true },
    });

    if (existingOrder) {
      console.log(`📝 Updating existing order #${orderData.order_number}`);

      // Update the order
      const updatedOrder = await prisma.order.update({
        where: { shopifyId: BigInt(orderData.id) },
        data: {
          customerId,
          totalAmount: parseFloat(orderData.total_price),
          subtotalAmount: parseFloat(orderData.subtotal_price),
          taxAmount: parseFloat(orderData.total_tax),
          shippingAmount,
          discountAmount: parseFloat(orderData.total_discounts),
          financialStatus: orderData.financial_status,
          fulfillmentStatus: orderData.fulfillment_status || "unfulfilled",
          processedAt: orderData.processed_at
            ? new Date(orderData.processed_at)
            : null,
          fulfilledAt:
            orderData.fulfillment_status === "fulfilled" ? new Date() : null,
          sourceUrl: orderData.source_url,
          referringSite: orderData.referring_site,
          landingSite: orderData.landing_site,
          tags: orderData.tags,
          note: orderData.note,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Delete existing line items and recreate them
      await prisma.lineItem.deleteMany({
        where: { orderId: updatedOrder.id },
      });

      // Create new line items
      if (orderData.line_items && orderData.line_items.length > 0) {
        await createLineItems(updatedOrder.id, orderData.line_items);
      }

      console.log(
        `✅ Updated order #${orderData.order_number} with ${orderData.line_items?.length || 0} line items`,
      );
      return updatedOrder;
    } else {
      console.log(`🆕 Creating new order #${orderData.order_number}`);

      // Create new order
      const newOrder = await prisma.order.create({
        data: {
          shopifyId: BigInt(orderData.id),
          customerId,
          totalAmount: parseFloat(orderData.total_price),
          subtotalAmount: parseFloat(orderData.subtotal_price),
          taxAmount: parseFloat(orderData.total_tax),
          shippingAmount,
          discountAmount: parseFloat(orderData.total_discounts),
          financialStatus: orderData.financial_status,
          fulfillmentStatus: orderData.fulfillment_status || "unfulfilled",
          createdAt: new Date(orderData.created_at),
          processedAt: orderData.processed_at
            ? new Date(orderData.processed_at)
            : null,
          fulfilledAt:
            orderData.fulfillment_status === "fulfilled" ? new Date() : null,
          sourceUrl: orderData.source_url,
          referringSite: orderData.referring_site,
          landingSite: orderData.landing_site,
          orderNumber: orderData.order_number,
          tags: orderData.tags,
          note: orderData.note,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create line items
      if (orderData.line_items && orderData.line_items.length > 0) {
        await createLineItems(newOrder.id, orderData.line_items);
      }

      console.log(
        `✅ Created order #${orderData.order_number} with ${orderData.line_items?.length || 0} line items`,
      );
      return newOrder;
    }
  } catch (error) {
    console.error(`❌ Error saving order #${orderData.order_number}:`, error);
    throw error;
  }
}

/**
 * Create line items for an order
 */
async function createLineItems(orderId: string, lineItems: OrderLineItem[]) {
  const lineItemsData = lineItems.map((item) => ({
    orderId,
    shopifyId: BigInt(item.id),
    name: item.title,
    price: parseFloat(item.price),
    quantity: item.quantity,
    sku: item.sku || null,
    variantId: item.variant_id ? BigInt(item.variant_id) : null,
    productId: item.product_id ? BigInt(item.product_id) : null,
    variantTitle: item.variant_title || null,
    vendor: item.vendor || null,
    discount: item.total_discount ? parseFloat(item.total_discount) : 0,
    taxable: item.taxable !== false, // Default to true if not specified
    requiresShipping: item.requires_shipping !== false, // Default to true if not specified
    fulfillmentService: item.fulfillment_service || null,
  }));

  await prisma.lineItem.createMany({
    data: lineItemsData,
  });

  console.log(`📦 Created ${lineItemsData.length} line items for order`);
}

/**
 * Get an order by Shopify ID
 */
export async function getOrderByShopifyId(shopifyId: number) {
  return await prisma.order.findUnique({
    where: { shopifyId: BigInt(shopifyId) },
    include: {
      customer: true,
      lineItems: true,
    },
  });
}

/**
 * Get an order by order number
 */
export async function getOrderByNumber(orderNumber: number) {
  return await prisma.order.findFirst({
    where: { orderNumber },
    include: {
      customer: true,
      lineItems: true,
    },
  });
}

/**
 * Update order fulfillment status
 */
export async function updateOrderFulfillment(
  shopifyId: number,
  fulfillmentStatus: string,
) {
  try {
    const updatedOrder = await prisma.order.update({
      where: { shopifyId: BigInt(shopifyId) },
      data: {
        fulfillmentStatus,
        fulfilledAt: fulfillmentStatus === "fulfilled" ? new Date() : null,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`📋 Updated order fulfillment status to: ${fulfillmentStatus}`);
    return updatedOrder;
  } catch (error) {
    console.error(`❌ Error updating order fulfillment:`, error);
    throw error;
  }
}

/**
 * Get orders for a customer
 */
export async function getCustomerOrders(customerId: string) {
  return await prisma.order.findMany({
    where: { customerId },
    include: {
      lineItems: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get recent orders
 */
export async function getRecentOrders(limit: number = 10) {
  return await prisma.order.findMany({
    include: {
      customer: true,
      lineItems: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
