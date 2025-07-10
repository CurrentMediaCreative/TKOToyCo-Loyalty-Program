/**
 * Test webhook system - check registration and simulate processing
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function testWebhookSystem() {
  console.log("🔧 TESTING WEBHOOK SYSTEM");
  console.log("=".repeat(50));
  console.log("");

  try {
    // 1. Check current point events
    console.log("📋 CHECKING POINT EVENTS:");
    const pointEvents = await prisma.pointEvent.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${pointEvents.length} active point events:`);
    for (const event of pointEvents) {
      console.log(`  • ${event.name}`);
      console.log(`    Collections: ${event.collections || "None"}`);
      console.log(`    Bonus: ${event.bonusPercentage}%`);
      console.log(`    Start: ${event.startDate.toISOString()}`);
      console.log(`    End: ${event.endDate.toISOString()}`);
      console.log(`    Active: ${event.isActive ? "Yes" : "No"}`);
      console.log("");
    }

    // 2. Check webhook endpoints
    console.log("🌐 WEBHOOK ENDPOINTS:");
    console.log("Expected webhook URLs:");
    console.log(
      "  • Order Created: https://tkotoyco-loyalty-program.onrender.com/webhooks/orders/create",
    );
    console.log(
      "  • Order Fulfilled: https://tkotoyco-loyalty-program.onrender.com/webhooks/orders/fulfilled",
    );
    console.log("");

    // 3. Check recent database activity
    console.log("📊 RECENT DATABASE ACTIVITY:");

    // Check recent customers
    const recentCustomers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log(`Recent customers (${recentCustomers.length}):`);
    for (const customer of recentCustomers) {
      console.log(
        `  • ${customer.firstName} ${customer.lastName} - ${customer.totalPoints} points`,
      );
      console.log(`    Created: ${customer.createdAt.toISOString()}`);
    }
    console.log("");

    // Check recent transactions
    const recentTransactions = await prisma.pointTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        customer: true,
        event: true,
      },
    });

    console.log(`Recent transactions (${recentTransactions.length}):`);
    for (const transaction of recentTransactions) {
      const customerName = `${transaction.customer.firstName} ${transaction.customer.lastName}`;
      const eventName = transaction.event?.name || "No event";
      console.log(
        `  • ${customerName}: ${transaction.amount} points (${transaction.type})`,
      );
      console.log(`    Event: ${eventName}`);
      console.log(`    Order: ${transaction.orderId || "N/A"}`);
      console.log(`    Created: ${transaction.createdAt.toISOString()}`);
    }
    console.log("");

    // 4. Test webhook processing logic
    console.log("🧪 TESTING WEBHOOK LOGIC:");

    // Create a mock order to test the logic
    const mockOrder = {
      id: 999999999,
      name: "#TEST-001",
      total_price: "50.00",
      test: false,
      created_at: new Date().toISOString(),
      customer: {
        id: 123456789,
        email: "test@example.com",
        first_name: "Test",
        last_name: "Customer",
        total_spent: "100.00",
      },
      line_items: [
        {
          id: "test-line-item",
          product_id: "test-product-123",
          variant_id: "test-variant-456",
          title: "Test Product",
          quantity: 1,
          price: "50.00",
          total_discount: "0.00",
          product_exists: true,
        },
      ],
      note: null,
    };

    console.log("Mock order created for testing:");
    console.log(`  Order: ${mockOrder.name} - $${mockOrder.total_price}`);
    console.log(
      `  Customer: ${mockOrder.customer.first_name} ${mockOrder.customer.last_name}`,
    );
    console.log(`  Products: ${mockOrder.line_items.length} items`);
    console.log("");

    // 5. Check if webhooks would process this order
    console.log("🎯 WEBHOOK PROCESSING SIMULATION:");

    // Check if any active events would apply
    const now = new Date();
    const applicableEvents = pointEvents.filter(
      (event) =>
        event.isActive && event.startDate <= now && event.endDate >= now,
    );

    console.log(`Events that would be checked: ${applicableEvents.length}`);
    for (const event of applicableEvents) {
      console.log(`  • ${event.name} (${event.bonusPercentage}% bonus)`);

      // Check if collections match (simplified check)
      if (event.collections) {
        console.log(
          `    Would check if products are in collections: ${event.collections}`,
        );
      } else {
        console.log(`    No collection filter - would apply to all products`);
      }
    }
    console.log("");

    // 6. Recommendations
    console.log("💡 RECOMMENDATIONS:");

    if (pointEvents.length === 0) {
      console.log("❌ No point events found - create some events first");
    } else if (applicableEvents.length === 0) {
      console.log("❌ No active events for current time period");
    } else {
      console.log("✅ Point events are configured and active");
    }

    if (recentTransactions.length === 0) {
      console.log("❌ No recent transactions - webhooks may not be working");
      console.log("   Check:");
      console.log("   1. Webhook registration in Shopify admin");
      console.log("   2. Render.com deployment logs");
      console.log("   3. Network connectivity to webhook URLs");
    } else {
      console.log(
        "✅ Recent transactions found - webhooks appear to be working",
      );
    }

    console.log("");
    console.log("🔍 NEXT STEPS:");
    console.log("1. Check Shopify admin webhook settings");
    console.log("2. Test webhook URLs manually");
    console.log("3. Check Render.com logs for webhook calls");
    console.log("4. Verify point events are properly configured");
  } catch (error) {
    console.error("❌ Error testing webhook system:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWebhookSystem().catch(console.error);
