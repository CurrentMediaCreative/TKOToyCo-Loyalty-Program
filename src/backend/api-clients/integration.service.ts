import { Customer } from "../interfaces/models/customer.interface";
import { createShopifyClient, ShopifyConfig } from "./shopify";
import { createBinderPOSClient, BinderPOSConfig } from "./binderpos";

/**
 * Configuration for the integration service
 */
export interface IntegrationConfig {
  shopify?: ShopifyConfig;
  binderPOS?: BinderPOSConfig;
}

/**
 * Integration service that provides a unified interface to external systems
 */
export class IntegrationService {
  private shopifyClient: ReturnType<typeof createShopifyClient> | null = null;
  private binderPOSClient: ReturnType<typeof createBinderPOSClient> | null =
    null;

  /**
   * Constructor
   * @param config Configuration for external systems
   */
  constructor(config: IntegrationConfig) {
    // Initialize Shopify client if config is provided
    if (config.shopify) {
      this.shopifyClient = createShopifyClient(config.shopify);
    }

    // Initialize BinderPOS client if config is provided
    if (config.binderPOS) {
      this.binderPOSClient = createBinderPOSClient(config.binderPOS);
    }
  }

  /**
   * Find a customer by identifier (email, phone)
   * @param identifier Customer identifier (email, phone)
   * @returns Customer data or null if not found
   */
  async findCustomerByIdentifier(
    identifier: string
  ): Promise<Partial<Customer> | null> {
    // Try to find customer in Shopify
    if (this.shopifyClient) {
      try {
        const shopifyCustomers = await this.shopifyClient.searchCustomers(
          identifier
        );

        // Find exact match for email or phone
        const exactMatch = shopifyCustomers.find(
          (c: any) => c.email === identifier || c.phone === identifier
        );

        if (exactMatch) {
          return this.shopifyClient.mapToCustomer(
            exactMatch,
            this.shopifyClient
          );
        }
      } catch (error) {
        console.error("Error searching Shopify for customer:", error);
      }
    }

    // Try to find customer in BinderPOS
    if (this.binderPOSClient) {
      try {
        const binderPOSCustomers = await this.binderPOSClient.searchCustomers(
          identifier
        );

        // Find exact match for email or phone
        const exactMatch = binderPOSCustomers.find(
          (c: any) => c.email === identifier || c.phone === identifier
        );

        if (exactMatch) {
          return this.binderPOSClient.mapToCustomer(
            exactMatch,
            this.binderPOSClient
          );
        }
      } catch (error) {
        console.error("Error searching BinderPOS for customer:", error);
      }
    }

    return null;
  }

  /**
   * Get customer total spend
   * @param customerId Customer ID
   * @param source Source system ('shopify' or 'binderpos')
   * @returns Total spend amount or 0 if not found
   */
  async getCustomerTotalSpend(
    customerId: string,
    source: "shopify" | "binderpos"
  ): Promise<number> {
    try {
      if (source === "shopify" && this.shopifyClient) {
        return await this.shopifyClient.getCustomerTotalSpend(customerId);
      } else if (source === "binderpos" && this.binderPOSClient) {
        return await this.binderPOSClient.getCustomerTotalSpend(customerId);
      }
    } catch (error) {
      console.error(
        `Error getting customer total spend from ${source}:`,
        error
      );
    }

    return 0;
  }

  /**
   * Test connections to external systems
   * @returns Object with connection status for each system
   */
  async testConnections(): Promise<{
    shopify: boolean;
    binderPOS: boolean;
  }> {
    const results = {
      shopify: false,
      binderPOS: false,
    };

    if (this.shopifyClient) {
      results.shopify = await this.shopifyClient.testConnection();
    }

    if (this.binderPOSClient) {
      results.binderPOS = await this.binderPOSClient.testConnection();
    }

    return results;
  }
}

/**
 * Create an integration service with the provided configuration
 * @param config Configuration for external systems
 * @returns Integration service instance
 */
export const createIntegrationService = (
  config: IntegrationConfig
): IntegrationService => {
  return new IntegrationService(config);
};
