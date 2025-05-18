# API Integration Plan for MVP

This document outlines the minimal API endpoints needed for the TKO Toy Co Loyalty Program MVP. The focus is on simplicity and getting only the essential data required.

## MVP Requirements

For the MVP, we only need:

1. Customer information (name, email, phone)
2. Total spend amount

## Shopify API Integration

### Authentication

Shopify uses OAuth for authentication. The process involves:

1. Redirecting to Shopify's authorization URL
2. Receiving a code when the user authorizes the app
3. Exchanging the code for an access token

For development and testing, you can also use a Private App access token.

### Required Endpoints

1. **Get Customer Information**

   - Endpoint: `GET /admin/api/2023-04/customers/{customer_id}.json`
   - Purpose: Retrieve a specific customer's details
   - Returns: Customer name, email, phone, and other details

2. **Search Customers**

   - Endpoint: `GET /admin/api/2023-04/customers/search.json?query={query}`
   - Purpose: Find customers by email, phone, or name
   - Returns: List of matching customers

3. **Get Customer Orders (for total spend)**
   - Endpoint: `GET /admin/api/2023-04/customers/{customer_id}/orders.json`
   - Purpose: Get all orders for a specific customer
   - Returns: List of orders with amounts
   - Note: You'll need to sum the order amounts to calculate total spend

### Simple Implementation

```typescript
// src/backend/api-clients/shopify.ts

import axios from "axios";

// Configuration
interface ShopifyConfig {
  shopUrl: string;
  accessToken: string;
}

// Simple client for Shopify API
export const createShopifyClient = (config: ShopifyConfig) => {
  const baseURL = `https://${config.shopUrl}/admin/api/2023-04`;
  const headers = {
    "X-Shopify-Access-Token": config.accessToken,
    "Content-Type": "application/json",
  };

  return {
    // Get customer by ID
    getCustomer: async (customerId: string) => {
      const response = await axios.get(
        `${baseURL}/customers/${customerId}.json`,
        { headers }
      );
      return response.data.customer;
    },

    // Search for customers
    searchCustomers: async (query: string) => {
      const response = await axios.get(
        `${baseURL}/customers/search.json?query=${encodeURIComponent(query)}`,
        { headers }
      );
      return response.data.customers;
    },

    // Get customer's total spend
    getCustomerTotalSpend: async (customerId: string) => {
      const response = await axios.get(
        `${baseURL}/customers/${customerId}/orders.json?status=any`,
        { headers }
      );
      const orders = response.data.orders;

      // Calculate total spend from completed orders
      const totalSpend = orders
        .filter((order) => order.financial_status === "paid")
        .reduce((total, order) => total + parseFloat(order.total_price), 0);

      return totalSpend;
    },
  };
};
```

## BinderPOS API Integration

### Authentication

BinderPOS uses API key authentication. You include the API key in the request headers.

### Required Endpoints

1. **Get Customer Information**

   - Endpoint: `GET /api/v2/customers/{customer_id}`
   - Purpose: Retrieve a specific customer's details
   - Returns: Customer name, email, phone, and other details

2. **Search Customers**

   - Endpoint: `GET /api/v2/customers?query={query}`
   - Purpose: Find customers by email, phone, or name
   - Returns: List of matching customers

3. **Get Customer Sales (for total spend)**
   - Endpoint: `GET /api/v2/customers/{customer_id}/sales`
   - Purpose: Get all sales for a specific customer
   - Returns: List of sales with amounts
   - Note: You'll need to sum the sale amounts to calculate total spend

### Simple Implementation

```typescript
// src/backend/api-clients/binderpos.ts

import axios from "axios";

// Configuration
interface BinderPOSConfig {
  apiUrl: string;
  apiKey: string;
  storeId: string;
}

// Simple client for BinderPOS API
export const createBinderPOSClient = (config: BinderPOSConfig) => {
  const baseURL = config.apiUrl;
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    "X-Store-ID": config.storeId,
  };

  return {
    // Get customer by ID
    getCustomer: async (customerId: string) => {
      const response = await axios.get(`${baseURL}/customers/${customerId}`, {
        headers,
      });
      return response.data;
    },

    // Search for customers
    searchCustomers: async (query: string) => {
      const response = await axios.get(
        `${baseURL}/customers?query=${encodeURIComponent(query)}`,
        { headers }
      );
      return response.data.customers;
    },

    // Get customer's total spend
    getCustomerTotalSpend: async (customerId: string) => {
      const response = await axios.get(
        `${baseURL}/customers/${customerId}/sales`,
        { headers }
      );
      const sales = response.data.sales;

      // Calculate total spend from completed sales
      const totalSpend = sales
        .filter((sale) => sale.status === "completed")
        .reduce((total, sale) => total + sale.total, 0);

      return totalSpend;
    },
  };
};
```

## Integration with Backend Services

These simple API clients can be used in your service layer to fetch data from external systems. For example:

```typescript
// Example usage in a service
import { createShopifyClient } from "../api-clients/shopify";
import { createBinderPOSClient } from "../api-clients/binderpos";

// Create clients with configuration
const shopifyClient = createShopifyClient({
  shopUrl: process.env.SHOPIFY_SHOP_URL,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

const binderPOSClient = createBinderPOSClient({
  apiUrl: process.env.BINDERPOS_API_URL,
  apiKey: process.env.BINDERPOS_API_KEY,
  storeId: process.env.BINDERPOS_STORE_ID,
});

// Use in service methods
export const getCustomerFromExternalSystems = async (identifier: string) => {
  // Try to find customer in Shopify
  const shopifyCustomers = await shopifyClient.searchCustomers(identifier);
  if (shopifyCustomers.length > 0) {
    const customer = shopifyCustomers[0];
    const totalSpend = await shopifyClient.getCustomerTotalSpend(customer.id);

    return {
      source: "shopify",
      id: customer.id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      totalSpend,
    };
  }

  // Try to find customer in BinderPOS
  const binderPOSCustomers = await binderPOSClient.searchCustomers(identifier);
  if (binderPOSCustomers.length > 0) {
    const customer = binderPOSCustomers[0];
    const totalSpend = await binderPOSClient.getCustomerTotalSpend(customer.id);

    return {
      source: "binderpos",
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      totalSpend,
    };
  }

  return null;
};
```

## Next Steps

1. Create the simple API client files as outlined above
2. Set up environment variables for API credentials
3. Implement basic error handling and retry logic
4. Create service methods that use these clients to fetch data
5. Connect the services to your controllers/routes
