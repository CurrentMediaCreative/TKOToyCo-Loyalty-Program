"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tier_benefits", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      benefit_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      benefit_value: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    // Add index for tier benefit lookups
    await queryInterface.addIndex("tier_benefits", ["tier_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tier_benefits");
  },
};
