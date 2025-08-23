import prisma from "../db.server";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { createOrUpdateOrder } from "./order.server";
import { processFulfilledOrder } from "./orderProcessor.server";
import { logger } from "../utils/logger.server";
import { withRetry, ServiceResult } from "../utils/errorHandler.server";
import { measurePerformance } from "../utils/performance.server";

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
  line_items: any[];
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

interface SyncResult {
  totalOrders: number;
  processedOrders: number;
  fulfilledOrders: number;
  customersUpdated: number;
  pointsAwarded: number;
  errors: number;
  duration: number;
  lastOrderDate: string | null;
}

/**
 * Order Sync Service
 * Handles synchronization of orders from Shopify to local database
 * Focuses on catching up missing orders since last sync
 */

export class OrderSyncService {
  private admin: AdminApiContext;

  constructor(admin: AdminApiContext) {
    this.admin = admin;
  }

  /**
   * Get the most recent order date from our database
   */
  async getLastOrderInDatabase(): Promise<Date | null> {
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, orderNumber: true },
    });

    if (lastOrder) {
      logger.info("Last order found in database", {
        operation: "getLastOrderInDatabase",
        orderNumber: lastOrder.orderNumber,
        createdAt: lastOrder.createdAt.toISOString(),
      });
      return lastOrder.createdAt;
    }

    logger.info("No orders found in database", {
      operation: "getLastOrderInDatabase",
    });
    return null;
  }

  /**
   * Sync all orders since the last order in our database
   */
  async syncMissingOrders(): Promise<SyncResult> {
    const startTime = Date.now();
    logger.info("Starting missing orders sync", {
      operation: "syncMissingOrders",
    });

    const lastOrderDate = await this.getLastOrderInDatabase();

    if (!lastOrderDate) {
      logger.warn(
        "No orders in database - consider running full sync instead",
        {
          operation: "syncMissingOrders",
          recommendation: "full_sync",
        },
      );
      return {
        totalOrders: 0,
        processedOrders: 0,
        fulfilledOrders: 0,
        customersUpdated: 0,
        pointsAwarded: 0,
        errors: 0,
        duration: Date.now() - startTime,
        lastOrderDate: null,
      };
    }

    // Add a small buffer to ensure we don't miss any orders due to timing
    const syncSince = new Date(lastOrderDate.getTime() - 60000); // 1 minute before last order

    return await this.syncOrdersSince(syncSince);
  }

  /**
   * Sync all orders since a specific date
   */
  async syncOrdersSince(sinceDate: Date): Promise<SyncResult> {
    const startTime = Date.now();
    logger.info("Syncing orders since date", {
      operation: "syncOrdersSince",
      sinceDate: sinceDate.toISOString(),
    });

    let totalOrders = 0;
    let processedOrders = 0;
    let fulfilledOrders = 0;
    let customersUpdated = 0;
    let pointsAwarded = 0;
    let errors = 0;
    let hasNextPage = true;
    let cursor: string | null = null;
    let batchCount = 0;

    const processedCustomers = new Set<string>();

    try {
      while (hasNextPage) {
        batchCount++;
        logger.info("Processing batch", {
          operation: "syncOrdersSince",
          batchNumber: batchCount,
        });

        try {
          const queryVariables: {
            first: number;
            after?: string;
            query: string;
          } = cursor
            ? {
                first: 250,
                after: cursor,
                query: `created_at:>='${sinceDate.toISOString()}'`,
              }
            : {
                first: 250,
                query: `created_at:>='${sinceDate.toISOString()}'`,
              };

          const response = await this.admin.graphql(
            `#graphql
              query GetOrdersSinceDate($first: Int!, $after: String, $query: String!) {
                orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT) {
                  edges {
                    node {
                      id
                      name
                      email
                      createdAt
                      updatedAt
                      number
                      note
                      totalPriceSet {
                        shopMoney {
                          amount
                        }
                      }
                      subtotalPriceSet {
                        shopMoney {
                          amount
                        }
                      }
                      totalTaxSet {
                        shopMoney {
                          amount
                        }
                      }
                      totalDiscountsSet {
                        shopMoney {
                          amount
                        }
                      }
                      displayFinancialStatus
                      displayFulfillmentStatus
                      processedAt
                      tags
                      customer {
                        id
                        email
                        firstName
                        lastName
                        phone
                        tags
                        numberOfOrders
                        amountSpent {
                          amount
                        }
                        createdAt
                        lastOrder {
                          createdAt
                        }
                        defaultAddress {
                          city
                          province
                          country
                        }
                      }
                      lineItems(first: 250) {
                        edges {
                          node {
                            id
                            title
                            quantity
                            originalUnitPriceSet {
                              shopMoney {
                                amount
                              }
                            }
                            totalDiscountSet {
                              shopMoney {
                                amount
                              }
                            }
                            variant {
                              id
                              title
                              sku
                              product {
                                id
                                title
                                vendor
                                productType
                                tags
                              }
                            }
                            taxable
                            requiresShipping
                          }
                        }
                      }
                      shippingLines(first: 10) {
                        edges {
                          node {
                            title
                          }
                        }
                      }
                    }
                    cursor
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }`,
            { variables: queryVariables },
          );

          const responseJson = await response.json();
          const ordersData = responseJson.data?.orders;

          if (!ordersData) {
            logger.error("No order data returned from API", {
              operation: "syncOrdersSince",
              batchNumber: batchCount,
            });
            break;
          }

          const orders = ordersData.edges.map((edge: any) => edge.node);
          totalOrders += orders.length;

          logger.info("Batch processing orders", {
            operation: "syncOrdersSince",
            batchNumber: batchCount,
            ordersCount: orders.length,
          });

          // Process each order
          for (const shopifyOrder of orders) {
            try {
              // Convert GraphQL format to REST format for compatibility
              const restOrder = this.convertGraphQLOrderToRest(shopifyOrder);

              // Find or create customer
              let customerId: string | undefined;
              if (shopifyOrder.customer) {
                const customerShopifyId = parseInt(
                  shopifyOrder.customer.id.replace(
                    "gid://shopify/Customer/",
                    "",
                  ),
                );

                // Always update customer data with current Shopify data to ensure accuracy
                if (!processedCustomers.has(customerShopifyId.toString())) {
                  // Use customer data from the order (which is current) to update our database
                  // IMPORTANT: amountSpent.amount is in dollars, use directly
                  const totalSpendDollars = parseFloat(
                    shopifyOrder.customer.amountSpent?.amount || "0",
                  );
                  const totalSpend = totalSpendDollars;
                  const numberOfOrders =
                    parseInt(shopifyOrder.customer.numberOfOrders) || 0;

                  logger.info("Updating customer with current Shopify data", {
                    operation: "syncOrdersSince",
                    customerShopifyId,
                    totalSpend,
                    numberOfOrders,
                  });

                  // Import createOrUpdateCustomer to ensure data consistency
                  const { createOrUpdateCustomer } = await import(
                    "./customer.server"
                  );

                  await createOrUpdateCustomer({
                    shopifyId: customerShopifyId,
                    email: shopifyOrder.customer.email,
                    firstName: shopifyOrder.customer.firstName,
                    lastName: shopifyOrder.customer.lastName,
                    totalSpend: totalSpend,
                    lastOrderDate: new Date(shopifyOrder.createdAt),
                    admin: this.admin,
                  });

                  processedCustomers.add(customerShopifyId.toString());
                  customersUpdated++;
                }

                // Find customer in database
                const customer = await prisma.customer.findUnique({
                  where: { shopifyId: customerShopifyId },
                });
                customerId = customer?.id;
              }

              // Create or update order
              await createOrUpdateOrder(restOrder, customerId);
              processedOrders++;

              // If order is fulfilled, process points
              if (shopifyOrder.fulfillmentStatus === "FULFILLED") {
                fulfilledOrders++;
                try {
                  const pointsResult = await processFulfilledOrder(
                    restOrder,
                    this.admin,
                  );
                  if (
                    pointsResult.bonusPoints &&
                    pointsResult.bonusPoints > 0
                  ) {
                    pointsAwarded += pointsResult.bonusPoints;
                    logger.info("Awarded points for order", {
                      operation: "syncOrdersSince",
                      bonusPoints: pointsResult.bonusPoints,
                      orderNumber: shopifyOrder.number,
                    });
                  }
                } catch (pointsError) {
                  logger.error("Error processing points for order", {
                    operation: "syncOrdersSince",
                    orderNumber: shopifyOrder.number,
                    error:
                      pointsError instanceof Error
                        ? pointsError.message
                        : String(pointsError),
                  });
                  errors++;
                }
              }
            } catch (orderError) {
              logger.error("Error processing order", {
                operation: "syncOrdersSince",
                orderNumber: shopifyOrder.number,
                error:
                  orderError instanceof Error
                    ? orderError.message
                    : String(orderError),
              });
              errors++;
            }
          }

          // Update pagination
          hasNextPage = ordersData.pageInfo.hasNextPage;
          cursor = ordersData.pageInfo.endCursor;

          logger.info("Batch complete", {
            operation: "syncOrdersSince",
            batchNumber: batchCount,
            ordersProcessed: orders.length,
          });

          // Small delay to respect API limits
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (batchError) {
          logger.error("Error processing batch", {
            operation: "syncOrdersSince",
            batchNumber: batchCount,
            error:
              batchError instanceof Error
                ? batchError.message
                : String(batchError),
          });
          errors++;
          break;
        }
      }

      const duration = Date.now() - startTime;
      const newLastOrder = await this.getLastOrderInDatabase();

      logger.info("Sync complete", {
        operation: "syncOrdersSince",
        processedOrders,
        totalOrders,
        duration,
        stats: {
          fulfilledOrders,
          customersUpdated,
          pointsAwarded,
          errors,
        },
      });

      return {
        totalOrders,
        processedOrders,
        fulfilledOrders,
        customersUpdated,
        pointsAwarded,
        errors,
        duration,
        lastOrderDate: newLastOrder?.toISOString() || null,
      };
    } catch (error) {
      logger.error("Fatal error in order sync", {
        operation: "syncOrdersSince",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Convert GraphQL order format to REST format for compatibility
   */
  private convertGraphQLOrderToRest(graphqlOrder: any): ShopifyOrder {
    return {
      id: parseInt(graphqlOrder.id.replace("gid://shopify/Order/", "")),
      email: graphqlOrder.email,
      created_at: graphqlOrder.createdAt,
      updated_at: graphqlOrder.updatedAt,
      number: graphqlOrder.number,
      note: graphqlOrder.note,
      token: "", // Not available in GraphQL
      gateway: "", // Not available in GraphQL
      test: graphqlOrder.test || false,
      total_price: graphqlOrder.totalPriceSet?.shopMoney?.amount || "0",
      subtotal_price: graphqlOrder.subtotalPriceSet?.shopMoney?.amount || "0",
      total_weight: 0, // Not available in GraphQL
      total_tax: graphqlOrder.totalTaxSet?.shopMoney?.amount || "0",
      taxes_included: false, // Not available in GraphQL
      currency: "CAD", // Assuming CAD
      financial_status:
        graphqlOrder.displayFinancialStatus?.toLowerCase() || "pending",
      confirmed: true,
      total_discounts: graphqlOrder.totalDiscountsSet?.shopMoney?.amount || "0",
      buyer_accepts_marketing: false, // Not available in GraphQL
      name: graphqlOrder.name,
      referring_site: "",
      landing_site: "",
      cancelled_at: undefined,
      cancel_reason: undefined,
      total_price_usd: undefined,
      checkout_token: undefined,
      reference: undefined,
      user_id: undefined,
      location_id: undefined,
      source_identifier: undefined,
      source_url: "", // Set to empty string instead of trying to fetch
      processed_at: graphqlOrder.processedAt,
      device_id: undefined,
      phone: undefined,
      customer_locale: undefined,
      app_id: undefined,
      browser_ip: undefined,
      landing_site_ref: undefined,
      order_number: graphqlOrder.number,
      discount_applications: [],
      discount_codes: [],
      note_attributes: [],
      payment_gateway_names: [],
      processing_method: "",
      checkout_id: undefined,
      source_name: "",
      fulfillment_status: graphqlOrder.displayFulfillmentStatus?.toLowerCase(),
      tax_lines: [],
      tags: graphqlOrder.tags?.join(",") || "",
      contact_email: graphqlOrder.email,
      order_status_url: "",
      presentment_currency: "CAD",
      total_line_items_price_set: {},
      total_discounts_set: {},
      total_shipping_price_set: {},
      subtotal_price_set: {},
      total_price_set: {},
      total_tax_set: {},
      line_items:
        graphqlOrder.lineItems?.edges?.map((edge: any) => ({
          id: edge.node.id.replace("gid://shopify/LineItem/", ""),
          product_id:
            edge.node.variant?.product?.id?.replace(
              "gid://shopify/Product/",
              "",
            ) || "",
          variant_id:
            edge.node.variant?.id?.replace(
              "gid://shopify/ProductVariant/",
              "",
            ) || "",
          title: edge.node.title,
          quantity: edge.node.quantity,
          price: edge.node.originalUnitPriceSet?.shopMoney?.amount || "0",
          total_discount: edge.node.totalDiscountSet?.shopMoney?.amount || "0",
          product_exists: true,
          variant_title: edge.node.variant?.title,
          vendor: edge.node.variant?.product?.vendor,
          product_type: edge.node.variant?.product?.productType,
          tags: edge.node.variant?.product?.tags?.join(","),
          sku: edge.node.variant?.sku,
          taxable: edge.node.taxable,
          requires_shipping: edge.node.requiresShipping,
          fulfillment_service: "", // Set to empty string instead of trying to fetch
        })) || [],
      shipping_lines:
        graphqlOrder.shippingLines?.edges?.map((edge: any) => ({
          title: edge.node.title,
          price: "0",
        })) || [],
      billing_address: null,
      shipping_address: null,
      fulfillments: [],
      client_details: null,
      refunds: [],
      customer: graphqlOrder.customer
        ? {
            id: parseInt(
              graphqlOrder.customer.id.replace("gid://shopify/Customer/", ""),
            ),
            email: graphqlOrder.customer.email,
            accepts_marketing: false,
            created_at: graphqlOrder.customer.createdAt,
            updated_at:
              graphqlOrder.customer.updatedAt ||
              graphqlOrder.customer.createdAt,
            first_name: graphqlOrder.customer.firstName,
            last_name: graphqlOrder.customer.lastName,
            orders_count: parseInt(graphqlOrder.customer.numberOfOrders) || 0,
            state: "enabled",
            total_spent: graphqlOrder.customer.amountSpent?.amount || "0",
            last_order_id: undefined,
            note: undefined,
            verified_email: true,
            multipass_identifier: undefined,
            tax_exempt: false,
            phone: graphqlOrder.customer.phone,
            tags: graphqlOrder.customer.tags?.join(",") || "",
            last_order_name: undefined,
            currency: "CAD",
            accepts_marketing_updated_at: graphqlOrder.customer.createdAt,
            marketing_opt_in_level: undefined,
            tax_exemptions: [],
            admin_graphql_api_id: graphqlOrder.customer.id,
            default_address: graphqlOrder.customer.defaultAddress,
          }
        : undefined,
    };
  }

  /**
   * Smart gap-filling sync that identifies missing order numbers and syncs only those
   * Enhanced with better error handling, smaller batches, and progress reporting
   */
  async syncMissingOrdersByNumber(): Promise<SyncResult> {
    const startTime = Date.now();
    logger.info("Starting enhanced smart gap-filling order sync", {
      operation: "syncMissingOrdersByNumber",
    });

    let totalOrders = 0;
    let processedOrders = 0;
    let fulfilledOrders = 0;
    let customersUpdated = 0;
    let pointsAwarded = 0;
    let errors = 0;

    const processedCustomers = new Set<string>();

    try {
      // Step 1: Get the highest order number from Shopify with timeout
      logger.info("Getting highest order number from Shopify", {
        operation: "syncMissingOrdersByNumber",
      });

      const highestOrderResponse = await Promise.race([
        this.admin.graphql(
          `#graphql
            query GetHighestOrderNumber {
              orders(first: 1, sortKey: CREATED_AT, reverse: true) {
                edges {
                  node {
                    number
                  }
                }
              }
            }`,
        ),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout getting highest order")),
            30000,
          ),
        ),
      ]);

      const highestOrderData = await (highestOrderResponse as Response).json();
      const highestOrderNumber =
        highestOrderData.data?.orders?.edges?.[0]?.node?.number;

      if (!highestOrderNumber) {
        logger.warn("No orders found in Shopify", {
          operation: "syncMissingOrdersByNumber",
        });
        return {
          totalOrders: 0,
          processedOrders: 0,
          fulfilledOrders: 0,
          customersUpdated: 0,
          pointsAwarded: 0,
          errors: 0,
          duration: Date.now() - startTime,
          lastOrderDate: null,
        };
      }

      logger.info("Found highest order number", {
        operation: "syncMissingOrdersByNumber",
        highestOrderNumber,
      });

      // Step 2: Get all existing order numbers from our database
      const existingOrders = await prisma.order.findMany({
        select: { orderNumber: true },
        orderBy: { orderNumber: "asc" },
      });

      const existingOrderNumbers = new Set(
        existingOrders.map((order) => order.orderNumber),
      );

      // Get the lowest order number in our database to establish the range
      const lowestOrderNumber =
        existingOrders.length > 0 ? existingOrders[0].orderNumber : 1001;

      logger.info("Database order analysis", {
        operation: "syncMissingOrdersByNumber",
        lowestOrderNumber,
        highestOrderNumber,
        existingOrdersCount: existingOrderNumbers.size,
      });

      // Step 3: Identify missing order numbers
      const missingOrderNumbers: number[] = [];
      for (
        let orderNum = lowestOrderNumber;
        orderNum <= highestOrderNumber;
        orderNum++
      ) {
        if (!existingOrderNumbers.has(orderNum)) {
          missingOrderNumbers.push(orderNum);
        }
      }

      logger.info("Gap analysis complete", {
        operation: "syncMissingOrdersByNumber",
        missingOrdersCount: missingOrderNumbers.length,
        sampleMissingOrders: missingOrderNumbers.slice(0, 10),
      });

      if (missingOrderNumbers.length === 0) {
        logger.info("No missing orders found", {
          operation: "syncMissingOrdersByNumber",
        });
        return {
          totalOrders: 0,
          processedOrders: 0,
          fulfilledOrders: 0,
          customersUpdated: 0,
          pointsAwarded: 0,
          errors: 0,
          duration: Date.now() - startTime,
          lastOrderDate: null,
        };
      }

      // Limit the number of orders to process in one session to prevent timeouts
      const maxOrdersPerSession = 500;
      const ordersToProcess = missingOrderNumbers.slice(0, maxOrdersPerSession);

      if (missingOrderNumbers.length > maxOrdersPerSession) {
        logger.info("Limiting sync to prevent timeout", {
          operation: "syncMissingOrdersByNumber",
          totalMissing: missingOrderNumbers.length,
          processingInThisSession: ordersToProcess.length,
        });
      }

      // Step 4: Sync missing orders in smaller batches
      const batchSize = 10; // Reduced from 50 to 10 for better reliability
      const batches = [];
      for (let i = 0; i < ordersToProcess.length; i += batchSize) {
        batches.push(ordersToProcess.slice(i, i + batchSize));
      }

      logger.info("Starting batch processing", {
        operation: "syncMissingOrdersByNumber",
        totalBatches: batches.length,
        batchSize,
        ordersToProcess: ordersToProcess.length,
      });

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const progressPercent = Math.round(
          ((batchIndex + 1) / batches.length) * 100,
        );

        logger.info("Processing batch with progress", {
          operation: "syncMissingOrdersByNumber",
          batchIndex: batchIndex + 1,
          totalBatches: batches.length,
          progressPercent,
          orderNumbers: batch,
          processedSoFar: processedOrders,
        });

        try {
          // Create query for specific order numbers
          const orderNumbersQuery = batch
            .map((num) => `number:${num}`)
            .join(" OR ");

          // Add timeout to GraphQL request
          const response = await Promise.race([
            this.admin.graphql(
              `#graphql
                query GetSpecificOrders($query: String!) {
                  orders(first: 50, query: $query) {
                    edges {
                      node {
                        id
                        name
                        email
                        createdAt
                        updatedAt
                        number
                        note
                        totalPriceSet {
                          shopMoney {
                            amount
                          }
                        }
                        subtotalPriceSet {
                          shopMoney {
                            amount
                          }
                        }
                        totalTaxSet {
                          shopMoney {
                            amount
                          }
                        }
                        totalDiscountsSet {
                          shopMoney {
                            amount
                          }
                        }
                        displayFinancialStatus
                        displayFulfillmentStatus
                        processedAt
                        tags
                        customer {
                          id
                          email
                          firstName
                          lastName
                          phone
                          tags
                          numberOfOrders
                          amountSpent {
                            amount
                          }
                          createdAt
                          defaultAddress {
                            city
                            province
                            country
                          }
                        }
                        lineItems(first: 50) {
                          edges {
                            node {
                              id
                              title
                              quantity
                              originalUnitPriceSet {
                                shopMoney {
                                  amount
                                }
                              }
                              totalDiscountSet {
                                shopMoney {
                                  amount
                                }
                              }
                              variant {
                                id
                                title
                                sku
                                product {
                                  id
                                  title
                                  vendor
                                  productType
                                  tags
                                }
                              }
                              taxable
                              requiresShipping
                            }
                          }
                        }
                        shippingLines(first: 5) {
                          edges {
                            node {
                              title
                            }
                          }
                        }
                      }
                    }
                  }
                }`,
              { variables: { query: orderNumbersQuery } },
            ),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Batch timeout")), 45000),
            ),
          ]);

          const responseJson = await (response as Response).json();
          const ordersData = responseJson.data?.orders;

          if (!ordersData) {
            logger.error("No order data returned from API", {
              operation: "syncMissingOrdersByNumber",
              batchIndex: batchIndex + 1,
              query: orderNumbersQuery,
            });
            errors++;
            continue;
          }

          const orders = ordersData.edges.map((edge: any) => edge.node);
          totalOrders += orders.length;

          logger.info("Found orders for batch", {
            operation: "syncMissingOrdersByNumber",
            batchIndex: batchIndex + 1,
            requestedOrders: batch.length,
            foundOrders: orders.length,
            progressPercent,
          });

          // Process each order with individual error handling
          for (const shopifyOrder of orders) {
            try {
              // Convert GraphQL format to REST format for compatibility
              const restOrder = this.convertGraphQLOrderToRest(shopifyOrder);

              // Find or create customer
              let customerId: string | undefined;
              if (shopifyOrder.customer) {
                const customerShopifyId = parseInt(
                  shopifyOrder.customer.id.replace(
                    "gid://shopify/Customer/",
                    "",
                  ),
                );

                // Always update customer data with current Shopify data to ensure accuracy
                if (!processedCustomers.has(customerShopifyId.toString())) {
                  try {
                    const totalSpendDollars = parseFloat(
                      shopifyOrder.customer.amountSpent?.amount || "0",
                    );
                    const totalSpend = totalSpendDollars;
                    const numberOfOrders =
                      parseInt(shopifyOrder.customer.numberOfOrders) || 0;

                    // Import createOrUpdateCustomer to ensure data consistency
                    const { createOrUpdateCustomer } = await import(
                      "./customer.server"
                    );

                    await createOrUpdateCustomer({
                      shopifyId: customerShopifyId,
                      email: shopifyOrder.customer.email,
                      firstName: shopifyOrder.customer.firstName,
                      lastName: shopifyOrder.customer.lastName,
                      totalSpend: totalSpend,
                      lastOrderDate: new Date(shopifyOrder.createdAt),
                      admin: this.admin,
                    });

                    processedCustomers.add(customerShopifyId.toString());
                    customersUpdated++;
                  } catch (customerError) {
                    logger.error("Error updating customer", {
                      operation: "syncMissingOrdersByNumber",
                      customerShopifyId,
                      error:
                        customerError instanceof Error
                          ? customerError.message
                          : String(customerError),
                    });
                    errors++;
                  }
                }

                // Find customer in database
                const customer = await prisma.customer.findUnique({
                  where: { shopifyId: customerShopifyId },
                });
                customerId = customer?.id;
              }

              // Create or update order
              await createOrUpdateOrder(restOrder, customerId);
              processedOrders++;

              // If order is fulfilled, process points
              if (shopifyOrder.displayFulfillmentStatus === "FULFILLED") {
                fulfilledOrders++;
                try {
                  const pointsResult = await processFulfilledOrder(
                    restOrder,
                    this.admin,
                  );
                  if (
                    pointsResult.bonusPoints &&
                    pointsResult.bonusPoints > 0
                  ) {
                    pointsAwarded += pointsResult.bonusPoints;
                  }
                } catch (pointsError) {
                  logger.error("Error processing points for order", {
                    operation: "syncMissingOrdersByNumber",
                    orderNumber: shopifyOrder.number,
                    error:
                      pointsError instanceof Error
                        ? pointsError.message
                        : String(pointsError),
                  });
                  errors++;
                }
              }
            } catch (orderError) {
              logger.error("Error processing order", {
                operation: "syncMissingOrdersByNumber",
                orderNumber: shopifyOrder.number,
                error:
                  orderError instanceof Error
                    ? orderError.message
                    : String(orderError),
              });
              errors++;
            }
          }

          // Longer delay to respect API limits and prevent overwhelming
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (batchError) {
          logger.error("Error processing batch", {
            operation: "syncMissingOrdersByNumber",
            batchIndex: batchIndex + 1,
            error:
              batchError instanceof Error
                ? batchError.message
                : String(batchError),
          });
          errors++;

          // Continue with next batch instead of failing completely
          continue;
        }
      }

      const duration = Date.now() - startTime;
      const newLastOrder = await this.getLastOrderInDatabase();

      const remainingOrders =
        missingOrderNumbers.length - ordersToProcess.length;

      logger.info("Enhanced smart gap-filling sync complete", {
        operation: "syncMissingOrdersByNumber",
        processedOrders,
        totalOrders,
        duration,
        stats: {
          fulfilledOrders,
          customersUpdated,
          pointsAwarded,
          errors,
          missingOrdersFound: missingOrderNumbers.length,
          processedInThisSession: ordersToProcess.length,
          remainingOrders,
        },
      });

      return {
        totalOrders,
        processedOrders,
        fulfilledOrders,
        customersUpdated,
        pointsAwarded,
        errors,
        duration,
        lastOrderDate: newLastOrder?.toISOString() || null,
      };
    } catch (error) {
      logger.error("Fatal error in enhanced smart gap-filling sync", {
        operation: "syncMissingOrdersByNumber",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    lastOrderInDatabase: Date | null;
    totalOrdersInDatabase: number;
    estimatedMissingOrders: number;
  }> {
    const lastOrder = await this.getLastOrderInDatabase();
    const totalOrders = await prisma.order.count();

    // This is a rough estimate - we'd need to query Shopify to get exact count
    const estimatedMissingOrders = lastOrder ? 0 : 0; // Placeholder

    return {
      lastOrderInDatabase: lastOrder,
      totalOrdersInDatabase: totalOrders,
      estimatedMissingOrders,
    };
  }
}

/**
 * Helper functions for use in routes
 */

export async function syncMissingOrders(
  admin: AdminApiContext,
): Promise<SyncResult> {
  const syncService = new OrderSyncService(admin);
  return await syncService.syncMissingOrders();
}

export async function syncOrdersSince(
  admin: AdminApiContext,
  sinceDate: Date,
): Promise<SyncResult> {
  const syncService = new OrderSyncService(admin);
  return await syncService.syncOrdersSince(sinceDate);
}

export async function getOrderSyncStats(): Promise<{
  lastOrderInDatabase: Date | null;
  totalOrdersInDatabase: number;
  estimatedMissingOrders: number;
}> {
  const syncService = new OrderSyncService({} as AdminApiContext);
  return await syncService.getSyncStats();
}

/**
 * Smart gap-filling sync that identifies missing order numbers and syncs only those
 */
export async function syncMissingOrdersByNumber(
  admin: AdminApiContext,
): Promise<SyncResult> {
  const syncService = new OrderSyncService(admin);
  return await syncService.syncMissingOrdersByNumber();
}
