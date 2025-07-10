const { PrismaClient } = require("@prisma/client");

async function diagnoseAlexBonusPoints() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Diagnosing Alex Pereira's bonus points...\n");

    // Find Alex Pereira by email
    const customer = await prisma.customer.findFirst({
      where: {
        email: "alexmikepereira@gmail.com",
      },
      include: {
        tier: true,
      },
    });

    if (!customer) {
      console.log("❌ Customer Alex Pereira not found");
      return;
    }

    console.log("👤 Customer Found:");
    console.log(`   ID: ${customer.id}`);
    console.log(`   Shopify ID: ${customer.shopifyId}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Name: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Total Spend: $${customer.totalSpend}`);
    console.log(`   Spend Points: ${customer.spendPoints}`);
    console.log(`   Bonus Points: ${customer.bonusPoints}`);
    console.log(`   Total Points: ${customer.totalPoints}`);
    console.log(`   Tier: ${customer.tier?.name || "None"}\n`);

    // Find all point transactions for this customer
    const transactions = await prisma.pointTransaction.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        event: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`💰 Point Transactions (${transactions.length} total):`);

    if (transactions.length === 0) {
      console.log("   No transactions found");
    } else {
      transactions.forEach((transaction, index) => {
        console.log(
          `   ${index + 1}. ${transaction.type.toUpperCase()}: ${transaction.amount} points`,
        );
        console.log(`      Order ID: ${transaction.orderId || "N/A"}`);
        console.log(`      Event: ${transaction.event?.name || "N/A"}`);
        console.log(`      Description: ${transaction.description || "N/A"}`);
        console.log(`      Created: ${transaction.createdAt}`);
        console.log("");
      });
    }

    // Calculate expected bonus points from transactions
    const bonusTransactions = transactions.filter((t) => t.type === "bonus");
    const calculatedBonusPoints = bonusTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    console.log("📊 Summary:");
    console.log(`   Bonus transactions: ${bonusTransactions.length}`);
    console.log(`   Calculated bonus points: ${calculatedBonusPoints}`);
    console.log(`   Customer bonus points: ${customer.bonusPoints}`);
    console.log(
      `   Match: ${calculatedBonusPoints === customer.bonusPoints ? "✅" : "❌"}`,
    );

    if (calculatedBonusPoints !== customer.bonusPoints) {
      console.log("\n🚨 MISMATCH DETECTED!");
      console.log(
        "   The customer's bonus points don't match their transactions.",
      );
      console.log("   This indicates the bonus points update is failing.");
    }
  } catch (error) {
    console.error("Error diagnosing bonus points:", error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAlexBonusPoints();
