import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  LiveReload,
} from "@remix-run/react";
import { useNonce } from "@shopify/hydrogen";
import { addDocumentResponseHeaders } from "./shopify.server";

// Create a Document component that includes the DOCTYPE
function Document({ children }: { children: React.ReactNode }) {
  // Get a nonce for script security
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link
          rel="preconnect"
          href="https://cdn.shopify.com/"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        {process.env.NODE_ENV === "development" && <LiveReload nonce={nonce} />}
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}

// Add Shopify document response headers
export const headers = () => {
  try {
    return addDocumentResponseHeaders({
      headers: {
        "Content-Type": "text/html; charset=utf-8", // Ensure proper content type with charset
        "X-Content-Type-Options": "nosniff",
        "X-UA-Compatible": "IE=edge", // Add this to ensure standards mode in IE
        "X-Frame-Options": "SAMEORIGIN", // Add this to improve security
      },
    });
  } catch (error) {
    console.error("Error adding document response headers:", error);
    // Return basic headers if Shopify headers fail
    return {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-UA-Compatible": "IE=edge",
      "X-Frame-Options": "SAMEORIGIN",
    };
  }
};
