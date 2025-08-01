import prisma from "../db.server";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

interface ShopifyCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  numberOfOrders: number;
  amountSpent: {
    amount: string;
    currencyCode: string;
  };
  tags: string[];
  createdAt: string;
  lastOrder?: {
    createdAt: string;
  };
  defaultAddress?: {
    city?: string;
    province?: string;
    country?: string;
  };
}

interface SyncOptions {
  forceFullSync?: boolean;
  batchSize?: number;
  maxPages?: number;
}

/**
 * Customer Sync Service
 * Handles synchronization between Shopify customers and local database
 * Implements intelligent caching and incremental updates
 */
export class CustomerSyncService {
  private admin: AdminApiContext;

  constructor(admin: AdminApiContext) {
    this.admin = admin;
  }

  /**
   * Sync all customers from Shopify to local database
   * Uses cursor-based pagination with safety limits
   */
  async syncAllCustomers(options: SyncOptions = {}): Promise<{
    synced: number;
    errors: number;
    duration: number;
  }> {
    const startTime = Date.now();
    const { batchSize = 250, maxPages = 50 } = options;

    let syncedCount = 0;
    let errorCount = 0;
    let hasNextPage = true;
    let cursor: string | null = null;
    let pageCount = 0;

    console.log(
      `Starting customer sync with batch size: ${batchSize}, max pages: ${maxPages}`,
    );

    try {
      while (hasNextPage && pageCount < maxPages) {
        try {
          const queryVariables: {
            first: number;
            after?: string;
            sortKey: string;
            reverse: boolean;
          } = cursor
            ? {
                first: batchSize,
                after: cursor,
                sortKey: "UPDATED_AT",
                reverse: true,
              }
            : { first: batchSize, sortKey: "UPDATED_AT", reverse: true };

          const response = await this.admin.graphql(
            `#graphql
              query GetCustomersForSync($first: Int!, $after: String, $sortKey: CustomerSortKeys!, $reverse: Boolean!) {
                customers(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
                  edges {
                    node {
                      id
                      firstName
                      lastName
                      email
                      phone
                      numberOfOrders
                      amountSpent {
                        amount
                        currencyCode
                      }
                      tags
                      createdAt
                      lastOrder {
                        createdAt
                      }
                      defaultAddress {
                        city
                        province
                        country
                      }
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

          const responseJson = await response.json();
          const customersData = responseJson.data?.customers;

          if (!customersData) {
            console.error("No customer data returned from API");
            break;
          }

          // Process customers in batch
          const customers = customersData.edges.map((edge: any) => edge.node);
          const batchResult = await this.processBatchCustomers(customers);

          syncedCount += batchResult.synced;
          errorCount += batchResult.errors;

          // Update pagination info
          hasNextPage = customersData.pageInfo.hasNextPage;
          cursor = customersData.pageInfo.endCursor;
          pageCount++;

          console.log(
            `Synced page ${pageCount}: ${batchResult.synced} customers, ${batchResult.errors} errors. Total: ${syncedCount}`,
          );

          // Small delay to prevent overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (pageError) {
          console.error(`Error processing page ${pageCount + 1}:`, pageError);
          errorCount++;
          break;
        }
      }

      // Update sync completion timestamp
      await this.updateLastSyncTimestamp();

      const duration = Date.now() - startTime;
      console.log(
        `Customer sync completed: ${syncedCount} synced, ${errorCount} errors, ${duration}ms`,
      );

      return { synced: syncedCount, errors: errorCount, duration };
    } catch (error) {
      console.error("Fatal error in customer sync:", error);
      throw error;
    }
  }

  /**
   * Process a batch of customers and upsert to database
   */
  private async processBatchCustomers(customers: ShopifyCustomer[]): Promise<{
    synced: number;
    errors: number;
  }> {
    let synced = 0;
    let errors = 0;

    for (const customer of customers) {
      try {
        await this.upsertCustomer(customer);
        synced++;
      } catch (error) {
        console.error(`Error syncing customer ${customer.id}:`, error);
        errors++;
      }
    }

    return { synced, errors };
  }

  /**
   * Upsert a single customer to the database
   */
  private async upsertCustomer(
    shopifyCustomer: ShopifyCustomer,
  ): Promise<void> {
    const shopifyId = parseInt(
      shopifyCustomer.id.replace("gid://shopify/Customer/", ""),
    );
    // IMPORTANT: amountSpent.amount contains the spend amount in the store's currency
    const totalSpend = parseFloat(shopifyCustomer.amountSpent?.amount || "0");

    // Calculate if customer is active (has order in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isActive = shopifyCustomer.lastOrder
      ? new Date(shopifyCustomer.lastOrder.createdAt) >= thirtyDaysAgo
      : false;

    // Determine tier based on total points (spend + bonus)
    const existingCustomer = await prisma.customer.findUnique({
      where: { shopifyId },
      select: { bonusPoints: true, tierId: true },
    });

    const bonusPoints = existingCustomer?.bonusPoints || 0;
    const totalPoints = totalSpend + bonusPoints;
    const tierId = await this.calculateTierForPoints(
      totalPoints,
      shopifyCustomer.tags,
    );

    await prisma.customer.upsert({
      where: { shopifyId },
      update: {
        email: shopifyCustomer.email,
        firstName: shopifyCustomer.firstName,
        lastName: shopifyCustomer.lastName,
        phone: shopifyCustomer.phone,
        totalSpend,
        numberOfOrders: shopifyCustomer.numberOfOrders,
        lastOrderDate: shopifyCustomer.lastOrder
          ? new Date(shopifyCustomer.lastOrder.createdAt)
          : null,
        spendPoints: totalSpend,
        totalPoints,
        tags: shopifyCustomer.tags.join(","),
        city: shopifyCustomer.defaultAddress?.city,
        province: shopifyCustomer.defaultAddress?.province,
        country: shopifyCustomer.defaultAddress?.country,
        isActive,
        tierId,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        id: `customer_${shopifyId}`,
        shopifyId,
        email: shopifyCustomer.email,
        firstName: shopifyCustomer.firstName,
        lastName: shopifyCustomer.lastName,
        phone: shopifyCustomer.phone,
        totalSpend,
        numberOfOrders: shopifyCustomer.numberOfOrders,
        lastOrderDate: shopifyCustomer.lastOrder
          ? new Date(shopifyCustomer.lastOrder.createdAt)
          : null,
        spendPoints: totalSpend,
        bonusPoints: 0,
        totalPoints,
        tags: shopifyCustomer.tags.join(","),
        city: shopifyCustomer.defaultAddress?.city,
        province: shopifyCustomer.defaultAddress?.province,
        country: shopifyCustomer.defaultAddress?.country,
        isActive,
        tierId,
        lastSyncAt: new Date(),
        createdAt: new Date(shopifyCustomer.createdAt),
      },
    });
  }

  /**
   * Calculate appropriate tier for customer based on points and tags
   */
  private async calculateTierForPoints(
    totalPoints: number,
    tags: string[],
  ): Promise<string | null> {
    // Check for Reigning Champion tag (invite-only tier)
    const hasReigningChampionTag = tags.some(
      (tag) => tag.toLowerCase() === "reigning champion",
    );

    if (hasReigningChampionTag) {
      const reigningChampionTier = await prisma.tier.findFirst({
        where: { name: "Reigning Champion" },
      });
      return reigningChampionTier?.id || null;
    }

    // Find appropriate tier based on points
    const tier = await prisma.tier.findFirst({
      where: {
        minPoints: { lte: totalPoints },
        OR: [{ maxPoints: { gte: totalPoints } }, { maxPoints: null }],
      },
      orderBy: { minPoints: "desc" },
    });

    return tier?.id || null;
  }

  /**
   * Sync customers that have been updated since last sync
   */
  async syncRecentCustomers(hoursBack: number = 24): Promise<{
    synced: number;
    errors: number;
  }> {
    const since = new Date();
    since.setHours(since.getHours() - hoursBack);

    console.log(`Syncing customers updated since: ${since.toISOString()}`);

    let syncedCount = 0;
    let errorCount = 0;
    let hasNextPage = true;
    let cursor: string | null = null;

    try {
      while (hasNextPage) {
        const queryVariables: {
          first: number;
          after?: string;
          query: string;
        } = cursor
          ? {
              first: 250,
              after: cursor,
              query: `updated_at:>='${since.toISOString()}'`,
            }
          : {
              first: 250,
              query: `updated_at:>='${since.toISOString()}'`,
            };

        const response = await this.admin.graphql(
          `#graphql
            query GetRecentCustomers($first: Int!, $after: String, $query: String!) {
              customers(first: $first, after: $after, query: $query) {
                edges {
                  node {
                    id
                    firstName
                    lastName
                    email
                    phone
                    numberOfOrders
                    amountSpent {
                      amount
                      currencyCode
                    }
                    tags
                    createdAt
                    lastOrder {
                      createdAt
                    }
                    defaultAddress {
                      city
                      province
                      country
                    }
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

        const responseJson = await response.json();
        const customersData = responseJson.data?.customers;

        if (!customersData) break;

        const customers = customersData.edges.map((edge: any) => edge.node);
        const batchResult = await this.processBatchCustomers(customers);

        syncedCount += batchResult.synced;
        errorCount += batchResult.errors;

        hasNextPage = customersData.pageInfo.hasNextPage;
        cursor = customersData.pageInfo.endCursor;

        console.log(
          `Recent sync batch: ${batchResult.synced} synced, ${batchResult.errors} errors`,
        );
      }

      await this.updateLastSyncTimestamp();

      return { synced: syncedCount, errors: errorCount };
    } catch (error) {
      console.error("Error in recent customer sync:", error);
      throw error;
    }
  }

  /**
   * Sync a specific customer by Shopify ID
   */
  async syncCustomerById(shopifyId: number): Promise<boolean> {
    try {
      const response = await this.admin.graphql(
        `#graphql
          query GetCustomerById($id: ID!) {
            customer(id: $id) {
              id
              firstName
              lastName
              email
              phone
              numberOfOrders
              amountSpent {
                amount
                currencyCode
              }
              tags
              createdAt
              lastOrder {
                createdAt
              }
              defaultAddress {
                city
                province
                country
              }
            }
          }`,
        { variables: { id: `gid://shopify/Customer/${shopifyId}` } },
      );

      const responseJson = await response.json();
      const customer = responseJson.data?.customer;

      if (!customer) {
        console.error(`Customer ${shopifyId} not found in Shopify`);
        return false;
      }

      await this.upsertCustomer(customer);
      console.log(`Successfully synced customer ${shopifyId}`);
      return true;
    } catch (error) {
      console.error(`Error syncing customer ${shopifyId}:`, error);
      return false;
    }
  }

  /**
   * Update the last sync timestamp for tracking
   */
  private async updateLastSyncTimestamp(): Promise<void> {
    // We can store this in a simple table or use the DashboardMetrics table
    // For now, we'll update all customers' lastSyncAt to current time
    await prisma.customer.updateMany({
      data: { lastSyncAt: new Date() },
    });
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalCustomers: number;
    lastSyncAt: Date | null;
    needsSync: number;
  }> {
    const totalCustomers = await prisma.customer.count();

    const lastSyncRecord = await prisma.customer.findFirst({
      where: { lastSyncAt: { not: null } },
      orderBy: { lastSyncAt: "desc" },
      select: { lastSyncAt: true },
    });

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const needsSync = await prisma.customer.count({
      where: {
        OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: oneHourAgo } }],
      },
    });

    return {
      totalCustomers,
      lastSyncAt: lastSyncRecord?.lastSyncAt || null,
      needsSync,
    };
  }
}

/**
 * Helper functions for use in routes
 */

export async function syncAllCustomers(
  admin: AdminApiContext,
  options?: SyncOptions,
) {
  const syncService = new CustomerSyncService(admin);
  return await syncService.syncAllCustomers(options);
}

export async function syncRecentCustomers(
  admin: AdminApiContext,
  hoursBack: number = 24,
) {
  const syncService = new CustomerSyncService(admin);
  return await syncService.syncRecentCustomers(hoursBack);
}

export async function syncCustomerById(
  admin: AdminApiContext,
  shopifyId: number,
) {
  const syncService = new CustomerSyncService(admin);
  return await syncService.syncCustomerById(shopifyId);
}

export async function getSyncStats() {
  const syncService = new CustomerSyncService({} as AdminApiContext);
  return await syncService.getSyncStats();
}
