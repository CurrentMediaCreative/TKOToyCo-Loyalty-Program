#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { shopifyApi } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-07";

const prisma = new PrismaClient();

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["read_orders", "read_customers", "read_products"],
  hostName:
    process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, "") || "localhost",
  apiVersion: "2023-07",
  isEmbeddedApp: true,
  restResources,
});

async function syncMissingOrdersInRange() {
  console.log("🔄 Starting targeted order sync from July 11, 2025...\n");

  try {
    // Create admin context
    const session = {
      shop: process.env.SHOP,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    };

    const admin = shopify.graphql({ session });

    // Start sync from July 11, 2025 (after order #15853)
    const syncStartDate = new Date("2025-07-11T00:00:00.000Z");

    console.log(`📅 Syncing orders from: ${syncStartDate.toISOString()}`);
    console.log(
      "🎯 Target: Fill gap between order #15853 and current orders\n",
    );

    // Get current stats before sync
    console.log("📊 Pre-sync database stats:");
    const preOrderCount = await prisma.order.count();
    console.log(`   Total orders in database: ${preOrderCount}`);

    // Get the last order in database
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, orderNumber: true },
    });
    console.log(
      `   Last order date: ${lastOrder?.createdAt?.toISOString() || "None"}\n`,
    );

    // Run the sync
    console.log("🚀 Starting sync process...");
    const startTime = Date.now();

    let totalOrders = 0;
    let processedOrders = 0;
    let errors = 0;
    let hasNextPage = true;
    let cursor = null;
    let batchCount = 0;

    while (hasNextPage) {
      batchCount++;
      console.log(`   Processing batch ${batchCount}...`);

      try {
        const queryVariables = cursor
          ? {
              first: 250,
              after: cursor,
              query: `created_at:>='${syncStartDate.toISOString()}'`,
            }
          : {
              first: 250,
              query: `created_at:>='${syncStartDate.toISOString()}'`,
            };

        const response = await admin(
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
                          priceSet {
                            shopMoney {
                              amount
                            }
                          }
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
          console.log("   No order data returned from API");
          break;
        }

        const orders = ordersData.edges.map((edge) => edge.node);
        totalOrders += orders.length;

        console.log(`   Found ${orders.length} orders in batch ${batchCount}`);

        // Process each order
        for (const shopifyOrder of orders) {
          try {
            const shopifyId = parseInt(
              shopifyOrder.id.replace("gid://shopify/Order/", ""),
            );

            // Check if order already exists
            const existingOrder = await prisma.order.findUnique({
              where: { shopifyId },
            });

            if (existingOrder) {
              console.log(
                `   ⏭️  Order #${shopifyOrder.number} already exists, skipping`,
              );
              continue;
            }

            // Find or create customer
            let customerId = null;
            if (shopifyOrder.customer) {
              const customerShopifyId = parseInt(
                shopifyOrder.customer.id.replace("gid://shopify/Customer/", ""),
              );

              let customer = await prisma.customer.findUnique({
                where: { shopifyId: customerShopifyId },
              });

              if (!customer) {
                // Create customer
                customer = await prisma.customer.create({
                  data: {
                    id: `customer_${customerShopifyId}`,
                    shopifyId: customerShopifyId,
                    emails: shopifyOrder.customer.email
                      ? [shopifyOrder.customer.email]
                      : [],
                    firstName: shopifyOrder.customer.firstName,
                    lastName: shopifyOrder.customer.lastName,
                    phone: shopifyOrder.customer.phone,
                    totalSpend: parseFloat(
                      shopifyOrder.customer.amountSpent?.amount || "0",
                    ),
                    numberOfOrders: parseInt(
                      shopifyOrder.customer.numberOfOrders || "0",
                    ),
                    tags: shopifyOrder.customer.tags?.join(","),
                    city: shopifyOrder.customer.defaultAddress?.city,
                    province: shopifyOrder.customer.defaultAddress?.province,
                    country: shopifyOrder.customer.defaultAddress?.country,
                    shopifyCreatedAt: new Date(shopifyOrder.customer.createdAt),
                  },
                });
                console.log(
                  `   👤 Created customer: ${customer.firstName} ${customer.lastName}`,
                );
              }

              customerId = customer.id;
            }

            // Calculate shipping amount
            const shippingAmount =
              shopifyOrder.shippingLines?.edges?.reduce((total, edge) => {
                return (
                  total +
                  parseFloat(edge.node.priceSet?.shopMoney?.amount || "0")
                );
              }, 0) || 0;

            // Create order
            const newOrder = await prisma.order.create({
              data: {
                shopifyId,
                customerId,
                totalAmount: parseFloat(
                  shopifyOrder.totalPriceSet?.shopMoney?.amount || "0",
                ),
                subtotalAmount: parseFloat(
                  shopifyOrder.subtotalPriceSet?.shopMoney?.amount || "0",
                ),
                taxAmount: parseFloat(
                  shopifyOrder.totalTaxSet?.shopMoney?.amount || "0",
                ),
                shippingAmount,
                discountAmount: parseFloat(
                  shopifyOrder.totalDiscountsSet?.shopMoney?.amount || "0",
                ),
                financialStatus:
                  shopifyOrder.displayFinancialStatus?.toLowerCase() ||
                  "pending",
                fulfillmentStatus:
                  shopifyOrder.displayFulfillmentStatus?.toLowerCase(),
                createdAt: new Date(shopifyOrder.createdAt),
                processedAt: shopifyOrder.processedAt
                  ? new Date(shopifyOrder.processedAt)
                  : null,
                orderNumber: shopifyOrder.number,
                tags: shopifyOrder.tags?.join(","),
                note: shopifyOrder.note,
              },
            });

            // Create line items
            if (shopifyOrder.lineItems?.edges) {
              for (const lineItemEdge of shopifyOrder.lineItems.edges) {
                const lineItem = lineItemEdge.node;
                await prisma.lineItem.create({
                  data: {
                    orderId: newOrder.id,
                    shopifyId: parseInt(
                      lineItem.id.replace("gid://shopify/LineItem/", ""),
                    ),
                    name: lineItem.title,
                    price: parseFloat(
                      lineItem.originalUnitPriceSet?.shopMoney?.amount || "0",
                    ),
                    quantity: lineItem.quantity,
                    sku: lineItem.variant?.sku,
                    variantId: lineItem.variant?.id
                      ? parseInt(
                          lineItem.variant.id.replace(
                            "gid://shopify/ProductVariant/",
                            "",
                          ),
                        )
                      : null,
                    productId: lineItem.variant?.product?.id
                      ? parseInt(
                          lineItem.variant.product.id.replace(
                            "gid://shopify/Product/",
                            "",
                          ),
                        )
                      : null,
                    variantTitle: lineItem.variant?.title,
                    vendor: lineItem.variant?.product?.vendor,
                    discount: parseFloat(
                      lineItem.totalDiscountSet?.shopMoney?.amount || "0",
                    ),
                    taxable: lineItem.taxable,
                    requiresShipping: lineItem.requiresShipping,
                  },
                });
              }
            }

            processedOrders++;
            console.log(
              `   ✅ Created order #${shopifyOrder.number} - $${shopifyOrder.totalPriceSet?.shopMoney?.amount}`,
            );
          } catch (orderError) {
            console.error(
              `   ❌ Error processing order #${shopifyOrder.number}:`,
              orderError.message,
            );
            errors++;
          }
        }

        // Update pagination
        hasNextPage = ordersData.pageInfo.hasNextPage;
        cursor = ordersData.pageInfo.endCursor;

        // Small delay to respect API limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (batchError) {
        console.error(
          `   ❌ Error processing batch ${batchCount}:`,
          batchError.message,
        );
        errors++;
        break;
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Get post-sync stats
    const postOrderCount = await prisma.order.count();
    const ordersAdded = postOrderCount - preOrderCount;

    // Display results
    console.log("\n✅ Sync completed!");
    console.log("📈 Results:");
    console.log(`   Duration: ${duration.toFixed(2)} seconds`);
    console.log(`   Total orders found: ${totalOrders}`);
    console.log(`   Orders processed: ${processedOrders}`);
    console.log(`   Orders added: ${ordersAdded}`);
    console.log(`   Errors: ${errors}`);

    // Check for specific orders we were looking for
    console.log("\n🔍 Checking for target orders:");
    const targetOrders = [15854, 18814, 18816];

    for (const orderNum of targetOrders) {
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderNum },
        select: {
          orderNumber: true,
          createdAt: true,
          totalAmount: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
              emails: true,
            },
          },
        },
      });

      if (order) {
        console.log(
          `   ✅ Order #${orderNum} found - ${order.createdAt.toISOString().split("T")[0]} - $${order.totalAmount}`,
        );
        if (order.customer) {
          console.log(
            `      Customer: ${order.customer.firstName} ${order.customer.lastName} (${order.customer.emails[0] || "No email"})`,
          );
        }
      } else {
        console.log(`   ❌ Order #${orderNum} still not found`);
      }
    }

    if (errors > 0) {
      console.log(
        `\n⚠️  ${errors} errors occurred during sync. Check output above for details.`,
      );
    }

    console.log("\n🎉 Sync process completed successfully!");
  } catch (error) {
    console.error("❌ Error during order sync:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if we have required environment variables
if (
  !process.env.SHOPIFY_API_KEY ||
  !process.env.SHOPIFY_API_SECRET ||
  !process.env.SHOPIFY_ACCESS_TOKEN ||
  !process.env.SHOP
) {
  console.error("❌ Missing required environment variables:");
  console.error(
    "   SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_ACCESS_TOKEN, SHOP",
  );
  process.exit(1);
}

syncMissingOrdersInRange();
