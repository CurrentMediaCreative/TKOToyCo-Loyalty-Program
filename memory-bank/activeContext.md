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

We are currently implementing the Frontend UI for the TKO Toy Co Loyalty Program. This phase follows the completed Backend Implementation phase, which included Database Schema Design, Core Backend Services, and API Endpoints and Controllers.

### Recently Completed

1. **Repository Pattern Implementation**:

   - Created repository interfaces for all entities in `src/backend/interfaces/repositories/`
   - Implemented concrete repositories in `src/backend/repositories/`
   - Set up CRUD operations and specialized query methods
   - Established proper error handling and type safety

2. **Service Layer Implementation**:

   - Created service interfaces for business logic in `src/backend/interfaces/services/`
   - Implemented adapter services in `src/backend/services/adapters/`
   - Implemented transaction, transaction item, reward, customer reward, and membership card services
   - Set up business logic for managing loyalty program operations

3. **Dependency Injection System**:

   - Created a flexible dependency injection container in `src/backend/utils/container.ts`
   - Implemented service registration with different lifetime options (singleton, transient, scoped)
   - Set up service provider for registering repositories and services in `src/backend/utils/serviceProvider.ts`
   - Configured dependency resolution with proper dependency chains

4. **Error Handling and Logging**:
   - Implemented custom error classes in `src/backend/utils/errors.ts`
   - Created standardized error response formats
   - Set up structured logging with Winston in `src/backend/utils/logger.ts`
   - Implemented global error handling middleware in `src/backend/middleware/errorHandler.ts`
   - Added request validation middleware in `src/backend/middleware/validator.ts`

### Current Focus

1. **Frontend UI Implementation**:

   - Created theme configuration with TKO brand colors in `src/frontend/src/theme.ts`
   - Implemented custom font loading with FontLoader component
   - Created responsive Layout component with sidebar navigation
   - Implemented authentication with useAuth hook and ProtectedRoute component
   - Created Login page with form validation and error handling
   - Implemented Dashboard page with statistics and visualizations
   - Created Customers page with table, search, and filtering
   - Implemented Tiers page with tier management interface

2. **Frontend Routing**:

   - Set up React Router with protected routes
   - Implemented navigation between pages
   - Created route structure for admin dashboard
   - Added authentication-based redirects

3. **UI Component Development**:

   - Using Material-UI components with custom TKO theme
   - Created reusable UI components for consistent design
   - Implemented responsive layouts for different screen sizes
   - Applied TKO branding consistently across components
   - Implemented data visualization components for reports and analytics

4. **Mock Data Integration**:
   - Created mock data for development and testing
   - Implemented realistic data structures matching backend models
   - Set up mock authentication flow
   - Prepared for eventual backend API integration

## Recent Changes

1. **Scope Clarification Implementation**:

   - Removed transaction processing functionality as it's not part of the app's scope
   - Removed redeemable rewards functionality as it's not part of the app's scope
   - Removed "Rewards" and "Transactions" navigation items from the sidebar in Layout.tsx
   - Removed corresponding imports (RewardsIcon and TransactionsIcon) from Layout.tsx
   - Clarified that the app will simply pull total spend data from existing systems (Shopify/BinderPOS)
   - Updated wireframes to reflect the simplified scope
   - Removed transaction processing wireframe completely
   - Updated customer portal wireframe to focus on tier benefits instead of rewards

2. **Frontend Structure Implementation**:

   - Created core frontend structure with React and TypeScript
   - Set up Material-UI with custom TKO theme
   - Implemented responsive layout with sidebar navigation
   - Created authentication context and protected routes
   - Set up routing with React Router

3. **UI Components Development**:

   - Implemented Dashboard page with statistics cards and charts
   - Created Customers page with data table and search functionality
   - Implemented Tiers page with tier management interface
   - Created Login page with form validation
   - Implemented Reports page with data visualization components
   - Implemented responsive design for all components

4. **Branding Implementation**:

   - Applied TKO brand colors throughout the UI
   - Implemented custom font loading for TKO typography
   - Used brand colors for UI elements (Keppel/Teal `#00B8A2`, Sunglow/Yellow `#FFD23F`, Pumpkin/Orange `#FF7C2A`)
   - Created consistent visual language across components

5. **Authentication Flow**:
   - Implemented authentication context with React Context API
   - Created login/logout functionality
   - Set up protected routes for authenticated users
   - Implemented mock authentication for development

6. **Desktop Application Implementation**:
   - Created Electron-based desktop application structure with dual-window architecture
   - Implemented system tray integration with context menu for both windows
   - Built popup window UI with customer lookup functionality
   - Created customer information display with tier progress visualization
   - Implemented "close to next tier" notification with spending recommendations
   - Developed comprehensive admin dashboard with multiple sections:
     - Dashboard with statistics and data visualization
     - Customers management with search and filtering
     - Tiers configuration with benefit management
     - Reports with analytics and data export
     - Settings for application configuration
   - Implemented IPC communication between main process and renderer processes
   - Created service layer with repository pattern for data access
   - Implemented mock data service for development while waiting for API access
   - Set up proper TypeScript interfaces for all data models
   - Applied TKO branding with consistent theme and styling across both windows
   - Implemented single instance lock mechanism to prevent multiple instances of the application from running simultaneously

