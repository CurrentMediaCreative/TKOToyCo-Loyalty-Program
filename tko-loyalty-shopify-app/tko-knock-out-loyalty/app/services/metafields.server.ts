// Import the admin type from a local type definition
import type { Admin } from "../types";
import { getTierById } from "./tier.server";
import { getCustomers } from "./customer.server";

// Namespace for our loyalty program metafields
export const METAFIELD_NAMESPACE = "tko_loyalty";

// Metafield keys
export const METAFIELD_KEYS = {
  TIER_NAME: "tier_name",
  TIER_LEVEL: "tier_level",
  TOTAL_SPEND: "total_spend",
  TIER_BENEFITS: "tier_benefits",
};

/**
 * Helper function to get tier level based on tier name
 */
function getTierLevel(tierName: string): number {
  const tierLevels: Record<string, number> = {
    Featherweight: 1,
    Lightweight: 2,
    Welterweight: 3,
    Heavyweight: 4,
    "Reigning Champion": 5,
  };
  return tierLevels[tierName] || 1;
}

/**
 * Updates a customer's tier information as metafields in Shopify
 *
 * @param admin - Shopify Admin API context
 * @param shopifyCustomerId - Shopify customer ID (gid format or numeric)
 * @param tierId - Tier ID from our database
 * @param totalSpend - Customer's total spend amount
 * @returns Result of the metafield update operation
 */
export async function updateCustomerTierMetafields(
  admin: Admin,
  shopifyCustomerId: string | number,
  tierId: string,
  totalSpend: number,
) {
  try {
    // Get tier details from our database
    const tier = await getTierById(tierId);
    if (!tier) {
      throw new Error(`Tier with ID ${tierId} not found`);
    }

    // Format the customer ID for GraphQL
    const customerGid =
      typeof shopifyCustomerId === "string" &&
      shopifyCustomerId.startsWith("gid://")
        ? shopifyCustomerId
        : `gid://shopify/Customer/${shopifyCustomerId}`;

    // Get tier benefits as a list of strings
    const benefits = tier.benefits.map((benefit) => benefit.name);

    // Determine tier level based on tier name
    const tierLevel = getTierLevel(tier.name);

    // Create metafields using the Shopify Admin API
    const response = await admin.graphql(
      `#graphql
      mutation UpdateCustomerMetafields($input: MetafieldsSetInput!) {
        metafieldsSet(metafields: $input) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            ownerId: customerGid,
            metafields: [
              {
                namespace: METAFIELD_NAMESPACE,
                key: METAFIELD_KEYS.TIER_NAME,
                type: "single_line_text_field",
                value: tier.name,
              },
              {
                namespace: METAFIELD_NAMESPACE,
                key: METAFIELD_KEYS.TIER_LEVEL,
                type: "number_integer",
                value: tierLevel.toString(),
              },
              {
                namespace: METAFIELD_NAMESPACE,
                key: METAFIELD_KEYS.TOTAL_SPEND,
                type: "number_decimal",
                value: totalSpend.toString(),
              },
              {
                namespace: METAFIELD_NAMESPACE,
                key: METAFIELD_KEYS.TIER_BENEFITS,
                type: "list.single_line_text_field",
                value: JSON.stringify(benefits),
              },
            ],
          },
        },
      },
    );

    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    console.error("Error updating customer tier metafields:", error);
    throw error;
  }
}

/**
 * Bulk updates metafields for all customers in our database
 *
 * @param admin - Shopify Admin API context
 * @returns Summary of the bulk update operation
 */
export async function bulkUpdateAllCustomerMetafields(admin: Admin) {
  try {
    // Get all customers from our database
    const customers = await getCustomers();

    const results = {
      total: customers.length,
      successful: 0,
      failed: 0,
      errors: [] as { customerId: string; error: string }[],
    };

    // Process customers in batches to avoid rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE);

      // Process each customer in the batch
      const batchPromises = batch.map(async (customer) => {
        try {
          if (!customer.tierId) {
            throw new Error("Customer has no tier assigned");
          }

          await updateCustomerTierMetafields(
            admin,
            customer.shopifyId.toString(),
            customer.tierId,
            customer.totalSpend,
          );

          return { success: true };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            success: false,
            customerId: customer.id || "unknown",
            error: errorMessage,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      // Update summary
      results.successful += batchResults.filter((r) => r.success).length;

      const failures = batchResults.filter((r) => !r.success);
      results.failed += failures.length;
      // Add failures to the errors array
      for (const failure of failures) {
        results.errors.push({
          customerId: failure.customerId || "unknown",
          error: failure.error || "Unknown error",
        });
      }

      // Add a small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < customers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  } catch (error) {
    console.error("Error in bulk update of customer metafields:", error);
    throw error;
  }
}
