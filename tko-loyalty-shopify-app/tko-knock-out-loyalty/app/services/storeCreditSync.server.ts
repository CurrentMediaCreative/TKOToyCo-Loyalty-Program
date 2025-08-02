import { authenticate } from "../shopify.server";
import { parseStoreCreditFromNote } from "./storeCreditParser.server";
import { METAFIELD_NAMESPACE, METAFIELD_KEYS } from "./metafields.server";
import { PrismaClient } from "@prisma/client";
import type { Admin } from "../types";

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
const ORDERS_WITH_STORE_CREDIT_QUERY = `
  query OrdersWithStoreCredit($first: Int!, $after: String) {
    orders(first: $first, after: $after, query: "note:'store credit used'") {
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
    console.error(`Error updating metafields for customer ${customerId}:`, error);
    throw error;
  }
}

export async function syncStoreCreditForAllCustomers(request: Request): Promise<StoreCreditSyncResult> {
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
    
    console.log('🔍 Starting store credit sync - fetching all orders with store credit notes...');
    
    // Step 1: Paginate through all orders with store credit notes
    const customerCredits: Record<string, {
      customerId: string;
      customerName: string;
      email: string;
      totalCredit: number;
      orderCount: number;
    }> = {};
    
    let cursor: string | null = null;
    let hasNextPage = true;
    
    while (hasNextPage) {
      const response: any = await admin.graphql(ORDERS_WITH_STORE_CREDIT_QUERY, {
        variables: {
          first: 100,
          after: cursor
        }
      });
      
      const data: any = await response.json();
      
      if (data.errors) {
        result.errors.push(`GraphQL error: ${JSON.stringify(data.errors)}`);
        break;
      }
      
      const orders = data.data.orders.edges;
      
      // Step 2: Parse store credit from each order
      for (const edge of orders) {
        const order = edge.node;
        result.ordersProcessed++;
        
        if (!order.customer?.id) {
          console.log(`⚠️ Order ${order.id} has no customer - skipping`);
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
          
          console.log(`💳 Found $${storeCreditInfo.storeCreditUsed} store credit for ${customerName} (${email})`);
        }
      }
      
      // Update pagination
      hasNextPage = data.data.orders.pageInfo.hasNextPage;
      cursor = data.data.orders.pageInfo.endCursor;
      
      console.log(`📦 Processed ${result.ordersProcessed} orders so far...`);
    }
    
    console.log(`✅ Finished processing orders. Found ${Object.keys(customerCredits).length} customers with store credit usage.`);
    
    // Step 3: For each customer with store credit, get their lifetime spend and calculate corrections
    for (const customerData of Object.values(customerCredits)) {
      try {
        console.log(`🔍 Processing customer: ${customerData.customerName} (${customerData.email})`);
        
        // Get customer's current lifetime spend from Shopify
        const customerResponse = await admin.graphql(CUSTOMER_SPEND_QUERY, {
          variables: {
            id: customerData.customerId
          }
        });
        
        const customerDataResponse = await customerResponse.json();
        
        if (customerDataResponse.errors) {
          result.errors.push(`Error fetching customer ${customerData.customerId}: ${JSON.stringify(customerDataResponse.errors)}`);
          continue;
        }
        
        const customer = customerDataResponse.data.customer;
        const originalSpend = parseFloat(customer.amountSpent.amount);
        const storeCreditUsed = customerData.totalCredit;
        const correctedSpend = Math.max(0, originalSpend - storeCreditUsed);
        const correctedPoints = Math.floor(correctedSpend); // 1 point per dollar
        
        console.log(`💰 ${customerData.customerName}: $${originalSpend} - $${storeCreditUsed} = $${correctedSpend} (${correctedPoints} points)`);
        
        // Step 4: Update customer metafields in Shopify
        await updateCustomerStoreCreditMetafields(admin, customerData.customerId, correctedSpend, storeCreditUsed);
        
        // Step 5: Update local database
        const customerIdNumeric = BigInt(customerData.customerId.replace('gid://shopify/Customer/', ''));
        
        await prisma.customer.upsert({
          where: { shopifyId: customerIdNumeric },
          update: {
            totalSpend: correctedSpend,
            totalPoints: correctedPoints,
            spendPoints: correctedPoints,
            updatedAt: new Date()
          },
          create: {
            id: `customer_${customerIdNumeric}`,
            shopifyId: customerIdNumeric,
            emails: customerData.email ? [customerData.email] : [],
            firstName: customerData.customerName.split(' ')[0] || '',
            lastName: customerData.customerName.split(' ').slice(1).join(' ') || '',
            totalSpend: correctedSpend,
            totalPoints: correctedPoints,
            spendPoints: correctedPoints,
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
          correctedSpend,
          correctedPoints
        });
        
        result.customersAffected++;
        
      } catch (error) {
        const errorMsg = `Error processing customer ${customerData.customerName}: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }
    
    result.success = result.errors.length === 0;
    
    console.log(`✅ Store credit sync completed:`);
    console.log(`   📦 Orders processed: ${result.ordersProcessed}`);
    console.log(`   👥 Customers affected: ${result.customersAffected}`);
    console.log(`   💳 Total store credit found: $${result.totalStoreCreditFound.toFixed(2)}`);
    console.log(`   ❌ Errors: ${result.errors.length}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Store credit sync failed:', error);
    result.errors.push(`Sync failed: ${error}`);
    return result;
  } finally {
    await prisma.$disconnect();
  }
}
