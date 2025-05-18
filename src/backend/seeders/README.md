# TKO Toy Co Loyalty Program - Database Seeders

This directory contains the database seed files for the TKO Toy Co Loyalty Program. These scripts are used to populate the database with sample data for development and testing purposes.

## Seeder Files

The seeder files are named with a timestamp prefix to ensure they run in the correct order. The current seeders are:

1. `20250516000001-tiers.js` - Creates sample loyalty tiers (Featherweight, Lightweight, Welterweight, Heavyweight, Champion)
2. `20250516000002-tier-benefits.js` - Creates sample benefits for each tier
3. `20250516000003-customers.js` - Creates sample customers with different tier levels
4. `20250516000004-membership-cards.js` - Creates sample membership cards for customers
5. `20250516000005-rewards.js` - Creates sample rewards that can be assigned to customers
6. `20250516000006-customer-rewards.js` - Creates sample reward assignments to customers
7. `20250516000007-transactions.js` - Creates sample purchase transactions for customers
8. `20250516000008-transaction-items.js` - Creates sample line items for the transactions

## Running Seeders

You can run the seeders using the following npm scripts:

```bash
# Run all seeders
npm run db:seed

# Run a specific seeder
npx sequelize-cli db:seed --seed 20250516000001-tiers.js

# Undo the most recent seeder
npx sequelize-cli db:seed:undo

# Undo a specific seeder
npx sequelize-cli db:seed:undo --seed 20250516000001-tiers.js

# Undo all seeders
npx sequelize-cli db:seed:undo:all

# Initialize the database with migrations and seed data
npm run db:init

# Reset the database (drop, create, migrate, seed)
npm run db:reset
```

## Seeder Structure

Each seeder file exports an object with two methods:

- `up`: Runs when the seeder is applied
- `down`: Runs when the seeder is reverted

Example:

```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("table_name", [
      {
        // sample data
      },
      // more sample data
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("table_name", null, {});
  },
};
```

## Data Relationships

The seeders maintain relationships between entities by using predefined IDs or storing generated IDs in global variables for reference in subsequent seeders. For example:

- Tier IDs are predefined and referenced in the customers seeder
- Customer IDs are stored in `global.customerIds` and referenced in transactions and membership cards seeders
- Transaction IDs are stored in `global.transactionIds` and referenced in transaction items seeder

This approach ensures that the sample data maintains proper relationships between entities.

## Sample Data

The sample data includes:

- 5 loyalty tiers with boxing weight class themes
- 15 tier benefits across all tiers
- 7 sample customers with different tier levels
- 7 membership cards for the customers
- 5 reward types
- 10 customer reward assignments
- 15 sample transactions
- 25+ transaction line items

This data provides a realistic representation of the loyalty program for development and testing purposes.

## Database Initialization

For a complete database setup including migrations and seed data, use:

```bash
npm run db:init
```

This script will run all migrations and seeders in the correct order.
