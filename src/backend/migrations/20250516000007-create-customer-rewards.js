"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("customer_rewards", {
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
      reward_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "rewards",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      issued_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_redeemed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      redeemed_date: {
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

    // Add indexes for customer reward lookups
    await queryInterface.addIndex("customer_rewards", ["customer_id"]);
    await queryInterface.addIndex("customer_rewards", ["reward_id"]);
    await queryInterface.addIndex("customer_rewards", ["is_redeemed"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("customer_rewards");
  },
};
