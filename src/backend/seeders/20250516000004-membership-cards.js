"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use the customer and tier IDs from the previous seeders
    const customerIds = global.customerIds || {
      john: "00000000-0000-0000-0000-000000000001",
      jane: "00000000-0000-0000-0000-000000000002",
      bob: "00000000-0000-0000-0000-000000000003",
      alice: "00000000-0000-0000-0000-000000000004",
      charlie: "00000000-0000-0000-0000-000000000005",
      diana: "00000000-0000-0000-0000-000000000006",
      edward: "00000000-0000-0000-0000-000000000007",
    };

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

    await queryInterface.bulkInsert("membership_cards", [
      // John's Champion card
      {
        id: uuidv4(),
        customer_id: customerIds.john,
        card_number: "CHAMP-1001-2024",
        nfc_id: "NFC-CHAMP-1001",
        activation_date: oneYearAgo,
        is_active: true,
        tier_id: tierIds.champion,
        created_at: oneYearAgo,
        updated_at: now,
      },
      // Jane's Heavyweight card
      {
        id: uuidv4(),
        customer_id: customerIds.jane,
        card_number: "HEAVY-2001-2024",
        nfc_id: "NFC-HEAVY-2001",
        activation_date: sixMonthsAgo,
        is_active: true,
        tier_id: tierIds.heavyweight,
        created_at: sixMonthsAgo,
        updated_at: now,
      },
      // Bob's Welterweight card
      {
        id: uuidv4(),
        customer_id: customerIds.bob,
        card_number: "WELTER-3001-2024",
        nfc_id: "NFC-WELTER-3001",
        activation_date: oneYearAgo,
        is_active: true,
        tier_id: tierIds.welterweight,
        created_at: oneYearAgo,
        updated_at: now,
      },
      // Alice's Welterweight card
      {
        id: uuidv4(),
        customer_id: customerIds.alice,
        card_number: "WELTER-3002-2024",
        nfc_id: "NFC-WELTER-3002",
        activation_date: threeMonthsAgo,
        is_active: true,
        tier_id: tierIds.welterweight,
        created_at: threeMonthsAgo,
        updated_at: now,
      },
      // Charlie's Lightweight card
      {
        id: uuidv4(),
        customer_id: customerIds.charlie,
        card_number: "LIGHT-4001-2024",
        nfc_id: "NFC-LIGHT-4001",
        activation_date: sixMonthsAgo,
        is_active: true,
        tier_id: tierIds.lightweight,
        created_at: sixMonthsAgo,
        updated_at: now,
      },
      // Diana's Lightweight card
      {
        id: uuidv4(),
        customer_id: customerIds.diana,
        card_number: "LIGHT-4002-2024",
        nfc_id: "NFC-LIGHT-4002",
        activation_date: oneMonthAgo,
        is_active: true,
        tier_id: tierIds.lightweight,
        created_at: oneMonthAgo,
        updated_at: now,
      },
      // Edward's Featherweight card
      {
        id: uuidv4(),
        customer_id: customerIds.edward,
        card_number: "FEATHER-5001-2024",
        nfc_id: "NFC-FEATHER-5001",
        activation_date: now,
        is_active: true,
        tier_id: tierIds.featherweight,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("membership_cards", null, {});
  },
};
