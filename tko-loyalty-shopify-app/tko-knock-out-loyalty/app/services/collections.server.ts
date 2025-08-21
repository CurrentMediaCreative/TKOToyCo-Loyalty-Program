import { logger } from "../utils/logger.server";
import { withRetry, ServiceResult, ErrorCodes } from "../utils/errorHandler.server";
import { BatchProcessor, trackBatchPerformance } from "../utils/performance.server";

/**
 * Fetch product collections from Shopify GraphQL API with enhanced error handling and retry logic
 */
export async function fetchProductCollections(
  admin: any,
  productIds: string[],
): Promise<ServiceResult<Record<string, string[]>>> {
  const startTime = Date.now();
  
  try {
    logger.info("Starting collection fetch operation", {
      operation: "fetchProductCollections",
      productCount: productIds.length,
      timestamp: new Date().toISOString()
    });

    const productCollections: Record<string, string[]> = {};
    let totalBatches = 0;
    let successfulBatches = 0;
    let failedBatches = 0;

    // Process products in batches to avoid GraphQL query limits
    const batchSize = 50;
    totalBatches = Math.ceil(productIds.length / batchSize);

    logger.info("Processing collection batches", {
      operation: "fetchProductCollections",
      totalBatches,
      batchSize,
      totalProducts: productIds.length
    });

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const batchStartTime = Date.now();

      logger.debug("Processing collection batch", {
        operation: "fetchProductCollections",
        batchNumber,
        totalBatches,
        batchSize: batch.length,
        productIds: batch
      });

      const query = `
        query getProductCollections($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              collections(first: 250) {
                edges {
                  node {
                    id
                    handle
                    title
                  }
                }
              }
            }
          }
        }
      `;

      // Use withRetry for robust error handling
      const batchResult = await withRetry(async () => {
        const response = await admin.graphql(query, {
          variables: {
            ids: batch.map((id) => `gid://shopify/Product/${id}`),
          },
        });

        const data = await response.json();

        // Check for GraphQL errors
        if (data.errors && data.errors.length > 0) {
          throw new Error(`GraphQL errors in collection fetch: ${JSON.stringify(data.errors)}`);
        }

        if (!data.data?.nodes) {
          throw new Error("No data.nodes in GraphQL response");
        }

        return data.data.nodes;
      }, 3, 1000, { 
        operation: "fetchProductCollections", 
        additionalData: { batchNumber, totalBatches, batchSize: batch.length }
      });

      if (batchResult.success && batchResult.data) {
        let productsProcessed = 0;

        for (const product of batchResult.data) {
          if (product?.id && product?.collections) {
            const productId = product.id.replace("gid://shopify/Product/", "");
            const collectionIds = product.collections.edges.map((edge: any) =>
              edge.node.id.replace("gid://shopify/Collection/", "")
            );
            productCollections[productId] = collectionIds;
            productsProcessed++;

            logger.debug("Product collections processed", {
              operation: "fetchProductCollections",
              productId,
              collectionCount: collectionIds.length,
              collections: collectionIds
            });
          } else if (product?.id) {
            // Product exists but has no collections
            const productId = product.id.replace("gid://shopify/Product/", "");
            productCollections[productId] = [];
            productsProcessed++;
            
            logger.debug("Product with no collections", {
              operation: "fetchProductCollections",
              productId
            });
          }
        }

        const batchDuration = Date.now() - batchStartTime;
        logger.info("Collection batch completed", {
          operation: "fetchProductCollections",
          batchNumber,
          totalBatches,
          productsProcessed,
          batchSize: batch.length,
          duration: batchDuration,
          throughput: Math.round((productsProcessed / batchDuration) * 1000)
        });

        successfulBatches++;
      } else {
        logger.error("Collection batch failed", {
          operation: "fetchProductCollections",
          batchNumber,
          totalBatches,
          error: batchResult.error,
          batchSize: batch.length
        });

        // Add empty arrays for products in failed batch to prevent undefined errors
        for (const productId of batch) {
          if (!productCollections[productId]) {
            productCollections[productId] = [];
          }
        }

        failedBatches++;
      }
    }

    const duration = Date.now() - startTime;
    
    logger.info("Collection fetch operation completed", {
      operation: "fetchProductCollections",
      totalProducts: productIds.length,
      productsWithData: Object.keys(productCollections).length,
      productsWithCollections: Object.values(productCollections).filter(c => c.length > 0).length,
      duration,
      throughput: Math.round((productIds.length / duration) * 1000),
      successfulBatches,
      failedBatches,
      totalBatches
    });

    // Track performance metrics
    trackBatchPerformance(batchSize, duration, successfulBatches * batchSize, failedBatches * batchSize);

    if (failedBatches > 0) {
      logger.warn("Some collection batches failed", {
        operation: "fetchProductCollections",
        failedBatches,
        totalBatches,
        successRate: successfulBatches / totalBatches
      });
    }

    return {
      success: true,
      data: productCollections
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error("Collection fetch operation failed", {
      operation: "fetchProductCollections",
      error: error instanceof Error ? error.message : String(error),
      duration,
      productCount: productIds.length
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: "COLLECTION_FETCH_FAILED"
    };
  }
}

/**
 * Fetch all store collections with enhanced error handling and logging
 */
export async function fetchAllCollections(admin: any): Promise<ServiceResult<Array<{
  id: string;
  handle: string;
  title: string;
  productsCount: number;
}>>> {
  const startTime = Date.now();
  
  try {
    logger.info("Starting fetch all collections operation", {
      operation: "fetchAllCollections",
      timestamp: new Date().toISOString()
    });

    const query = `
      query getAllCollections($first: Int!, $after: String) {
        collections(first: $first, after: $after) {
          edges {
            node {
              id
              handle
              title
              productsCount
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const collections: Array<{
      id: string;
      handle: string;
      title: string;
      productsCount: number;
    }> = [];

    let hasNextPage = true;
    let cursor: string | null = null;
    let pageCount = 0;

    while (hasNextPage) {
      pageCount++;
      
      const pageResult: ServiceResult<any> = await withRetry(async () => {
        const response: any = await admin.graphql(query, {
          variables: {
            first: 250,
            after: cursor,
          },
        });

        const data: any = await response.json();

        if (data.errors && data.errors.length > 0) {
          throw new Error(`GraphQL errors in collections fetch: ${JSON.stringify(data.errors)}`);
        }

        if (!data.data?.collections) {
          throw new Error("No collections data in GraphQL response");
        }

        return data.data.collections;
      }, 3, 1000, { 
        operation: "fetchAllCollections", 
        additionalData: { pageCount, cursor: cursor || "null" }
      });

      if (pageResult.success && pageResult.data) {
        const edges = pageResult.data.edges;

        for (const edge of edges) {
          collections.push({
            id: edge.node.id.replace("gid://shopify/Collection/", ""),
            handle: edge.node.handle,
            title: edge.node.title,
            productsCount: edge.node.productsCount,
          });
        }

        hasNextPage = pageResult.data.pageInfo.hasNextPage;
        cursor = pageResult.data.pageInfo.endCursor;

        logger.debug("Collections page processed", {
          operation: "fetchAllCollections",
          pageCount,
          collectionsInPage: edges.length,
          totalCollections: collections.length,
          hasNextPage
        });
      } else {
        logger.error("Failed to fetch collections page", {
          operation: "fetchAllCollections",
          pageCount,
          error: pageResult.error
        });
        hasNextPage = false;
      }
    }

    const duration = Date.now() - startTime;
    
    logger.info("Fetch all collections completed", {
      operation: "fetchAllCollections",
      totalCollections: collections.length,
      pagesProcessed: pageCount,
      duration,
      throughput: Math.round((collections.length / duration) * 1000)
    });

    return {
      success: true,
      data: collections
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error("Fetch all collections failed", {
      operation: "fetchAllCollections",
      error: error instanceof Error ? error.message : String(error),
      duration
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: "COLLECTIONS_FETCH_FAILED"
    };
  }
}

/**
 * Check if an order is from BinderPOS (in-store)
 */
export function isBinderPOSOrder(orderNote: string | null): boolean {
  if (!orderNote) return false;

  // Check if the note contains "BinderPOS Cart #" which indicates an in-store order
  return orderNote.toLowerCase().includes("binderpos cart #");
}
