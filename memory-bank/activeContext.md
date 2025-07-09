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

We are implementing a points-based loyalty system for the TKO Toy Co Loyalty Program Shopify app. The app has been fully implemented as a Shopify integration, and we have made significant progress in transitioning from a spend-based to a points-based loyalty system.

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

1. **Points-Based System Completion**:

   - Updating tier display to show point thresholds instead of spend thresholds
   - Ensuring bonus points are properly displayed in the customer table
   - Adding Shopify profile integration for customer details
   - Creating data export functionality for customer points data

2. **Point Events System**:

   - Implementing the admin interface for point events management
   - Integrating with checkout process to apply bonus points automatically
   - Building event performance metrics and reporting
   - Creating event filtering and search functionality

3. **Service Layer Updates**:
   - Enhancing point calculation logic
   - Creating methods for managing bonus points
   - Building point history tracking
   - Implementing point transaction records

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
