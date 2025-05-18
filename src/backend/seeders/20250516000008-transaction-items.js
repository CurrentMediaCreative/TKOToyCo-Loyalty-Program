"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use the transaction IDs from the previous seeders
    const transactionIds = global.transactionIds || {
      john1: "00000000-0000-0000-0000-000000000001",
      john2: "00000000-0000-0000-0000-000000000002",
      john3: "00000000-0000-0000-0000-000000000003",
      john4: "00000000-0000-0000-0000-000000000004",
      jane1: "00000000-0000-0000-0000-000000000005",
      jane2: "00000000-0000-0000-0000-000000000006",
      jane3: "00000000-0000-0000-0000-000000000007",
      bob1: "00000000-0000-0000-0000-000000000008",
      bob2: "00000000-0000-0000-0000-000000000009",
      alice1: "00000000-0000-0000-0000-000000000010",
      alice2: "00000000-0000-0000-0000-000000000011",
      charlie1: "00000000-0000-0000-0000-000000000012",
      charlie2: "00000000-0000-0000-0000-000000000013",
      diana1: "00000000-0000-0000-0000-000000000014",
      edward1: "00000000-0000-0000-0000-000000000015",
    };

    const now = new Date();

    await queryInterface.bulkInsert("transaction_items", [
      // John's transaction 1 items (Champion tier)
      {
        id: uuidv4(),
        transaction_id: transactionIds.john1,
        product_id: "PKM-BB-001",
        product_name: "Pokémon Scarlet & Violet Booster Box",
        quantity: 5,
        price: 9000.0,
        total: 45000.0,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        transaction_id: transactionIds.john1,
        product_id: "PKM-ETB-001",
        product_name: "Pokémon Scarlet & Violet Elite Trainer Box",
        quantity: 2,
        price: 2500.0,
        total: 5000.0,
        created_at: now,
        updated_at: now,
      },

      // John's transaction 2 items
      {
        id: uuidv4(),
        transaction_id: transactionIds.john2,
        product_id: "PKM-COLL-001",
        product_name: "Pokémon Special Collection Box",
        quantity: 3,
        price: 5000.0,
        total: 15000.0,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        transaction_id: transactionIds.john2,
        product_id: "MTG-BB-001",
        product_name: "Magic The Gathering Modern Horizons 3 Booster Box",
        quantity: 2,
        price: 10000.0,
        total: 20000.0,
        created_at: now,
        updated_at: now,
      },

      // John's transaction 3 items
      {
        id: uuidv4(),
        transaction_id: transactionIds.john3,
        product_id: "PKM-RARE-001",
        product_name: "Charizard Illustrator PSA 10",
        quantity: 1,
        price: 35000.0,
        total: 35000.0,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        transaction_id: transactionIds.john3,
        product_id: "PKM-PACKS-001",
        product_name: "Pokémon Base Set Booster Pack",
        quantity: 2,
        price: 5000.0,
        total: 10000.0,
        created_at: now,
        updated_at: now,
      },

      // John's transaction 4 items
      {
        id: uuidv4(),
        transaction_id: transactionIds.john4,
        product_id: "MTG-COLL-001",
        product_name: "Magic The Gathering Secret Lair Bundle",
        quantity: 1,
        price: 20000.0,
        total: 20000.0,
        created_at: now,
        updated_at: now,
      },

      // Jane's transaction 1 items (Heavyweight tier)
      {
        id: uuidv4(),
        transaction_id: transactionIds.jane1,
        product_id: "OP-BB-001",
        product_name: "One Piece Card Game Booster Box",
        quantity: 2,
        price: 5000.0,
        total: 10000.0,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        transaction_id: transactionIds.jane1,
        product_id: "OP-SD-001",
        product_name: "One Piece Card Game Starter Deck",
        quantity: 5,
        price: 1000.0,
        total: 5000.0,
        created_at: now,
        updated_at: now,
      },

      // Jane's transaction 2 items
      {
        id: uuidv4(),
        transaction_id: transactionIds.jane2,
        product_id: "MTG-BUNDLE-001",
        product_name: "Magic The Gathering Bundle",
        quantity: 2,
        price: 3000.0,
        total: 6000.0,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        transaction_id: transactionIds.jane2,
        product_id: "MTG-COMM-001",
        product_name: "Magic The Gathering Commander Deck",
        quantity: 2,
        price: 3000.0,
        total: 6000.0,
        created_at: now,
        updated_at: now,
      },

      // Jane's transaction 3 items
      {
        id: uuidv4(),
        transaction_id: transactionIds.jane3,
        product_id: "PKM-UPC-001",
        product_name: "Pokémon Ultra Premium Collection",
        quantity: 1,
        price: 8000.0,
        total: 8000.0,
        created_at: now,
        updated_at: now,
      },

      // Bob's transaction 1 items (Welterweight tier)
      {
        id: uuidv4(),
        transaction_id: transactionIds.bob1,
        product_id: "MTG-DRAFT-001",
        product_name: "Magic The Gathering Draft Booster Box",
        quantity: 1,
        price: 7500.0,
        total: 7500.0,
        created_at: now,
        updated_at: now,
      },

      // Bob's transaction 2 items
      {
        id: uuidv4(),
        transaction_id: transactionIds.bob2,
        product_id: "PKM-PACKS-002",
        product_name: "Pokémon Scarlet & Violet Booster Packs",
        quantity: 25,
        price: 200.0,
        total: 5000.0,
        created_at: now,
        updated_at: now,
      },

      // Alice's transaction 1 items (Welterweight tier)
      {
        id: uuidv4(),
        transaction_id: transactionIds.alice1,
        product_id: "TCG-ACC-001",
        product_name: "Premium Card Sleeves",
        quantity: 10,
        price: 150.0,
        total: 1500.0,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        transaction_id: transactionIds.alice1,
        product_id: "TCG-ACC-002",
        product_name: "Collector's Binder",
        quantity: 3,
        price: 1000.0,
        total: 3000.0,
        created_at: now,
        updated_at: now,
      },

      // Alice's transaction 2 items
      {
        id: uuidv4(),
        transaction_id: transactionIds.alice2,
        product_id: "TCG-ACC-003",
        product_name: "Card Protector Sleeves",
        quantity: 30,
        price: 100.0,
        total: 3000.0,
        created_at: now,
        updated_at: now,
      },

      // Charlie's transaction 1 items (Lightweight tier)
      {
        id: uuidv4(),
        transaction_id: transactionIds.charlie1,
        product_id: "OP-PACKS-001",
        product_name: "One Piece Card Game Booster Packs",
        quantity: 10,
        price: 200.0,
        total: 2000.0,
        created_at: now,
        updated_at: now,
      },

      // Charlie's transaction 2 items
      {
        id: uuidv4(),
        transaction_id: transactionIds.charlie2,
        product_id: "TCG-ACC-004",
        product_name: "Deck Box",
        quantity: 5,
        price: 300.0,
        total: 1500.0,
        created_at: now,
        updated_at: now,
      },

      // Diana's transaction 1 items (Lightweight tier)
      {
        id: uuidv4(),
        transaction_id: transactionIds.diana1,
        product_id: "MTG-PACKS-001",
        product_name: "Magic The Gathering Draft Booster Packs",
        quantity: 10,
        price: 200.0,
        total: 2000.0,
        created_at: now,
        updated_at: now,
      },

      // Edward's transaction 1 items (Featherweight tier)
      {
        id: uuidv4(),
        transaction_id: transactionIds.edward1,
        product_id: "PKM-STARTER-001",
        product_name: "Pokémon Starter Deck",
        quantity: 1,
        price: 750.0,
        total: 750.0,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("transaction_items", null, {});
  },
};
