# TKO Toy Co Loyalty Program - System Patterns

**IMPORTANT: Always read .clinerules first, followed by ALL memory bank files at the start of EVERY task.**

See `memory-bank/taskWorkflow.md` for detailed task management procedures.

## System Architecture

The TKO Toy Co Loyalty Program follows a modular, service-oriented architecture to ensure flexibility, scalability, and maintainability. The system is designed to integrate with existing platforms (Shopify and POS Binder) while providing a standalone loyalty management solution.

```mermaid
flowchart TD
    subgraph "Presentation Layer"
        A[Admin Dashboard] --> |API Calls| D[API Gateway]
        B[Customer Portal] --> |API Calls| D
        C[Desktop Application] --> |API Calls| D
    end

    subgraph "API Layer"
        D --> E[Authentication Service]
        D --> F[Loyalty Core Service]
        D --> G[Integration Service]
        D --> H[Notification Service]
    end

    subgraph "Core Services"
        F --> I[Customer Service]
        F --> J[Tier Management Service]
        F --> K[Reward Service]
        F --> L[Transaction Service]
    end

    subgraph "Integration Layer"
        G --> M[Shopify Connector]
        G --> N[POS Binder Connector]
        H --> O[Email Service Connector]
    end

    subgraph "Data Layer"
        P[(Customer Database)]
        Q[(Transaction Database)]
        R[(Reward Database)]
        S[(Tier Configuration)]

        I <--> P
        J <--> S
        K <--> R
        L <--> Q
    end

    subgraph "External Systems"
        T[Shopify]
        U[POS Binder]
        V[Email Service]

        M <--> T
        N <--> U
        O <--> V
    end
```

## Key Design Patterns

### Repository Pattern

Used for data access abstraction, allowing the system to interact with the database through a consistent interface regardless of the underlying data storage technology.

```mermaid
classDiagram
    class ICustomerRepository {
        +GetById(id)
        +GetByPhone(phone)
        +Create(customer)
        +Update(customer)
        +Delete(id)
    }

    class CustomerRepository {
        -dbContext
        +GetById(id)
        +GetByPhone(phone)
        +Create(customer)
        +Update(customer)
        +Delete(id)
    }

    ICustomerRepository <|-- CustomerRepository

    class CustomerService {
        -customerRepository
        +GetCustomer(id)
        +RegisterCustomer(customerData)
        +UpdateCustomer(customerData)
    }

    CustomerService --> ICustomerRepository
```

### Service Pattern

Encapsulates business logic in service classes that are responsible for specific domains of functionality.

```mermaid
classDiagram
    class LoyaltyService {
        -customerService
        -transactionService
        -tierService
        -rewardService
        +CalculateTier(customerId)
        +ProcessTransaction(transactionData)
        +GetAvailableRewards(customerId)
    }

    LoyaltyService --> CustomerService
    LoyaltyService --> TransactionService
    LoyaltyService --> TierService
    LoyaltyService --> RewardService
```

### Strategy Pattern

Used for implementing different tier calculation strategies and reward distribution algorithms.

```mermaid
classDiagram
    class ITierCalculationStrategy {
        +CalculateTier(customerData)
    }

    class SpendBasedTierStrategy {
        +CalculateTier(customerData)
    }

    class FrequencyBasedTierStrategy {
        +CalculateTier(customerData)
    }

    class HybridTierStrategy {
        +CalculateTier(customerData)
    }

    ITierCalculationStrategy <|-- SpendBasedTierStrategy
    ITierCalculationStrategy <|-- FrequencyBasedTierStrategy
    ITierCalculationStrategy <|-- HybridTierStrategy

    class TierService {
        -tierCalculationStrategy
        +SetStrategy(strategy)
        +CalculateCustomerTier(customerId)
    }

    TierService --> ITierCalculationStrategy
```

### Observer Pattern

Implemented for notifications and event handling when customer tiers change or rewards become available.

