import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

/**
 * JSON Order Import Script
 *
 * This script imports orders from JSON files (converted from CSV) and processes them through
 * the same logic as the Shopify sync to ensure consistency.
 *
 * Expected JSON format (converted from Shopify export):
 * - Array of objects with Name, Email, Financial Status, Fulfillment Status, Total, Created at, etc.
 */

async function importOrdersFromJSON() {
  try {
    console.log("📁 Starting JSON Order Import Process...\n");

    // Check for JSON files
    const dataDir = path.join(
      process.cwd(),
      "../../../Loyalty Program Application/data",
    );
    const jsonFiles = [
      path.join(dataDir, "Untitled-1.json"),
      path.join(dataDir, "Untitled-2.json"),
    ];

    console.log("🔍 Checking for JSON files...");
    const existingFiles = jsonFiles.filter((file) => fs.existsSync(file));

    if (existingFiles.length === 0) {
      console.log("❌ No JSON files found in data directory");
      console.log("   Expected files:");
      jsonFiles.forEach((file) => console.log(`   - ${file}`));
      return;
    }

    console.log(`✅ Found ${existingFiles.length} JSON files:`);
    existingFiles.forEach((file) => console.log(`   - ${path.basename(file)}`));
    console.log();

    // Import each JSON file
    let totalImported = 0;
    let totalErrors = 0;

    for (const jsonFile of existingFiles) {
      console.log(`📄 Processing ${path.basename(jsonFile)}...`);

      try {
        const result = await processJsonFile(jsonFile);
        totalImported += result.imported;
        totalErrors += result.errors;

        console.log(`   ✅ Imported ${result.imported} orders`);
        if (result.errors > 0) {
          console.log(`   ⚠️  ${result.errors} errors encountered`);
        }
      } catch (error) {
        console.error(
          `   ❌ Failed to process ${path.basename(jsonFile)}:`,
          error.message,
        );
        totalErrors++;
      }
      console.log();
    }

    console.log("📊 Import Summary:");
    console.log(`   Total Orders Imported: ${totalImported}`);
    console.log(`   Total Errors: ${totalErrors}`);

    if (totalImported > 0) {
      console.log("\n✅ JSON import completed successfully!");
      console.log("💡 Next steps:");
      console.log(
        "   1. Run order sync to get recent orders since JSON export",
      );
      console.log("   2. Check dashboard metrics");
      console.log("   3. Verify customer points and tiers");
    }
  } catch (error) {
    console.error("❌ Fatal error during JSON import:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function processJsonFile(jsonFilePath) {
  console.log(`   📋 Reading JSON file...`);

  // Read and parse JSON file
  const fileContent = fs.readFileSync(jsonFilePath, "utf8");
  const orders = JSON.parse(fileContent);

  if (!Array.isArray(orders) || orders.length === 0) {
    throw new Error("JSON file appears to be empty or invalid");
  }

  console.log(`   📊 Found ${orders.length} orders in JSON file`);

  // Show sample structure
  const sampleOrder = orders[0];
  const keys = Object.keys(sampleOrder);
  console.log(
    `   🗂️  Order fields: ${keys.slice(0, 5).join(", ")}... (${keys.length} total)`,
  );

  let imported = 0;
  let errors = 0;
  let processed = 0;

  // Process orders in batches
  const batchSize = 100;
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);

    for (const orderJson of batch) {
      try {
        processed++;
        const orderData = parseJsonOrder(orderJson);

        if (orderData) {
          await importSingleOrder(orderData);
          imported++;
        }

        // Progress indicator
        if (processed % 500 === 0) {
          console.log(`   📈 Processed ${processed} orders...`);
        }
      } catch (error) {
        errors++;
        if (errors <= 5) {
          // Only log first 5 errors to avoid spam
          console.log(`   ⚠️  Order ${processed}: ${error.message}`);
        }
      }
    }

    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return { imported, errors };
}

function parseJsonOrder(orderJson) {
  // Extract order data from JSON object matching the ShopifyOrder interface
  const orderData = {
    // Basic order info
    id: Math.floor(Math.random() * 1000000000), // Temporary ID for JSON imports
    name: orderJson["Name"] || orderJson["name"],
    email: orderJson["Email"] || orderJson["email"],
    order_number:
      parseInt(
        (orderJson["Name"] || orderJson["name"] || "").replace("#", ""),
      ) || Math.floor(Math.random() * 1000000),

    // Financial data
    total_price: orderJson["Total"] || orderJson["total"] || "0",
    subtotal_price: orderJson["Subtotal"] || orderJson["subtotal"] || "0",
    total_tax: orderJson["Taxes"] || orderJson["total_tax"] || "0",
    total_discounts:
      orderJson["Discount Amount"] || orderJson["total_discounts"] || "0",

    // Dates
    created_at:
      orderJson["Created at"] ||
      orderJson["createdAt"] ||
      orderJson["Created At"],
    updated_at:
      orderJson["Updated at"] ||
      orderJson["updatedAt"] ||
      orderJson["Created at"] ||
      orderJson["createdAt"],
    processed_at:
      orderJson["Created at"] ||
      orderJson["createdAt"] ||
      orderJson["Created At"],

    // Status
    financial_status: (
      orderJson["Financial Status"] ||
      orderJson["financialStatus"] ||
      "paid"
    ).toLowerCase(),
    fulfillment_status: (
      orderJson["Fulfillment Status"] ||
      orderJson["fulfillmentStatus"] ||
      "fulfilled"
    ).toLowerCase(),

    // Customer info
    customerName:
      orderJson["Billing Name"] ||
      orderJson["Customer Name"] ||
      orderJson["billingName"] ||
      orderJson["customerName"],

    // Additional fields required by schema
    note: orderJson["Notes"] || orderJson["note"] || null,
    token: "",
    gateway: "",
    test: false,
    total_weight: 0,
    taxes_included: false,
    currency: orderJson["Currency"] || "CAD",
    confirmed: true,
    buyer_accepts_marketing: false,
    referring_site: "",
    landing_site: "",
    source_url: "",
    tags: orderJson["Tags"] || "",
    contact_email: orderJson["Email"] || orderJson["email"],
    order_status_url: "",
    presentment_currency: orderJson["Currency"] || "CAD",

    // Arrays and objects
    discount_applications: [],
    discount_codes: [],
    note_attributes: [],
    payment_gateway_names: [],
    processing_method: "",
    source_name: "",
    tax_lines: [],
    total_line_items_price_set: {},
    total_discounts_set: {},
    total_shipping_price_set: {},
    subtotal_price_set: {},
    total_price_set: {},
    total_tax_set: {},
    line_items: [], // Will be populated if line item data exists
    shipping_lines: [],
    billing_address: null,
    shipping_address: null,
    fulfillments: [],
    client_details: null,
    refunds: [],
    customer: null, // Will be populated separately
  };

  // Validate required fields
  if (
    !orderData.name ||
    !orderData.email ||
    parseFloat(orderData.total_price) <= 0
  ) {
    return null;
  }

  return orderData;
}

async function importSingleOrder(orderData) {
  // Find or create customer first
  let customer = await prisma.customer.findFirst({
    where: {
      email: orderData.email,
    },
  });

  if (!customer) {
    // Extract first/last name from customer name or email
    const nameParts = (orderData.customerName || orderData.email).split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    customer = await prisma.customer.create({
      data: {
        shopifyId: BigInt(Math.floor(Math.random() * 1000000000)), // Temporary ID
        email: orderData.email,
        firstName,
        lastName,
        totalSpend: 0, // Will be calculated by loyalty system
        totalPoints: 0, // Will be calculated by loyalty system
        spendPoints: 0, // Will be calculated by loyalty system
        bonusPoints: 0, // Will be calculated by loyalty system
        unfulfilledPoints: 0, // Will be calculated by loyalty system
        numberOfOrders: 0, // Will be calculated by loyalty system
      },
    });
  }

  // Check if order already exists by order number
  const existingOrder = await prisma.order.findFirst({
    where: {
      orderNumber: orderData.order_number,
    },
  });

  if (existingOrder) {
    // Skip duplicate orders
    return null;
  }

  // Create order with only Shopify data - let loyalty system handle points calculation
  const order = await prisma.order.create({
    data: {
      shopifyId: BigInt(orderData.id),
      customerId: customer.id,
      totalAmount: parseFloat(orderData.total_price),
      subtotalAmount: parseFloat(orderData.subtotal_price),
      taxAmount: parseFloat(orderData.total_tax),
      shippingAmount: 0, // JSON doesn't have shipping data
      discountAmount: parseFloat(orderData.total_discounts),
      financialStatus: orderData.financial_status,
      fulfillmentStatus: orderData.fulfillment_status || "unfulfilled",
      createdAt: new Date(orderData.created_at),
      processedAt: orderData.processed_at
        ? new Date(orderData.processed_at)
        : null,
      fulfilledAt:
        orderData.fulfillment_status === "fulfilled"
          ? new Date(orderData.created_at)
          : null,
      sourceUrl: orderData.source_url,
      referringSite: orderData.referring_site,
      landingSite: orderData.landing_site,
      orderNumber: orderData.order_number,
      tags: orderData.tags,
      note: orderData.note,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
      // Let loyalty system calculate points - don't set pointsAwarded or pointsStatus here
    },
  });

  // Only update basic customer data - let loyalty system handle points and totals
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      lastOrderDate: new Date(orderData.created_at),
      // Don't update totalSpend, numberOfOrders, or points here
      // Let the loyalty system recalculate these through its normal processes
    },
  });

  return order;
}

// Run the import
importOrdersFromJSON();
