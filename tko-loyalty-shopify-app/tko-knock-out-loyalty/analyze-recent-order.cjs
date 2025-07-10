const { authenticate } = require("./app/shopify.server");
const { PrismaClient } = require("@prisma/client");
const {
  fetchProductCollections,
} = require("./app/services/collections.server");
const { calculateBonusPoints } = require("./app/services/pointEvent.server");

const prisma = new PrismaClient();

async function analyzeRecentOrder() {
  try {
    console.log("🔍 ANALYZING MOST RECENT FULFILLED ORDER");
    console.log("=".repeat(50));

    // Get session for API access
    const sessions = await prisma.session.findMany({
      where: { isOnline: false },
      orderBy: { expires: "desc" },
      take: 1,
    });

    if (!sessions.length) {
      console.log("❌ No valid session found");
      return;
    }

    const session = sessions[0];
    console.log(`✅ Using session for shop: ${session.shop}`);

    // Create admin API client
    const { admin } = await authenticate.admin({
      session,
      isOnline: false,
    });

    // Fetch recent fulfilled orders
    console.log("\n📦 Fetching recent fulfilled orders...");
    const ordersResponse = await admin.graphql(`
      query getRecentOrders {
        orders(first: 5, query: "fulfillment_status:fulfilled") {
          edges {
            node {
              id
              name
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              createdAt
              fulfillmentStatus
              customer {
                id
                firstName
                lastName
                email
              }
              lineItems(first: 10) {
                edges {
                  node {
                    id
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                    product {
                      id
                      title
                      vendor
                      productType
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    const ordersData = await ordersResponse.json();
    const orders = ordersData.data?.orders?.edges || [];

    if (!orders.length) {
      console.log("❌ No fulfilled orders found");
      return;
    }

    // Analyze the most recent order
    const recentOrder = orders[0].node;
    const orderId = recentOrder.id.split("/").pop(); // Extract numeric ID
    const orderName = recentOrder.name;
    const totalAmount = parseFloat(recentOrder.totalPriceSet.shopMoney.amount);

    console.log(`\n🎯 ANALYZING ORDER: ${orderName}`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Total: $${totalAmount.toFixed(2)}`);
    console.log(
      `Customer: ${recentOrder.customer?.firstName} ${recentOrder.customer?.lastName} (${recentOrder.customer?.email})`,
    );
    console.log(`Created: ${recentOrder.createdAt}`);

    // Get line items
    const lineItems = recentOrder.lineItems.edges.map((edge) => edge.node);
    console.log(`\n🛍️ PRODUCTS IN ORDER (${lineItems.length} items):`);

    const productIds = [];
    lineItems.forEach((item, i) => {
      const productId = item.product.id.split("/").pop();
      const price = parseFloat(item.originalUnitPriceSet.shopMoney.amount);
      const lineTotal = price * item.quantity;

      console.log(`${i + 1}. ${item.title}`);
      console.log(`   Product ID: ${productId}`);
      console.log(
        `   Price: $${price.toFixed(2)} x ${item.quantity} = $${lineTotal.toFixed(2)}`,
      );
      console.log(`   Vendor: ${item.product.vendor || "N/A"}`);
      console.log(`   Type: ${item.product.productType || "N/A"}`);

      productIds.push(productId);
    });

    // Fetch product collections
    console.log(`\n🏷️ FETCHING PRODUCT COLLECTIONS...`);
    const productCollections = await fetchProductCollections(admin, productIds);

    console.log(`\nCOLLECTION MAPPING:`);
    Object.entries(productCollections).forEach(([productId, collections]) => {
      const product = lineItems.find(
        (item) => item.product.id.split("/").pop() === productId,
      );
      console.log(`${product?.title || productId}:`);
      if (collections.length > 0) {
        console.log(`  Collections: [${collections.join(", ")}]`);
      } else {
        console.log(`  Collections: None`);
      }
    });

    // Get current point events
    console.log(`\n🎯 CURRENT POINT EVENTS:`);
    const events = await prisma.pointEvent.findMany({
      where: { isActive: true },
    });

    events.forEach((event) => {
      console.log(`\n• ${event.name}`);
      console.log(`  Type: ${event.eventType}`);
      console.log(`  Bonus: ${event.bonusPercentage}%`);
      console.log(`  Start: ${event.startDate.toLocaleDateString()}`);
      console.log(`  End: ${event.endDate.toLocaleDateString()}`);

      if (event.collections) {
        const collections = JSON.parse(event.collections);
        console.log(`  Target Collections: [${collections.join(", ")}]`);
      }

      if (event.productIds) {
        const products = JSON.parse(event.productIds);
        console.log(`  Target Products: [${products.join(", ")}]`);
      }
    });

    // Simulate bonus calculation
    console.log(`\n🧮 SIMULATING BONUS CALCULATION:`);
    const orderLineItems = lineItems.map((item) => ({
      productId: item.product.id.split("/").pop(),
      price: parseFloat(item.originalUnitPriceSet.shopMoney.amount),
      quantity: item.quantity,
      collections: productCollections[item.product.id.split("/").pop()] || [],
    }));

    const bonusResult = await calculateBonusPoints({
      orderLineItems,
      isInstoreOrder: false,
    });

    console.log(`\nBONUS CALCULATION RESULT:`);
    console.log(`Total bonus points: ${bonusResult.totalBonusPoints}`);
    console.log(`Applied events: ${bonusResult.appliedEvents.length}`);

    bonusResult.appliedEvents.forEach((appliedEvent, i) => {
      const event = events.find((e) => e.id === appliedEvent.eventId);
      console.log(
        `  ${i + 1}. ${event?.name || "Unknown"}: +${appliedEvent.pointsAwarded} points`,
      );
    });

    // Check if this order has transactions in our database
    console.log(`\n💾 CHECKING DATABASE TRANSACTIONS:`);
    const transactions = await prisma.pointTransaction.findMany({
      where: { orderId: orderId },
      include: { event: true },
    });

    if (transactions.length > 0) {
      console.log(`Found ${transactions.length} transactions:`);
      transactions.forEach((tx, i) => {
        console.log(
          `  ${i + 1}. ${tx.type}: ${tx.amount} points (${tx.event?.name || "base points"})`,
        );
      });
    } else {
      console.log(`No transactions found for order ${orderId}`);
    }

    // Detailed breakdown for each qualifying product
    console.log(`\n📊 DETAILED BONUS BREAKDOWN:`);
    for (const event of events) {
      if (!event.isActive) continue;

      console.log(`\nEvent: ${event.name} (${event.bonusPercentage}% bonus)`);

      let eventTotal = 0;

      for (const lineItem of orderLineItems) {
        const product = lineItems.find(
          (item) => item.product.id.split("/").pop() === lineItem.productId,
        );
        const lineTotal = lineItem.price * lineItem.quantity;
        let qualifies = false;

        if (event.eventType === "store-wide") {
          qualifies = true;
        } else if (event.eventType === "collections" && event.collections) {
          const eventCollections = JSON.parse(event.collections);
          qualifies = lineItem.collections.some((col) =>
            eventCollections.includes(col),
          );
        } else if (event.eventType === "product-specific" && event.productIds) {
          const eventProducts = JSON.parse(event.productIds);
          qualifies = eventProducts.includes(lineItem.productId);
        }

        if (qualifies) {
          const bonus = (lineTotal * event.bonusPercentage) / 100;
          eventTotal += bonus;
          console.log(
            `  ✅ ${product?.title}: $${lineTotal.toFixed(2)} → +${bonus.toFixed(2)} points`,
          );
        } else {
          console.log(
            `  ❌ ${product?.title}: $${lineTotal.toFixed(2)} → Not eligible`,
          );
        }
      }

      if (eventTotal > 0) {
        console.log(
          `  📈 Event total: ${eventTotal.toFixed(2)} → ${Math.ceil(eventTotal)} points (rounded up)`,
        );
      } else {
        console.log(`  📈 Event total: 0 points`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRecentOrder();
