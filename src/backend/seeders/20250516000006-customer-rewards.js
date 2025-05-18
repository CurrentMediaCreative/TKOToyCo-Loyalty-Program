"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use the customer and reward IDs from the previous seeders
    const customerIds = global.customerIds || {
      john: "00000000-0000-0000-0000-000000000001",
      jane: "00000000-0000-0000-0000-000000000002",
      bob: "00000000-0000-0000-0000-000000000003",
      alice: "00000000-0000-0000-0000-000000000004",
      charlie: "00000000-0000-0000-0000-000000000005",
      diana: "00000000-0000-0000-0000-000000000006",
      edward: "00000000-0000-0000-0000-000000000007",
    };

    const rewardIds = global.rewardIds || {
      freeItem: "00000000-0000-0000-0000-000000000001",
      discount10: "00000000-0000-0000-0000-000000000002",
      discount20: "00000000-0000-0000-0000-000000000003",
      freeShipping: "00000000-0000-0000-0000-000000000004",
      birthdayGift: "00000000-0000-0000-0000-000000000005",
      exclusiveAccess: "00000000-0000-0000-0000-000000000006",
      vipEvent: "00000000-0000-0000-0000-000000000007",
    };

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    await queryInterface.bulkInsert("customer_rewards", [
      // John's rewards (Champion tier)
      {
        id: uuidv4(),
        customer_id: customerIds.john,
        reward_id: rewardIds.freeItem,
        issued_date: oneMonthAgo,
        created_at: oneMonthAgo,
        updated_at: now,
      },
      {
        id: uuidv4(),
        customer_id: customerIds.john,
        reward_id: rewardIds.discount20,
        issued_date: twoMonthsAgo,
        created_at: twoMonthsAgo,
        updated_at: now,
      },
      {
        id: uuidv4(),
        customer_id: customerIds.john,
        reward_id: rewardIds.vipEvent,
        issued_date: threeMonthsAgo,
        created_at: threeMonthsAgo,
        updated_at: now,
      },
      {
        id: uuidv4(),
        customer_id: customerIds.john,
        reward_id: rewardIds.birthdayGift,
        issued_date: oneMonthAgo,
        created_at: oneMonthAgo,
        updated_at: now,
      },

      // Jane's rewards (Heavyweight tier)
      {
        id: uuidv4(),
        customer_id: customerIds.jane,
        reward_id: rewardIds.discount20,
        issued_date: oneMonthAgo,
        created_at: oneMonthAgo,
        updated_at: now,
      },
      {
        id: uuidv4(),
        customer_id: customerIds.jane,
        reward_id: rewardIds.freeShipping,
        issued_date: twoMonthsAgo,
        created_at: twoMonthsAgo,
        updated_at: now,
      },
      {
        id: uuidv4(),
        customer_id: customerIds.jane,
        reward_id: rewardIds.exclusiveAccess,
        issued_date: threeMonthsAgo,
        created_at: threeMonthsAgo,
        updated_at: now,
      },

      // Bob's rewards (Welterweight tier)
      {
        id: uuidv4(),
        customer_id: customerIds.bob,
        reward_id: rewardIds.discount10,
        issued_date: oneMonthAgo,
        created_at: oneMonthAgo,
        updated_at: now,
      },
      {
        id: uuidv4(),
        customer_id: customerIds.bob,
        reward_id: rewardIds.freeShipping,
        issued_date: twoMonthsAgo,
        created_at: twoMonthsAgo,
        updated_at: now,
      },

      // Alice's rewards (Welterweight tier)
      {
        id: uuidv4(),
        customer_id: customerIds.alice,
        reward_id: rewardIds.discount10,
        issued_date: oneMonthAgo,
        created_at: oneMonthAgo,
        updated_at: now,
      },

      // Charlie's rewards (Lightweight tier)
      {
        id: uuidv4(),
        customer_id: customerIds.charlie,
        reward_id: rewardIds.discount10,
        issued_date: twoMonthsAgo,
        created_at: twoMonthsAgo,
        updated_at: now,
      },

      // Diana's rewards (Lightweight tier)
      {
        id: uuidv4(),
        customer_id: customerIds.diana,
        reward_id: rewardIds.freeItem,
        issued_date: oneMonthAgo,
        created_at: oneMonthAgo,
        updated_at: now,
      },

      // Edward has no rewards yet (Featherweight tier - new member)
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("customer_rewards", null, {});
  },
};
