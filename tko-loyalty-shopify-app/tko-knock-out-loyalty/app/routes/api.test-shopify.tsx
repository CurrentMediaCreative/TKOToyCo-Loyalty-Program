import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    console.log("🧪 Testing Shopify API connection...");
    const startTime = Date.now();

    // Same GraphQL query that's hanging in the sync
    const response = await Promise.race([
      admin.graphql(`
        query GetHighestOrderNumber {
          orders(first: 1, sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                number
                createdAt
                id
              }
            }
          }
        }
      `),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Test timeout after 10 seconds")),
          10000,
        ),
      ),
    ]);

    const duration = Date.now() - startTime;
    console.log(`✅ Shopify API call completed in ${duration}ms`);

    const data = await (response as Response).json();
    console.log("📊 Response data:", JSON.stringify(data, null, 2));

    return json({
      success: true,
      duration: `${duration}ms`,
      highestOrder: data.data?.orders?.edges?.[0]?.node?.number,
      orderDate: data.data?.orders?.edges?.[0]?.node?.createdAt,
      orderId: data.data?.orders?.edges?.[0]?.node?.id,
      hasErrors: !!data.errors,
      errors: data.errors || null,
      message: `API call successful in ${duration}ms. Highest order: #${data.data?.orders?.edges?.[0]?.node?.number}`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Shopify API test failed:", errorMessage);

    return json(
      {
        success: false,
        error: errorMessage,
        type: error instanceof Error ? error.constructor.name : "Unknown",
        message: `API test failed: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
};

// Also support GET for easy browser testing
export const loader = async ({ request }: ActionFunctionArgs) => {
  return json({
    message: "Use POST to test Shopify API connection",
    endpoint: "/api/test-shopify",
    method: "POST",
  });
};
