# TKO Toy Co Loyalty Program - Active Context

## Task Context Management Rules

**IMPORTANT: Always read .clinerules first, followed by ALL memory bank files at the start of EVERY task.**

The project follows strict context management rules defined in `.clinerules`:

- Always read `.clinerules` first at the start of every task
- Read ALL memory bank files at the start of EVERY task
- Monitor context window usage (create new task at 70-80%)
- Create new tasks at logical boundaries between work phases
- See `memory-bank/taskWorkflow.md` for detailed task management procedures

## Current Work Focus

**STORE CREDIT SYNC IMPLEMENTATION - COMPLETED ✅**

We successfully implemented comprehensive store credit tracking to fix the incomplete sync that was only processing 3,751 out of 16,381 orders.

### Problem Solved:
- **Root Cause**: Case-sensitive GraphQL queries missing order variations
- **Example**: Eric Grier's order with "Store credit used: $150.00" (capital S) was missed by query `note:'store credit used'` (lowercase)
- **Impact**: Customers with store credit usage had inflated loyalty points

### Solution Implemented:
1. **Multiple GraphQL Queries**: Added 7 different search patterns to catch all case variations
2. **Proper Data Separation**: Preserve original Shopify totalSpend, track store credit separately
3. **Loyalty-Eligible Calculation**: totalSpend - storeCreditUsed = loyaltyEligibleSpend
4. **Database Schema**: Added `totalStoreCreditUsed` and `loyaltyEligibleSpend` fields
5. **UI Enhancement**: Customer page shows breakdown columns, loyalty card shows spending breakdown

### Completed Work:
1. ✅ **Database Migration**: Added store credit tracking fields with Decimal precision
2. ✅ **Enhanced GraphQL Queries**: Multiple case-sensitive search patterns
3. ✅ **Fixed Sync Logic**: Preserve original totalSpend, populate store credit fields separately
4. ✅ **Customer Page**: Added store credit columns and sync button
5. ✅ **Loyalty Card Modal**: Shows spending breakdown with store credit details
6. ✅ **TypeScript Fixes**: Regenerated Prisma client, fixed variable references
7. ✅ **Build Verification**: Confirmed successful compilation and deployment

**CRITICAL GRAPHQL FIELD BUG FIX - COMPLETED ✅**

We successfully resolved a critical GraphQL field bug that was causing "Field 'totalSpent' doesn't exist" errors in both webhook processing and customer sync operations.

### Issue Resolution Summary:
- **Root Cause**: Code was using non-existent `totalSpent` field in Shopify GraphQL API
  - Correct field is `amountSpent { amount currencyCode }` (MoneyV2 object)
  - `totalSpent` field doesn't exist in Shopify Admin GraphQL API (version 2025-07)
- **Impact**: Customer sync failing with GraphQL errors, webhook processing broken
- **Solution**: Updated all GraphQL queries to use correct `amountSpent` field structure

### Completed Work:
1. ✅ **Fixed webhook processor** (`webhooks.orders.create.tsx`)
   - Updated GraphQL query from `totalSpent` to `amountSpent { amount currencyCode }`
   - Updated data processing to use `amountSpent.amount` instead of `totalSpent`
   - Fixed TypeScript interface to match MoneyV2 object structure
   - **Status**: Committed and deployed to production

2. ✅ **Fixed customer sync service** (`customerSync.server.ts`)
   - Updated TypeScript interface to use `amountSpent` MoneyV2 object
   - Fixed all GraphQL queries to use `amountSpent { amount currencyCode }`
   - Updated data processing logic to extract `amount` from `amountSpent` object
   - **Status**: Committed and deployed to production

3. ✅ **Added customer sync UI** (`app.customers.tsx`)
   - Added "Sync All Customers" button to customers page
   - Implemented progress tracking and error handling
   - Added success/error banners for user feedback
   - **Status**: Committed and deployed to production

### Deployment Status:
- **Webhook Fix**: ✅ Deployed - stops new inflated data from being created
- **Customer Sync**: ✅ Deployed - allows admins to correct existing inflated data
- **All changes**: ✅ Pushed to GitHub and deployed to production

The critical issue has been resolved and the system is now functioning correctly with proper customer spend tracking.

### Recently Completed

1. **Points-Based System Implementation (Complete)**:

   - ✅ Updated database schema with new fields for points system:
     - `spendPoints`: Points earned from purchases (1:1 with dollars)
     - `bonusPoints`: Points earned from events, promotions, etc.
     - `totalPoints`: Sum of both point sources (used for tier calculation)
   - ✅ Created database migration for points system conversion
   - ✅ Updated tier system to use `minPoints` and `maxPoints` instead of spend thresholds
   - ✅ Updated customer service to handle points calculation
   - ✅ Modified customer list view to display total points
   - ✅ Updated customer loyalty card component to show points information

