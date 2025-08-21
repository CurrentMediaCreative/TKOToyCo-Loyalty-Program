import { authenticate } from "../shopify.server";
import { parseStoreCreditFromNote } from "./storeCreditParser.server";
import { METAFIELD_NAMESPACE, METAFIELD_KEYS } from "./metafields.server";
import { PrismaClient } from "@prisma/client";
import type { Admin } from "../types";
import { logger } from "../utils/logger.server";
import { withRetry } from "../utils/errorHandler.server";
import { measurePerformance } from "../utils/performance.server";

const prisma = new PrismaClient();

export interface StoreCreditSyncResult {
  success: boolean;
  ordersProcessed: number;
  customersAffected: number;
  totalStoreCreditFound: number;
  customerUpdates: Array<{
    customerId: string;
    customerName: string;
    email: string;
    originalSpend: number;
    storeCreditUsed: number;
    correctedSpend: number;
    correctedPoints: number;
  }>;
  errors: string[];
}

// GraphQL query to fetch orders with store credit notes
// Using multiple queries to catch all case variations since Shopify GraphQL search is case-sensitive
const ORDERS_WITH_STORE_CREDIT_QUERY = `
  query OrdersWithStoreCredit($first: Int!, $after: String, $query: String!) {
    orders(first: $first, after: $after, query: $query) {
      edges {
        cursor
        node {
          id
          note
          customer {
            id
            displayName
            email
          }
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// GraphQL query to get customer's lifetime spend
const CUSTOMER_SPEND_QUERY = `
  query GetCustomerSpend($id: ID!) {
    customer(id: $id) {
      id
      displayName
      email
      amountSpent {
        amount
        currencyCode
      }
    }
  }
