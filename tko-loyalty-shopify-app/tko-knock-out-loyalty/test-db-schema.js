// Simple test to verify database schema and migration
// Run with: node test-db-schema.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabaseSchema() {
  console.log("🧪 Testing Database Schema...\n");

  try {
    // Test 1: Create a category-based event with tags
    console.log("1️⃣ Creating category-based event with tags...");
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
    console.log("   Tags:", categoryEvent.tags);

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
    console.log("   Product IDs:", productEvent.productIds);

    // Test 3: Retrieve and verify events
    console.log("\n3️⃣ Retrieving all events...");
    const allEvents = await prisma.pointEvent.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${allEvents.length} events:`);
    allEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name} (${event.eventType})`);
      if (event.tags) {
        console.log(`   Tags: ${event.tags}`);
      }
      if (event.productIds) {
        console.log(`   Product IDs: ${event.productIds}`);
      }
    });

    // Test 4: Test tag parsing
    console.log("\n4️⃣ Testing tag parsing...");
    const eventWithTags = allEvents.find((e) => e.tags);
    if (eventWithTags) {
      const parsedTags = JSON.parse(eventWithTags.tags);
      console.log("Parsed tags:", parsedTags);
      console.log("Tag type:", typeof parsedTags);
      console.log("Is array:", Array.isArray(parsedTags));
    }

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    await prisma.pointEvent.deleteMany({
      where: {
        name: {
          in: ["Pokemon Singles Bonus", "Special Product Bonus"],
        },
      },
    });
    console.log("✅ Test data cleaned up");

    console.log("\n✅ All database schema tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseSchema();
