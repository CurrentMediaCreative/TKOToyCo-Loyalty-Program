"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use the customer IDs from the previous seeders
    const customerIds = global.customerIds || {
      john: "00000000-0000-0000-0000-000000000001",
      jane: "00000000-0000-0000-0000-000000000002",
      bob: "00000000-0000-0000-0000-000000000003",
      alice: "00000000-0000-0000-0000-000000000004",
      charlie: "00000000-0000-0000-0000-000000000005",
      diana: "00000000-0000-0000-0000-000000000006",
      edward: "00000000-0000-0000-0000-000000000007",
    };

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const nineMonthsAgo = new Date(now);
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);

    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Create transaction IDs to reference in other seeders
    const transactionIds = {
      john1: uuidv4(),
      john2: uuidv4(),
      john3: uuidv4(),
      john4: uuidv4(),
      jane1: uuidv4(),
      jane2: uuidv4(),
      jane3: uuidv4(),
      bob1: uuidv4(),
      bob2: uuidv4(),
      alice1: uuidv4(),
      alice2: uuidv4(),
      charlie1: uuidv4(),
      charlie2: uuidv4(),
      diana1: uuidv4(),
      edward1: uuidv4(),
    };

    await queryInterface.bulkInsert("transactions", [
      // John's transactions (Champion tier)
      {
        id: transactionIds.john1,
        customer_id: customerIds.john,
        transaction_date: oneYearAgo,
        amount: 50000.0,
        source: "in_store",
        reference_id: "POS-12345",
        status: "completed",
        created_at: oneYearAgo,
        updated_at: oneYearAgo,
      },
      {
        id: transactionIds.john2,
        customer_id: customerIds.john,
        transaction_date: nineMonthsAgo,
        amount: 35000.0,
        source: "online",
        reference_id: "ORD-67890",
        status: "completed",
        created_at: nineMonthsAgo,
        updated_at: nineMonthsAgo,
      },
      {
        id: transactionIds.john3,
        customer_id: customerIds.john,
        transaction_date: sixMonthsAgo,
        amount: 45000.0,
        source: "in_store",
        reference_id: "POS-23456",
        status: "completed",
        created_at: sixMonthsAgo,
        updated_at: sixMonthsAgo,
      },
      {
        id: transactionIds.john4,
        customer_id: customerIds.john,
        transaction_date: oneMonthAgo,
        amount: 20000.0,
        source: "online",
        reference_id: "ORD-78901",
        status: "completed",
        created_at: oneMonthAgo,
        updated_at: oneMonthAgo,
      },

      // Jane's transactions (Heavyweight tier)
      {
        id: transactionIds.jane1,
        customer_id: customerIds.jane,
        transaction_date: sixMonthsAgo,
        amount: 15000.0,
        source: "in_store",
        reference_id: "POS-34567",
        status: "completed",
        created_at: sixMonthsAgo,
        updated_at: sixMonthsAgo,
      },
      {
        id: transactionIds.jane2,
        customer_id: customerIds.jane,
        transaction_date: threeMonthsAgo,
        amount: 12000.0,
        source: "online",
        reference_id: "ORD-89012",
        status: "completed",
        created_at: threeMonthsAgo,
        updated_at: threeMonthsAgo,
      },
      {
        id: transactionIds.jane3,
        customer_id: customerIds.jane,
        transaction_date: oneMonthAgo,
        amount: 8000.0,
        source: "in_store",
        reference_id: "POS-45678",
        status: "completed",
        created_at: oneMonthAgo,
        updated_at: oneMonthAgo,
      },

      // Bob's transactions (Welterweight tier)
      {
        id: transactionIds.bob1,
        customer_id: customerIds.bob,
        transaction_date: oneYearAgo,
        amount: 7500.0,
        source: "in_store",
        reference_id: "POS-56789",
        status: "completed",
        created_at: oneYearAgo,
        updated_at: oneYearAgo,
      },
      {
        id: transactionIds.bob2,
        customer_id: customerIds.bob,
        transaction_date: sixMonthsAgo,
        amount: 5000.0,
        source: "online",
        reference_id: "ORD-90123",
        status: "completed",
        created_at: sixMonthsAgo,
        updated_at: sixMonthsAgo,
      },

      // Alice's transactions (Welterweight tier)
      {
        id: transactionIds.alice1,
        customer_id: customerIds.alice,
        transaction_date: threeMonthsAgo,
        amount: 4500.0,
        source: "in_store",
        reference_id: "POS-67890",
        status: "completed",
        created_at: threeMonthsAgo,
        updated_at: threeMonthsAgo,
      },
      {
        id: transactionIds.alice2,
        customer_id: customerIds.alice,
        transaction_date: oneMonthAgo,
        amount: 3000.0,
        source: "online",
        reference_id: "ORD-01234",
        status: "completed",
        created_at: oneMonthAgo,
        updated_at: oneMonthAgo,
      },

      // Charlie's transactions (Lightweight tier)
      {
        id: transactionIds.charlie1,
        customer_id: customerIds.charlie,
        transaction_date: sixMonthsAgo,
        amount: 2000.0,
        source: "in_store",
        reference_id: "POS-78901",
        status: "completed",
        created_at: sixMonthsAgo,
        updated_at: sixMonthsAgo,
      },
      {
        id: transactionIds.charlie2,
        customer_id: customerIds.charlie,
        transaction_date: twoMonthsAgo,
        amount: 1500.0,
        source: "online",
        reference_id: "ORD-12345",
        status: "completed",
        created_at: twoMonthsAgo,
        updated_at: twoMonthsAgo,
      },

      // Diana's transactions (Lightweight tier)
      {
        id: transactionIds.diana1,
        customer_id: customerIds.diana,
        transaction_date: oneMonthAgo,
        amount: 2000.0,
        source: "in_store",
        reference_id: "POS-89012",
        status: "completed",
        created_at: oneMonthAgo,
        updated_at: oneMonthAgo,
      },

      // Edward's transactions (Featherweight tier)
      {
        id: transactionIds.edward1,
        customer_id: customerIds.edward,
        transaction_date: now,
        amount: 750.0,
        source: "online",
        reference_id: "ORD-23456",
        status: "completed",
        created_at: now,
        updated_at: now,
      },
    ]);

    // Store transaction IDs for reference in other seeders
    global.transactionIds = transactionIds;
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("transactions", null, {});
  },
};
