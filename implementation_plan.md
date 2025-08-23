# Implementation Plan

Integrate TKO Loyalty Program customer-facing features into Shopify storefront using App Blocks system to display customer loyalty tier information, points balance, and dynamic cart calculations across customer account pages, checkout, and cart interfaces.

## Overview

This implementation extends the existing TKO Loyalty Program Shopify app to provide customer-facing loyalty displays through Shopify's App Blocks system. The plan addresses Issue #005 (Missing Customer-Facing Features) by creating customer account extensions, enhancing existing checkout extensions, and adding unfulfilled points tracking. The solution leverages Shopify's native UI Extensions for customer accounts and checkout, plus Theme App Extensions for cart integration, allowing store owners to easily add loyalty displays through Shopify's visual editor without custom theme modifications.

## Types

Database schema extensions to track unfulfilled points from pending orders.

**New Database Fields:**

- `Customer.unfulfilledPoints: Float @default(0)` - Points from orders not yet fulfilled
- `Order.pointsAwarded: Float @default(0)` - Points awarded when order is fulfilled
- `Order.pointsStatus: String @default("pending")` - Status: "pending", "awarded", "cancelled"

**Enhanced API Response Types:**

```typescript
interface CustomerLoyaltyResponse {
  success: boolean;
  customer?: {
    id: string;
    name: string;
    email: string;
    tier: string;
    totalPoints: number;
    unfulfilledPoints: number; // NEW
    tierProgress: {
      percentage: number;
      current: number;
      needed: number;
      nextTier: string | null;
    };
  };
  cartCalculation?: {
    cartTotal: number;
    basePoints: number;
    bonusPoints: number;
    totalPoints: number;
    appliedEvents: Array<{
      eventId: string;
      eventName: string;
      bonusPoints: number;
      bonusPercentage: number;
    }>;
  };
  error?: string;
}
```

## Files

New customer account extension and enhanced API endpoints for comprehensive loyalty integration.

**New Files to Create:**

- `extensions/loyalty-customer-account/shopify.extension.toml` - Customer account extension configuration
- `extensions/loyalty-customer-account/src/CustomerAccount.tsx` - React component for customer account loyalty display
- `extensions/loyalty-customer-account/package.json` - Extension dependencies
- `extensions/loyalty-customer-account/tsconfig.json` - TypeScript configuration
- `app/routes/api.public.customer-account-loyalty.tsx` - Enhanced API for customer account data

**Existing Files to Modify:**

- `extensions/loyalty-points-display/src/Checkout.tsx` - Fix API endpoint and enhance display
- `extensions/loyalty-cart-display/blocks/loyalty-display.liquid` - Add unfulfilled points display
- `app/routes/api.public.customer-loyalty.tsx` - Add unfulfilled points calculation
- `app/routes/webhooks.orders.fulfilled.tsx` - Add points awarding logic
- `prisma/schema.prisma` - Add unfulfilled points tracking fields

**Configuration Updates:**

- Update app permissions in `shopify.app.toml` for customer account access
- Add new extension targets for customer account pages

## Functions

Enhanced API functions and new customer account extension components.

**New Functions:**

- `calculateUnfulfilledPoints(customerId: string): Promise<number>` in `app/services/customer.server.ts`
- `awardOrderPoints(orderId: string): Promise<void>` in `app/services/order.server.ts`
- `getTierProgress(currentPoints: number, tierName: string): TierProgress` in `extensions/loyalty-customer-account/src/CustomerAccount.tsx`
- `CustomerAccountLoyaltyCard()` React component in `extensions/loyalty-customer-account/src/CustomerAccount.tsx`

**Modified Functions:**

- `getCustomerByEmail()` in `app/routes/api.public.customer-loyalty.tsx` - Add unfulfilled points
- `processFulfilledOrder()` in `app/routes/webhooks.orders.fulfilled.tsx` - Award points and update unfulfilled
- `Extension()` in `extensions/loyalty-points-display/src/Checkout.tsx` - Fix API endpoint from `/api/public/calculate-points` to `/api/public/customer-loyalty`

