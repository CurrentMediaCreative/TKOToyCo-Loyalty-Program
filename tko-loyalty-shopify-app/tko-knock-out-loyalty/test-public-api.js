/**
 * Test script for the public points calculation API
 * This tests the new public endpoint that doesn't require admin authentication
 */

const testCartLines = [
  {
    product_id: "123456789",
    variant_id: "987654321",
    title: "Pokemon Trading Card Booster Pack",
    quantity: 2,
    price: 15.99,
    product_type: "Trading Cards",
    tags: "pokemon,tcg,booster",
    variant_title: "Standard Booster",
  },
  {
    product_id: "111222333",
    variant_id: "444555666",
    title: "Single Card - Charizard",
    quantity: 1,
    price: 25.0,
    product_type: "Single Card",
    tags: "pokemon,single,rare",
    variant_title: "Near Mint",
  },
];

const testData = {
  cartLines: testCartLines,
  subtotal: 56.98, // (15.99 * 2) + 25.00
  customerId: "test-customer-123",
  shop: "82cc2c.myshopify.com",
};

async function testPublicAPI() {
  console.log("🧪 Testing Public Points Calculation API");
  console.log("==========================================");

  try {
    console.log("📦 Test Cart:");
    testCartLines.forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.title} (${item.quantity}x $${item.price})`,
      );
      console.log(`     Type: ${item.product_type}, Tags: ${item.tags}`);
    });
    console.log(`💰 Subtotal: $${testData.subtotal}`);
    console.log("");

    // Test the public API endpoint
    const response = await fetch(
      "https://tkotoyco-loyalty-program.onrender.com/api/public/calculate-points",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      },
    );

    console.log(`📡 Response Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log("✅ API Response:");
    console.log("================");
    console.log(`Success: ${result.success}`);
    console.log(`Spend Points: ${result.spendPoints}`);
    console.log(`Bonus Points: ${result.bonusPoints}`);
    console.log(`Total Points: ${result.totalPoints}`);
    console.log(`Bonus Eligible Amount: $${result.bonusEligibleAmount}`);
    console.log(`Active Events Count: ${result.activeEventsCount}`);

    if (result.appliedEvents && result.appliedEvents.length > 0) {
      console.log("\n🎉 Applied Events:");
      result.appliedEvents.forEach((event) => {
        console.log(
          `  - ${event.eventName}: +${event.bonusPoints} points (${event.bonusPercentage}% bonus)`,
        );
      });
    }

    // Validate expected behavior
    console.log("\n🔍 Validation:");
    console.log("==============");

    // Should exclude singles from bonus calculation
    const expectedBonusEligible = 15.99 * 2; // Only booster packs, not singles
    console.log(`Expected bonus eligible: $${expectedBonusEligible}`);
    console.log(`Actual bonus eligible: $${result.bonusEligibleAmount}`);

    if (Math.abs(result.bonusEligibleAmount - expectedBonusEligible) < 0.01) {
      console.log("✅ Singles exclusion working correctly");
    } else {
      console.log("❌ Singles exclusion not working as expected");
    }

    // Spend points should be 1:1 with subtotal
    const expectedSpendPoints = Math.floor(testData.subtotal);
    if (result.spendPoints === expectedSpendPoints) {
      console.log("✅ Spend points calculation correct");
    } else {
      console.log(
        `❌ Spend points incorrect. Expected: ${expectedSpendPoints}, Got: ${result.spendPoints}`,
      );
    }
  } catch (error) {
    console.error("❌ Test Failed:");
    console.error(error.message);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 Make sure the development server is running:");
      console.log("   cd tko-knock-out-loyalty");
      console.log("   npm run dev");
    }
  }
}

// Test CORS headers with OPTIONS request
async function testCORS() {
  console.log("\n🌐 Testing CORS Headers");
  console.log("=======================");

  try {
    const response = await fetch(
      "https://tkotoyco-loyalty-program.onrender.com/api/public/calculate-points",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://checkout.shopify.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type",
        },
      },
    );

    console.log(`OPTIONS Response Status: ${response.status}`);
    console.log("CORS Headers:");
    console.log(
      `  Access-Control-Allow-Origin: ${response.headers.get("Access-Control-Allow-Origin")}`,
    );
    console.log(
      `  Access-Control-Allow-Methods: ${response.headers.get("Access-Control-Allow-Methods")}`,
    );
    console.log(
      `  Access-Control-Allow-Headers: ${response.headers.get("Access-Control-Allow-Headers")}`,
    );

    if (response.headers.get("Access-Control-Allow-Origin") === "*") {
      console.log("✅ CORS configured correctly");
    } else {
      console.log("❌ CORS may not be configured properly");
    }
  } catch (error) {
    console.error("❌ CORS Test Failed:", error.message);
  }
}

// Run tests
async function runTests() {
  await testPublicAPI();
  await testCORS();

  console.log("\n🏁 Test Complete");
  console.log("================");
  console.log(
    "If all tests pass, the public API is ready for the checkout extension!",
  );
}

runTests();
