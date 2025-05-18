"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("membership_cards", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      card_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      nfc_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      activation_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes for membership card lookups
    await queryInterface.addIndex("membership_cards", ["customer_id"]);
    await queryInterface.addIndex("membership_cards", ["card_number"]);
    await queryInterface.addIndex("membership_cards", ["nfc_id"]);
    await queryInterface.addIndex("membership_cards", ["tier_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("membership_cards");
  },
};
