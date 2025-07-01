import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  DataTable,
  Badge,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";

interface ProductNode {
  id: string;
  title: string;
  productType: string;
  tags: string[];
  vendor: string;
  collections: {
    edges: Array<{
      node: {
        id: string;
        title: string;
      };
    }>;
  };
  metafields: {
    edges: Array<{
      node: {
        namespace: string;
        key: string;
        value: string;
      };
    }>;
  };
}

interface AnalysisData {
  totalProducts: number;
  productTypes: [string, number][];
  commonTags: [string, number][];
  collections: [string, number][];
  metafieldNamespaces: [string, number][];
  vendors: [string, number][];
  sampleProducts: Array<{
    title: string;
    productType: string;
    tags: string[];
    vendor: string;
    collections: string[];
    metafields: Array<{
      namespace: string;
      key: string;
      value: string;
    }>;
  }>;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Query only 20 products to avoid overwhelming the API
    const response = await admin.graphql(`
      query GetProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              productType
              tags
              vendor
              collections(first: 5) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
              metafields(first: 5) {
                edges {
                  node {
                    namespace
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    `, {
      variables: {
        first: 20, // Reduced to 20 products for analysis
      },
    });

    const data = await response.json();
    const products: Array<{ node: ProductNode }> = data.data?.products?.edges || [];

    // Analyze the data
    const analysis = {
      totalProducts: products.length,
      productTypes: new Map<string, number>(),
      commonTags: new Map<string, number>(),
      collections: new Map<string, number>(),
      metafieldNamespaces: new Map<string, number>(),
      vendors: new Map<string, number>(),
      sampleProducts: products.slice(0, 10).map((edge) => ({
        title: edge.node.title,
        productType: edge.node.productType,
        tags: edge.node.tags,
        vendor: edge.node.vendor,
        collections: edge.node.collections.edges.map((c) => c.node.title),
        metafields: edge.node.metafields.edges.map((m) => ({
          namespace: m.node.namespace,
          key: m.node.key,
          value: m.node.value,
        })),
      })),
    };

    // Count occurrences
    products.forEach((edge) => {
      const product = edge.node;
      
      // Product types
      const type = product.productType || "No Type";
      analysis.productTypes.set(type, (analysis.productTypes.get(type) || 0) + 1);
      
      // Tags
      product.tags.forEach((tag: string) => {
        analysis.commonTags.set(tag, (analysis.commonTags.get(tag) || 0) + 1);
      });
      
      // Collections
      product.collections.edges.forEach((collectionEdge) => {
        const title = collectionEdge.node.title;
        analysis.collections.set(title, (analysis.collections.get(title) || 0) + 1);
      });
      
      // Metafields
      product.metafields.edges.forEach((metafieldEdge) => {
        const namespace = metafieldEdge.node.namespace;
        analysis.metafieldNamespaces.set(namespace, (analysis.metafieldNamespaces.get(namespace) || 0) + 1);
      });
      
      // Vendors
      const vendor = product.vendor || "No Vendor";
      analysis.vendors.set(vendor, (analysis.vendors.get(vendor) || 0) + 1);
    });

    // Convert Maps to arrays for easier rendering
    const analysisData: AnalysisData = {
      totalProducts: analysis.totalProducts,
      productTypes: Array.from(analysis.productTypes.entries()).sort((a, b) => b[1] - a[1]),
      commonTags: Array.from(analysis.commonTags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20),
      collections: Array.from(analysis.collections.entries()).sort((a, b) => b[1] - a[1]),
      metafieldNamespaces: Array.from(analysis.metafieldNamespaces.entries()).sort((a, b) => b[1] - a[1]),
      vendors: Array.from(analysis.vendors.entries()).sort((a, b) => b[1] - a[1]),
      sampleProducts: analysis.sampleProducts,
    };

    return json({ success: true, analysis: analysisData });
  } catch (error) {
    console.error("Error analyzing products:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return json({ success: false, error: errorMessage });
  }
};

