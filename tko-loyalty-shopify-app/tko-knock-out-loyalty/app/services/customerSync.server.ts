import prisma from "../db.server";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { logger } from "../utils/logger.server";
import { withRetry, ServiceResult, ErrorCodes } from "../utils/errorHandler.server";
import { trackBatchPerformance } from "../utils/performance.server";

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
   * Uses cursor-based pagination with safety limits and enhanced error handling
   */
  async syncAllCustomers(options: SyncOptions = {}): Promise<ServiceResult<{
    synced: number;
    errors: number;
    duration: number;
  }>> {
    const startTime = Date.now();
    const { batchSize = 250, maxPages = 50 } = options;

    let syncedCount = 0;
    let errorCount = 0;
    let hasNextPage = true;
    let cursor: string | null = null;
    let pageCount = 0;

    try {
      logger.info("Starting customer sync operation", {
        operation: "syncAllCustomers",
        batchSize,
        maxPages,
        timestamp: new Date().toISOString()
      });

      while (hasNextPage && pageCount < maxPages) {
        const pageStartTime = Date.now();
        pageCount++;

        logger.debug("Processing customer sync page", {
          operation: "syncAllCustomers",
          pageNumber: pageCount,
          maxPages,
          cursor,
          batchSize
        });

        const pageResult = await withRetry(async () => {
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

          const responseJson: any = await response.json();

          if (responseJson.errors && responseJson.errors.length > 0) {
            throw new Error(`GraphQL errors in customer sync: ${JSON.stringify(responseJson.errors)}`);
          }

          if (!responseJson.data?.customers) {
            throw new Error("No customer data returned from Shopify API");
          }

          return responseJson.data.customers;
        }, 3, 1000, { 
          operation: "syncAllCustomers", 
          additionalData: { pageNumber: pageCount, batchSize }
        });

        if (pageResult.success && pageResult.data) {
          // Process customers in batch
          const customers = pageResult.data.edges.map((edge: any) => edge.node);
          const batchResult = await this.processBatchCustomers(customers);

          syncedCount += batchResult.synced;
          errorCount += batchResult.errors;

          // Update pagination info
          hasNextPage = pageResult.data.pageInfo.hasNextPage;
          cursor = pageResult.data.pageInfo.endCursor;

          const pageDuration = Date.now() - pageStartTime;
          logger.info("Customer sync page completed", {
            operation: "syncAllCustomers",
            pageNumber: pageCount,
            customersInPage: customers.length,
            synced: batchResult.synced,
            errors: batchResult.errors,
            totalSynced: syncedCount,
            totalErrors: errorCount,
            duration: pageDuration,
            throughput: Math.round((customers.length / pageDuration) * 1000),
            hasNextPage
          });

          // Small delay to prevent overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          logger.error("Customer sync page failed", {
            operation: "syncAllCustomers",
            pageNumber: pageCount,
            error: pageResult.error
          });
          errorCount++;
          break;
        }
      }

      // Update sync completion timestamp
      await this.updateLastSyncTimestamp();

      const duration = Date.now() - startTime;
      
      logger.info("Customer sync operation completed", {
        operation: "syncAllCustomers",
        totalSynced: syncedCount,
        totalErrors: errorCount,
        pagesProcessed: pageCount,
        duration,
        throughput: Math.round((syncedCount / duration) * 1000),
        batchSize,
        maxPages
      });

      // Track performance metrics
      trackBatchPerformance(batchSize, duration, syncedCount, errorCount);

      return {
        success: true,
        data: { synced: syncedCount, errors: errorCount, duration }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error("Customer sync operation failed", {
        operation: "syncAllCustomers",
        error: error instanceof Error ? error.message : String(error),
        syncedCount,
        errorCount,
        pageCount,
        duration
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        code: "CUSTOMER_SYNC_FAILED"
      };
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
        logger.error("Error syncing customer", {
          operation: "processBatchCustomers",
          customerId: customer.id,
          error: error instanceof Error ? error.message : String(error)
        });
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
    // FIXED: Convert numberOfOrders to integer for Prisma
    const numberOfOrders = parseInt(shopifyCustomer.numberOfOrders.toString(), 10);

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
        numberOfOrders,
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
        numberOfOrders,
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

    logger.info("Starting recent customer sync", {
      operation: "syncRecentCustomers",
      hoursBack,
      since: since.toISOString()
    });

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

        logger.info("Recent sync batch completed", {
          operation: "syncRecentCustomers",
          synced: batchResult.synced,
          errors: batchResult.errors,
          totalSynced: syncedCount,
          totalErrors: errorCount,
          hasNextPage
        });
      }

      await this.updateLastSyncTimestamp();

      return { synced: syncedCount, errors: errorCount };
    } catch (error) {
      logger.error("Error in recent customer sync", {
        operation: "syncRecentCustomers",
        error: error instanceof Error ? error.message : String(error),
        syncedCount,
        errorCount
      });
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
        logger.error("Customer not found in Shopify", {
          operation: "syncCustomerById",
          shopifyId
        });
        return false;
      }

      await this.upsertCustomer(customer);
      logger.info("Successfully synced customer", {
        operation: "syncCustomerById",
        shopifyId
      });
      return true;
    } catch (error) {
      logger.error("Error syncing customer by ID", {
        operation: "syncCustomerById",
        shopifyId,
        error: error instanceof Error ? error.message : String(error)
      });
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