2. **Point Events System Implementation (Complete)**:

   - ✅ Created the PointEvent model in the schema with necessary fields
   - ✅ Set up the basic service file for point events (pointEvent.server.ts)
   - ✅ Created PointTransaction model for tracking point history
   - ✅ Enhanced pointEvent.server.ts to track statistics and calculate potential bonus points
   - ✅ Created pointTransaction.server.ts service for recording and retrieving transactions
   - ✅ Created complete admin UI for point events management
   - ✅ Updated events management UI with performance metrics and filtering
   - ✅ Implemented reporting for points earned during specific events

3. **Product Analysis System (Complete)**:

   - ✅ Created comprehensive product analysis page for identifying singles
   - ✅ Implemented product categorization analysis (types, tags, collections, vendors, metafields)
   - ✅ Added automatic detection of potential singles categories with visual indicators
   - ✅ Integrated with existing Shopify app navigation
   - ✅ Deployed to production environment
   - ✅ Uses same authentication and API patterns as existing features
   - ✅ **CRITICAL FIX**: Fixed infinite loop that was crashing the server
   - ✅ **CRITICAL FIX**: Replaced broken pagination with efficient Shopify productTypes API
   - ✅ **CRITICAL FIX**: Used sample products to extract tags instead of problematic productTags API
   - ✅ **CRITICAL FIX**: Added proper limits (50 types, 50 tags) to prevent performance issues
   - ✅ **CRITICAL FIX**: Fixed TypeScript errors and removed unused imports
   - ✅ **CRITICAL FIX**: App now builds successfully and won't crash server

4. **Database Schema Conversion (Complete)**:

   - ✅ Successfully migrated tier system from spend-based to points-based
   - ✅ Created and applied database migrations for tier conversion
   - ✅ Updated all related services to use points instead of spend amounts
   - ✅ Maintained data integrity during conversion process

5. **Deployment and Integration (Complete)**:
   - ✅ All changes committed and pushed to production
   - ✅ Product Analysis feature deployed and accessible
   - ✅ Points system conversion deployed
   - ✅ App running successfully on Render.com with PostgreSQL

### Current Focus

**Collections-Based Point Events System Implementation**:

1. **Point Events Logic Clarification**:

   - Events are based on **collections** (not product types)
   - Admin selects one or multiple collections when creating events
   - Events can target online only, in-store only, or both purchase types
   - System checks fulfilled orders against active events and applies bonus points

2. **Customer-Facing Loyalty Display**:

   - Cart UI showing current tier, total points, and points to be earned
   - Real-time calculation showing spend points + bonus points breakdown
   - Visual representation only - actual points applied on order fulfillment

3. **Spend Points Rounding Logic**:

   - Total lifetime spend = spend points, rounded to nearest dollar
   - Examples: $1234.34 → 1234 points, $1234.87 → 1235 points
   - No decimals in point display for visual clarity

4. **Order Processing Pipeline**:

   - Webhook handler for order fulfillment (not creation)
   - Event matching logic (check if products are in event collections)
   - Bonus point calculation: percentage of qualifying product subtotals
   - Example: 10% event on $286 qualifying products = 28.6 → 29 bonus points

5. **BinderPOS Integration**:
   - In-store orders come through as regular Shopify orders
   - Identified by order notes containing "BinderPOS Cart #[number]"
   - In-store orders auto-fulfill, triggering immediate point calculation
   - Online orders only get points when fulfilled (prevents cancellation issues)

## Recent Changes

1. **Points System Implementation**:

   - Added `spendPoints`, `bonusPoints`, and `totalPoints` fields to Customer model
   - Created database migration for points system
   - Updated customer service to handle points calculation
   - Modified customer list view to display total points
   - Updated customer loyalty card component to show points information

2. **Customer Management Enhancement**:

   - Updated customer listing to show points information
   - Enhanced customer detail view with loyalty point breakdown
   - Modified tier assignment to use points instead of direct spend
   - Updated customer data synchronization to include points

3. **Tier Management Implementation**:

   - Created tier configuration interface
   - Implemented tier benefit management
   - Set up automatic tier assignment based on points
   - Added manual tier override capabilities

4. **Metafields Integration**:
   - Implemented customer metafields for loyalty program data
   - Created metafield definitions for tier information
   - Set up metafield synchronization
   - Added bulk update capabilities for metafields
   - Updated metafields to include points information

## Active Decisions and Considerations

1. **Points System Design**:

   - Using dual-category point system (spend points and bonus points)
   - Implementing 1:1 conversion from dollars to points
   - Planning for annual reset starting in 2026
   - Designing point events system for promotional bonuses
   - Ensuring clear display of both point categories in UI

2. **Point Events System Design**:

   - Creating time-based promotional events with performance tracking
   - Supporting both store-wide and product-specific events
   - Implementing percentage-based bonus point calculation
   - Creating a PointTransaction model for simplified point history tracking
   - Implementing reporting for points earned during specific events
   - Integrating with checkout process via webhook handler
   - Building admin interface with performance metrics and filtering

