/**
 * Fetch product collections from Shopify GraphQL API with enhanced error handling and retry logic
 */
export async function fetchProductCollections(
  admin: any,
  productIds: string[],
): Promise<Record<string, string[]>> {
  console.log(`🔍 Fetching collections for ${productIds.length} products...`);

  const productCollections: Record<string, string[]> = {};
  let totalBatches = 0;
  let successfulBatches = 0;
  let failedBatches = 0;

  // Process products in batches to avoid GraphQL query limits
  const batchSize = 50;
  totalBatches = Math.ceil(productIds.length / batchSize);

  console.log(
    `📦 Processing ${totalBatches} batches of up to ${batchSize} products each`,
  );

  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    console.log(
      `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} products)`,
    );

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

    let retryCount = 0;
    const maxRetries = 3;
    let batchSuccess = false;

    while (retryCount < maxRetries && !batchSuccess) {
      try {
        if (retryCount > 0) {
          console.log(
            `🔄 Retry attempt ${retryCount}/${maxRetries - 1} for batch ${batchNumber}`,
          );
          // Add exponential backoff delay
          const delayMs = Math.pow(2, retryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const response = await admin.graphql(query, {
          variables: {
            ids: batch.map((id) => `gid://shopify/Product/${id}`),
          },
        });

        const data = await response.json();

        // Check for GraphQL errors
        if (data.errors && data.errors.length > 0) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        if (data.data?.nodes) {
          let productsProcessed = 0;

          for (const product of data.data.nodes) {
            if (product?.id && product?.collections) {
              const productId = product.id.replace(
                "gid://shopify/Product/",
                "",
              );
              const collectionIds = product.collections.edges.map((edge: any) =>
                edge.node.id.replace("gid://shopify/Collection/", ""),
              );
              productCollections[productId] = collectionIds;
              productsProcessed++;

              if (collectionIds.length > 0) {
                console.log(
                  `  ✅ Product ${productId}: ${collectionIds.length} collections`,
                );
              } else {
                console.log(`  ⚠️ Product ${productId}: no collections found`);
              }
            } else if (product?.id) {
              // Product exists but has no collections
              const productId = product.id.replace(
                "gid://shopify/Product/",
                "",
              );
              productCollections[productId] = [];
              productsProcessed++;
              console.log(`  ⚠️ Product ${productId}: no collections data`);
            }
          }

          console.log(
            `✅ Batch ${batchNumber} completed: ${productsProcessed}/${batch.length} products processed`,
          );
          batchSuccess = true;
          successfulBatches++;
        } else {
          throw new Error("No data.nodes in response");
        }
      } catch (error) {
        retryCount++;
        console.error(
          `❌ Error fetching collections for batch ${batchNumber} (attempt ${retryCount}):`,
          error,
        );

        if (retryCount >= maxRetries) {
          console.error(
            `💥 Batch ${batchNumber} failed after ${maxRetries} attempts - skipping`,
          );
          failedBatches++;

          // Add empty arrays for products in failed batch to prevent undefined errors
          for (const productId of batch) {
            if (!productCollections[productId]) {
              productCollections[productId] = [];
            }
          }
        }
      }
    }
  }

  // Summary logging
  console.log(`\n📊 Collection fetch summary:`);
  console.log(`   ✅ Successful batches: ${successfulBatches}/${totalBatches}`);
  console.log(`   ❌ Failed batches: ${failedBatches}/${totalBatches}`);
  console.log(
    `   📦 Products with collection data: ${Object.keys(productCollections).length}/${productIds.length}`,
  );

  const productsWithCollections = Object.values(productCollections).filter(
    (collections) => collections.length > 0,
  ).length;
  const productsWithoutCollections =
    Object.keys(productCollections).length - productsWithCollections;

  console.log(`   🏷️ Products with collections: ${productsWithCollections}`);
  console.log(
    `   ⚠️ Products without collections: ${productsWithoutCollections}`,
  );

  if (failedBatches > 0) {
    console.log(
      `⚠️ Warning: ${failedBatches} batches failed - collection-based events may not work correctly for some products`,
    );
  }

  return productCollections;
}

/**
 * Fetch all store collections
 */
export async function fetchAllCollections(admin: any) {
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
  let cursor = null;

  while (hasNextPage) {
    try {
      const response: any = await admin.graphql(query, {
        variables: {
          first: 250,
          after: cursor,
        },
      });

      const data: any = await response.json();

      if (data.data?.collections) {
        const edges = data.data.collections.edges;

        for (const edge of edges) {
          collections.push({
            id: edge.node.id.replace("gid://shopify/Collection/", ""),
            handle: edge.node.handle,
            title: edge.node.title,
            productsCount: edge.node.productsCount,
          });
        }

        hasNextPage = data.data.collections.pageInfo.hasNextPage;
        cursor = data.data.collections.pageInfo.endCursor;
      } else {
        hasNextPage = false;
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      hasNextPage = false;
    }
  }

  return collections;
}

/**
 * Check if an order is from BinderPOS (in-store)
 */
export function isBinderPOSOrder(orderNote: string | null): boolean {
  if (!orderNote) return false;

  // Check if the note contains "BinderPOS Cart #" which indicates an in-store order
  return orderNote.toLowerCase().includes("binderpos cart #");
}
