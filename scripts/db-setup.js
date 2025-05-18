/**
 * Database setup script for TKO Toy Co Loyalty Program
 *
 * This script initializes the PostgreSQL database for the loyalty program.
 * It creates the database if it doesn't exist and runs the initial migrations.
 */

require("dotenv").config();
const { Client } = require("pg");
const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");

// Configuration
const dbName = process.env.DB_NAME || "tko_loyalty";
const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "password";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || 5432;

// Create database if it doesn't exist
async function createDatabase() {
  const client = new Client({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: "postgres", // Connect to default postgres database
  });

  try {
    await client.connect();

    // Check if database exists
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rowCount === 0) {
      console.log(`Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } catch (err) {
    console.error("Error creating database:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Initialize Sequelize and run migrations
async function initializeSequelize() {
  const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: "postgres",
    logging: console.log,
  });

  try {
    // Test the connection
    await sequelize.authenticate();
    console.log("Database connection established successfully");

    // In a real implementation, we would run migrations here
    // For now, we'll just create a placeholder for future implementation
    console.log(
      "Migration functionality will be implemented in future versions"
    );

    // Create logs directory if it doesn't exist
    const logsDir = path.resolve("logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    console.log("Database setup completed successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the setup
async function setup() {
  console.log("Starting database setup...");
  await createDatabase();
  await initializeSequelize();
  console.log("Database setup completed");
}

setup();
