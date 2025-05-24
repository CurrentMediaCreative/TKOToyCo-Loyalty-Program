import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <nav
        style={{
          display: "flex",
          gap: "10px",
          padding: "10px",
          background: "#f5f5f5",
        }}
      >
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/customers">Customers</Link>
        <Link to="/app/tiers">Loyalty Tiers</Link>
        <Link to="/app/rewards">Rewards</Link>
      </nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

// Define boundary object locally since it's not exported from @shopify/shopify-app-remix/server
export const boundary = {
  error: (error: any) => error,
  headers: (args: any) => new Headers(),
};