3. **Shopify Integration Approach**:

   - Leveraging Shopify Admin API for data access
   - Using Shopify Webhooks for real-time updates
   - Storing loyalty data in both app database and Shopify metafields
   - Using Shopify App Bridge for seamless admin UI integration
   - Adding direct links to Shopify customer profiles

4. **Data Export Functionality**:

   - Implementing date range filtering for exports
   - Supporting Excel/CSV export formats
   - Including comprehensive points data in exports
   - Designing for efficient data retrieval

5. **UI/UX Considerations**:
   - Using Shopify Polaris components for consistent admin experience
   - Implementing clear point breakdown display
   - Designing intuitive point events management interface
   - Creating visual indicators for tier progress based on points
   - Ensuring clear distinction between spend points and bonus points

## Next Steps

1. **Points System Completion**:

   - Update tier display to show point thresholds instead of spend thresholds
   - Ensure bonus points are properly displayed in the customer table
   - Add Shopify profile integration for customer details
   - Update metafields to include additional points information

2. **Point Events System Implementation**:

   - Add performance tracking fields to PointEvent model:
     - usageCount
     - pointsAwarded
     - lastUsed
   - Create PointTransaction model for tracking point history with fields for:
     - Customer ID
     - Transaction type (spend points, bonus points)
     - Amount
     - Source (order ID, event ID)
     - Timestamp
   - Enhance pointEvent.server.ts service to:
     - Track usage statistics when events are applied
     - Calculate potential bonus points for a cart
   - Create pointTransaction.server.ts service for:
     - Recording point transactions
     - Retrieving transaction history for a customer
   - Create webhook handler for "orders/create" to apply points after purchase
   - Update events management UI with:
     - Performance metrics for each event
     - Total points awarded and usage count
     - Filtering by active/inactive/upcoming events
   - Implement reporting for points earned during specific events

3. **Data Export Functionality**:

   - Create new route for data exports
   - Implement date range filtering
   - Build UI for export configuration
   - Implement Excel/CSV export generation
   - Include comprehensive points data in exports

4. **Annual Reset Mechanism**:

   - Design data structure for historical point tracking
   - Implement scheduled task for annual reset (starting 2026)
   - Create point transaction records for resets
   - Build reporting for historical point data

5. **Tier Benefits Automation**:

   - Implement automatic discount application based on tier
   - Create checkout integration for tier benefits
   - Build admin interface for managing tier-based discounts
   - Implement tracking for benefit usage

6. **Testing and Validation**:
   - Test point calculation accuracy
   - Validate tier assignment based on points
   - Test point events functionality
   - Verify data export functionality
   - Test Shopify profile integration

## Important Patterns and Preferences

1. **Shopify App Architecture**:

   - Using Remix framework for Shopify app development
   - Leveraging Shopify App Bridge for admin UI integration
   - Following Shopify's recommended patterns for app development
   - Using Shopify Polaris components for UI

2. **Data Access Patterns**:

   - Using Prisma ORM for database access
   - Implementing repository pattern for data operations
   - Using GraphQL for Shopify API interactions
   - Implementing proper error handling and validation

3. **State Management**:

   - Using React hooks for local state
   - Leveraging Remix's data loading patterns
   - Implementing proper form handling with validation
   - Using optimistic UI updates where appropriate

4. **API Integration**:

   - Using Shopify Admin API for data access
   - Implementing webhook handlers for real-time updates
   - Using GraphQL for efficient data fetching
   - Implementing proper error handling and retry logic

5. **UI Component Structure**:

   - Building on Shopify Polaris component library
   - Creating reusable custom components
   - Implementing responsive layouts
   - Following Shopify's design guidelines

6. **File Organization**:
   - Using Remix's file-based routing
   - Organizing services by domain
   - Keeping components focused and reusable
   - Implementing proper separation of concerns

## Learnings and Project Insights

1. **Shopify App Development**:

   - Shopify's app framework provides a solid foundation
   - Polaris components accelerate UI development
   - App Bridge enables seamless admin integration
   - GraphQL API is powerful but requires careful query design

2. **Metafields Management**:

   - Metafields provide flexible data storage for Shopify entities
   - Bulk operations are necessary for efficient updates
   - Proper error handling is crucial for metafield operations
   - Metafield definitions improve discoverability

3. **Remix Framework**:

   - File-based routing simplifies navigation structure
   - Loader/action pattern separates data loading from UI
   - Error boundary system improves error handling
   - Server-side rendering improves performance

4. **Points System Design**:
   - Separating points by source provides flexibility
   - Annual reset mechanism requires careful planning
   - Point events system enables powerful promotional capabilities
   - Clear UI for points breakdown improves user understanding
