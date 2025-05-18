/**
 * API Clients Index
 *
 * This file exports all API clients and integration services
 * for easy importing in other parts of the application.
 */

// Export Shopify API client
export { createShopifyClient, ShopifyConfig } from "./shopify";

// Export BinderPOS API client
export { createBinderPOSClient, BinderPOSConfig } from "./binderpos";

// Export Integration Service
export {
  createIntegrationService,
  IntegrationService,
  IntegrationConfig,
} from "./integration.service";

// Export example usage (for reference only)
export {
  CustomerLookupController,
  setupCustomerLookupRoutes,
} from "./example-usage";
