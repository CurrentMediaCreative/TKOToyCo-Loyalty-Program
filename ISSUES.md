# TKO Loyalty App Issues

**Last Updated:** 2025-01-21
**Analysis Method:** Direct code examination

## Priority 1 (Critical - Breaks Functionality)

### #001: Customer Page Checkbox Selection Bug
- **File:** `app/routes/app.customers.tsx`
- **Lines:** 89-120 (handleSelectionChange function)
- **Severity:** Critical
- **Impact:** Users cannot deselect customers after selecting, especially "select all"
- **Root Cause:** Manual selection state logic conflicts with IndexTable's built-in selection
- **Status:** Confirmed via code review
- **Fix Required:** Replace custom selection logic with Shopify's IndexTable selection API

### #002: NaN Display in Customer Table ✅ **FIXED**
- **File:** `app/routes/app.customers.tsx`
- **Lines:** 347-348 (IndexTable.Cell components)
- **Severity:** Critical
- **Impact:** Store credit and loyalty eligible columns show "NaN" instead of values
- **Root Cause:** Missing null checks before calling `.toFixed(2)` on undefined values
- **Status:** ✅ **FIXED** - 2025-01-21
- **Fix Applied:** Added fallback values: `(customer.storeCreditUsed || 0).toFixed(2)`

### #003: JSON Parsing Without Error Handling
- **File:** `app/services/pointEvent.server.ts`
- **Lines:** 165, 200 (JSON.parse calls)
- **Severity:** Critical
- **Impact:** App crashes if event collections/productIds contain malformed JSON
- **Root Cause:** No try/catch around JSON.parse operations
- **Status:** Confirmed via code review
- **Fix Required:** Add proper error handling and validation

## Priority 2 (Important - Affects UX)

### #004: Tier Benefits Parsing is Brittle
- **File:** `app/routes/app.tiers.tsx`
- **Lines:** 300+ (getBenefitForTier function)
- **Severity:** Important
- **Impact:** Tier benefits display may break with benefit text changes
- **Root Cause:** Hardcoded string matching for benefit parsing
- **Status:** Confirmed via code review
- **Fix Required:** Implement structured benefit data model

### #005: Missing Customer-Facing Features
- **Files:** Checkout extension, customer account integration
- **Severity:** Important
- **Impact:** Customers cannot see their loyalty status
- **Root Cause:** Admin-only APIs being called from public contexts
- **Status:** Confirmed via code review
- **Fix Required:** Create public API endpoints and fix checkout extension

### #006: Webhook Error Handling Gaps
- **File:** `app/routes/webhooks.orders.fulfilled.tsx`
- **Lines:** 89, 200, 350 (error scenarios)
- **Severity:** Important
- **Impact:** Failed webhooks may cause data inconsistency
- **Root Cause:** Incomplete error handling and database cleanup
- **Status:** Confirmed via code review
- **Fix Required:** Add comprehensive error handling and transaction rollback

## Priority 3 (Nice to Have)

### #007: Performance Issues
- **Files:** Various (tier comparison table, product collection fetching)
- **Severity:** Low
- **Impact:** Slow loading times with large datasets
- **Root Cause:** No caching, inefficient queries
- **Status:** Identified via code review
- **Fix Required:** Implement caching and query optimization

### #008: Security Concerns
- **Files:** JSON parsing, webhook endpoints, customer data logging
- **Severity:** Medium
- **Impact:** Potential security vulnerabilities
- **Root Cause:** Insufficient input validation and excessive logging
- **Status:** Identified via code review
- **Fix Required:** Add input validation and reduce sensitive data logging

## Completed Issues

### #000: Store Credit Sync Implementation
- **Status:** ✅ Completed
- **Date:** 2025-01-20
- **Description:** Fixed comprehensive store credit tracking and sync

### #000: GraphQL Field Bug Fix
- **Status:** ✅ Completed  
- **Date:** 2025-01-19
- **Description:** Fixed totalSpent → amountSpent field errors in webhook processing

## Notes

- **Always verify issue status by checking actual code**
- **Update this file after each fix**
- **Add new issues as they're discovered**
- **Include file paths and line numbers for quick navigation**
