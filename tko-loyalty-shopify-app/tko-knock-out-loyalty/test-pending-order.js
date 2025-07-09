const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testPendingOrder() {
  try {
    console.log("Testing PendingOrder model...");

    // Try to query the PendingOrder table
    const count = await prisma.pendingOrder.count();
    console.log("✅ PendingOrder model exists, count:", count);
  } catch (error) {
    console.log("❌ PendingOrder model error:", error.message);

    // Check if it's a table not found error
    if (
      error.message.includes("does not exist") ||
      error.message.includes("pendingOrder")
    ) {
      console.log("🔧 Need to apply pending order migration");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testPendingOrder();
