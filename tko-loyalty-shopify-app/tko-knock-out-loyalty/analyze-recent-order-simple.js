// Analyze recent order with product details
// Run with: node analyze-recent-order-simple.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fetchShopifyOrder() {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    console.log("❌ Missing Shopify credentials in .env file");
    console.log("Need: SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN");
    return null;
  }

  try {
    console.log(`🔍 Fetching recent orders from ${shopDomain}...`);

    const response = await fetch(
      `https://${shopDomain}/admin/api/2025-01/orders.json?limit=5&status=any&fulfillment_status=fulfilled`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Shopify API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      console.log("⚠️ No fulfilled orders found in Shopify");
      return null;
    }

    return orders[0]; // Return the most recent order
  } catch (error) {
    console.log("⚠️ Error fetching from Shopify:", error.message);
    return null;
  }
}

async function fetchProductCollections(productId, shopDomain, accessToken) {
  try {
    const response = await fetch(
      `https://${shopDomain}/admin/api/2025-01/products/${productId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.log(`⚠️ Could not fetch product ${productId}`);
      return [];
    }

    const data = await response.json();
    const product = data.product;

    // Fetch collections for this product
    const collectionsResponse = await fetch(
      `https://${shopDomain}/admin/api/2025-01/products/${productId}/collects.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!collectionsResponse.ok) {
      return [];
    }

    const collectsData = await collectionsResponse.json();
    const collectionIds = collectsData.collects.map((collect) =>
      collect.collection_id.toString(),
    );

    return {
      product,
      collectionIds,
    };
  } catch (error) {
    console.log(`⚠️ Error fetching product ${productId}:`, error.message);
    return [];
  }
}

