import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  DataTable,
} from "@shopify/polaris";

interface ProductTypeData {
  type: string;
  count: number;
}

interface TagData {
  tag: string;
  count: number;
}

interface AnalysisData {
  totalUniqueProductTypes: number;
  totalUniqueTags: number;
  productTypes: ProductTypeData[];
  tags: TagData[];
  gamingTags: TagData[];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    console.log(
      "🔍 Starting comprehensive product analysis with real counts...",
    );

    // Step 1: Get ALL products to extract unique product types and tags
    console.log(
      "📋 Fetching all products to get complete type and tag lists...",
    );

    let allProducts: any[] = [];
    let hasNextPage = true;
    let cursor = null;
    let pageCount = 0;
    const maxPages = 20; // Safety limit to prevent infinite loops

    while (hasNextPage && pageCount < maxPages) {
      const productsQuery = `
        query GetProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            nodes {
              productType
              tags
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const response: any = await admin.graphql(productsQuery, {
        variables: {
          first: 250,
          after: cursor,
        },
      });

      const data: any = await response.json();
      const products = data.data?.products?.nodes || [];

      allProducts = [...allProducts, ...products];
      hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false;
      cursor = data.data?.products?.pageInfo?.endCursor;
      pageCount++;

      console.log(
        `📦 Fetched page ${pageCount}, total products so far: ${allProducts.length}`,
      );
    }

    console.log(`✅ Collected ${allProducts.length} total products`);

    // Step 2: Extract unique product types
    const productTypeSet = new Set<string>();
    const tagSet = new Set<string>();

    allProducts.forEach((product) => {
      // Add product type if it exists and isn't empty
      if (product.productType && product.productType.trim()) {
        productTypeSet.add(product.productType.trim());
      }

      // Add all tags
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag: string) => {
          if (tag && tag.trim()) {
            tagSet.add(tag.trim());
          }
        });
      }
    });

    const uniqueProductTypes = Array.from(productTypeSet);
    const uniqueTags = Array.from(tagSet);

    console.log(`📊 Found ${uniqueProductTypes.length} unique product types`);
    console.log(`🏷️ Found ${uniqueTags.length} unique tags`);

    // Step 3: Get counts for each product type
    console.log("🔢 Getting real counts for each product type...");
    const productTypeData: ProductTypeData[] = [];

    for (const productType of uniqueProductTypes) {
      try {
        const countQuery = `
          query GetProductTypeCount($query: String!) {
            products(first: 1, query: $query) {
              totalCount
            }
          }
        `;

        const countResponse = await admin.graphql(countQuery, {
          variables: {
            query: `product_type:"${productType}"`,
          },
        });

        const countData = await countResponse.json();
        const count = countData.data?.products?.totalCount || 0;

        productTypeData.push({
          type: productType,
          count: count,
        });

        console.log(`📦 ${productType}: ${count} products`);
      } catch (error) {
        console.error(
          `Error counting products for type "${productType}":`,
          error,
        );
        productTypeData.push({
          type: productType,
          count: 0,
        });
      }
    }

    // Step 4: Get counts for each tag
    console.log("🔢 Getting real counts for each tag...");
    const tagData: TagData[] = [];

    for (const tag of uniqueTags) {
      try {
        const countQuery = `
          query GetTagCount($query: String!) {
            products(first: 1, query: $query) {
              totalCount
            }
          }
        `;

        const countResponse = await admin.graphql(countQuery, {
          variables: {
            query: `tag:"${tag}"`,
          },
        });

        const countData = await countResponse.json();
        const count = countData.data?.products?.totalCount || 0;

        tagData.push({
          tag: tag,
          count: count,
        });

        console.log(`🏷️ ${tag}: ${count} products`);
      } catch (error) {
        console.error(`Error counting products for tag "${tag}":`, error);
        tagData.push({
          tag: tag,
          count: 0,
        });
      }
    }

    // Step 5: Sort by count (highest first) and identify gaming tags
    productTypeData.sort((a, b) => b.count - a.count);
    tagData.sort((a, b) => b.count - a.count);

    // Identify gaming-related tags
    const gamingKeywords = [
      "pokemon",
      "magic",
      "yugioh",
      "mtg",
      "tcg",
      "ccg",
      "digimon",
      "dragon",
      "ball",
      "piece",
      "one piece",
      "yu-gi-oh",
      "gathering",
    ];

    const gamingTags = tagData.filter((item) =>
      gamingKeywords.some((keyword) =>
        item.tag.toLowerCase().includes(keyword.toLowerCase()),
      ),
    );

    const analysis: AnalysisData = {
      totalUniqueProductTypes: uniqueProductTypes.length,
      totalUniqueTags: uniqueTags.length,
      productTypes: productTypeData,
      tags: tagData,
      gamingTags: gamingTags,
    };

    console.log("✅ Complete analysis finished!");
    return json({ analysis });
  } catch (error) {
    console.error("❌ Error in product analysis:", error);
    throw new Response("Failed to analyze products", { status: 500 });
  }
};

export default function ProductAnalysis() {
  const { analysis } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Complete Product Analysis"
      subtitle="All product types and tags in your store with real product counts"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                📊 Complete Store Overview
              </Text>
              <InlineStack gap="400">
                <Badge tone="info">
                  {`${analysis.totalUniqueProductTypes} Product Types`}
                </Badge>
                <Badge tone="success">
                  {`${analysis.totalUniqueTags} Unique Tags`}
                </Badge>
                <Badge tone="attention">
                  {`${analysis.gamingTags.length} Gaming Tags Found`}
                </Badge>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                📦 All Product Types (with counts)
              </Text>
              <DataTable
                columnContentTypes={["text", "numeric"]}
                headings={["Product Type", "Product Count"]}
                rows={analysis.productTypes.map((item) => [
                  item.type || "(No Type)",
                  item.count.toLocaleString(),
                ])}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {analysis.gamingTags.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  🎮 Gaming Categories (with counts)
                </Text>
                <DataTable
                  columnContentTypes={["text", "numeric"]}
                  headings={["Gaming Tag", "Product Count"]}
                  rows={analysis.gamingTags.map((item) => [
                    item.tag,
                    item.count.toLocaleString(),
                  ])}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                🏷️ All Tags (with counts)
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                Complete list of all {analysis.totalUniqueTags} tags in your
                store:
              </Text>
              <DataTable
                columnContentTypes={["text", "numeric"]}
                headings={["Tag", "Product Count"]}
                rows={analysis.tags.map((item) => [
                  item.tag,
                  item.count.toLocaleString(),
                ])}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                💡 Point Event Recommendations
              </Text>
              <BlockStack gap="200">
                <Text as="p">
                  <strong>High-Volume Categories:</strong> Use your top product
                  types and tags for store-wide events
                </Text>
                <Text as="p">
                  <strong>Gaming-Specific Events:</strong> Target Pokemon,
                  Magic, Yu-Gi-Oh, or One Piece specifically
                </Text>
                <Text as="p">
                  <strong>Niche Promotions:</strong> Use lower-count tags for
                  targeted customer segments
                </Text>
                <Text as="p">
                  <strong>Combination Events:</strong> Combine product type +
                  tag for precise targeting
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                ✅ Analysis Complete
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                This analysis shows ALL product types and tags in your store
                with real product counts. Use this data to create targeted point
                events for your loyalty program.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
