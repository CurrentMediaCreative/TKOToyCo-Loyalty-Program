// Import the admin type from a local type definition
import type { Admin } from "../types";
import { getTierById, getTiers } from "./tier.server";

// Namespace for our loyalty program metafields
export const METAFIELD_NAMESPACE = "tko_loyalty";

// Metafield keys
export const METAFIELD_KEYS = {
  TIER_NAME: "tier_name",
  TIER_LEVEL: "tier_level",
  TOTAL_SPEND: "total_spend",
  SPEND_POINTS: "spend_points",
  BONUS_POINTS: "bonus_points",
  TOTAL_POINTS: "total_points",
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
 * @param spendPoints - Points earned from spending
 * @param bonusPoints - Bonus points awarded
 * @param totalPoints - Total points (spend + bonus)
 * @returns Result of the metafield update operation
 */
export async function updateCustomerTierMetafields(
  admin: Admin,
  shopifyCustomerId: string | number,
  tierId: string,
  totalSpend: number,
  spendPoints: number = totalSpend, // Default to totalSpend if not provided
  bonusPoints: number = 0,
  totalPoints: number = spendPoints + bonusPoints, // Default to sum if not provided
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
    const benefits = tier.benefits.map((benefit: any) => benefit.name);

    // Determine tier level based on tier name
    const tierLevel = getTierLevel(tier.name);

    // Create metafields using the Shopify Admin API
    const response = await admin.graphql(
      `#graphql
      mutation UpdateCustomerMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
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
          metafields: [
            {
              ownerId: customerGid,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEYS.TIER_NAME,
              type: "single_line_text_field",
              value: tier.name,
            },
            {
              ownerId: customerGid,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEYS.TIER_LEVEL,
              type: "number_integer",
              value: tierLevel.toString(),
            },
            {
              ownerId: customerGid,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEYS.TOTAL_SPEND,
              type: "number_decimal",
              value: totalSpend.toString(),
            },
            {
              ownerId: customerGid,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEYS.SPEND_POINTS,
              type: "number_decimal",
              value: spendPoints.toString(),
            },
            {
              ownerId: customerGid,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEYS.BONUS_POINTS,
              type: "number_decimal",
              value: bonusPoints.toString(),
            },
            {
              ownerId: customerGid,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEYS.TOTAL_POINTS,
              type: "number_decimal",
              value: totalPoints.toString(),
            },
            {
              ownerId: customerGid,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEYS.TIER_BENEFITS,
              type: "list.single_line_text_field",
              value: JSON.stringify(benefits),
            },
          ],
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
 * Bulk updates metafields for all customers in Shopify
 *
 * @param admin - Shopify Admin API context
 * @returns Summary of the bulk update operation
 */
export async function bulkUpdateAllCustomerMetafields(admin: Admin) {
  try {
    // Function to fetch all customers using cursor-based pagination
    async function fetchAllCustomers() {
      let allCustomers: any[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;
      let pageCount = 0;
      const MAX_PAGES = 20; // Safety limit to prevent infinite loops
      const PER_PAGE = 50; // Reduced for better handling with metafields

      while (hasNextPage && pageCount < MAX_PAGES) {
        // Build the query with or without cursor
        const queryVariables: { first: number; after?: string } = cursor
          ? { first: PER_PAGE, after: cursor }
          : { first: PER_PAGE };

        const response: any = await admin.graphql(
          `#graphql
            query GetCustomers($first: Int!, $after: String) {
              customers(first: $first, after: $after) {
                edges {
                  node {
                    id
                    firstName
                    lastName
                    email
                    numberOfOrders
                    amountSpent {
                      amount
                    }
                    tags
                  }
                  cursor
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }`,
          { variables: queryVariables },
        );

        const responseJson: any = await response.json();
        const customersData: any = responseJson.data?.customers;

        if (!customersData) {
          console.error("No customer data returned from API");
          break;
        }

        // Extract customers from this page
        const pageCustomers = customersData.edges.map((edge: any) => edge.node);
        allCustomers = [...allCustomers, ...pageCustomers];

        // Update pagination info for next iteration
        hasNextPage = customersData.pageInfo.hasNextPage;
        cursor = customersData.pageInfo.endCursor;
        pageCount++;

        console.log(
          `Fetched page ${pageCount} with ${pageCustomers.length} customers. Total: ${allCustomers.length}`,
        );
      }

      return allCustomers;
    }

    // Fetch all customers from Shopify
    const shopifyCustomers = await fetchAllCustomers();

    const results = {
      total: shopifyCustomers.length,
      successful: 0,
      failed: 0,
      errors: [] as { customerId: string; error: string }[],
    };

    // Function to determine customer tier based on total spent
    async function getCustomerTierInfo(admin: Admin, amountSpent: any) {
      const spent = parseFloat(amountSpent?.amount || "0");

      // Fetch all tiers from the database
      const dbTiers = await getTiers();

      // Sort tiers by minSpend in ascending order
      const sortedTiers = [...dbTiers].sort((a, b) => a.minSpend - b.minSpend);

      // Find the appropriate tier based on the customer's spend
      let matchedTier = sortedTiers[0]; // Default to the lowest tier

      for (let i = sortedTiers.length - 1; i >= 0; i--) {
        const tier = sortedTiers[i];
        // Skip the Reigning Champion tier (which is invite-only)
        if (tier.name === "Reigning Champion" || tier.minSpend >= 9999999) {
          continue;
        }

        if (spent >= tier.minSpend) {
          matchedTier = tier;
          break;
        }
      }

      // Get the tier level based on its position in the sorted array
      const tierLevel =
        sortedTiers.findIndex((t) => t.id === matchedTier.id) + 1;

      // Extract benefits from the tier
      const benefits = matchedTier.benefits.map((benefit: any) => benefit.name);

      return {
        name: matchedTier.name,
        level: tierLevel,
        benefits: benefits,
      };
    }

    // Process customers in batches to avoid rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < shopifyCustomers.length; i += BATCH_SIZE) {
      const batch = shopifyCustomers.slice(i, i + BATCH_SIZE);

      // Process each customer in the batch
      const batchPromises = batch.map(async (customer: any) => {
        try {
          const customerId = customer.id;
          const tierInfo = await getCustomerTierInfo(
            admin,
            customer.amountSpent,
          );
          const totalSpend = parseFloat(customer.amountSpent?.amount || "0");

          // Calculate points from spend (1:1 ratio)
          const spendPoints = totalSpend;
          const bonusPoints = 0; // Default to 0 for bulk updates
          const totalPoints = spendPoints; // No bonus points in bulk update

          // Create metafields using the Shopify Admin API
          const response = await admin.graphql(
            `#graphql
            mutation UpdateCustomerMetafields($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
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
                metafields: [
                  {
                    ownerId: customerId,
                    namespace: METAFIELD_NAMESPACE,
                    key: METAFIELD_KEYS.TIER_NAME,
                    type: "single_line_text_field",
                    value: tierInfo.name,
                  },
                  {
                    ownerId: customerId,
                    namespace: METAFIELD_NAMESPACE,
                    key: METAFIELD_KEYS.TIER_LEVEL,
                    type: "number_integer",
                    value: tierInfo.level.toString(),
                  },
                  {
                    ownerId: customerId,
                    namespace: METAFIELD_NAMESPACE,
                    key: METAFIELD_KEYS.TOTAL_SPEND,
                    type: "number_decimal",
                    value: totalSpend.toString(),
                  },
                  {
                    ownerId: customerId,
                    namespace: METAFIELD_NAMESPACE,
                    key: METAFIELD_KEYS.SPEND_POINTS,
                    type: "number_decimal",
                    value: spendPoints.toString(),
                  },
                  {
                    ownerId: customerId,
                    namespace: METAFIELD_NAMESPACE,
                    key: METAFIELD_KEYS.BONUS_POINTS,
                    type: "number_decimal",
                    value: bonusPoints.toString(),
                  },
                  {
                    ownerId: customerId,
                    namespace: METAFIELD_NAMESPACE,
                    key: METAFIELD_KEYS.TOTAL_POINTS,
                    type: "number_decimal",
                    value: totalPoints.toString(),
                  },
                  {
                    ownerId: customerId,
                    namespace: METAFIELD_NAMESPACE,
                    key: METAFIELD_KEYS.TIER_BENEFITS,
                    type: "list.single_line_text_field",
                    value: JSON.stringify(tierInfo.benefits),
                  },
                ],
              },
            },
          );

          const responseJson = await response.json();

          // Check for errors in the response
          if (responseJson.data?.metafieldsSet?.userErrors?.length > 0) {
            const errors = responseJson.data.metafieldsSet.userErrors;
            throw new Error(errors.map((e: any) => e.message).join(", "));
          }

          return { success: true };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const customerId = customer.id.replace("gid://shopify/Customer/", "");
          return {
            success: false,
            customerId,
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
      if (i + BATCH_SIZE < shopifyCustomers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  } catch (error) {
    console.error("Error in bulk update of customer metafields:", error);
    throw error;
  }
}
