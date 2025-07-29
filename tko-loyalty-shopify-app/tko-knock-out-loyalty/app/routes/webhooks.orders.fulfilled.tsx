import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * Ultra-simplified webhook handler for debugging the 400 error
 * This removes ALL complex logic to isolate the exact failure point
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🚀 Ultra-simple webhook handler starting...");

  try {
    // Step 1: Test basic webhook authentication
    console.log("🔐 Testing basic webhook authentication...");
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log(
      `✅ Authentication successful - Shop: ${shop}, Topic: ${topic}`,
    );

    // Step 2: Basic payload check
    console.log("📋 Basic payload validation...");
    if (!payload) {
      throw new Error("No payload received");
    }

    const orderData = payload as any;
    console.log(`📦 Order received - ID: ${orderData.id}`);

    // Step 3: Return immediate success (no processing)
    console.log(
      "✅ Webhook processed successfully (no actual processing done)",
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Ultra-simple webhook processed",
        orderId: orderData.id,
        shop: shop,
        topic: topic,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("❌ Ultra-simple webhook failed:", error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Check for specific error types
    if (error && typeof error === "object") {
      if ("status" in error) {
        console.error(`HTTP Status: ${(error as any).status}`);
      }
      if ("response" in error) {
        const response = (error as any).response;
        console.error("Response details:", {
          status: response?.status,
          statusText: response?.statusText,
          headers: response?.headers,
          data: response?.data,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : typeof error,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
