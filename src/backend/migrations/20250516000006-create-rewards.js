"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rewards", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reward_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      reward_value: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      tier_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "tiers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add index for reward lookups
    await queryInterface.addIndex("rewards", ["tier_id"]);
    await queryInterface.addIndex("rewards", ["is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("rewards");
  },
};
