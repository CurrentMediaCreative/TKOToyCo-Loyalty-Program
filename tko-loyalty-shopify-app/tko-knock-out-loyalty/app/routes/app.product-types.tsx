import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, DataTable, Text, Badge } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

interface ProductTypeData {
  productType: string;
  productCount: number;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Step 1: Fetch all product types using the productTypes query
    const productTypesResponse = await admin.graphql(
      `
        query getProductTypes($first: Int!, $cursor: String) {
          productTypes(first: $first, after: $cursor) {
            edges {
              node
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      {
        variables: { first: 1000 }, // Max allowed per page
      },
    );

    const productTypesData = await productTypesResponse.json();

    if (productTypesData.errors) {
      console.error("GraphQL errors:", productTypesData.errors);
      return json({
        productTypes: [],
        totalTypes: 0,
        error:
          "Failed to fetch product types: " +
          productTypesData.errors[0]?.message,
      });
    }

    const productTypeEdges = productTypesData.data?.productTypes?.edges || [];
    const productTypeNames = productTypeEdges.map((edge: any) => edge.node);

    // Step 2: For each product type, get the count of products
    const productTypesWithCounts: ProductTypeData[] = [];

    for (const productType of productTypeNames) {
      if (!productType || productType.trim() === "") {
        continue; // Skip empty product types
      }

      try {
        // Use search query to get count for this specific product type
        const countResponse = await admin.graphql(
          `
            query getProductCountByType($query: String!) {
              products(first: 1, query: $query) {
                totalCount
              }
            }
          `,
          {
            variables: {
              query: `product_type:'${productType.replace(/'/g, "\\'")}'`,
            },
          },
        );

        const countData = await countResponse.json();

        if (!countData.errors) {
          const productCount = countData.data?.products?.totalCount || 0;
          productTypesWithCounts.push({
            productType,
            productCount,
          });
        } else {
          console.error(
            `Error getting count for product type "${productType}":`,
            countData.errors,
          );
          // Still add it with 0 count rather than skipping
          productTypesWithCounts.push({
            productType,
            productCount: 0,
          });
        }
      } catch (error) {
        console.error(`Error processing product type "${productType}":`, error);
        // Still add it with 0 count rather than skipping
        productTypesWithCounts.push({
          productType,
          productCount: 0,
        });
      }
    }

    // Sort by product count (highest first)
    const sortedProductTypes = productTypesWithCounts.sort(
      (a, b) => b.productCount - a.productCount,
    );

    return json({
      productTypes: sortedProductTypes,
      totalTypes: sortedProductTypes.length,
    });
  } catch (error) {
    console.error("Error fetching product types:", error);
    return json({
      productTypes: [],
      totalTypes: 0,
      error: "Failed to fetch product types",
    });
  }
};

export default function ProductTypesAnalysis() {
  const data = useLoaderData<typeof loader>();
  const { productTypes, totalTypes } = data;
  const error = (data as any).error;

  if (error) {
    return (
      <Page title="Product Types Analysis">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="p" tone="critical">
                Error: {error}
              </Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Prepare data for the table
  const tableRows = productTypes.map((item: ProductTypeData) => [
    item.productType || "(No Product Type)",
    item.productCount.toString(),
    item.productCount > 0 ? (
      <Badge tone="success">Active</Badge>
    ) : (
      <Badge tone="warning">No Products</Badge>
    ),
  ]);

  return (
    <Page title="Product Types Analysis">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "16px" }}>
              <Text as="h2" variant="headingMd">
                Store Product Types Overview
              </Text>
              <div style={{ marginTop: "8px", marginBottom: "16px" }}>
                <Badge tone="info">{`${totalTypes} total product types`}</Badge>
                <span style={{ marginLeft: "8px" }}>
                  <Badge tone="success">
                    {`${productTypes.filter((pt) => pt.productCount > 0).length} with products`}
                  </Badge>
                </span>
              </div>

              <Text as="p" tone="subdued" variant="bodyMd">
                This analysis shows all product types in your store and the
                number of products assigned to each type. Use this information
                to create targeted point events for specific product categories.
              </Text>

              <div style={{ marginTop: "16px" }}>
                <DataTable
                  columnContentTypes={["text", "numeric", "text"]}
                  headings={["Product Type", "Product Count", "Status"]}
                  rows={tableRows}
                  sortable={[true, true, false]}
                  defaultSortDirection="descending"
                  initialSortColumnIndex={1}
                />
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
