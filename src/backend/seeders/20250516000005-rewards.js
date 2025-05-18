"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Create reward IDs to reference in other seeders
    const rewardIds = {
      freeItem: uuidv4(),
      discount10: uuidv4(),
      discount20: uuidv4(),
      freeShipping: uuidv4(),
      birthdayGift: uuidv4(),
      exclusiveAccess: uuidv4(),
      vipEvent: uuidv4(),
    };

    // Get tier IDs from global variable set in tiers seeder
    const tierIds = global.tierIds;

    await queryInterface.bulkInsert("rewards", [
      {
        id: rewardIds.freeItem,
        name: "Free Item",
        description: "Free item up to $25 value",
        reward_type: "free_item",
        reward_value: JSON.stringify({ max_value: 25 }),
        tier_id: tierIds.welterweight,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: rewardIds.discount10,
        name: "10% Discount",
        description: "10% off any purchase",
        reward_type: "percentage_discount",
        reward_value: JSON.stringify({ percentage: 10, max_discount: 50 }),
        tier_id: tierIds.featherweight,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: rewardIds.discount20,
        name: "20% Discount",
        description: "20% off any purchase",
        reward_type: "percentage_discount",
        reward_value: JSON.stringify({ percentage: 20, max_discount: 100 }),
        tier_id: tierIds.lightweight,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: rewardIds.freeShipping,
        name: "Free Shipping",
        description: "Free shipping on any order",
        reward_type: "free_shipping",
        reward_value: JSON.stringify({ min_order: 0 }),
        tier_id: tierIds.lightweight,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: rewardIds.birthdayGift,
        name: "Birthday Gift",
        description: "Special gift for your birthday",
        reward_type: "birthday_gift",
        reward_value: JSON.stringify({ gift_value: 50 }),
        tier_id: tierIds.welterweight,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: rewardIds.exclusiveAccess,
        name: "Exclusive Access",
        description: "Early access to new releases",
        reward_type: "exclusive_access",
        reward_value: JSON.stringify({ days_early: 3 }),
        tier_id: tierIds.heavyweight,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: rewardIds.vipEvent,
        name: "VIP Event Invitation",
        description: "Invitation to exclusive VIP event",
        reward_type: "vip_event",
        reward_value: JSON.stringify({ event_type: "product_launch" }),
        tier_id: tierIds.champion,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    // Store reward IDs for reference in other seeders
    global.rewardIds = rewardIds;
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("rewards", null, {});
  },
};
