/**
 * Fetch product collections from Shopify GraphQL API
 */
export async function fetchProductCollections(
  admin: any,
  productIds: string[],
): Promise<Record<string, string[]>> {
  const productCollections: Record<string, string[]> = {};

  // Process products in batches to avoid GraphQL query limits
  const batchSize = 50;
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);

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

    try {
      const response = await admin.graphql(query, {
        variables: {
          ids: batch.map((id) => `gid://shopify/Product/${id}`),
        },
      });

      const data = await response.json();

      if (data.data?.nodes) {
        for (const product of data.data.nodes) {
          if (product?.id && product?.collections) {
            const productId = product.id.replace("gid://shopify/Product/", "");
            const collectionIds = product.collections.edges.map((edge: any) =>
              edge.node.id.replace("gid://shopify/Collection/", ""),
            );
            productCollections[productId] = collectionIds;
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching collections for batch ${i}:`, error);
      // Continue with other batches even if one fails
    }
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
