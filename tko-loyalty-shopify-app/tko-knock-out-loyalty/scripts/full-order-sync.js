import { PrismaClient } from "@prisma/client";
import { syncOrdersSince } from "../app/services/orderSync.server.js";

const prisma = new PrismaClient();

async function fullOrderSync() {
  try {
    console.log("🔄 Starting Full Order Sync Process...\n");

    // Step 1: Clear existing orders
    console.log("1️⃣ Clearing existing orders from database...");
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOrders.count} existing orders\n`);

    // Step 2: Clear existing point transactions and events
    console.log("2️⃣ Clearing existing point data...");
    const deletedTransactions = await prisma.pointTransaction.deleteMany({});
    const deletedEvents = await prisma.pointEvent.deleteMany({});
    console.log(
      `   ✅ Deleted ${deletedTransactions.count} point transactions`,
    );
    console.log(`   ✅ Deleted ${deletedEvents.count} point events\n`);

    // Step 3: Reset customer points and order counts
    console.log("3️⃣ Resetting customer points and order counts...");
    const updatedCustomers = await prisma.customer.updateMany({
      data: {
        totalPoints: 0,
        spendPoints: 0,
        bonusPoints: 0,
        unfulfilledPoints: 0,
        numberOfOrders: 0,
        totalSpend: "0",
        lastOrderDate: null,
      },
    });
    console.log(`   ✅ Reset ${updatedCustomers.count} customers\n`);

    // Step 4: Sync all orders from Shopify (from store opening)
    console.log("4️⃣ Starting full sync from Shopify...");
    console.log("   📅 Syncing from store opening (2020-01-01)...");

    // Start from a very early date to get all orders
    const storeOpeningDate = new Date("2020-01-01");

    // Note: You'll need to pass the admin context here
    // This script needs to be called from a route or with proper admin setup
    console.log("   ⚠️  This script needs to be called with admin context");
    console.log(
      "   💡 Use the 'Sync With Store' button in the admin dashboard instead",
    );
    console.log(
      "   💡 Or modify the orderSync service to start from store opening date\n",
    );

    console.log("✅ Full sync preparation completed!");
    console.log("📋 Next steps:");
    console.log("   1. Go to admin dashboard");
    console.log("   2. Click 'Sync With Store' button");
    console.log("   3. This will now sync ALL orders since database is empty");
  } catch (error) {
    console.error("❌ Error during full sync:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fullOrderSync();
