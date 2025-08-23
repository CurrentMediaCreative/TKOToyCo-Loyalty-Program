import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearOrdersOnly() {
  try {
    console.log("🧹 Clearing Orders Only (Preserving Customer Data)...\n");

    // Step 1: Clear orders
    console.log("1️⃣ Deleting all orders...");
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOrders.count} orders\n`);

    // Step 2: Clear point transactions and events
    console.log("2️⃣ Clearing point transactions and events...");
    const deletedTransactions = await prisma.pointTransaction.deleteMany({});
    const deletedEvents = await prisma.pointEvent.deleteMany({});
    console.log(
      `   ✅ Deleted ${deletedTransactions.count} point transactions`,
    );
    console.log(`   ✅ Deleted ${deletedEvents.count} point events\n`);

    // Step 3: Show what's preserved
    console.log("3️⃣ Verifying preserved data...");
    const customerCount = await prisma.customer.count();
    const tierCount = await prisma.tier.count();
    const benefitCount = await prisma.tierBenefit.count();

    console.log(`   ✅ Preserved ${customerCount} customers`);
    console.log(`   ✅ Preserved ${tierCount} tiers`);
    console.log(`   ✅ Preserved ${benefitCount} tier benefits\n`);

    console.log("✅ Orders cleared successfully!");
    console.log("📋 What was cleared:");
    console.log("   - All orders");
    console.log("   - All point transactions");
    console.log("   - All point events");
    console.log("   - Customer order counts and spending totals");

    console.log("\n📋 What was preserved:");
    console.log("   - All customer data (names, emails, points)");
    console.log("   - All tier configurations and benefits");
    console.log("   - All other app data");

    console.log("\n💡 Next steps:");
    console.log("   1. Go to admin dashboard");
    console.log("   2. Click 'Sync With Store' button");
    console.log(
      "   3. Since no orders exist, it should sync ALL orders from Shopify",
    );
    console.log(
      "   4. This will pull thousands of historical orders if they exist in Shopify",
    );
  } catch (error) {
    console.error("❌ Error clearing orders:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearOrdersOnly();
