"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const tierIds = {
      featherweight: uuidv4(),
      lightweight: uuidv4(),
      welterweight: uuidv4(),
      heavyweight: uuidv4(),
      champion: uuidv4(),
    };

    await queryInterface.bulkInsert("tiers", [
      {
        id: tierIds.featherweight,
        name: "Featherweight",
        description: "Entry level tier for new members",
        spend_threshold: 0,
        card_design: "featherweight_card.png",
        is_active: true,
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: tierIds.lightweight,
        name: "Lightweight",
        description: "Second tier with enhanced benefits",
        spend_threshold: 1500,
        card_design: "lightweight_card.png",
        is_active: true,
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
      {
        id: tierIds.welterweight,
        name: "Welterweight",
        description: "Third tier with premium benefits",
        spend_threshold: 5000,
        card_design: "welterweight_card.png",
        is_active: true,
        sort_order: 3,
        created_at: now,
        updated_at: now,
      },
      {
        id: tierIds.heavyweight,
        name: "Heavyweight",
        description: "Fourth tier with exclusive benefits",
        spend_threshold: 25000,
        card_design: "heavyweight_card.png",
        is_active: true,
        sort_order: 4,
        created_at: now,
        updated_at: now,
      },
      {
        id: tierIds.champion,
        name: "Reigning Champion",
        description: "Invite-only tier with ultimate benefits",
        spend_threshold: 100000, // High threshold as it's invite-only
        card_design: "champion_card.png",
        is_active: true,
        sort_order: 5,
        created_at: now,
        updated_at: now,
      },
    ]);

    // Store tier IDs for reference in other seeders
    global.tierIds = tierIds;
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("tiers", null, {});
  },
};