```mermaid
classDiagram
    class ILoyaltyEventObserver {
        +OnTierChanged(customerId, oldTier, newTier)
        +OnRewardEarned(customerId, rewardId)
    }

    class EmailNotificationObserver {
        -emailService
        +OnTierChanged(customerId, oldTier, newTier)
        +OnRewardEarned(customerId, rewardId)
    }

    class AdminDashboardObserver {
        -dashboardService
        +OnTierChanged(customerId, oldTier, newTier)
        +OnRewardEarned(customerId, rewardId)
    }

    ILoyaltyEventObserver <|-- EmailNotificationObserver
    ILoyaltyEventObserver <|-- AdminDashboardObserver

    class LoyaltyEventManager {
        -observers
        +Subscribe(observer)
        +Unsubscribe(observer)
        +NotifyTierChanged(customerId, oldTier, newTier)
        +NotifyRewardEarned(customerId, rewardId)
    }

    LoyaltyEventManager --> ILoyaltyEventObserver
```

### Adapter Pattern

Used for integrating with external systems like Shopify and POS Binder.

```mermaid
classDiagram
    class ITransactionSource {
        +GetTransactions(customerId)
        +RecordTransaction(transactionData)
    }

    class ShopifyAdapter {
        -shopifyClient
        +GetTransactions(customerId)
        +RecordTransaction(transactionData)
    }

    class POSBinderAdapter {
        -posBinderClient
        +GetTransactions(customerId)
        +RecordTransaction(transactionData)
    }

    ITransactionSource <|-- ShopifyAdapter
    ITransactionSource <|-- POSBinderAdapter

    class TransactionService {
        -transactionSources
        +RegisterSource(source)
        +GetAllTransactions(customerId)
        +RecordTransaction(transactionData, sourceId)
    }

    TransactionService --> ITransactionSource
```

## Component Relationships

### Core Domain Model

```mermaid
classDiagram
    class Customer {
        +Id
        +Name
        +Phone
        +Email
        +JoinDate
        +CurrentTierId
        +TotalSpend
        +IsActive
    }

    class Tier {
        +Id
        +Name
        +SpendThreshold
        +Benefits
        +CardDesign
    }

    class Reward {
        +Id
        +Name
        +Description
        +Value
        +RequiredTierId
        +IsActive
        +ExpiryDate
    }

    class Transaction {
        +Id
        +CustomerId
        +Amount
        +Date
        +Source
        +Items
    }

    class CustomerReward {
        +Id
        +CustomerId
        +RewardId
        +IssuedDate
        +ExpiryDate
        +IsRedeemed
        +RedeemedDate
    }

    class MembershipCard {
        +Id
        +CustomerId
        +CardNumber
        +NfcId
        +ActivationDate
        +IsActive
        +TierId
    }

    Customer "1" -- "1" Tier
    Customer "1" -- "*" Transaction
    Customer "1" -- "*" CustomerReward
    Customer "1" -- "1" MembershipCard
    Reward "1" -- "*" CustomerReward
    Tier "1" -- "*" Reward
```

## Data Flow Patterns

### Customer Registration Flow

```mermaid
sequenceDiagram
    participant Staff as Staff/Admin
    participant API as API Gateway
    participant CS as Customer Service
    participant DB as Database
    participant NS as Notification Service
    participant Email as Email Service

    Staff->>API: Register Customer (name, phone, email)
    API->>CS: Create Customer
    CS->>DB: Store Customer Data
    DB-->>CS: Customer Created (ID)
    CS->>NS: Customer Created Event
    NS->>Email: Send Welcome Email
    Email-->>NS: Email Sent
    NS-->>CS: Notification Sent
    CS-->>API: Customer Registration Complete
    API-->>Staff: Registration Confirmation
```

### Transaction Processing Flow

```mermaid
sequenceDiagram
    participant Source as Shopify/POS
    participant IS as Integration Service
    participant TS as Transaction Service
    participant CS as Customer Service
    participant TierS as Tier Service
    participant RS as Reward Service
    participant NS as Notification Service

    Source->>IS: New Transaction
    IS->>TS: Process Transaction
    TS->>CS: Get Customer
    CS-->>TS: Customer Data
    TS->>CS: Update Total Spend
    CS-->>TS: Updated
    TS->>TierS: Check Tier Eligibility
    TierS-->>TS: Tier Change (if any)

    alt Tier Changed
        TS->>NS: Tier Change Event
        NS->>Source: Notify Tier Change
    end

    TS->>RS: Check Reward Eligibility
    RS-->>TS: New Rewards (if any)

    alt New Rewards
        TS->>NS: New Reward Event
        NS->>Source: Notify New Rewards
    end

    TS-->>IS: Transaction Processed
    IS-->>Source: Transaction Confirmation
```

