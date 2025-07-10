/**
 * Check actual webhook registrations with Shopify
 */

import { authenticate } from "./app/shopify.server.ts";
import dotenv from "dotenv";

dotenv.config();

async function checkWebhookRegistrations() {
  console.log("🔍 CHECKING WEBHOOK REGISTRATIONS");
  console.log("=".repeat(50));
  console.log("");

  try {
    // Create a mock request object for authentication
    const mockRequest = {
      url: new URL("https://tkotoyco-loyalty-program.onrender.com"),
      headers: new Headers(),
    };

    // Get admin API client
    const { admin } = await authenticate.admin(mockRequest);

    console.log("📡 FETCHING WEBHOOK SUBSCRIPTIONS FROM SHOPIFY:");
    console.log("");

    // Query for webhook subscriptions
    const query = `
      query {
        webhookSubscriptions(first: 50) {
          edges {
            node {
              id
              topic
              callbackUrl
              format
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query);
    const data = await response.json();

    if (data.errors) {
      console.error("❌ GraphQL Errors:", data.errors);
      return;
    }

    const webhooks = data.data?.webhookSubscriptions?.edges || [];

    console.log(`📊 FOUND ${webhooks.length} WEBHOOK SUBSCRIPTIONS:`);
    console.log("");

    if (webhooks.length === 0) {
      console.log("❌ NO WEBHOOKS REGISTERED!");
      console.log("This explains why no orders are being processed.");
      console.log("");
      console.log("💡 SOLUTION:");
      console.log(
        "You need to register webhooks with Shopify. This should happen automatically",
      );
      console.log(
        "when the app is installed, but it seems like it didn't work.",
      );
      console.log("");
      console.log("Expected webhooks:");
      console.log(
        "  • orders/create -> https://tkotoyco-loyalty-program.onrender.com/webhooks/orders/create",
      );
      console.log(
        "  • orders/fulfilled -> https://tkotoyco-loyalty-program.onrender.com/webhooks/orders/fulfilled",
      );
      return;
    }

    // Display each webhook
    for (const { node: webhook } of webhooks) {
      console.log(`🔗 Webhook: ${webhook.topic}`);
      console.log(`   URL: ${webhook.callbackUrl}`);
      console.log(`   Format: ${webhook.format}`);
      console.log(`   Created: ${webhook.createdAt}`);
      console.log(`   Updated: ${webhook.updatedAt}`);
      console.log("");
    }

    // Check for the specific webhooks we need
    const orderCreateWebhook = webhooks.find(
      (w) => w.node.topic === "ORDERS_CREATE",
    );
    const orderFulfilledWebhook = webhooks.find(
      (w) => w.node.topic === "ORDERS_FULFILLED",
    );

    console.log("🎯 REQUIRED WEBHOOKS CHECK:");

    if (orderCreateWebhook) {
      console.log("✅ orders/create webhook is registered");
      console.log(`   URL: ${orderCreateWebhook.node.callbackUrl}`);
    } else {
      console.log("❌ orders/create webhook is NOT registered");
    }

    if (orderFulfilledWebhook) {
      console.log("✅ orders/fulfilled webhook is registered");
      console.log(`   URL: ${orderFulfilledWebhook.node.callbackUrl}`);
    } else {
      console.log("❌ orders/fulfilled webhook is NOT registered");
    }

    console.log("");

    // Check if URLs are correct
    const expectedBaseUrl = "https://tkotoyco-loyalty-program.onrender.com";

    if (orderCreateWebhook) {
      const expectedUrl = `${expectedBaseUrl}/webhooks/orders/create`;
      if (orderCreateWebhook.node.callbackUrl === expectedUrl) {
        console.log("✅ orders/create URL is correct");
      } else {
        console.log("❌ orders/create URL is incorrect");
        console.log(`   Expected: ${expectedUrl}`);
        console.log(`   Actual: ${orderCreateWebhook.node.callbackUrl}`);
      }
    }

    if (orderFulfilledWebhook) {
      const expectedUrl = `${expectedBaseUrl}/webhooks/orders/fulfilled`;
      if (orderFulfilledWebhook.node.callbackUrl === expectedUrl) {
        console.log("✅ orders/fulfilled URL is correct");
      } else {
        console.log("❌ orders/fulfilled URL is incorrect");
        console.log(`   Expected: ${expectedUrl}`);
        console.log(`   Actual: ${orderFulfilledWebhook.node.callbackUrl}`);
      }
    }

    console.log("");
    console.log("🔧 NEXT STEPS:");

    if (!orderCreateWebhook || !orderFulfilledWebhook) {
      console.log("1. Register missing webhooks");
      console.log("2. Check app installation process");
      console.log("3. Verify webhook registration code in your app");
    } else {
      console.log("1. Test webhook endpoints manually");
      console.log("2. Check Render.com logs for incoming webhook calls");
      console.log("3. Verify webhook processing logic");
    }
  } catch (error) {
    console.error("❌ Error checking webhook registrations:", error);
  }
}

// Run the check
checkWebhookRegistrations().catch(console.error);
