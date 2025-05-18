# Customer Detail View

This wireframe represents the detailed view of an individual customer in the TKO Toy Co Loyalty Program. It provides comprehensive information about the customer, their transaction history, and other relevant details.

```mermaid
graph TD
    subgraph "Customer Detail View"
        A[Header: Customer Profile] --> B[Customer Info Section]
        B --> C[Name: John Smith]
        B --> D[Email: john@example.com]
        B --> E[Phone: 555-123-4567]
        B --> F[Signup Date: 01/15/2025]
        B --> G[Current Tier: Gold]
        B --> H[Total Spend: $1,245]
        B --> I[Card Number: TKO-12345]
        B --> J[Card Status: Active]
        B --> K[Edit Profile Button]

        A --> L[Tabs Navigation]
        L --> M[Transaction History Tab]
        L --> N[Notes Tab]

        M --> O[Transaction Table]
        O --> P[Date Column]
        O --> Q[Amount Column]
        O --> R[Items Column]
        O --> S[Source Column]
        O --> T[Applied Benefits Column]

        N --> U[Notes Section]
        U --> V[Add Note Button]
        U --> W[Notes List]
        W --> X[Date/Time]
        W --> Y[Employee]
        W --> Z[Note Content]
    end
```

## Key Components

1. **Customer Info Section**

   - Essential customer information displayed prominently and editable
   - Visual indicator of loyalty tier (with boxing-themed color coding)
   - Physical card information integrated directly in the main view
   - Summary of key metrics (total spend, visit frequency)
   - Edit button to modify customer details

2. **Tabs Navigation**

   - Organized sections for different aspects of customer data
   - Maintains clean interface while providing comprehensive information
   - Tab state persists between visits to the customer profile

3. **Transaction History**

   - Complete record of customer purchases
   - Sortable and filterable table
   - Links to detailed transaction records
   - Export functionality for reporting
   - "Applied Benefits" column showing tier benefits applied to each transaction

4. **Notes Section**
   - Internal notes about the customer
   - Communication history
   - Special considerations or preferences
   - Tagged notes for easy filtering
   - Timestamp and employee attribution for each note

## User Interactions

- Administrators can edit customer information via the Edit Profile button
- Tabs switch between different sections of customer data
- Transaction history can be filtered by date range, amount, or source
- Card status can be updated directly from the main customer info section
- Notes can be added, edited, or categorized with tags
- Tier benefits are automatically displayed based on the customer's current tier

## Tier Benefits Display

The customer's current tier (e.g., "Gold" corresponding to a boxing weight class) is prominently displayed with visual indicators. When staff access a customer's profile:

1. The tier is clearly shown with appropriate boxing-themed styling
2. A tooltip or expandable section shows the specific benefits associated with that tier
3. During transaction processing, these benefits are automatically suggested for application
4. The transaction history shows which benefits were applied to past purchases
