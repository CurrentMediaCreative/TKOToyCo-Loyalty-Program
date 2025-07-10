/**
 * Verify webhook subscriptions are properly registered with Shopify
 */

import { authenticate } from "./app/shopify.server.js";

async function verifyWebhooks() {
  console.log("🔍 VERIFYING WEBHOOK SUBSCRIPTIONS");
  console.log("==================================================");

  try {
    // We need to simulate a request to use the authenticate function
    // This is a bit of a hack but necessary for testing
    const mockRequest = new Request("https://example.com", {
      method: "GET",
      headers: {
        "X-Shopify-Shop-Domain": "82cc2c.myshopify.com",
      },
    });

    // Get admin API client
    const { admin } = await authenticate.admin(mockRequest);

    // Query webhook subscriptions
    const response = await admin.graphql(`
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
    `);

    const data = await response.json();
    const webhooks = data.data?.webhookSubscriptions?.edges || [];

    console.log(`📋 Found ${webhooks.length} webhook subscriptions:`);

    if (webhooks.length === 0) {
      console.log("❌ NO WEBHOOKS FOUND! This is the problem.");
      console.log(
        "   Shopify is not sending webhooks because none are registered.",
      );
      return;
    }

    webhooks.forEach((webhook, index) => {
      const node = webhook.node;
      console.log(`\n${index + 1}. Topic: ${node.topic}`);
      console.log(`   URL: ${node.callbackUrl}`);
      console.log(`   Format: ${node.format}`);
      console.log(`   Created: ${node.createdAt}`);
      console.log(`   Updated: ${node.updatedAt}`);
    });

    // Check specifically for order webhooks
    const orderWebhooks = webhooks.filter(
      (w) =>
        w.node.topic === "ORDERS_CREATE" || w.node.topic === "ORDERS_FULFILLED",
    );

    console.log(`\n🛒 Order-related webhooks: ${orderWebhooks.length}`);

    if (orderWebhooks.length === 0) {
      console.log("❌ NO ORDER WEBHOOKS FOUND!");
      console.log("   This explains why point events are not triggering.");
      console.log("   The app deployment did not register the order webhooks.");
    } else {
      console.log("✅ Order webhooks are registered");
      orderWebhooks.forEach((webhook) => {
        console.log(`   • ${webhook.node.topic}: ${webhook.node.callbackUrl}`);
      });
    }
  } catch (error) {
    console.error("❌ Error verifying webhooks:", error);

    if (error.message?.includes("shop parameter is missing")) {
      console.log(
        "\n💡 This error is expected when running outside of Shopify context.",
      );
      console.log(
        "   Try running this from within the app or check the Partner Dashboard.",
      );
    }
  }
}

verifyWebhooks().catch(console.error);
