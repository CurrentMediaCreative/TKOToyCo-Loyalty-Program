import axios from "axios";
import { Customer } from "../interfaces/models/customer.interface";

/**
 * Configuration for Shopify API client
 */
export interface ShopifyConfig {
  shopUrl: string;
  accessToken: string;
  apiVersion?: string;
}

/**
 * Creates a simple Shopify API client
 * @param config Configuration for the Shopify API
 * @returns Object with methods to interact with Shopify API
 */
export const createShopifyClient = (config: ShopifyConfig) => {
  const apiVersion = config.apiVersion || "2023-04";
  const baseURL = `https://${config.shopUrl}/admin/api/${apiVersion}`;
  const headers = {
    "X-Shopify-Access-Token": config.accessToken,
    "Content-Type": "application/json",
  };

  return {
    /**
     * Get a customer by ID
     * @param customerId Shopify customer ID
     * @returns Customer data
     */
    getCustomer: async (customerId: string) => {
      try {
        const response = await axios.get(
          `${baseURL}/customers/${customerId}.json`,
          { headers }
        );
        return response.data.customer;
      } catch (error) {
        console.error(`Error fetching Shopify customer ${customerId}:`, error);
        throw error;
      }
    },

    /**
     * Search for customers by query
     * @param query Search query (email, phone, name)
     * @returns Array of matching customers
     */
    searchCustomers: async (query: string) => {
      try {
        const response = await axios.get(
          `${baseURL}/customers/search.json?query=${encodeURIComponent(query)}`,
          { headers }
        );
        return response.data.customers || [];
      } catch (error) {
        console.error(`Error searching Shopify customers:`, error);
        throw error;
      }
    },

    /**
     * Get a customer's total spend
     * @param customerId Shopify customer ID
     * @returns Total spend amount
     */
    getCustomerTotalSpend: async (customerId: string) => {
      try {
        const response = await axios.get(
          `${baseURL}/customers/${customerId}/orders.json?status=any`,
          { headers }
        );
        const orders = response.data.orders || [];

        // Calculate total spend from completed orders
        const totalSpend = orders
          .filter((order: any) => order.financial_status === "paid")
          .reduce(
            (total: number, order: any) =>
              total + parseFloat(order.total_price),
            0
          );

        return totalSpend;
      } catch (error) {
        console.error(`Error fetching Shopify customer spend:`, error);
        throw error;
      }
    },

    /**
     * Map a Shopify customer to our internal Customer model
     * @param shopifyCustomer Shopify customer data
     * @returns Customer object in our application format
     */
    mapToCustomer: async (
      shopifyCustomer: any,
      client: any
    ): Promise<Partial<Customer>> => {
      if (!shopifyCustomer) {
        return {};
      }

      const totalSpend = await client.getCustomerTotalSpend(shopifyCustomer.id);

      return {
        id: shopifyCustomer.id.toString(),
        first_name: shopifyCustomer.first_name,
        last_name: shopifyCustomer.last_name,
        email: shopifyCustomer.email,
        phone: shopifyCustomer.phone || "",
        join_date: new Date(shopifyCustomer.created_at),
        total_spend: totalSpend,
        is_active: shopifyCustomer.state === "enabled",
        created_at: new Date(shopifyCustomer.created_at),
        updated_at: new Date(shopifyCustomer.updated_at),
      };
    },

    /**
     * Test the connection to Shopify
     * @returns Boolean indicating if connection was successful
     */
    testConnection: async () => {
      try {
        const response = await axios.get(`${baseURL}/shop.json`, { headers });
        return response.status === 200 && !!response.data.shop;
      } catch (error) {
        console.error("Failed to connect to Shopify API:", error);
        return false;
      }
    },
  };
};
