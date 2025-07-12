import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  LiveReload,
} from "@remix-run/react";
import { addDocumentResponseHeaders } from "./shopify.server";

// Create a Document component that includes the DOCTYPE
function Document({ children }: { children: React.ReactNode }) {
  // Generate a nonce for script security (simple implementation)
  const nonce =
    typeof window !== "undefined"
      ? undefined
      : Math.random().toString(36).substring(2);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* Shopify API Key - Required for App Bridge initialization */}
        <meta
          name="shopify-api-key"
          content="81275bdb1a912d7493a70992a17824bb"
        />
        <link
          rel="preconnect"
          href="https://cdn.shopify.com/"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        {/* Shopify App Bridge Script for Web Vitals monitoring */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        {/* Web Vitals debug meta tag */}
        <meta name="shopify-debug" content="web-vitals" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        {process.env.NODE_ENV === "development" && <LiveReload nonce={nonce} />}
        {/* Web Vitals monitoring script */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              // Web Vitals monitoring implementation
              if (window.shopify && window.shopify.webVitals) {
                window.shopify.webVitals.onReport(function(metric) {
                  // Log Web Vitals data for debugging
                  console.log('Web Vital:', metric.name, '=', metric.value + 'ms');
                  
                  // Send to monitoring endpoint
                  fetch('/api/web-vitals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: metric.name,
                      value: metric.value,
                      rating: metric.rating,
                      delta: metric.delta,
                      id: metric.id,
                      timestamp: Date.now(),
                      url: window.location.href
                    })
                  }).catch(function(error) {
                    console.warn('Failed to send Web Vitals data:', error);
                  });
                });
              } else {
                console.warn('Shopify Web Vitals API not available');
              }
            `,
          }}
        />
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
