#!/usr/bin/env node

/**
 * Database initialization script for TKO Toy Co Loyalty Program
 *
 * This script runs all migrations and seeders to set up the database
 * with the schema and sample data.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Set the working directory to the backend folder
const backendDir = path.resolve(__dirname, "..");
process.chdir(backendDir);

console.log("=== TKO Toy Co Loyalty Program Database Initialization ===");
console.log("Working directory:", process.cwd());

// Check if .sequelizerc exists
if (!fs.existsSync(path.join(backendDir, ".sequelizerc"))) {
  console.error(
    "Error: .sequelizerc file not found. Make sure you are in the correct directory."
  );
  process.exit(1);
}

try {
  // Run migrations
  console.log("\n=== Running Migrations ===");
  execSync("npx sequelize-cli db:migrate", { stdio: "inherit" });
  console.log("✅ Migrations completed successfully");

  // Run seeders
  console.log("\n=== Running Seeders ===");
  execSync("npx sequelize-cli db:seed:all", { stdio: "inherit" });
  console.log("✅ Seeders completed successfully");

  console.log("\n=== Database Initialization Complete ===");
  console.log("The database has been set up with the schema and sample data.");
  console.log("You can now start the application.");
} catch (error) {
  console.error("\n❌ Error during database initialization:");
  console.error(error.message);

  // Provide guidance on how to fix common issues
  console.log("\nTroubleshooting tips:");
  console.log("1. Make sure the database exists and is accessible");
  console.log("2. Check database connection settings in config/database.js");
  console.log("3. Ensure you have the necessary permissions to create tables");
  console.log(
    "4. If tables already exist, you may need to run db:migrate:undo:all first"
  );

  process.exit(1);
}
