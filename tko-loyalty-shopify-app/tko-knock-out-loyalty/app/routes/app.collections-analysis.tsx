import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, DataTable, Text, Badge } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Fetch all collections with product counts
    const collectionsResponse = await admin.graphql(
      `
        query getCollections($first: Int!, $cursor: String) {
          collections(first: $first, after: $cursor) {
            edges {
              node {
                id
                title
                handle
                productsCount
                description
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      {
        variables: { first: 250 },
      },
    );

    const collectionsData = await collectionsResponse.json();
    const collections = collectionsData.data?.collections?.edges || [];

    // Sort by product count (highest first)
    const sortedCollections = collections
      .map((edge: any) => edge.node)
      .sort((a: any, b: any) => b.productsCount - a.productsCount);

    return json({
      collections: sortedCollections,
      totalCollections: collections.length,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return json({
      collections: [],
      totalCollections: 0,
      error: "Failed to fetch collections",
    });
  }
};

export default function CollectionsAnalysis() {
  const data = useLoaderData<typeof loader>();
  const { collections, totalCollections } = data;
  const error = (data as any).error;

  if (error) {
    return (
      <Page title="Collections Analysis">
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
  const tableRows = collections.map((collection: any) => [
    collection.title,
    collection.handle,
    collection.productsCount.toString(),
    collection.description ? (
      <Text as="span" truncate>
        {collection.description.substring(0, 100)}
        {collection.description.length > 100 ? "..." : ""}
      </Text>
    ) : (
      <Text as="span" tone="subdued">
        No description
      </Text>
    ),
  ]);

  return (
    <Page title="Collections Analysis">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "16px" }}>
              <Text as="h2" variant="headingMd">
                Store Collections Overview
              </Text>
              <div style={{ marginTop: "8px", marginBottom: "16px" }}>
                <Badge tone="info">{`${totalCollections} total collections`}</Badge>
              </div>

              <DataTable
                columnContentTypes={["text", "text", "numeric", "text"]}
                headings={[
                  "Collection Name",
                  "Handle",
                  "Products",
                  "Description",
                ]}
                rows={tableRows}
                sortable={[true, true, true, false]}
                defaultSortDirection="descending"
                initialSortColumnIndex={2}
              />
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
