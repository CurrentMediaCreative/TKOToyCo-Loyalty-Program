/**
 * Test script for the new customer loyalty API endpoint
 * Tests both customer-specific and guest scenarios
 */

const fetch = require("node-fetch");

// Configuration
const BASE_URL = "http://localhost:3000"; // Adjust if your app runs on a different port
const API_ENDPOINT = "/api/public/customer-loyalty";

async function testCustomerLoyaltyAPI() {
  console.log("🧪 Testing Customer Loyalty API Endpoint\n");

  // Test 1: Guest user (no customer email)
  console.log("📝 Test 1: Guest user with cart total");
  try {
    const response = await fetch(
      `${BASE_URL}${API_ENDPOINT}?cartTotal=150.00`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    console.log("✅ Guest user response:", JSON.stringify(data, null, 2));

    if (data.success && !data.customer && data.cartCalculation) {
      console.log(
        "✅ Guest user test passed - no customer data, cart calculation present\n",
      );
    } else {
      console.log(
        "❌ Guest user test failed - unexpected response structure\n",
      );
    }
  } catch (error) {
    console.log("❌ Guest user test failed:", error.message, "\n");
  }

  // Test 2: Customer with email (you'll need to replace with a real customer email from your database)
  console.log("📝 Test 2: Customer with email and cart total");
  try {
    const testEmail = "test@example.com"; // Replace with a real customer email from your database
    const response = await fetch(
      `${BASE_URL}${API_ENDPOINT}?cartTotal=200.00&customerEmail=${encodeURIComponent(testEmail)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    console.log("✅ Customer response:", JSON.stringify(data, null, 2));

    if (data.success && data.cartCalculation) {
      if (data.customer) {
        console.log(
          "✅ Customer found test passed - customer data and cart calculation present\n",
        );
      } else {
        console.log(
          "⚠️  Customer not found (email may not exist in database) but API working correctly\n",
        );
      }
    } else {
      console.log("❌ Customer test failed - unexpected response structure\n");
    }
  } catch (error) {
    console.log("❌ Customer test failed:", error.message, "\n");
  }

  // Test 3: Invalid cart total
  console.log("📝 Test 3: Invalid cart total");
  try {
    const response = await fetch(
      `${BASE_URL}${API_ENDPOINT}?cartTotal=invalid`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    console.log(
      "✅ Invalid cart total response:",
      JSON.stringify(data, null, 2),
    );

    if (!data.success && data.error) {
      console.log(
        "✅ Invalid cart total test passed - error handled correctly\n",
      );
    } else {
      console.log("❌ Invalid cart total test failed - should return error\n");
    }
  } catch (error) {
    console.log("❌ Invalid cart total test failed:", error.message, "\n");
  }

  // Test 4: Zero cart total
  console.log("📝 Test 4: Zero cart total");
  try {
    const response = await fetch(`${BASE_URL}${API_ENDPOINT}?cartTotal=0`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("✅ Zero cart total response:", JSON.stringify(data, null, 2));

    if (
      data.success &&
      data.cartCalculation &&
      data.cartCalculation.totalPoints === 0
    ) {
      console.log(
        "✅ Zero cart total test passed - returns zero points correctly\n",
      );
    } else {
      console.log("❌ Zero cart total test failed - unexpected response\n");
    }
  } catch (error) {
    console.log("❌ Zero cart total test failed:", error.message, "\n");
  }

  // Test 5: CORS preflight (OPTIONS request)
  console.log("📝 Test 5: CORS preflight request");
  try {
    const response = await fetch(`${BASE_URL}${API_ENDPOINT}`, {
      method: "OPTIONS",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ CORS preflight response status:", response.status);
    console.log("✅ CORS headers:", {
      "Access-Control-Allow-Origin": response.headers.get(
        "Access-Control-Allow-Origin",
      ),
      "Access-Control-Allow-Methods": response.headers.get(
        "Access-Control-Allow-Methods",
      ),
      "Access-Control-Allow-Headers": response.headers.get(
        "Access-Control-Allow-Headers",
      ),
    });

    if (response.status === 200) {
      console.log("✅ CORS preflight test passed\n");
    } else {
      console.log("❌ CORS preflight test failed - unexpected status\n");
    }
  } catch (error) {
    console.log("❌ CORS preflight test failed:", error.message, "\n");
  }

  console.log("🏁 API testing complete!");
  console.log("\n📋 To test with real customer data:");
  console.log("1. Check your database for existing customer emails");
  console.log('2. Replace "test@example.com" in this script with a real email');
  console.log("3. Ensure you have active point events in your database");
  console.log("4. Run this script again to see customer-specific results");
}

// Helper function to get a real customer email from database (optional)
async function getTestCustomerEmail() {
  console.log("🔍 Fetching a real customer email from database...");
  try {
    const response = await fetch(`${BASE_URL}/api/customers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.customers && data.customers.length > 0) {
        const customer = data.customers[0];
        console.log(`✅ Found test customer: ${customer.email || "No email"}`);
        return customer.email;
      }
    }
  } catch (error) {
    console.log("⚠️  Could not fetch customer data:", error.message);
  }
  return null;
}

// Run the tests
if (require.main === module) {
  testCustomerLoyaltyAPI().catch(console.error);
}

module.exports = { testCustomerLoyaltyAPI, getTestCustomerEmail };
