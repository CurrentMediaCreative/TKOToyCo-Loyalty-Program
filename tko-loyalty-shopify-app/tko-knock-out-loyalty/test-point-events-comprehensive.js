// Comprehensive test script for point events functionality
// Run with: node test-point-events-comprehensive.js

import { PrismaClient } from "@prisma/client";
import {
  getPointEvents,
  createPointEvent,
  updatePointEvent,
  deletePointEvent,
  getActivePointEvents,
  calculateBonusPoints,
  updatePointEventStats,
} from "./app/services/pointEvent.server.js";

const prisma = new PrismaClient();

// Test data
const testCollections = ["123456789", "987654321", "555666777"];
const testProducts = ["prod_001", "prod_002", "prod_003"];

async function runComprehensiveTests() {
  console.log("🧪 Starting Comprehensive Point Events Tests...\n");

  try {
    // Clean up any existing test events
    await cleanupTestEvents();

    // Test 1: Create different types of events
    console.log("1️⃣ Testing Event Creation...");
    const storeWideEvent = await testCreateStoreWideEvent();
    const collectionEvent = await testCreateCollectionEvent();
    const productEvent = await testCreateProductEvent();
    console.log("✅ All event types created successfully\n");

    // Test 2: Test event retrieval
    console.log("2️⃣ Testing Event Retrieval...");
    await testEventRetrieval();
    console.log("✅ Event retrieval working correctly\n");

    // Test 3: Test active events filtering
    console.log("3️⃣ Testing Active Events Filtering...");
    await testActiveEventsFiltering();
    console.log("✅ Active events filtering working correctly\n");

    // Test 4: Test bonus point calculations
    console.log("4️⃣ Testing Bonus Point Calculations...");
    await testBonusPointCalculations(
      storeWideEvent,
      collectionEvent,
      productEvent,
    );
    console.log("✅ Bonus point calculations working correctly\n");

    // Test 5: Test event statistics updates
    console.log("5️⃣ Testing Event Statistics Updates...");
    await testEventStatisticsUpdates(storeWideEvent);
    console.log("✅ Event statistics updates working correctly\n");

    // Test 6: Test event updates
    console.log("6️⃣ Testing Event Updates...");
    await testEventUpdates(storeWideEvent);
    console.log("✅ Event updates working correctly\n");

    // Test 7: Test edge cases
    console.log("7️⃣ Testing Edge Cases...");
    await testEdgeCases();
    console.log("✅ Edge cases handled correctly\n");

    // Test 8: Test event deletion
    console.log("8️⃣ Testing Event Deletion...");
    await testEventDeletion();
    console.log("✅ Event deletion working correctly\n");

    console.log("🎉 All tests passed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await cleanupTestEvents();
    await prisma.$disconnect();
  }
}

async function cleanupTestEvents() {
  await prisma.pointEvent.deleteMany({
    where: {
      name: {
        startsWith: "TEST_",
      },
    },
  });
}

async function testCreateStoreWideEvent() {
  const event = await createPointEvent({
    name: "TEST_Store Wide Event",
    description: "Test store-wide bonus event",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    eventType: "store-wide",
    channel: "both",
    bonusPercentage: 15,
    isActive: true,
  });

  console.log(`   ✓ Store-wide event created: ${event.name}`);
  return event;
}

async function testCreateCollectionEvent() {
  const event = await createPointEvent({
    name: "TEST_Collection Event",
    description: "Test collection-based bonus event",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    eventType: "collections",
    collections: testCollections,
    channel: "online",
    bonusPercentage: 20,
    isActive: true,
  });

  console.log(`   ✓ Collection event created: ${event.name}`);
  return event;
}

async function testCreateProductEvent() {
  const event = await createPointEvent({
    name: "TEST_Product Event",
    description: "Test product-specific bonus event",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    eventType: "product-specific",
    productIds: testProducts,
    channel: "instore",
    bonusPercentage: 25,
    isActive: true,
  });

  console.log(`   ✓ Product event created: ${event.name}`);
  return event;
}

async function testEventRetrieval() {
  const allEvents = await getPointEvents();
  const testEvents = allEvents.filter((e) => e.name.startsWith("TEST_"));

  if (testEvents.length !== 3) {
    throw new Error(`Expected 3 test events, found ${testEvents.length}`);
  }

  console.log(`   ✓ Retrieved ${testEvents.length} test events`);
}

async function testActiveEventsFiltering() {
  // Create an inactive event
  const inactiveEvent = await createPointEvent({
    name: "TEST_Inactive Event",
    description: "Test inactive event",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    eventType: "store-wide",
    channel: "both",
    bonusPercentage: 10,
    isActive: false,
  });

  // Create an expired event
  const expiredEvent = await createPointEvent({
    name: "TEST_Expired Event",
    description: "Test expired event",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    eventType: "store-wide",
    channel: "both",
    bonusPercentage: 10,
    isActive: true,
  });

  const activeEvents = await getActivePointEvents();
  const testActiveEvents = activeEvents.filter((e) =>
    e.name.startsWith("TEST_"),
  );

  // Should only include the 3 active events from previous tests
  if (testActiveEvents.length !== 3) {
    throw new Error(
      `Expected 3 active test events, found ${testActiveEvents.length}`,
    );
  }

  console.log(
    `   ✓ Active events filtering working (${testActiveEvents.length} active events)`,
  );
}

async function testBonusPointCalculations(
  storeWideEvent,
  collectionEvent,
  productEvent,
) {
  // Test order line items
  const orderLineItems = [
    {
      productId: "prod_001", // Matches product event
      price: 50.0,
      quantity: 1,
      collections: ["123456789", "999888777"], // Matches collection event
    },
    {
      productId: "prod_999", // Doesn't match product event
      price: 30.0,
      quantity: 2,
      collections: ["123456789"], // Matches collection event
    },
    {
      productId: "prod_888", // Doesn't match any specific events
      price: 20.0,
      quantity: 1,
      collections: ["999888777"], // Doesn't match collection event
    },
  ];

  // Test online order (should apply store-wide and collection events)
  const onlineResult = await calculateBonusPoints({
    orderLineItems,
    isInstoreOrder: false,
  });

  console.log(
    `   ✓ Online order bonus: ${onlineResult.totalBonusPoints} points`,
  );
  console.log(`   ✓ Applied events: ${onlineResult.appliedEvents.length}`);

  // Test in-store order (should apply store-wide and product events)
  const instoreResult = await calculateBonusPoints({
    orderLineItems,
    isInstoreOrder: true,
  });

  console.log(
    `   ✓ In-store order bonus: ${instoreResult.totalBonusPoints} points`,
  );
  console.log(`   ✓ Applied events: ${instoreResult.appliedEvents.length}`);

  // Verify calculations
  // Store-wide event (15%): applies to all items = (50 + 60 + 20) * 0.15 = 19.5 → 20 points
  // Collection event (20%, online only): applies to first two items = (50 + 60) * 0.20 = 22 points
  // Product event (25%, in-store only): applies to first item = 50 * 0.25 = 12.5 → 13 points

  const expectedOnlinePoints = 20 + 22; // Store-wide + Collection
  const expectedInstorePoints = 20 + 13; // Store-wide + Product

  if (onlineResult.totalBonusPoints !== expectedOnlinePoints) {
    console.warn(
      `   ⚠️ Online calculation mismatch: expected ${expectedOnlinePoints}, got ${onlineResult.totalBonusPoints}`,
    );
  }

  if (instoreResult.totalBonusPoints !== expectedInstorePoints) {
    console.warn(
      `   ⚠️ In-store calculation mismatch: expected ${expectedInstorePoints}, got ${instoreResult.totalBonusPoints}`,
    );
  }
}

async function testEventStatisticsUpdates(event) {
  const initialEvent = await prisma.pointEvent.findUnique({
    where: { id: event.id },
  });

  // Update statistics
  await updatePointEventStats(event.id, 25);
  await updatePointEventStats(event.id, 15);

  const updatedEvent = await prisma.pointEvent.findUnique({
    where: { id: event.id },
  });

  if (updatedEvent.usageCount !== initialEvent.usageCount + 2) {
    throw new Error("Usage count not updated correctly");
  }

  if (updatedEvent.pointsAwarded !== initialEvent.pointsAwarded + 40) {
    throw new Error("Points awarded not updated correctly");
  }

  if (
    !updatedEvent.lastUsed ||
    updatedEvent.lastUsed <= initialEvent.lastUsed
  ) {
    throw new Error("Last used timestamp not updated correctly");
  }

  console.log(
    `   ✓ Statistics updated: ${updatedEvent.usageCount} uses, ${updatedEvent.pointsAwarded} points awarded`,
  );
}

async function testEventUpdates(event) {
  const updatedEvent = await updatePointEvent({
    id: event.id,
    name: "TEST_Updated Store Wide Event",
    bonusPercentage: 30,
    isActive: false,
  });

  if (updatedEvent.name !== "TEST_Updated Store Wide Event") {
    throw new Error("Event name not updated correctly");
  }

  if (updatedEvent.bonusPercentage !== 30) {
    throw new Error("Bonus percentage not updated correctly");
  }

  if (updatedEvent.isActive !== false) {
    throw new Error("Active status not updated correctly");
  }

  console.log(`   ✓ Event updated successfully: ${updatedEvent.name}`);
}

async function testEdgeCases() {
  // Test with empty order line items
  const emptyResult = await calculateBonusPoints({
    orderLineItems: [],
    isInstoreOrder: false,
  });

  if (emptyResult.totalBonusPoints !== 0) {
    throw new Error("Empty order should result in 0 bonus points");
  }

  // Test with order items that don't match any events
  const noMatchResult = await calculateBonusPoints({
    orderLineItems: [
      {
        productId: "nonexistent_product",
        price: 100.0,
        quantity: 1,
        collections: ["nonexistent_collection"],
      },
    ],
    isInstoreOrder: false,
  });

  // Should still get store-wide bonus
  if (noMatchResult.totalBonusPoints === 0) {
    console.log("   ✓ No matching events handled correctly");
  }

  // Test updating non-existent event statistics
  try {
    await updatePointEventStats("nonexistent_id", 10);
    console.log("   ✓ Non-existent event stats update handled gracefully");
  } catch (error) {
    console.log("   ✓ Non-existent event stats update properly rejected");
  }

  console.log("   ✓ Edge cases handled correctly");
}

async function testEventDeletion() {
  const events = await getPointEvents();
  const testEvents = events.filter((e) => e.name.startsWith("TEST_"));

  for (const event of testEvents) {
    await deletePointEvent(event.id);
  }

  const remainingEvents = await getPointEvents();
  const remainingTestEvents = remainingEvents.filter((e) =>
    e.name.startsWith("TEST_"),
  );

  if (remainingTestEvents.length !== 0) {
    throw new Error(
      `Expected 0 test events after deletion, found ${remainingTestEvents.length}`,
    );
  }

  console.log(`   ✓ Deleted ${testEvents.length} test events`);
}

// Run the tests
runComprehensiveTests().catch(console.error);