## Active Decisions and Considerations

1. **Frontend Architecture**:

   - Using React with TypeScript for type safety
   - Implementing component-based architecture
   - Using React Context for state management
   - Leveraging Material-UI for UI components

2. **UI/UX Design Approach**:

   - Following Material Design principles
   - Implementing responsive design for all screen sizes
   - Using consistent spacing and typography
   - Applying TKO branding consistently

3. **State Management**:

   - Using React Context for authentication state
   - Planning to use Redux for more complex state management
   - Implementing local component state where appropriate
   - Planning for eventual API integration

4. **Integration Approach**:
   - Starting with mock data for frontend development
   - Planning API integration after UI implementation
   - Considering whether to implement as standalone app or Shopify app
   - Evaluating integration options with BinderPOS

## Next Steps

1. **Integration Approach Updated: Shopify App**:

   - We have decided to transition to implementing the TKO Toy Co Loyalty Program as a fully integrated Shopify app
   - This approach provides seamless integration with the Shopify ecosystem
   - Leverages Shopify's built-in infrastructure for authentication, data storage, and UI
   - Simplifies deployment and maintenance
   - Detailed documentation available in `tko-loyalty-shopify-app/shopify-app-transition-plan.md`

2. **Shopify App Development - Current Phase**:

   - Created Shopify app scaffold using Shopify CLI
   - Implemented basic UI components for the admin dashboard
   - Set up loyalty tier management screens
   - Configured customer management views
   - Implemented rewards management interface
   - Updated tier naming convention to use boxing-themed tiers (Featherweight, Lightweight, Welterweight, Heavyweight, Reigning Champion)
   - Currently working on completing the core features of the app
   - Resolved deployment issues with Render.com:
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

3. **Complete Core Shopify App Features**:

   - Implement points calculation logic based on order value
   - Create database models for storing customer points
   - Set up point history tracking
   - Implement point expiration rules
   - Finalize tier benefits implementation
   - Create automatic tier assignment based on customer spending
   - Implement manual tier override capabilities for admin
   - Complete rewards redemption flow
   - Build customer-facing loyalty dashboard

4. **Implement Shopify Integration Points**:

   - Set up webhooks to capture new orders
   - Implement point calculation on order completion
   - Create transaction records for point history
   - Integrate with Shopify customer data
   - Implement customer tagging for tier identification
   - Create discount code generation for rewards

5. **Testing and Debugging**:

   - Comprehensive testing with sample data
   - Verify points calculation accuracy
   - Test tier progression logic
   - Validate reward redemption flow
   - Performance testing under load

6. **Deployment and Publication**:
   - Prepare app for Shopify App Store submission
   - Create app listing materials (screenshots, descriptions)
   - Set up production environment
   - Configure monitoring and error tracking
   - Prepare user documentation

## Important Patterns and Preferences

1. **Repository Pattern**:

   - Base repository with common CRUD operations
   - Specialized repositories for entity-specific operations
   - Strong typing with TypeScript interfaces
   - Consistent error handling

2. **Service Pattern**:

   - Service interfaces defining business operations
   - Adapter implementations for concrete services
   - Business logic encapsulation
   - Transaction management

3. **Dependency Injection**:

   - Custom DI container for managing service instances
   - Different service lifetimes (singleton, transient, scoped)
   - Automatic dependency resolution
   - Service provider for registration

4. **Error Handling**:

   - Custom error classes for different scenarios
   - Global error handling middleware
   - Standardized error responses
   - Structured logging

5. **Naming Conventions**:

   - Interfaces prefixed with `I` (e.g., `IRewardService`)
   - Repository interfaces follow `IEntityRepository` pattern
   - Service interfaces follow `IEntityService` pattern
   - Implementation classes without prefix (e.g., `RewardService`)

6. **File Organization**:
   - Interfaces in `src/backend/interfaces/` directory
   - Implementations in corresponding directories
   - Index files for exporting multiple related items
   - Clear separation of concerns

## Learnings and Project Insights

1. **TypeScript Integration with Sequelize**:

   - Sequelize and TypeScript integration requires careful type definitions
   - Decorator pattern works well for model definitions
   - Need to ensure proper typing for query results
   - Some Sequelize features require type assertions

2. **Service Layer Design**:

   - Services provide a clean API for business operations
   - Repository pattern simplifies data access
   - Clear separation between data access and business logic
   - Adapter pattern allows for flexible implementations

3. **Dependency Injection**:

   - Custom DI container provides flexibility
   - Service lifetimes are important for resource management
   - Automatic dependency resolution simplifies service creation
   - Factory patterns useful for complex service creation

4. **Error Handling**:
   - Standardized error handling improves consistency
   - Custom error classes provide better context
   - Global error handling simplifies controller code
   - Structured logging helps with debugging and monitoring
