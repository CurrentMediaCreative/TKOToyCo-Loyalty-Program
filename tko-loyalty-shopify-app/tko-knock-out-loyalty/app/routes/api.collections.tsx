import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(`
      query getCollections {
        collections(first: 250) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `);

    const data = await response.json();
    const collections = data.data.collections.edges.map((edge: any) => ({
      id: edge.node.id.replace("gid://shopify/Collection/", ""),
      title: edge.node.title,
      handle: edge.node.handle,
    }));

    return json({ collections });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return json({ collections: [], error: "Failed to fetch collections" });
  }
};
