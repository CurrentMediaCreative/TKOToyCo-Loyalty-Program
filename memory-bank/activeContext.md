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

We are currently implementing a points-based loyalty system for the TKO Toy Co Loyalty Program Shopify app. The app has been fully implemented as a Shopify integration, and we are now enhancing it to support a more flexible points-based approach rather than the current direct spend-based tier system.

### Recently Completed

1. **Shopify App Implementation**:

   - Created Shopify app scaffold using Shopify CLI
   - Implemented admin dashboard UI components using Shopify Polaris
   - Set up loyalty tier management screens
   - Configured customer management views
   - Implemented customer lookup and filtering
   - Updated tier naming convention to use boxing-themed tiers (Featherweight, Lightweight, Welterweight, Heavyweight, Reigning Champion)

2. **Shopify Integration**:

   - Implemented Shopify Admin API integration
   - Set up customer data synchronization
   - Created metafields for storing loyalty program data
   - Implemented GraphQL queries for data retrieval
   - Set up authentication using Shopify OAuth

3. **Database and Data Model**:

   - Configured PostgreSQL database with Prisma ORM
   - Created data models for customers, tiers, and benefits
   - Implemented data access layer for loyalty program entities
   - Set up relationships between entities

4. **Deployment Configuration**:
   - Resolved deployment issues with Render.com
   - Updated database configuration to use PostgreSQL instead of SQLite
   - Fixed URL configuration issues in vite.config.ts
   - Updated environment variables for proper deployment
   - Configured proper redirect URLs in shopify.app.toml
   - Fixed Shopify app integration issues:
     - Changed app distribution from AppDistribution.AppStore to AppDistribution.ShopifyAdmin
     - Updated authentication flow to use authenticate.admin instead of login
     - Modified routes to handle admin app authentication properly
     - Added adminApiAccessToken parameter to shopifyApp configuration
     - Added SHOPIFY_ADMIN_API_ACCESS_TOKEN environment variable on Render.com

### Current Focus

1. **Points-Based System Implementation**:

   - Transitioning from direct spend-based tier calculation to points-based system
   - Maintaining 1:1 conversion from dollars to points for spending
   - Adding support for additional points from events and promotions
   - Implementing point tracking and history
   - Creating annual reset mechanism (starting in 2026)

2. **Database Schema Updates**:

   - Adding new fields to customer model:
     - `pointsFromSpend`: Points earned from purchases (1:1 with dollars)
     - `additionalPoints`: Points earned from events, promotions, etc.
     - `totalPoints`: Sum of both point sources (used for tier calculation)
     - `pointsYear`: Year these points were earned (for annual reset)

3. **Point Events System**:

   - Creating a new "Point Events" feature for time-limited promotions
   - Implementing date-based event scheduling
   - Adding percentage-based point bonuses
   - Building admin interface for event management

4. **Service Layer Updates**:
   - Updating tier calculation to use total points instead of total spend
   - Implementing point calculation logic
   - Creating methods for managing bonus points
   - Building point history tracking

## Recent Changes

1. **Shopify App Completion**:

   - Fully transitioned from standalone/desktop app concept to Shopify app
   - Implemented core Shopify app functionality
   - Set up customer management and tier assignment
   - Deployed app to Render.com
   - Connected app to Shopify store

2. **Customer Management Implementation**:

   - Created comprehensive customer listing with filtering and sorting
   - Implemented customer detail view with loyalty information
   - Added tier assignment and management
   - Set up customer data synchronization with Shopify

3. **Tier Management Implementation**:

   - Created tier configuration interface
   - Implemented tier benefit management
   - Set up automatic tier assignment based on spending
   - Added manual tier override capabilities

4. **Metafields Integration**:
   - Implemented customer metafields for loyalty program data
   - Created metafield definitions for tier information
   - Set up metafield synchronization
   - Added bulk update capabilities for metafields

## Active Decisions and Considerations

1. **Points System Design**:

   - Using dual-category point system (spend points and additional points)
   - Implementing 1:1 conversion from dollars to points
   - Planning for annual reset starting in 2026
   - Designing point events system for promotional bonuses

2. **Shopify Integration Approach**:

   - Leveraging Shopify Admin API for data access
   - Using Shopify Webhooks for real-time updates
   - Storing loyalty data in both app database and Shopify metafields
   - Using Shopify App Bridge for seamless admin UI integration

3. **Database Design**:

   - Using Prisma ORM for database access
   - Implementing proper relationships between entities
   - Planning for point transaction history
   - Designing for efficient querying and reporting

4. **UI/UX Considerations**:
   - Using Shopify Polaris components for consistent admin experience
   - Implementing clear point breakdown display
   - Designing intuitive point events management interface
   - Creating visual indicators for tier progress based on points

## Next Steps

1. **Points System Implementation**:

   - Update database schema to add point-related fields
   - Modify customer service to calculate and track points
   - Update metafields service to store points information in Shopify
   - Update UI components to display points information

2. **Point Events System**:

   - Create database schema for point events
   - Implement event management service
   - Build admin interface for creating and managing events
   - Implement point calculation logic for events

3. **Annual Reset Mechanism**:

   - Design data structure for historical point tracking
   - Implement scheduled task for annual reset
   - Create point transaction records for resets
   - Build reporting for historical point data

4. **Admin Interface Updates**:

   - Update customer display to show point breakdown
   - Create point history/transactions view
   - Implement manual point adjustment interface
   - Build point events management UI

5. **Testing and Validation**:
   - Test point calculation accuracy
   - Validate tier assignment based on points
   - Test point events functionality
   - Verify annual reset mechanism

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
