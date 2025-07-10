/**
 * Check webhook registrations using Shopify CLI
 */

import { execSync } from "child_process";

console.log("🔍 CHECKING WEBHOOK REGISTRATIONS WITH SHOPIFY CLI");
console.log("=".repeat(60));
console.log("");

try {
  console.log("📡 Fetching webhook subscriptions...");

  // Use Shopify CLI to get webhook subscriptions
  const result = execSync("shopify app generate webhook --list", {
    encoding: "utf8",
    cwd: process.cwd(),
  });

  console.log("Raw output:", result);
} catch (error) {
  console.log(
    "❌ Shopify CLI command failed. Let's try a different approach...",
  );
  console.log("");

  // Let's check if webhooks are configured in the app config
  console.log("🔧 CHECKING APP CONFIGURATION:");
  console.log("");

  try {
    const fs = await import("fs");
    const path = await import("path");

    // Check shopify.app.toml for webhook configuration
    const configPath = "shopify.app.toml";
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, "utf8");
      console.log("📄 shopify.app.toml content:");
      console.log(config);

      if (config.includes("webhooks")) {
        console.log("✅ Webhooks section found in config");
      } else {
        console.log("❌ No webhooks section found in config");
        console.log("");
        console.log("💡 PROBLEM IDENTIFIED:");
        console.log(
          "Your app configuration doesn't include webhook subscriptions!",
        );
        console.log("");
        console.log("🔧 SOLUTION:");
        console.log(
          "You need to add webhook subscriptions to your shopify.app.toml file:",
        );
        console.log("");
        console.log("Add this to your shopify.app.toml:");
        console.log(`
[webhooks]
api_version = "2024-07"

  [[webhooks.subscriptions]]
  topics = [ "orders/create" ]
  uri = "/webhooks/orders/create"

  [[webhooks.subscriptions]]
  topics = [ "orders/fulfilled" ]
  uri = "/webhooks/orders/fulfilled"
        `);
      }
    } else {
      console.log("❌ shopify.app.toml not found");
    }
  } catch (configError) {
    console.error("Error reading config:", configError.message);
  }
}

console.log("");
console.log("🎯 NEXT STEPS:");
console.log("1. Add webhook subscriptions to shopify.app.toml");
console.log("2. Redeploy your app to Render.com");
console.log("3. Reinstall the app in your Shopify store");
console.log("4. Test with a new order");
