# TKO Toy Co Loyalty Program - Database Migrations

This directory contains the database migration scripts for the TKO Toy Co Loyalty Program. These scripts are used to create and modify the database schema.

## Migration Files

The migration files are named with a timestamp prefix to ensure they run in the correct order. The current migrations are:

1. `20250516000001-create-tiers.js` - Creates the tiers table for loyalty program tiers
2. `20250516000002-create-customers.js` - Creates the customers table for loyalty program members
3. `20250516000003-create-tier-benefits.js` - Creates the tier_benefits table for benefits associated with each tier
4. `20250516000004-create-transactions.js` - Creates the transactions table for customer purchase records
5. `20250516000005-create-transaction-items.js` - Creates the transaction_items table for line items in transactions
6. `20250516000006-create-rewards.js` - Creates the rewards table for rewards that can be assigned to customers
7. `20250516000007-create-customer-rewards.js` - Creates the customer_rewards table for tracking rewards assigned to customers
8. `20250516000008-create-membership-cards.js` - Creates the membership_cards table for physical card information

## Running Migrations

You can run the migrations using the following npm scripts:

```bash
# Run all pending migrations
npm run db:migrate

# Undo the most recent migration
npm run db:migrate:undo

# Undo all migrations
npm run db:migrate:undo:all

# Initialize the database with migrations and seed data
npm run db:init

# Reset the database (drop, create, migrate, seed)
npm run db:reset
```

## Migration Structure

Each migration file exports an object with two methods:

- `up`: Runs when the migration is applied
- `down`: Runs when the migration is reverted

Example:

```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("table_name", {
      // table columns
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("table_name");
  },
};
```

## Seed Data

After running migrations, you can populate the database with seed data using:

```bash
npm run db:seed
```

The seed files are located in the `src/backend/seeders` directory and follow a similar naming convention to ensure they run in the correct order.

## Database Initialization

For a complete database setup including migrations and seed data, use:

```bash
npm run db:init
```

This script will run all migrations and seeders in the correct order.

## Foreign Key Relationships

The migrations create the following foreign key relationships:

- `customers.tier_id` references `tiers.id`
- `tier_benefits.tier_id` references `tiers.id`
- `transactions.customer_id` references `customers.id`
- `transaction_items.transaction_id` references `transactions.id`
- `customer_rewards.customer_id` references `customers.id`
- `customer_rewards.reward_id` references `rewards.id`
- `membership_cards.customer_id` references `customers.id`

These relationships ensure data integrity and enable proper cascading of updates and deletes.