type LoaderData = 
  | { success: true; analysis: AnalysisData }
  | { success: false; error: string };

export default function ProductAnalysis() {
  const data = useLoaderData<LoaderData>();

  if (!data.success) {
    return (
      <Page title="Product Analysis - Error">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="p">Error analyzing products: {data.error}</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const { analysis } = data;

  const productTypeRows = analysis.productTypes.map(([type, count]: [string, number]) => [
    type,
    count.toString(),
    <Badge key={type} tone={type.toLowerCase().includes('single') ? 'attention' : 'info'}>
      {type.toLowerCase().includes('single') ? 'Potential Singles' : 'Other'}
    </Badge>
  ]);

  const tagRows = analysis.commonTags.map(([tag, count]: [string, number]) => [
    tag,
    count.toString(),
    <Badge key={tag} tone={tag.toLowerCase().includes('single') ? 'attention' : 'info'}>
      {tag.toLowerCase().includes('single') ? 'Potential Singles' : 'Other'}
    </Badge>
  ]);

  const collectionRows = analysis.collections.map(([collection, count]: [string, number]) => [
    collection,
    count.toString(),
    <Badge key={collection} tone={collection.toLowerCase().includes('single') ? 'attention' : 'info'}>
      {collection.toLowerCase().includes('single') ? 'Potential Singles' : 'Other'}
    </Badge>
  ]);

  return (
    <Page title="Product Catalog Analysis">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Store Overview
              </Text>
              <InlineStack gap="400">
                <Text as="p">
                  <strong>Total Products Analyzed:</strong> {analysis.totalProducts}
                </Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Product Types Analysis
              </Text>
              <Text as="p" tone="subdued">
                Looking for patterns that might identify singles vs other products
              </Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'text']}
                headings={['Product Type', 'Count', 'Potential Category']}
                rows={productTypeRows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Common Tags Analysis
              </Text>
              <Text as="p" tone="subdued">
                Top 20 most used tags - looking for singles identifiers
              </Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'text']}
                headings={['Tag', 'Count', 'Potential Category']}
                rows={tagRows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Collections Analysis
              </Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'text']}
                headings={['Collection', 'Count', 'Potential Category']}
                rows={collectionRows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {analysis.vendors.length > 1 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Vendors Analysis
                </Text>
                <DataTable
                  columnContentTypes={['text', 'numeric']}
                  headings={['Vendor', 'Product Count']}
                  rows={analysis.vendors.map(([vendor, count]: [string, number]) => [vendor, count.toString()])}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {analysis.metafieldNamespaces.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Custom Metafields
                </Text>
                <DataTable
                  columnContentTypes={['text', 'numeric']}
                  headings={['Namespace', 'Usage Count']}
                  rows={analysis.metafieldNamespaces.map(([namespace, count]: [string, number]) => [namespace, count.toString()])}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Sample Products
              </Text>
              <Text as="p" tone="subdued">
                First 10 products with their categorization data
              </Text>
              {analysis.sampleProducts.map((product: AnalysisData['sampleProducts'][0], index: number) => (
                <Card key={index}>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm">
                      {product.title}
                    </Text>
                    <InlineStack gap="200">
                      <Text as="p">
                        <strong>Type:</strong> {product.productType || 'None'}
                      </Text>
                      <Text as="p">
                        <strong>Vendor:</strong> {product.vendor || 'None'}
                      </Text>
                    </InlineStack>
                    {product.tags.length > 0 && (
                      <Text as="p">
                        <strong>Tags:</strong> {product.tags.join(', ')}
                      </Text>
                    )}
                    {product.collections.length > 0 && (
                      <Text as="p">
                        <strong>Collections:</strong> {product.collections.join(', ')}
                      </Text>
                    )}
                    {product.metafields.length > 0 && (
                      <Text as="p">
                        <strong>Metafields:</strong> {product.metafields.map((m: { namespace: string; key: string; value: string }) => `${m.namespace}.${m.key}`).join(', ')}
                      </Text>
                    )}
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
