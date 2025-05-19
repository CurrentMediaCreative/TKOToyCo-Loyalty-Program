# TKO Toy Co Loyalty Program

A desktop application for managing TKO Toy Co's customer loyalty program.

## Overview

This application connects to Shopify to retrieve customer data, calculate loyalty tiers based on customer spending, and provide a simple interface for looking up customer information.

## Features

- **Customer Lookup**: Search for customers by name, email, or phone number
- **Tier Management**: Automatically assign customers to loyalty tiers based on their total spend
- **Dashboard**: View key metrics like customer distribution by tier and total revenue
- **Shopify Integration**: Direct connection to Shopify for real-time customer data

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- A Shopify store with API access

### Installation

1. Clone this repository
2. Copy `.env.example` to `.env` and fill in your Shopify API credentials
3. Install dependencies:
   ```
   npm install
   ```

### Development

Run the application in development mode:

```
npm run dev
```

This will:

- Compile the TypeScript code for the main process
- Start the React development server for the renderer process
- Launch Electron pointing to the development server

### Building

Build the application for production:

```
npm run build
```

Create a distributable package:

```
npm run dist
```

## Application Structure

- `src/desktop/src/main/` - Electron main process code
- `src/desktop/src/renderer/` - React application for the UI
- `src/desktop/src/main/models/` - Data models
- `src/desktop/src/main/services/` - Services for external API communication

## Shopify Integration

The application connects directly to the Shopify API to retrieve customer data. It requires the following environment variables:

- `SHOPIFY_SHOP_URL`: Your Shopify store URL (e.g., your-store.myshopify.com)
- `SHOPIFY_ACCESS_TOKEN`: A Shopify Admin API access token with permissions to read customers and orders
- `SHOPIFY_API_VERSION`: The Shopify API version to use (e.g., 2023-04)
