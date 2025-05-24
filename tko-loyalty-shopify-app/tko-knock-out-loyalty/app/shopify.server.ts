import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Ensure we have a valid URL with protocol for Shopify API
const getAppUrl = () => {
  try {
    const url = process.env.SHOPIFY_APP_URL || "";
    // If no protocol, add https://
    if (!url.includes("://")) {
      return `https://${url}`;
    }
    // Validate URL by attempting to construct a URL object
    new URL(url);
    return url; // Return the full URL with protocol
  } catch (error) {
    console.error("Invalid SHOPIFY_APP_URL:", error);
    // Fallback to a safe default for local development
    return "http://localhost:3000";
  }
};

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: getAppUrl(),
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.ShopifyAdmin,
  adminApiAccessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
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
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
// login is not available for ShopifyAdmin distribution
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