`;

// Function to update customer metafields with store credit corrections
async function updateCustomerStoreCreditMetafields(
  admin: Admin,
  customerId: string,
  totalSpend: number,
  storeCreditUsed: number
) {
  try {
    const customerGid = customerId.startsWith("gid://") 
      ? customerId 
      : `gid://shopify/Customer/${customerId}`;

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
              key: METAFIELD_KEYS.TOTAL_SPEND,
              type: "number_decimal",
              value: totalSpend.toString(),
            },
            {
              ownerId: customerGid,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEYS.TOTAL_POINTS,
              type: "number_decimal",
              value: Math.floor(totalSpend).toString(),
            },
            {
              ownerId: customerGid,
              namespace: METAFIELD_NAMESPACE,
              key: "store_credit_used",
              type: "number_decimal",
              value: storeCreditUsed.toString(),
            },
          ],
        },
      },
    );

    const responseJson = await response.json();

    if (responseJson.data?.metafieldsSet?.userErrors?.length > 0) {
      const errors = responseJson.data.metafieldsSet.userErrors;
      throw new Error(errors.map((e: any) => e.message).join(", "));
    }

    return responseJson;
  } catch (error) {
    logger.error("Error updating metafields for customer", {
      operation: "updateCustomerStoreCreditMetafields",
      customerId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export async function syncStoreCreditForAllCustomers(request: Request): Promise<StoreCreditSyncResult> {
  return await measurePerformance(async () => {
    const result: StoreCreditSyncResult = {
      success: false,
      ordersProcessed: 0,
      customersAffected: 0,
      totalStoreCreditFound: 0,
      customerUpdates: [],
      errors: []
    };

    try {
      const { admin } = await authenticate.admin(request);
      
      logger.info("Starting store credit sync", {
        operation: "syncStoreCreditForAllCustomers"
      });
      
      // Step 1: Paginate through all orders with store credit notes
      // Use multiple search queries to catch all case variations since Shopify GraphQL search is case-sensitive
      const customerCredits: Record<string, {
        customerId: string;
        customerName: string;
        email: string;
        totalCredit: number;
        orderCount: number;
      }> = {};
      
      // Define search queries to catch different case variations
      const searchQueries = [
        "note:'store credit used'",      // lowercase (original)
        "note:'Store credit used'",      // Capital S (Eric Grier's case)
        "note:'Store Credit Used'",      // Title Case
        "note:'STORE CREDIT USED'",      // All caps
        "note:'store credit'",           // Partial match lowercase
        "note:'Store credit'",           // Partial match capital S
        "note:'Store Credit'",           // Partial match title case
      ];
      
      const processedOrderIds = new Set<string>(); // Track processed orders to avoid duplicates
      
      // Process each search query
      for (const searchQuery of searchQueries) {
        logger.info("Searching with query", {
          operation: "syncStoreCreditForAllCustomers",
          searchQuery
        });
        
        let cursor: string | null = null;
        let hasNextPage = true;
        
        while (hasNextPage) {
          const response: any = await withRetry(async () => {
            return await admin.graphql(ORDERS_WITH_STORE_CREDIT_QUERY, {
              variables: {
                first: 100,
                after: cursor,
                query: searchQuery
              }
            });
          }, 3, 1000, { 
            operation: "syncStoreCreditForAllCustomers", 
            additionalData: { searchQuery, cursor }
          });
          
          if (!response.success) {
            result.errors.push(`GraphQL error for query "${searchQuery}": ${response.error}`);
            break;
          }
          
          const data: any = await response.data.json();
          
          if (data.errors) {
            result.errors.push(`GraphQL error for query "${searchQuery}": ${JSON.stringify(data.errors)}`);
            break;
          }
          
          const orders = data.data.orders.edges;
          
          // Step 2: Parse store credit from each order
          for (const edge of orders) {
            const order = edge.node;
            
            // Skip if we've already processed this order
            if (processedOrderIds.has(order.id)) {
              continue;
            }
            
            processedOrderIds.add(order.id);
            result.ordersProcessed++;
            
            if (!order.customer?.id) {
              logger.warn("Order has no customer - skipping", {
                operation: "syncStoreCreditForAllCustomers",
                orderId: order.id
              });
              continue;
            }
            
            const customerId = order.customer.id;
            const customerName = order.customer.displayName || 'Unknown';
            const email = order.customer.email || '';
            
            // Parse store credit from note
            const storeCreditInfo = parseStoreCreditFromNote(order.note, 0); // totalAmount not needed for parsing
            
            if (storeCreditInfo.hasStoreCredit && storeCreditInfo.storeCreditUsed > 0) {
              if (!customerCredits[customerId]) {
                customerCredits[customerId] = {
                  customerId,
                  customerName,
                  email,
                  totalCredit: 0,
                  orderCount: 0
                };
              }
              
              customerCredits[customerId].totalCredit += storeCreditInfo.storeCreditUsed;
              customerCredits[customerId].orderCount++;
              result.totalStoreCreditFound += storeCreditInfo.storeCreditUsed;
              
              logger.info("Found store credit for customer", {
                operation: "syncStoreCreditForAllCustomers",
                storeCreditUsed: storeCreditInfo.storeCreditUsed,
                customerName,
                email,
                searchQuery
              });
            }
          }
          
          // Update pagination
          hasNextPage = data.data.orders.pageInfo.hasNextPage;
          cursor = data.data.orders.pageInfo.endCursor;
          
          if (orders.length > 0) {
            logger.info("Query batch processed", {
              operation: "syncStoreCreditForAllCustomers",
              searchQuery,
              ordersInBatch: orders.length,
              totalOrdersProcessed: result.ordersProcessed
            });
          }
        }
      }
      
      logger.info("Finished processing orders", {
        operation: "syncStoreCreditForAllCustomers",
        customersWithStoreCredit: Object.keys(customerCredits).length,
        totalOrdersProcessed: result.ordersProcessed
      });
      
      // Step 3: For each customer with store credit, get their lifetime spend and calculate corrections
      for (const customerData of Object.values(customerCredits)) {
        try {
          logger.info("Processing customer", {
            operation: "syncStoreCreditForAllCustomers",
            customerName: customerData.customerName,
            email: customerData.email,
            customerId: customerData.customerId
          });
          
          // Get customer's current lifetime spend from Shopify
          const customerResult = await withRetry(async () => {
            const response = await admin.graphql(CUSTOMER_SPEND_QUERY, {
              variables: {
                id: customerData.customerId
              }
            });
            
            const data = await response.json();
            
            if (data.errors) {
              throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
            }
            
            return data.data.customer;
          }, 3, 1000, { 
            operation: "syncStoreCreditForAllCustomers", 
            additionalData: { customerId: customerData.customerId }
          });
          
          if (!customerResult.success) {
            result.errors.push(`Error fetching customer ${customerData.customerId}: ${customerResult.error}`);
            continue;
          }
          
          const customer = customerResult.data;
          const originalSpend = parseFloat(customer.amountSpent.amount);
          const storeCreditUsed = customerData.totalCredit;
          const loyaltyEligibleSpend = Math.max(0, originalSpend - storeCreditUsed);
          const loyaltyEligiblePoints = Math.floor(loyaltyEligibleSpend); // 1 point per dollar of loyalty-eligible spending
          
          logger.info("Customer spend calculation", {
            operation: "syncStoreCreditForAllCustomers",
            customerName: customerData.customerName,
            originalSpend,
            storeCreditUsed,
            loyaltyEligibleSpend,
            loyaltyEligiblePoints
          });
          
          // Step 4: Update customer metafields in Shopify (keep original spend, add store credit info)
          await updateCustomerStoreCreditMetafields(admin, customerData.customerId, originalSpend, storeCreditUsed);
          
          // Step 5: Update local database - PRESERVE original totalSpend, populate store credit fields
          const customerIdNumeric = BigInt(customerData.customerId.replace('gid://shopify/Customer/', ''));
          
          await prisma.customer.upsert({
            where: { shopifyId: customerIdNumeric },
            update: {
              // Keep original totalSpend from Shopify - DO NOT MODIFY
              totalSpend: originalSpend,
              // Populate store credit tracking fields (using Decimal type)
              totalStoreCreditUsed: storeCreditUsed,
              loyaltyEligibleSpend: loyaltyEligibleSpend,
              // Update points based on loyalty-eligible spending only
              spendPoints: loyaltyEligiblePoints,
              totalPoints: loyaltyEligiblePoints, // Assuming no bonus points for now, will be recalculated if needed
              updatedAt: new Date()
            },
            create: {
              id: `customer_${customerIdNumeric}`,
              shopifyId: customerIdNumeric,
              emails: customerData.email ? [customerData.email] : [],
              firstName: customerData.customerName.split(' ')[0] || '',
              lastName: customerData.customerName.split(' ').slice(1).join(' ') || '',
              // Keep original totalSpend from Shopify
              totalSpend: originalSpend,
              // Populate store credit tracking fields (using Decimal type)
              totalStoreCreditUsed: storeCreditUsed,
              loyaltyEligibleSpend: loyaltyEligibleSpend,
              // Set points based on loyalty-eligible spending
              spendPoints: loyaltyEligiblePoints,
              totalPoints: loyaltyEligiblePoints,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          result.customerUpdates.push({
            customerId: customerData.customerId,
            customerName: customerData.customerName,
            email: customerData.email,
            originalSpend,
            storeCreditUsed,
            correctedSpend: loyaltyEligibleSpend, // Use loyaltyEligibleSpend instead of undefined correctedSpend
            correctedPoints: loyaltyEligiblePoints // Use loyaltyEligiblePoints instead of undefined correctedPoints
          });
          
          result.customersAffected++;
          
        } catch (error) {
          const errorMsg = `Error processing customer ${customerData.customerName}: ${error}`;
          logger.error("Error processing customer", {
            operation: "syncStoreCreditForAllCustomers",
            customerName: customerData.customerName,
            error: error instanceof Error ? error.message : String(error)
          });
          result.errors.push(errorMsg);
        }
      }
      
      result.success = result.errors.length === 0;
      
      logger.info("Store credit sync completed", {
        operation: "syncStoreCreditForAllCustomers",
        ordersProcessed: result.ordersProcessed,
        customersAffected: result.customersAffected,
        totalStoreCreditFound: result.totalStoreCreditFound,
        errorsCount: result.errors.length,
        success: result.success
      });
      
      return result;
      
    } catch (error) {
      logger.error("Store credit sync failed", {
        operation: "syncStoreCreditForAllCustomers",
        error: error instanceof Error ? error.message : String(error)
      });
      result.errors.push(`Sync failed: ${error}`);
      return result;
    } finally {
      await prisma.$disconnect();
    }
  }, "syncStoreCreditForAllCustomers");
}
