"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("customers", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      join_date: {
        type: Sequelize.DATEONLY,
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
      total_spend: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
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

    // Add indexes for customer lookups
    await queryInterface.addIndex("customers", ["email"]);
    await queryInterface.addIndex("customers", ["phone"]);
    await queryInterface.addIndex("customers", ["tier_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("customers");
  },
};
