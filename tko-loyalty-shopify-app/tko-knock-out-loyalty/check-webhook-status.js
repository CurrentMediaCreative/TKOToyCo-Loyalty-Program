/**
 * Check webhook registration and recent order processing
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function checkWebhookStatus() {
  console.log("🔍 WEBHOOK STATUS CHECK");
  console.log("=".repeat(50));
  console.log("");

  try {
    // Check all transactions (not just last 7 days)
    console.log("📊 TRANSACTION OVERVIEW:");
    const allTransactions = await prisma.pointTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    console.log(`Total recent transactions: ${allTransactions.length}`);
    console.log("");

    // Group by date
    const transactionsByDate = {};
    for (const transaction of allTransactions) {
      const date = transaction.createdAt.toISOString().split("T")[0];
      if (!transactionsByDate[date]) {
        transactionsByDate[date] = 0;
      }
      transactionsByDate[date]++;
    }

    console.log("Transactions by date:");
    Object.entries(transactionsByDate).forEach(([date, count]) => {
      console.log(`  ${date}: ${count} transactions`);
    });
    console.log("");

    // Check all customers
    console.log("👥 CUSTOMER OVERVIEW:");
    const totalCustomers = await prisma.customer.count();
    const customersWithPoints = await prisma.customer.count({
      where: {
        totalPoints: {
          gt: 0,
        },
      },
    });

    console.log(`Total customers: ${totalCustomers}`);
    console.log(`Customers with points: ${customersWithPoints}`);
    console.log("");

    // Check recent customers
    const recentCustomers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log("Recent customers:");
    for (const customer of recentCustomers) {
      console.log(
        `  ${customer.firstName} ${customer.lastName} - ${customer.totalPoints || 0} points - Created: ${customer.createdAt.toISOString()}`,
      );
    }
    console.log("");

    // Check for any pending orders
    console.log("⏳ PENDING ORDERS:");
    const allPendingOrders = await prisma.pendingOrder.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(`Total pending orders: ${allPendingOrders.length}`);
    for (const pending of allPendingOrders) {
      console.log(
        `  Order ${pending.shopifyOrderId} - Customer ${pending.customerId} - Created: ${pending.createdAt.toISOString()}`,
      );
    }
    console.log("");

    // Check database connection and basic stats
    console.log("🗄️ DATABASE STATS:");
    const stats = await Promise.all([
      prisma.customer.count(),
      prisma.pointTransaction.count(),
      prisma.pointEvent.count(),
      prisma.pendingOrder.count(),
    ]);

    console.log(`Customers: ${stats[0]}`);
    console.log(`Point Transactions: ${stats[1]}`);
    console.log(`Point Events: ${stats[2]}`);
    console.log(`Pending Orders: ${stats[3]}`);
    console.log("");

    // Check if there are any transactions at all
    if (stats[1] === 0) {
      console.log("❌ CRITICAL ISSUE: No point transactions found!");
      console.log(
        "This means webhooks have never successfully processed any orders.",
      );
    } else if (stats[1] < 50) {
      console.log("⚠️ WARNING: Very few point transactions found.");
      console.log("This suggests webhooks are not processing most orders.");
    }

    console.log("");
    console.log("🔧 WEBHOOK TROUBLESHOOTING:");
    console.log("1. Check Render.com logs for webhook errors");
    console.log("2. Verify webhook URLs are accessible");
    console.log("3. Check if Shopify is sending webhooks");
    console.log("4. Test webhook endpoints manually");
  } catch (error) {
    console.error("❌ Error during webhook status check:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkWebhookStatus().catch(console.error);
