import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Point event qualification logic
function doesProductQualifyForEvent(product: any, event: any) {
  if (event.eventType === "store-wide") {
    return true;
  }

  if (event.eventType === "collections" && event.collections) {
    const eventCollections = JSON.parse(event.collections);
    const productCollectionIds =
      product.collections?.edges?.map((edge: any) =>
        edge.node.id.replace("gid://shopify/Collection/", ""),
      ) || [];
    return productCollectionIds.some((col: string) =>
      eventCollections.includes(col),
    );
  }

  if (event.eventType === "product-specific" && event.productIds) {
    const eventProducts = JSON.parse(event.productIds);
    return eventProducts.includes(
      product.id.replace("gid://shopify/Product/", ""),
    );
  }

  if (event.eventType === "category" && event.tags) {
    const requiredTags = JSON.parse(event.tags);
    const productTags = product.tags || [];
    return requiredTags.every((requiredTag: string) =>
      productTags.some(
        (tag: string) => tag.toLowerCase() === requiredTag.toLowerCase(),
      ),
    );
  }

  return false;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const eventId = formData.get("eventId") as string;
    const orderId = formData.get("orderId") as string;

    if (!eventId || !orderId) {
      return json({ error: "Missing eventId or orderId" }, { status: 400 });
    }

    // Get the event details
    const event = await prisma.pointEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return json({ error: "Event not found" }, { status: 404 });
    }

    // Check if this order has already been processed for this event
    const existingProcessing = await prisma.eventOrderProcessing.findUnique({
      where: {
        eventId_orderId: {
          eventId,
          orderId,
        },
      },
    });

    if (existingProcessing && existingProcessing.processed) {
      return json(
        {
          error: "Order already processed for this event",
          status: existingProcessing.qualified ? "qualified" : "not_qualified",
          bonusPoints: existingProcessing.bonusPointsAwarded,
        },
        { status: 400 },
      );
    }

    // Fetch order details from Shopify
    const orderResponse = await admin.graphql(
      `
        query getOrder($id: ID!) {
          order(id: $id) {
            id
            name
            totalPriceSet {
              shopMoney {
                amount
              }
            }
            createdAt
            customer {
              id
              firstName
              lastName
              email
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
                  product {
                    id
                    title
                    tags
                    collections(first: 50) {
                      edges {
                        node {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      {
        variables: { id: `gid://shopify/Order/${orderId}` },
      },
    );

    const orderData = await orderResponse.json();
    const order = orderData.data?.order;

    if (!order) {
      return json({ error: "Order not found in Shopify" }, { status: 404 });
    }

    // Check if any products in the order qualify for the event
    let qualifiesForEvent = false;
    let qualifyingProducts = [];

    for (const lineItem of order.lineItems.edges) {
      const product = lineItem.node.product;
      if (product && doesProductQualifyForEvent(product, event)) {
        qualifiesForEvent = true;
        qualifyingProducts.push({
          title: lineItem.node.title,
          quantity: lineItem.node.quantity,
          price: lineItem.node.originalUnitPriceSet.shopMoney.amount,
        });
      }
    }

    let bonusPointsAwarded = 0;

    // If order qualifies, calculate and award bonus points
    if (qualifiesForEvent && order.customer) {
      const shopifyCustomerId = order.customer.id.replace(
        "gid://shopify/Customer/",
        "",
      );

      // Find or create customer in our system
      let customer = await prisma.customer.findFirst({
        where: { shopifyId: BigInt(shopifyCustomerId) },
      });

      if (!customer) {
        // Create customer if they don't exist
        customer = await prisma.customer.create({
          data: {
            id: `customer_${shopifyCustomerId}`,
            shopifyId: BigInt(shopifyCustomerId),
            email: order.customer.email,
            firstName: order.customer.firstName,
            lastName: order.customer.lastName,
          },
        });
      }

      // Calculate bonus points
      const orderTotal = parseFloat(order.totalPriceSet.shopMoney.amount);
      const basePoints = Math.floor(orderTotal); // 1 point per dollar
      bonusPointsAwarded = Math.floor(
        basePoints * (event.bonusPercentage / 100),
      );

      // Award the bonus points
      if (bonusPointsAwarded > 0) {
        await prisma.pointTransaction.create({
          data: {
            customerId: customer.id,
            type: "bonus",
            amount: bonusPointsAwarded,
            orderId: orderId,
            eventId: eventId,
            description: `Bonus points from ${event.name}`,
          },
        });

        // Update customer's bonus points
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            bonusPoints: { increment: bonusPointsAwarded },
            totalPoints: { increment: bonusPointsAwarded },
          },
        });
      }
    }

    // Record the processing result
    const customerName = order.customer
      ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()
      : "Guest";

    await prisma.eventOrderProcessing.upsert({
      where: {
        eventId_orderId: {
          eventId,
          orderId,
        },
      },
      update: {
        processed: true,
        qualified: qualifiesForEvent,
        bonusPointsAwarded,
        processedAt: new Date(),
        customerName,
        orderTotal: parseFloat(order.totalPriceSet.shopMoney.amount),
        orderNumber: order.name,
      },
      create: {
        eventId,
        orderId,
        orderNumber: order.name,
        customerName,
        orderTotal: parseFloat(order.totalPriceSet.shopMoney.amount),
        processed: true,
        qualified: qualifiesForEvent,
        bonusPointsAwarded,
        processedAt: new Date(),
      },
    });

    return json({
      success: true,
      qualified: qualifiesForEvent,
      bonusPointsAwarded,
      orderNumber: order.name,
      customerName,
      qualifyingProducts,
    });
  } catch (error) {
    console.error("Error processing event order:", error);
    return json({ error: "Failed to process order" }, { status: 500 });
  }
};
