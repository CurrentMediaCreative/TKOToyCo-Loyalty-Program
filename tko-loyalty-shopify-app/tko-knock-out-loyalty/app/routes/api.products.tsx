import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("query") || "";

  try {
    const response = await admin.graphql(
      `
      query searchProducts($query: String!) {
        products(first: 50, query: $query) {
          edges {
            node {
              id
              title
              handle
              status
              featuredImage {
                url
                altText
              }
            }
          }
        }
      }
    `,
      {
        variables: {
          query: query,
        },
      },
    );

    const data = await response.json();
    const products = data.data.products.edges.map((edge: any) => ({
      id: edge.node.id.replace("gid://shopify/Product/", ""),
      title: edge.node.title,
      handle: edge.node.handle,
      status: edge.node.status,
      image: edge.node.featuredImage?.url || null,
    }));

    return json({ products });
  } catch (error) {
    console.error("Error searching products:", error);
    return json({ products: [], error: "Failed to search products" });
  }
};
