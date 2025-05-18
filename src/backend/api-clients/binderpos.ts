import axios from "axios";
import { Customer } from "../interfaces/models/customer.interface";

/**
 * Configuration for BinderPOS API client
 */
export interface BinderPOSConfig {
  apiUrl: string;
  apiKey: string;
  storeId: string;
}

/**
 * Creates a simple BinderPOS API client
 * @param config Configuration for the BinderPOS API
 * @returns Object with methods to interact with BinderPOS API
 */
export const createBinderPOSClient = (config: BinderPOSConfig) => {
  const baseURL = config.apiUrl;
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    "X-Store-ID": config.storeId,
  };

  return {
    /**
     * Get a customer by ID
     * @param customerId BinderPOS customer ID
     * @returns Customer data
     */
    getCustomer: async (customerId: string) => {
      try {
        const response = await axios.get(`${baseURL}/customers/${customerId}`, {
          headers,
        });
        return response.data;
      } catch (error) {
        console.error(
          `Error fetching BinderPOS customer ${customerId}:`,
          error
        );
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
          `${baseURL}/customers?query=${encodeURIComponent(query)}`,
          { headers }
        );
        return response.data.customers || [];
      } catch (error) {
        console.error(`Error searching BinderPOS customers:`, error);
        throw error;
      }
    },

    /**
     * Get a customer's total spend
     * @param customerId BinderPOS customer ID
     * @returns Total spend amount
     */
    getCustomerTotalSpend: async (customerId: string) => {
      try {
        const response = await axios.get(
          `${baseURL}/customers/${customerId}/sales`,
          { headers }
        );
        const sales = response.data.sales || [];

        // Calculate total spend from completed sales
        const totalSpend = sales
          .filter((sale: any) => sale.status === "completed")
          .reduce(
            (total: number, sale: any) => total + parseFloat(sale.total),
            0
          );

        return totalSpend;
      } catch (error) {
        console.error(`Error fetching BinderPOS customer spend:`, error);
        throw error;
      }
    },

    /**
     * Map a BinderPOS customer to our internal Customer model
     * @param binderPOSCustomer BinderPOS customer data
     * @param client BinderPOS client instance
     * @returns Customer object in our application format
     */
    mapToCustomer: async (
      binderPOSCustomer: any,
      client: any
    ): Promise<Partial<Customer>> => {
      if (!binderPOSCustomer) {
        return {};
      }

      const totalSpend = await client.getCustomerTotalSpend(
        binderPOSCustomer.id
      );

      return {
        id: binderPOSCustomer.id.toString(),
        first_name: binderPOSCustomer.firstName,
        last_name: binderPOSCustomer.lastName,
        email: binderPOSCustomer.email,
        phone: binderPOSCustomer.phone || "",
        join_date: new Date(binderPOSCustomer.createdAt),
        total_spend: totalSpend,
        is_active: true, // Assuming all customers in BinderPOS are active
        created_at: new Date(binderPOSCustomer.createdAt),
        updated_at: new Date(binderPOSCustomer.updatedAt),
      };
    },

    /**
     * Test the connection to BinderPOS
     * @returns Boolean indicating if connection was successful
     */
    testConnection: async () => {
      try {
        // Try to get store information as a connection test
        const response = await axios.get(`${baseURL}/store/${config.storeId}`, {
          headers,
        });
        return response.status === 200;
      } catch (error) {
        console.error("Failed to connect to BinderPOS API:", error);
        return false;
      }
    },
  };
};
