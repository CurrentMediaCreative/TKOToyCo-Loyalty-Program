// Test script for point events functionality
// Run with: node test-point-events.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testPointEvents() {
  console.log("🧪 Testing Point Events System...\n");

  try {
    // Test 1: Create a category-based event
    console.log("1️⃣ Creating category-based event (Pokemon + Single)...");
    const categoryEvent = await prisma.pointEvent.create({
      data: {
        name: "Pokemon Singles Bonus",
        description: "10% bonus on Pokemon single cards",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        eventType: "category",
        tags: JSON.stringify(["pokemon", "single"]),
        bonusPercentage: 10,
        isActive: true,
      },
    });
    console.log("✅ Category event created:", categoryEvent.name);

    // Test 2: Create a product-specific event
    console.log("\n2️⃣ Creating product-specific event...");
    const productEvent = await prisma.pointEvent.create({
      data: {
        name: "Special Product Bonus",
        description: "20% bonus on specific products",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        eventType: "product-specific",
        productIds: JSON.stringify(["prod_123", "prod_456"]),
        bonusPercentage: 20,
        isActive: true,
      },
    });
    console.log("✅ Product event created:", productEvent.name);

    // Test 3: Test tag matching logic
    console.log("\n3️⃣ Testing tag matching logic...");

    // Mock products for testing
    const testProducts = [
      {
        id: "prod_001",
        price: 50.0,
        tags: ["pokemon", "single", "charizard"], // Should qualify for Pokemon Singles event
      },
      {
        id: "prod_002",
        price: 30.0,
        tags: ["pokemon", "sealed"], // Should NOT qualify (missing 'single' tag)
      },
      {
        id: "prod_123",
        price: 25.0,
        tags: ["yugioh", "single"], // Should qualify for product-specific event
      },
      {
        id: "prod_999",
        price: 15.0,
        tags: ["magic", "single"], // Should NOT qualify for any event
      },
    ];

    // Import the calculation function
    const { calculateBonusPoints, doesProductQualifyForEvent } = await import(
      "./app/services/pointEvent.server.ts"
    );

    // Test individual product qualification
    console.log("\n🔍 Testing product qualification:");
    testProducts.forEach((product) => {
      const qualifiesForCategory = doesProductQualifyForEvent(
        product,
        categoryEvent,
      );
      const qualifiesForProduct = doesProductQualifyForEvent(
        product,
        productEvent,
      );
      console.log(
        `Product ${product.id}: Category=${qualifiesForCategory}, Product-specific=${qualifiesForProduct}`,
      );
    });

    // Test bonus calculation
    console.log("\n💰 Testing bonus calculation...");
    const result = await calculateBonusPoints({ products: testProducts });
    console.log("Bonus points calculated:", result.bonusPoints);
    console.log("Applied events:", result.appliedEvents);

    // Expected results:
    // - prod_001: 10% of $50 = 5 bonus points (Pokemon Singles event)
    // - prod_123: 20% of $25 = 5 bonus points (Product-specific event)
    // - Total expected: 10 bonus points

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPointEvents();
