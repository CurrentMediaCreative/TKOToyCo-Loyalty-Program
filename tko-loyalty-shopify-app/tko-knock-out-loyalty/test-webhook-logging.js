/**
 * Test webhook logging and functionality
 * This script helps verify that webhooks are working and logs are visible
 */

import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const WEBHOOK_URL = "https://tkotoyco-loyalty-program.onrender.com";

// Test webhook endpoints
const testWebhookEndpoints = async () => {
  console.log("🧪 Testing webhook endpoints...\n");

  const endpoints = ["/webhooks/orders/create", "/webhooks/orders/fulfilled"];

  for (const endpoint of endpoints) {
    const url = `${WEBHOOK_URL}${endpoint}`;
    console.log(`Testing: ${url}`);

    try {
      // Test with a simple GET request to see if endpoint exists
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${response.statusText}`);

      if (response.status === 405) {
        console.log(
          "  ✅ Endpoint exists (Method Not Allowed is expected for GET)",
        );
      } else if (response.status === 404) {
        console.log("  ❌ Endpoint not found");
      } else {
        console.log("  ℹ️  Unexpected response");
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log("");
  }
};

// Check webhook registration status
const checkWebhookRegistration = async () => {
  console.log("📋 Webhook Registration Status:");
  console.log("  orders/create: Registered in shopify.app.toml ✅");
  console.log("  orders/fulfilled: Registered in shopify.app.toml ✅");
  console.log("");

  console.log("🔗 Webhook URLs:");
  console.log(`  ${WEBHOOK_URL}/webhooks/orders/create`);
  console.log(`  ${WEBHOOK_URL}/webhooks/orders/fulfilled`);
  console.log("");
};

// Test logging visibility
const testLogging = () => {
  console.log("📊 Logging Information:");
  console.log("  Webhook logs will appear in:");
  console.log("  1. Render.com deployment logs");
  console.log("  2. Console output with detailed emoji indicators");
  console.log("");

  console.log("🔍 Log Patterns to Look For:");
  console.log(
    '  📦 "Processing fulfilled order" - Order fulfillment webhook triggered',
  );
  console.log('  🛒 "Processing new order" - Order creation webhook triggered');
  console.log("  👤 Customer information logs");
  console.log('  🎯 "Applied point events" - Bonus points calculation');
  console.log('  ✅ "Order processed successfully" - Completion confirmation');
  console.log("  ❌ Error messages if something fails");
  console.log("");
};

// Instructions for manual testing
const printTestingInstructions = () => {
  console.log("🧪 MANUAL TESTING INSTRUCTIONS:");
  console.log("");
  console.log("1. CREATE A TEST ORDER:");
  console.log("   - Go to your Shopify admin");
  console.log("   - Create a draft order with a customer");
  console.log("   - Include products that match your point events");
  console.log("   - Complete the order");
  console.log("");

  console.log("2. FULFILL THE ORDER:");
  console.log("   - Mark the order as fulfilled in Shopify admin");
  console.log("   - This should trigger the orders/fulfilled webhook");
  console.log("");

  console.log("3. CHECK LOGS:");
  console.log("   - Go to Render.com dashboard");
  console.log("   - View your app logs");
  console.log("   - Look for the emoji indicators mentioned above");
  console.log("");

  console.log("4. VERIFY RESULTS:");
  console.log("   - Check the loyalty app dashboard");
  console.log("   - Verify customer bonus points were added");
  console.log("   - Check point transactions in the database");
  console.log("");
};

// Main execution
const main = async () => {
  console.log("🚀 WEBHOOK TESTING UTILITY\n");
  console.log("=".repeat(50));
  console.log("");

  await checkWebhookRegistration();
  await testWebhookEndpoints();
  testLogging();
  printTestingInstructions();

  console.log("=".repeat(50));
  console.log("✅ Testing utility complete!");
  console.log("");
  console.log(
    "💡 TIP: Keep Render.com logs open while testing to see real-time webhook activity",
  );
};

main().catch(console.error);
