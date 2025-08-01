import "@shopify/shopify-app-remix/adapters/node";
import { shopifyApp, DeliveryMethod } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import type { Session } from "@shopify/shopify-api";
import prisma from "./db.server";

// Ensure we have a valid URL with protocol for Shopify API
const getAppUrl = () => {
  const url = process.env.SHOPIFY_APP_URL;

  // Fail fast if URL is missing
  if (!url || url.trim() === "") {
    console.error("❌ SHOPIFY_APP_URL environment variable is missing or empty");
    throw new Error(
      "SHOPIFY_APP_URL environment variable is required and cannot be empty",
    );
  }

  try {
    // If no protocol, add https://
    let formattedUrl = url.trim();
    if (!formattedUrl.includes("://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Validate URL by attempting to construct a URL object
    const urlObject = new URL(formattedUrl);
    
    // Additional validation for common issues
    if (!urlObject.hostname || urlObject.hostname === 'undefined') {
      throw new Error("URL hostname is invalid or undefined");
    }
    
    console.log(`✅ Using app URL: ${formattedUrl}`);
    return formattedUrl;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Invalid SHOPIFY_APP_URL format: ${url}. Error: ${errorMessage}`);
    throw new Error(
      `Invalid SHOPIFY_APP_URL format: ${url}. Error: ${errorMessage}`,
    );
  }
};

// Validate required environment variables
const validateEnvVars = () => {
  const required = ["SHOPIFY_API_KEY", "SHOPIFY_API_SECRET", "SCOPES"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};

// Validate environment on startup
validateEnvVars();

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: "2025-07",
  scopes: process.env.SCOPES?.split(","),
  appUrl: getAppUrl(),
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  // For custom distribution apps, omit the distribution parameter
  // distribution: AppDistribution.ShopifyAdmin, // Only used for admin-created custom apps
  isEmbeddedApp: true, // Ensure embedded app is set to true
  cookieOptions: {
    // Set SameSite attribute to None for cross-site embedding
    sameSite: "none",
    secure: true, // Required when SameSite is None
    partitioned: true, // Enable partitioned cookies for better third-party context handling
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
    v3_authenticatePublic: true, // Enable v3 authentication for public requests
    v3_optInToPartialSessions: true, // Opt into partial sessions for better cookie handling
  },
  // Webhook configuration - register webhooks for order events
  webhooks: {
    ORDERS_CREATED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/orders/create",
    },
    ORDERS_FULFILLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/orders/fulfilled",
    },
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/uninstalled",
    },
  },
  // Register webhooks after authentication
  hooks: {
    afterAuth: async ({ session }: { session: Session }) => {
      shopify.registerWebhooks({ session });
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = "2025-07";
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
// login is not available for ShopifyAdmin distribution
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