**Enhanced Functions:**

- `calculateBonusPointsWithItems()` - Ensure consistent with admin app logic
- `setCorsHeaders()` - Add customer account domain support

## Classes

React component classes for customer account and enhanced checkout extensions.

**New Classes:**

- `CustomerAccountLoyaltyCard` - Main customer account loyalty display component
  - File: `extensions/loyalty-customer-account/src/CustomerAccount.tsx`
  - Key methods: `fetchCustomerData()`, `renderTierProgress()`, `renderUnfulfilledPoints()`
  - Inheritance: React functional component using Shopify UI Extensions

**Modified Classes:**

- `Extension` in `extensions/loyalty-points-display/src/Checkout.tsx`
  - Modifications: Fix API endpoint, enhance error handling, add tier display option
  - Add proper customer account integration support

**Component Structure:**

```typescript
// Customer Account Component
function CustomerAccountLoyaltyCard() {
  // State management for customer data
  // Tier progress calculation
  // Unfulfilled points display
  // Real-time updates
}

// Enhanced Checkout Component
function Extension() {
  // Fixed API integration
  // Enhanced display options
  // Better error handling
}
```

## Dependencies

Shopify UI Extensions packages and enhanced API capabilities.

**New Package Dependencies:**

- `@shopify/ui-extensions-react/customer-account` - Customer account UI extensions
- Enhanced CORS support for customer account domains

**Version Updates:**

- Ensure `@shopify/ui-extensions-react` supports customer account extensions (2025-04 API version)
- Update `shopify.extension.toml` files to use latest API version

**API Enhancements:**

- Customer account domain whitelist for CORS
- Enhanced authentication for customer-specific data
- Real-time cart monitoring capabilities

## Testing

Comprehensive testing strategy for customer-facing loyalty features.

**Test File Requirements:**

- `extensions/loyalty-customer-account/src/__tests__/CustomerAccount.test.tsx` - Component testing
- `app/routes/__tests__/api.public.customer-account-loyalty.test.ts` - API endpoint testing
- Integration tests for unfulfilled points workflow

**Existing Test Modifications:**

- Update checkout extension tests to reflect API endpoint changes
- Add cart integration tests for real-time calculations
- Enhance webhook tests for points awarding logic

**Validation Strategies:**

- Test customer account extension in Shopify development store
- Validate cart calculations match admin app logic exactly
- Test unfulfilled points workflow through complete order lifecycle
- Verify CORS functionality across all customer-facing domains

## Implementation Order

Logical sequence to minimize conflicts and ensure successful integration.

1. **Database Schema Updates** - Add unfulfilled points fields to Customer and Order models
2. **Enhanced API Endpoints** - Extend existing public API with unfulfilled points support
3. **Webhook Enhancement** - Update order fulfillment webhook to award points
4. **Customer Account Extension** - Create new UI extension for customer account pages
5. **Fix Checkout Extension** - Correct API endpoint and enhance display
6. **Enhanced Cart Integration** - Add unfulfilled points to theme extension
7. **Testing and Validation** - Comprehensive testing across all integration points
8. **Deployment Configuration** - Update app configuration for customer account access

**Critical Dependencies:**

- Step 1 must complete before Step 2 (database schema before API)
- Step 2 must complete before Steps 4-6 (API before UI components)
- Step 3 can run parallel to Steps 4-6 (webhook independent of UI)
- Step 7 requires Steps 1-6 complete (testing needs all components)
- Step 8 is final deployment step (configuration last)

**Risk Mitigation:**

- Implement database changes with migration rollback capability
- Test API changes thoroughly before UI component development
- Use feature flags for gradual rollout of customer-facing features
- Maintain backward compatibility with existing checkout extension