## Critical Implementation Paths

### Integration Implementation

1. **Shopify Integration**

   - Implement Shopify API client
   - Create adapter for transaction synchronization
   - Develop webhook handlers for real-time events
   - Implement customer identification mechanism

2. **POS Binder Integration**
   - Develop POS Binder connector
   - Implement transaction import/export
   - Create customer lookup functionality
   - Develop card scanning interface

3. **Desktop Application Implementation**
   - Create Electron-based application with dual-window architecture
   - Implement system tray integration with context menu
   - Develop popup window for customer loyalty information
   - Create admin dashboard for comprehensive management
   - Implement IPC communication between main and renderer processes
   - Create service layer with repository pattern for data access
   - Implement single instance lock mechanism to prevent multiple instances

### Tier Management Implementation

1. **Tier Configuration**

   - Create tier definition interface
   - Implement tier threshold management
   - Develop tier benefit association
   - Create tier upgrade/downgrade logic

2. **Customer Tier Calculation**
   - Implement spend tracking
   - Develop tier calculation algorithms
   - Create tier change notification system
   - Implement tier history tracking

### Reward System Implementation

1. **Reward Definition**

   - Create reward management interface
   - Implement reward eligibility rules
   - Develop reward value calculation
   - Create reward activation/deactivation logic

2. **Reward Distribution**
   - Implement reward issuance system
   - Develop reward redemption process
   - Create reward expiration handling
   - Implement reward history tracking

## Technical Constraints and Considerations

1. **Performance Optimization**

   - Implement caching for frequently accessed data
   - Use database indexing for customer and transaction lookups
   - Optimize API calls to external systems
   - Implement batch processing for historical data

2. **Security Measures**

   - Implement secure API authentication
   - Encrypt sensitive customer data
   - Use secure token-based authentication for admin access
   - Implement role-based access control

3. **Scalability Considerations**

   - Design for horizontal scaling of services
   - Implement database sharding strategy for large customer bases
   - Use message queues for asynchronous processing
   - Design for multi-region deployment

4. **Resilience Patterns**
   - Implement circuit breakers for external service calls
   - Develop retry mechanisms for transient failures
   - Create fallback strategies for critical operations
   - Implement comprehensive logging and monitoring

## Task Context Management Pattern

The Task Context Management Pattern is a critical workflow pattern used in this project to ensure consistent knowledge transfer between development sessions and to maintain context across the development lifecycle.

```mermaid
flowchart TD
    A[Start New Task] --> B[Read .clinerules]
    B --> C[Read ALL Memory Bank Files]
    C --> D[Assess Current Context]
    D --> E[Implement Task]
    E --> F[Monitor Context Window Usage]
    F --> G{Context Usage > 70%?}
    G -->|No| E
    G -->|Yes| H[Update Memory Bank Files]
    H --> I[Create New Task Context]
    I --> J[Continue Implementation]
    J --> K[Complete Task]
    K --> L[Update Memory Bank Files]
    L --> M[Document Completed Work]
```

### Key Components

1. **Context Initialization**

   - Always read `.clinerules` first at the start of every task
   - Read ALL memory bank files in a specific order
   - Assess current project state and recent changes

2. **Context Monitoring**

   - Regularly check context window usage percentage
   - Create new task contexts at logical boundaries
   - Proactively manage context when usage exceeds 70-80%

3. **Context Preservation**

   - Update memory bank files before transitions
   - Document completed work and pending items
   - Capture important decisions and patterns

4. **Context Transition**
   - Use the `new_task` tool with comprehensive context
   - Include current status, technical concepts, and next steps
   - Ensure smooth handoff between task contexts

This pattern ensures that no critical information is lost between development sessions, maintaining a consistent understanding of the project state and enabling efficient continuation of work.
