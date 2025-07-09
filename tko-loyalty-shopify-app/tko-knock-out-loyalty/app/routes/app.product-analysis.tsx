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
  Divider,
} from "@shopify/polaris";

interface TagAnalysis {
  totalProducts: number;
  productsWithTags: number;
  totalTagInstances: number;
  uniqueTags: number;
  averageTagsPerProduct: number;
  topTags: Array<{ tag: string; count: number; percentage: number }>;
  gamingTags: Array<{ tag: string; count: number; percentage: number }>;
  productTypes: Array<{
    type: string;
    count: number;
    percentage: number;
    uniqueTags: number;
  }>;
  rareTags: Array<{ tag: string; count: number }>;
  suggestedCombinations: Array<{
    combination: string;
    estimatedProducts: number;
  }>;
  allTagsByFrequency: Array<{ tag: string; count: number; category: string }>;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    console.log("🔍 Starting comprehensive product analysis...");

    // Fetch all products using GraphQL with pagination
    let allProducts: any[] = [];
    let hasNextPage = true;
    let cursor = null;
    let pageCount = 0;

    while (hasNextPage) {
      pageCount++;
      console.log(`📄 Fetching page ${pageCount}...`);

      const query = `
        query getProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                title
                productType
                vendor
                tags
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

      const response: any = await admin.graphql(query, {
        variables: {
          first: 250,
          after: cursor,
        },
      });

      const data: any = await response.json();
      const products = data.data?.products?.edges || [];

      allProducts = allProducts.concat(products.map((edge: any) => edge.node));

      hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false;
      cursor = data.data?.products?.pageInfo?.endCursor;

      console.log(
        `   Found ${products.length} products (Total: ${allProducts.length})`,
      );
    }

    console.log(
      `✅ Fetched ${allProducts.length} total products from ${pageCount} pages`,
    );

    // Analyze the tags
    const analysis = analyzeProductTags(allProducts);

    return json({ analysis, totalProducts: allProducts.length });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    throw new Response("Failed to fetch product data", { status: 500 });
  }
};

function analyzeProductTags(products: any[]): TagAnalysis {
  const tagFrequency = new Map<string, number>();
  const productTypeAnalysis = new Map<
    string,
    { count: number; tags: Set<string> }
  >();

  let totalProducts = 0;
  let productsWithTags = 0;
  let totalTagInstances = 0;

  products.forEach((product) => {
    totalProducts++;

    if (product.tags && product.tags.length > 0) {
      productsWithTags++;
      const tags = product.tags
        .map((tag: string) => tag.trim().toLowerCase())
        .filter(Boolean);

      tags.forEach((tag: string) => {
        totalTagInstances++;
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    }

    // Analyze by product type
    const productType = product.productType || "Unknown";
    if (!productTypeAnalysis.has(productType)) {
      productTypeAnalysis.set(productType, { count: 0, tags: new Set() });
    }
    const typeData = productTypeAnalysis.get(productType)!;
    typeData.count++;

    if (product.tags) {
      const tags = product.tags
        .map((tag: string) => tag.trim().toLowerCase())
        .filter(Boolean);
      tags.forEach((tag: string) => typeData.tags.add(tag));
    }
  });

  // Process results
  const sortedTags = Array.from(tagFrequency.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  const topTags = sortedTags.slice(0, 30).map(([tag, count]) => ({
    tag,
    count,
    percentage: parseFloat(((count / productsWithTags) * 100).toFixed(1)),
  }));

  const gamingTags = sortedTags
    .filter(
      ([tag]) =>
        tag.includes("pokemon") ||
        tag.includes("magic") ||
        tag.includes("yugioh") ||
        tag.includes("mtg") ||
        tag.includes("tcg") ||
        tag.includes("ccg") ||
        tag.includes("digimon") ||
        tag.includes("dragon ball") ||
        tag.includes("one piece"),
    )
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: parseFloat(((count / productsWithTags) * 100).toFixed(1)),
    }));

  const productTypes = Array.from(productTypeAnalysis.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([type, data]) => ({
      type,
      count: data.count,
      percentage: parseFloat(((data.count / totalProducts) * 100).toFixed(1)),
      uniqueTags: data.tags.size,
    }));

  const rareTags = sortedTags
    .filter(([, count]) => count >= 1 && count <= 5)
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  // Suggest tag combinations
  const combinations = [
    ["pokemon", "single"],
    ["pokemon", "sealed"],
    ["magic", "single"],
    ["magic", "sealed"],
    ["yugioh", "single"],
    ["yugioh", "sealed"],
    ["mtg", "single"],
    ["mtg", "booster"],
    ["tcg", "rare"],
    ["ccg", "pack"],
  ];

  const suggestedCombinations = combinations
    .map(([tag1, tag2]) => {
      const tag1Count = tagFrequency.get(tag1) || 0;
      const tag2Count = tagFrequency.get(tag2) || 0;
      if (tag1Count > 0 && tag2Count > 0) {
        const estimatedOverlap = Math.round(
          Math.min(tag1Count, tag2Count) * 0.3,
        );
        return {
          combination: `"${tag1}" + "${tag2}"`,
          estimatedProducts: estimatedOverlap,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{
    combination: string;
    estimatedProducts: number;
  }>;

  // Categorize all tags by frequency
  const allTagsByFrequency = sortedTags.map(([tag, count]) => {
    let category = "RARE (1)";
    if (count >= 100) category = "VERY HIGH (100+)";
    else if (count >= 50) category = "HIGH (50-99)";
    else if (count >= 20) category = "MEDIUM-HIGH (20-49)";
    else if (count >= 10) category = "MEDIUM (10-19)";
    else if (count >= 5) category = "LOW-MEDIUM (5-9)";
    else if (count >= 2) category = "LOW (2-4)";

    return { tag, count, category };
  });

  return {
    totalProducts,
    productsWithTags,
    totalTagInstances,
    uniqueTags: tagFrequency.size,
    averageTagsPerProduct: parseFloat(
      (totalTagInstances / productsWithTags).toFixed(1),
    ),
    topTags,
    gamingTags,
    productTypes,
    rareTags,
    suggestedCombinations,
    allTagsByFrequency,
  };
}

export default function ProductAnalysis() {
  const { analysis } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Product Analysis"
      subtitle="Comprehensive analysis of all products and tags for Point Events planning"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                📊 Overview Statistics
              </Text>
              <InlineStack gap="400">
                <Badge tone="info">
                  {`Total Products: ${analysis.totalProducts}`}
                </Badge>
                <Badge tone="success">
                  {`Products with Tags: ${analysis.productsWithTags}`}
                </Badge>
                <Badge tone="attention">
                  {`Unique Tags: ${analysis.uniqueTags}`}
                </Badge>
                <Badge>
                  {`Avg Tags/Product: ${analysis.averageTagsPerProduct}`}
                </Badge>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                🏷️ Top 30 Most Common Tags
              </Text>
              <DataTable
                columnContentTypes={["text", "numeric", "text"]}
                headings={["Tag", "Products", "Percentage"]}
                rows={analysis.topTags.map((item, index) => [
                  `${index + 1}. ${item.tag}`,
                  item.count.toString(),
                  `${item.percentage}%`,
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
                  🎮 Gaming Categories Analysis
                </Text>
                <DataTable
                  columnContentTypes={["text", "numeric", "text"]}
                  headings={["Gaming Tag", "Products", "Percentage"]}
                  rows={analysis.gamingTags.map((item) => [
                    item.tag,
                    item.count.toString(),
                    `${item.percentage}%`,
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
                📦 Product Type Breakdown
              </Text>
              <DataTable
                columnContentTypes={["text", "numeric", "text", "numeric"]}
                headings={[
                  "Product Type",
                  "Products",
                  "Percentage",
                  "Unique Tags",
                ]}
                rows={analysis.productTypes.map((item) => [
                  item.type,
                  item.count.toString(),
                  `${item.percentage}%`,
                  item.uniqueTags.toString(),
                ])}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                🎯 Suggested Point Event Categories
              </Text>

              <Text variant="headingSm" as="h3">
                High Volume Tags (Good for regular promotions)
              </Text>
              <InlineStack gap="200" wrap>
                {analysis.allTagsByFrequency
                  .filter((item) => item.count >= 50)
                  .slice(0, 10)
                  .map((item) => (
                    <Badge key={item.tag} tone="success">
                      {`${item.tag} (${item.count})`}
                    </Badge>
                  ))}
              </InlineStack>

              <Divider />

              <Text variant="headingSm" as="h3">
                Medium Volume Tags (Good for targeted campaigns)
              </Text>
              <InlineStack gap="200" wrap>
                {analysis.allTagsByFrequency
                  .filter((item) => item.count >= 10 && item.count < 50)
                  .slice(0, 15)
                  .map((item) => (
                    <Badge key={item.tag} tone="info">
                      {`${item.tag} (${item.count})`}
                    </Badge>
                  ))}
              </InlineStack>

              <Divider />

              <Text variant="headingSm" as="h3">
                Low Volume Tags (Good for special events)
              </Text>
              <InlineStack gap="200" wrap>
                {analysis.allTagsByFrequency
                  .filter((item) => item.count >= 3 && item.count < 10)
                  .slice(0, 15)
                  .map((item) => (
                    <Badge key={item.tag} tone="attention">
                      {`${item.tag} (${item.count})`}
                    </Badge>
                  ))}
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {analysis.suggestedCombinations.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  🔗 Suggested Tag Combinations (AND Logic)
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  These combinations would create targeted point events where
                  products must have ALL specified tags:
                </Text>
                <DataTable
                  columnContentTypes={["text", "numeric"]}
                  headings={["Tag Combination", "Estimated Products"]}
                  rows={analysis.suggestedCombinations.map((item) => [
                    item.combination,
                    item.estimatedProducts.toString(),
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
                📋 Complete Tag List by Frequency
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                All {analysis.uniqueTags} unique tags sorted by frequency:
              </Text>

              {[
                "VERY HIGH (100+)",
                "HIGH (50-99)",
                "MEDIUM-HIGH (20-49)",
                "MEDIUM (10-19)",
                "LOW-MEDIUM (5-9)",
                "LOW (2-4)",
                "RARE (1)",
              ].map((category) => {
                const tagsInCategory = analysis.allTagsByFrequency.filter(
                  (item) => item.category === category,
                );
                if (tagsInCategory.length === 0) return null;

                return (
                  <BlockStack key={category} gap="200">
                    <Text variant="headingSm" as="h3">
                      {category} ({tagsInCategory.length} tags)
                    </Text>
                    <InlineStack gap="100" wrap>
                      {tagsInCategory.map((item) => (
                        <Badge
                          key={item.tag}
                          tone={
                            category.includes("VERY HIGH")
                              ? "success"
                              : category.includes("HIGH")
                                ? "info"
                                : category.includes("MEDIUM")
                                  ? "warning"
                                  : "critical"
                          }
                        >
                          {`${item.tag} (${item.count})`}
                        </Badge>
                      ))}
                    </InlineStack>
                  </BlockStack>
                );
              })}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                💡 Recommendations for Point Events
              </Text>
              <BlockStack gap="200">
                <Text as="p">
                  • Use high-volume tags for ongoing loyalty bonuses
                </Text>
                <Text as="p">
                  • Combine gaming category + product type for targeted
                  campaigns
                </Text>
                <Text as="p">
                  • Use rare/niche tags for special seasonal promotions
                </Text>
                <Text as="p">
                  • Consider product type tags for broad category bonuses
                </Text>
                <Text as="p">
                  • Test tag combinations to find optimal targeting
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
