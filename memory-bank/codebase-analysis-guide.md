# TKO Loyalty App - Codebase Analysis Guide

**CRITICAL: Always analyze actual code, never trust implementation details in documentation**

## How to Analyze Current State

### 1. Start with Core Architecture Files
```
1. prisma/schema.prisma - Database schema and relationships
2. app/routes/ - All route definitions and API endpoints  
3. app/services/ - Business logic and data operations
4. app/components/ - Reusable UI components
5. ISSUES.md - Known problems and their status
```

### 2. Key Files for Understanding System
```
Database & Models:
- prisma/schema.prisma (complete data model)

Core Admin Routes:
- app/routes/app._index.tsx (dashboard)
- app/routes/app.customers.tsx (customer management)
- app/routes/app.tiers.tsx (tier configuration)
- app/routes/app.events.tsx (point events)
- app/routes/app.reports.tsx (analytics)

Webhook Processing:
- app/routes/webhooks.orders.fulfilled.tsx (order fulfillment)
- app/routes/webhooks.orders.create.tsx (order creation)

Business Logic Services:
- app/services/customer.server.ts (customer operations)
- app/services/tier.server.ts (tier management)
- app/services/pointEvent.server.ts (bonus point logic)
- app/services/pointTransaction.server.ts (point tracking)

UI Components:
- app/components/CustomerLoyaltyCard.tsx (customer popup)
```

### 3. Analysis Workflow for New Cline Instances

**Step 1: Check Current Issues**
```bash
1. Read ISSUES.md for known problems
2. Verify issue status by checking actual code
3. Look for TODO/FIXME/BUG comments in code
```

**Step 2: Understand Data Model**
```bash
1. Read prisma/schema.prisma completely
2. Note relationships between models
3. Check for recent migrations in prisma/migrations/
```

**Step 3: Map System Architecture**
```bash
1. Use list_code_definition_names on app/routes/
2. Use list_code_definition_names on app/services/
3. Read key route files to understand functionality
```

**Step 4: Identify Current State**
```bash
1. Check recent git commits if available
2. Look for console.log statements indicating recent work
3. Examine error handling patterns
4. Test critical user flows
```

## Key Architecture Patterns

### Database Layer
- **ORM:** Prisma with PostgreSQL
- **Models:** Customer, Tier, PointEvent, PointTransaction, Order, etc.
- **Relationships:** Proper foreign keys and indexes

### Service Layer  
- **Pattern:** Repository pattern with service classes
- **Location:** app/services/*.server.ts
- **Purpose:** Business logic, data validation, external API calls

### Route Layer
- **Framework:** Remix with file-based routing
- **Admin Routes:** app/routes/app.*.tsx
- **API Routes:** app/routes/api.*.tsx  
- **Webhooks:** app/routes/webhooks.*.tsx

### UI Layer
- **Framework:** React with TypeScript
- **Components:** Shopify Polaris design system
- **State:** Remix loaders/actions, minimal client state

## Critical System Components

### Points System
```
- Spend Points: 1:1 ratio with dollars spent
- Bonus Points: From promotional events
- Total Points: Sum used for tier calculation
- Annual Reset: Planned for 2026 (not implemented)
```

### Tier System
```
- Featherweight: 0-1,499 points
- Lightweight: 1,500-4,999 points  
- Welterweight: 5,000-29,999 points
- Heavyweight: 30,000+ points
- Reigning Champion: Invite-only (9999999 points threshold)
```

### Event System
```
- Store-wide: Apply to all products
- Collection-based: Apply to specific collections
- Product-specific: Apply to individual products
- Channel filtering: Online, in-store, or both
```

## Common Pitfalls to Avoid

### 1. Don't Trust Memory Bank Implementation Details
- Always verify current code state
- Check for recent changes and fixes
- Look for discrepancies between docs and code

### 2. Don't Assume Error Handling Exists
- Many functions lack proper try/catch blocks
- JSON parsing often missing validation
- Database operations may not handle failures

### 3. Don't Ignore Data Type Issues
- Check for null/undefined handling
- Verify number vs string conversions
- Look for NaN display issues

### 4. Don't Skip Integration Points
- Shopify API calls may fail
- Webhook processing has edge cases
- External service dependencies

## Debugging Checklist

### When Investigating Issues:
```
□ Check ISSUES.md for known problems
□ Read the actual implementation file
□ Look for error handling gaps
□ Check data type consistency
□ Verify null/undefined handling
□ Test edge cases and error scenarios
□ Check console logs for debugging info
```

### When Making Changes:
```
□ Update ISSUES.md if fixing known issues
□ Add error handling if missing
□ Include null checks for data safety
□ Test both success and failure paths
□ Add comments for complex logic
□ Consider impact on related systems
```

## Never Trust These Documentation Files

**Outdated Files (Don't Use for Implementation Details):**
- systemPatterns.md (may contain outdated architecture info)
- techContext.md (may contain outdated technology details)
- activeContext.md (may contain outdated current work info)
- progress.md (may contain outdated completion status)

**Always Check Code Instead:**
- Read the actual implementation files
- Use list_code_definition_names to understand structure
- Check recent git history if available
- Look for inline comments and TODOs

## Quick Reference Commands

```bash
# Understand route structure
list_code_definition_names app/routes/

# Understand service layer
list_code_definition_names app/services/

# Check database schema
read_file prisma/schema.prisma

# Check known issues
read_file ISSUES.md

# Search for specific patterns
search_files app/ "TODO|FIXME|BUG"
```

Remember: **Code is the source of truth, not documentation.**
