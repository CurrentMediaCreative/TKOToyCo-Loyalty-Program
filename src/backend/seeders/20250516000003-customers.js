"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use the tier IDs from the previous seeder
    const tierIds = global.tierIds || {
      featherweight: "00000000-0000-0000-0000-000000000001",
      lightweight: "00000000-0000-0000-0000-000000000002",
      welterweight: "00000000-0000-0000-0000-000000000003",
      heavyweight: "00000000-0000-0000-0000-000000000004",
      champion: "00000000-0000-0000-0000-000000000005",
    };

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Create customer IDs to reference in other seeders
    const customerIds = {
      john: uuidv4(),
      jane: uuidv4(),
      bob: uuidv4(),
      alice: uuidv4(),
      charlie: uuidv4(),
      diana: uuidv4(),
      edward: uuidv4(),
    };

    await queryInterface.bulkInsert("customers", [
      // Champion tier customer (Invite Only)
      {
        id: customerIds.john,
        first_name: "John",
        last_name: "Smith",
        email: "john.smith@example.com",
        phone: "555-123-4567",
        join_date: oneYearAgo,
        tier_id: tierIds.champion,
        total_spend: 150000.0,
        is_active: true,
        created_at: oneYearAgo,
        updated_at: now,
      },
      // Heavyweight tier customer ($25000+)
      {
        id: customerIds.jane,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane.doe@example.com",
        phone: "555-234-5678",
        join_date: sixMonthsAgo,
        tier_id: tierIds.heavyweight,
        total_spend: 35000.0,
        is_active: true,
        created_at: sixMonthsAgo,
        updated_at: now,
      },
      // Welterweight tier customer ($5000-$19999)
      {
        id: customerIds.bob,
        first_name: "Bob",
        last_name: "Johnson",
        email: "bob.johnson@example.com",
        phone: "555-345-6789",
        join_date: oneYearAgo,
        tier_id: tierIds.welterweight,
        total_spend: 12500.0,
        is_active: true,
        created_at: oneYearAgo,
        updated_at: now,
      },
      // Another Welterweight tier customer
      {
        id: customerIds.alice,
        first_name: "Alice",
        last_name: "Williams",
        email: "alice.williams@example.com",
        phone: "555-456-7890",
        join_date: threeMonthsAgo,
        tier_id: tierIds.welterweight,
        total_spend: 7500.0,
        is_active: true,
        created_at: threeMonthsAgo,
        updated_at: now,
      },
      // Lightweight tier customer ($1500-$4999)
      {
        id: customerIds.charlie,
        first_name: "Charlie",
        last_name: "Brown",
        email: "charlie.brown@example.com",
        phone: "555-567-8901",
        join_date: sixMonthsAgo,
        tier_id: tierIds.lightweight,
        total_spend: 3500.0,
        is_active: true,
        created_at: sixMonthsAgo,
        updated_at: now,
      },
      // Another Lightweight tier customer
      {
        id: customerIds.diana,
        first_name: "Diana",
        last_name: "Miller",
        email: "diana.miller@example.com",
        phone: "555-678-9012",
        join_date: oneMonthAgo,
        tier_id: tierIds.lightweight,
        total_spend: 2000.0,
        is_active: true,
        created_at: oneMonthAgo,
        updated_at: now,
      },
      // Featherweight tier customer ($0-$1499)
      {
        id: customerIds.edward,
        first_name: "Edward",
        last_name: "Davis",
        email: "edward.davis@example.com",
        phone: "555-789-0123",
        join_date: now,
        tier_id: tierIds.featherweight,
        total_spend: 750.0,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    // Store customer IDs for reference in other seeders
    global.customerIds = customerIds;
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("customers", null, {});
  },
};
