# API Setup Guide for TKO Toy Co Loyalty Program

This document provides detailed instructions for setting up the required API access for the TKO Toy Co Loyalty Program integration with Shopify and BinderPOS.

## Overview

The Loyalty Program application needs to integrate with two external systems:

1. **Shopify** - For online purchases
2. **BinderPOS** - For in-store transactions

For the MVP, we only need to retrieve:

- Customer information (name, email, phone)
- Total spend amount

## Shopify API Setup

### 1. Create a Private App in Shopify

1. Log in to your Shopify Admin Panel
2. Navigate to **Apps > Develop Apps**
3. Click **Create an app**
4. Enter app details:
   - Name: "TKO Loyalty Program"
   - App URL: Your application URL or localhost for development
   - Allowed redirection URLs: Your callback URLs
5. Click **Create app**

### 2. Configure API Scopes

For the MVP, request the following scopes:

- `read_customers` - To access customer information
- `read_orders` - To access order history for calculating total spend

### 3. Generate API Credentials

1. In your app settings, go to the **API credentials** tab
2. Click **Generate API credentials**
3. Save the following information:
   - API Key
   - API Secret Key
   - Access Token

### 4. Test API Access

You can test your API access using a tool like Postman:

```
GET https://{your-store}.myshopify.com/admin/api/2023-04/shop.json
Header: X-Shopify-Access-Token: {your-access-token}
```

### 5. Required API Endpoints

For the MVP, we'll use these Shopify API endpoints:

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

## BinderPOS API Setup

### 1. Request API Access

1. Contact BinderPOS support at support@binderpos.com
2. Request API access for the TKO Toy Co Loyalty Program
3. Specify that you need access to:
   - Customer data
   - Sales/transaction data

### 2. Receive API Credentials

BinderPOS will provide you with:

- API Key
- Store ID
- API Base URL

### 3. Test API Access

You can test your API access using a tool like Postman:

```
GET {base-url}/store/{store-id}
Header: Authorization: Bearer {your-api-key}
Header: Content-Type: application/json
Header: X-Store-ID: {your-store-id}
```

### 4. Required API Endpoints

For the MVP, we'll use these BinderPOS API endpoints:

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

## Environment Variables

After obtaining the API credentials, add them to your `.env` file:

```
# Shopify Integration
SHOPIFY_SHOP_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token
SHOPIFY_API_VERSION=2023-04

# BinderPOS Integration
BINDERPOS_API_URL=https://api.binderpos.com/api/v2
BINDERPOS_API_KEY=your_binderpos_api_key
BINDERPOS_STORE_ID=your_binderpos_store_id
```

## Next Steps

Once you have obtained the API credentials:

1. Update your `.env` file with the credentials
2. Test the API connections using the integration service
3. Implement the customer lookup and total spend calculation features
4. Connect the frontend to the backend API

## Troubleshooting

### Common Shopify API Issues

1. **401 Unauthorized**: Check your access token
2. **403 Forbidden**: Check your API scopes
3. **429 Too Many Requests**: You've hit the API rate limit, implement throttling

### Common BinderPOS API Issues

1. **401 Unauthorized**: Check your API key
2. **403 Forbidden**: Check your store ID
3. **404 Not Found**: Check the endpoint URL
