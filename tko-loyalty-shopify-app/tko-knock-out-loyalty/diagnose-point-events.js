/**
 * Comprehensive Point Event System Diagnostic
 * This script will help identify why point events aren't triggering
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function diagnosePointEventSystem() {
  console.log("🔍 POINT EVENT SYSTEM DIAGNOSTIC");
  console.log("=".repeat(50));
  console.log("");

  try {
    // 1. Check active point events
    console.log("📅 CHECKING ACTIVE POINT EVENTS:");
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    console.log("");

    const allEvents = await prisma.pointEvent.findMany({
      orderBy: { startDate: "desc" },
    });

    console.log(`Total point events in database: ${allEvents.length}`);
    console.log("");

    if (allEvents.length === 0) {
      console.log("❌ NO POINT EVENTS FOUND!");
      console.log("This is why no bonus points are being awarded.");
      console.log("You need to create point events in the admin dashboard.");
      return;
    }

    // Check each event's status
    for (const event of allEvents) {
      const isActive = event.isActive;
      const isInDateRange = event.startDate <= now && event.endDate >= now;
      const shouldBeActive = isActive && isInDateRange;

      console.log(`📋 Event: "${event.name}"`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Type: ${event.eventType}`);
      console.log(`   Channel: ${event.channel}`);
      console.log(`   Bonus: ${event.bonusPercentage}%`);
      console.log(`   Start: ${event.startDate.toISOString()}`);
      console.log(`   End: ${event.endDate.toISOString()}`);
      console.log(`   Is Active Flag: ${isActive ? "✅" : "❌"}`);
      console.log(`   In Date Range: ${isInDateRange ? "✅" : "❌"}`);
      console.log(`   Should Trigger: ${shouldBeActive ? "✅" : "❌"}`);

      if (event.collections) {
        const collections = JSON.parse(event.collections);
        console.log(`   Collections: [${collections.join(", ")}]`);
      }

      if (event.productIds) {
        const productIds = JSON.parse(event.productIds);
        console.log(`   Product IDs: [${productIds.join(", ")}]`);
      }

      console.log(`   Usage Count: ${event.usageCount || 0}`);
      console.log(`   Points Awarded: ${event.pointsAwarded || 0}`);
      console.log(`   Last Used: ${event.lastUsed || "Never"}`);
      console.log("");
    }

    // 2. Check recent orders and transactions
    console.log("📦 CHECKING RECENT ORDERS:");
    const recentTransactions = await prisma.pointTransaction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        customer: true,
        event: true,
      },
    });

    console.log(
      `Recent transactions (last 7 days): ${recentTransactions.length}`,
    );
    console.log("");

    for (const transaction of recentTransactions) {
      console.log(`💰 Transaction: ${transaction.id}`);
      console.log(
        `   Customer: ${transaction.customer.firstName} ${transaction.customer.lastName}`,
      );
      console.log(`   Type: ${transaction.type}`);
      console.log(`   Amount: ${transaction.amount} points`);
      console.log(`   Order ID: ${transaction.orderId || "N/A"}`);
      console.log(`   Event: ${transaction.event?.name || "Base points"}`);
      console.log(`   Created: ${transaction.createdAt.toISOString()}`);
      console.log(`   Description: ${transaction.description}`);
      console.log("");
    }

    // 3. Check pending orders
    console.log("⏳ CHECKING PENDING ORDERS:");
    const pendingOrders = await prisma.pendingOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log(`Pending orders: ${pendingOrders.length}`);
    console.log("");

    for (const pending of pendingOrders) {
      console.log(`📋 Pending Order: ${pending.shopifyOrderId}`);
      console.log(`   Customer ID: ${pending.customerId}`);
      console.log(`   Created: ${pending.createdAt.toISOString()}`);
      console.log("");
    }

    // 4. Check customers with recent activity
    console.log("👥 CHECKING RECENT CUSTOMERS:");
    const recentCustomers = await prisma.customer.findMany({
      where: {
        lastOrderDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { lastOrderDate: "desc" },
      take: 5,
    });

    console.log(
      `Customers with orders in last 7 days: ${recentCustomers.length}`,
    );
    console.log("");

    for (const customer of recentCustomers) {
      console.log(`👤 Customer: ${customer.firstName} ${customer.lastName}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Shopify ID: ${customer.shopifyId}`);
      console.log(`   Points: ${customer.points}`);
      console.log(`   Total Spend: $${customer.totalSpend}`);
      console.log(`   Last Order: ${customer.lastOrderDate?.toISOString()}`);
      console.log("");
    }

    // 5. Summary and recommendations
    console.log("📊 DIAGNOSTIC SUMMARY:");
    console.log("=".repeat(30));

    const activeEvents = allEvents.filter(
      (event) =>
        event.isActive && event.startDate <= now && event.endDate >= now,
    );

    if (activeEvents.length === 0) {
      console.log("❌ ISSUE FOUND: No active point events");
      console.log("   - Check event dates and active status");
      console.log("   - Ensure events are properly configured");
    } else {
      console.log(`✅ Active events: ${activeEvents.length}`);
    }

    if (recentTransactions.length === 0) {
      console.log("❌ ISSUE FOUND: No recent transactions");
      console.log("   - Webhooks might not be triggering");
      console.log("   - Check Render.com logs for webhook activity");
    } else {
      console.log(`✅ Recent transactions: ${recentTransactions.length}`);
    }

    if (pendingOrders.length > 0) {
      console.log(`⚠️  Pending orders: ${pendingOrders.length}`);
      console.log("   - These orders are waiting for fulfillment");
    }

    console.log("");
    console.log("🔧 NEXT STEPS:");
    if (activeEvents.length === 0) {
      console.log("1. Create or activate point events in the admin dashboard");
      console.log("2. Ensure event dates include today's date");
    }
    if (recentTransactions.length === 0) {
      console.log("3. Test with a new order to see if webhooks trigger");
      console.log("4. Check Render.com logs for webhook activity");
    }
    console.log("5. Monitor logs during order creation and fulfillment");
  } catch (error) {
    console.error("❌ Error during diagnostic:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnostic
diagnosePointEventSystem().catch(console.error);