async function analyzeRecentOrder() {
  console.log("🔍 ANALYZING MOST RECENT FULFILLED ORDER");
  console.log("=".repeat(50));

  try {
    // Step 1: Fetch recent order from Shopify
    const order = await fetchShopifyOrder();

    if (!order) {
      console.log("❌ Could not fetch order from Shopify");
      return;
    }

    const orderId = order.id.toString();
    const orderName = order.name;
    const totalAmount = parseFloat(order.total_price);

    console.log(`\n🎯 ANALYZING ORDER: ${orderName}`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Total: $${totalAmount.toFixed(2)}`);
    console.log(
      `Customer: ${order.customer?.first_name} ${order.customer?.last_name} (${order.customer?.email})`,
    );
    console.log(`Created: ${order.created_at}`);

    // Step 2: Get line items and fetch product details
    const lineItems = order.line_items || [];
    console.log(`\n🛍️ PRODUCTS IN ORDER (${lineItems.length} items):`);

    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    const productDetails = [];

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      const price = parseFloat(item.price);
      const lineTotal = price * item.quantity;

      console.log(`${i + 1}. ${item.title}`);
      console.log(`   Product ID: ${item.product_id}`);
      console.log(
        `   Price: $${price.toFixed(2)} x ${item.quantity} = $${lineTotal.toFixed(2)}`,
      );
      console.log(`   Vendor: ${item.vendor || "N/A"}`);

      if (item.product_id) {
        console.log(`   🔍 Fetching product details...`);
        const productInfo = await fetchProductCollections(
          item.product_id,
          shopDomain,
          accessToken,
        );

        if (productInfo.product) {
          console.log(
            `   Product Type: ${productInfo.product.product_type || "N/A"}`,
          );
          console.log(`   Tags: [${productInfo.product.tags || "None"}]`);
          console.log(
            `   Collections: [${productInfo.collectionIds.join(", ") || "None"}]`,
          );

          productDetails.push({
            lineItem: item,
            product: productInfo.product,
            collectionIds: productInfo.collectionIds,
            lineTotal,
          });
        }
      }
      console.log("");
    }

    // Step 3: Get current point events
    console.log(`🎯 CURRENT POINT EVENTS:`);
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

      if (event.tags) {
        const tags = JSON.parse(event.tags);
        console.log(`  Target Tags: [${tags.join(", ")}]`);
      }
    });

    // Step 4: Analyze bonus eligibility for each product
    console.log(`\n📊 DETAILED BONUS BREAKDOWN:`);

    let totalBonusPoints = 0;
    const appliedEvents = [];

    for (const event of events) {
      if (!event.isActive) continue;

      console.log(`\nEvent: ${event.name} (${event.bonusPercentage}% bonus)`);
      let eventTotal = 0;

      for (const productDetail of productDetails) {
        const { lineItem, product, collectionIds, lineTotal } = productDetail;
        let qualifies = false;

        if (event.eventType === "store-wide") {
          qualifies = true;
        } else if (event.eventType === "collections" && event.collections) {
          const eventCollections = JSON.parse(event.collections);
          qualifies = collectionIds.some((col) =>
            eventCollections.includes(col),
          );
        } else if (event.eventType === "product-specific" && event.productIds) {
          const eventProducts = JSON.parse(event.productIds);
          qualifies = eventProducts.includes(product.id.toString());
        } else if (event.eventType === "category" && event.tags) {
          const requiredTags = JSON.parse(event.tags);
          const productTags = product.tags
            ? product.tags.split(", ").map((tag) => tag.toLowerCase())
            : [];
          qualifies = requiredTags.every((requiredTag) =>
            productTags.includes(requiredTag.toLowerCase()),
          );
        }

        if (qualifies) {
          const bonus = (lineTotal * event.bonusPercentage) / 100;
          eventTotal += bonus;
          console.log(
            `  ✅ ${lineItem.title}: $${lineTotal.toFixed(2)} → +${bonus.toFixed(2)} points`,
          );
        } else {
          console.log(
            `  ❌ ${lineItem.title}: $${lineTotal.toFixed(2)} → Not eligible`,
          );
        }
      }

      if (eventTotal > 0) {
        const roundedEventTotal = Math.ceil(eventTotal);
        totalBonusPoints += roundedEventTotal;
        appliedEvents.push(event.name);
        console.log(
          `  📈 Event total: ${eventTotal.toFixed(2)} → ${roundedEventTotal} points (rounded up)`,
        );
      } else {
        console.log(`  📈 Event total: 0 points`);
      }
    }

    // Step 5: Check database transactions
    console.log(`\n💾 CHECKING DATABASE TRANSACTIONS:`);
    const transactions = await prisma.pointTransaction.findMany({
      where: { orderId: orderId },
      include: { event: true },
    });

    if (transactions.length > 0) {
      console.log(`Found ${transactions.length} transactions:`);
      let dbBasePoints = 0;
      let dbBonusPoints = 0;

      transactions.forEach((tx, i) => {
        console.log(
          `  ${i + 1}. ${tx.type}: ${tx.amount} points (${tx.event?.name || "base points"})`,
        );
        if (tx.eventId) {
          dbBonusPoints += tx.amount;
        } else {
          dbBasePoints += tx.amount;
        }
      });

      console.log(`\nDatabase Summary:`);
      console.log(`  Base points: ${dbBasePoints}`);
      console.log(`  Bonus points: ${dbBonusPoints}`);
      console.log(`  Total: ${dbBasePoints + dbBonusPoints}`);
    } else {
      console.log(`No transactions found for order ${orderId}`);
    }

    // Step 6: Final summary
    console.log(`\n🎯 ANALYSIS SUMMARY:`);
    console.log(`Order: ${orderName} ($${totalAmount.toFixed(2)})`);
    console.log(
      `Expected base points: ${Math.floor(totalAmount)} (rounded down)`,
    );
    console.log(`Expected bonus points: ${totalBonusPoints}`);
    console.log(
      `Expected total: ${Math.floor(totalAmount) + totalBonusPoints}`,
    );
    console.log(
      `Applied events: ${appliedEvents.length > 0 ? appliedEvents.join(", ") : "None"}`,
    );

    if (transactions.length > 0) {
      const dbTotal = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const expectedTotal = Math.floor(totalAmount) + totalBonusPoints;

      if (dbTotal === expectedTotal) {
        console.log(`✅ Database matches expected calculation!`);
      } else {
        console.log(
          `❌ Database mismatch! Expected: ${expectedTotal}, Got: ${dbTotal}`,
        );
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRecentOrder();
