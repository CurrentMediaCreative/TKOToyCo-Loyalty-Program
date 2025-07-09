// Comprehensive Shopify Tags Analysis
// Run with: node analyze-shopify-tags.js

import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function fetchAllShopifyTags() {
  // Use the shop domain from shopify.app.toml
  const shopDomain = "82cc2c.myshopify.com";
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    console.log("❌ Missing Shopify access token");
    console.log("Please set SHOPIFY_ACCESS_TOKEN environment variable");
    console.log(
      "You can get this from your Shopify app settings or create a private app",
    );
    return;
  }

  console.log(`🔍 Analyzing ALL tags from ${shopDomain}...`);
  console.log("This may take a moment for stores with many products...\n");

  try {
    let allProducts = [];
    let pageCount = 0;
    let hasNextPage = true;
    let cursor = null;

    // Use GraphQL API for better performance and pagination
    while (hasNextPage) {
      pageCount++;
      console.log(`📄 Fetching page ${pageCount}...`);

      const query = `
        query getProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                title
                productType
                vendor
                tags
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const response = await fetch(
        `https://${shopDomain}/admin/api/2025-01/graphql.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            variables: {
              first: 250,
              after: cursor,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Shopify API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const products = data.data?.products?.edges || [];
      allProducts = allProducts.concat(products.map((edge) => edge.node));

      hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false;
      cursor = data.data?.products?.pageInfo?.endCursor;

      console.log(
        `   Found ${products.length} products (Total: ${allProducts.length})`,
      );
    }

    console.log(
      `\n✅ Fetched ${allProducts.length} total products from ${pageCount} pages\n`,
    );

    // Analyze tags
    const tagAnalysis = analyzeProductTags(allProducts);

    // Display comprehensive results
    displayTagAnalysis(tagAnalysis);
  } catch (error) {
    console.error("❌ Error fetching Shopify data:", error.message);
    if (error.message.includes("401")) {
      console.log("\n💡 This might be an authentication issue.");
      console.log(
        "Make sure your SHOPIFY_ACCESS_TOKEN has the 'read_products' permission.",
      );
    }
  }
}

function analyzeProductTags(products) {
  const tagFrequency = new Map();
  const tagToProducts = new Map();
  const productTypeAnalysis = new Map();

  let totalProducts = 0;
  let productsWithTags = 0;
  let totalTagInstances = 0;

  products.forEach((product) => {
    totalProducts++;

    if (product.tags && product.tags.trim()) {
      productsWithTags++;
      const tags = product.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

      tags.forEach((tag) => {
        totalTagInstances++;

        // Track frequency
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);

        // Track which products have this tag
        if (!tagToProducts.has(tag)) {
          tagToProducts.set(tag, []);
        }
        tagToProducts.get(tag).push({
          title: product.title,
          productType: product.product_type || "Unknown",
          vendor: product.vendor || "Unknown",
        });
      });
    }

    // Analyze by product type
    const productType = product.product_type || "Unknown";
    if (!productTypeAnalysis.has(productType)) {
      productTypeAnalysis.set(productType, {
        count: 0,
        tags: new Set(),
        products: [],
      });
    }
    const typeData = productTypeAnalysis.get(productType);
    typeData.count++;
    typeData.products.push(product.title);

    if (product.tags) {
      const tags = product.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
      tags.forEach((tag) => typeData.tags.add(tag));
    }
  });

  return {
    totalProducts,
    productsWithTags,
    totalTagInstances,
    tagFrequency,
    tagToProducts,
    productTypeAnalysis,
  };
}

function displayTagAnalysis(analysis) {
  const {
    totalProducts,
    productsWithTags,
    totalTagInstances,
    tagFrequency,
    tagToProducts,
    productTypeAnalysis,
  } = analysis;

  console.log("📊 COMPREHENSIVE TAG ANALYSIS");
  console.log("=".repeat(60));

  // Overview Statistics
  console.log(`\n📈 OVERVIEW STATISTICS:`);
  console.log(`   Total Products: ${totalProducts}`);
  console.log(
    `   Products with Tags: ${productsWithTags} (${((productsWithTags / totalProducts) * 100).toFixed(1)}%)`,
  );
  console.log(`   Total Tag Instances: ${totalTagInstances}`);
  console.log(`   Unique Tags: ${tagFrequency.size}`);
  console.log(
    `   Average Tags per Product: ${(totalTagInstances / productsWithTags).toFixed(1)}`,
  );

  // Most Common Tags
  console.log(`\n🏷️ TOP 30 MOST COMMON TAGS:`);
  const sortedTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  sortedTags.forEach(([tag, count], index) => {
    const percentage = ((count / productsWithTags) * 100).toFixed(1);
    console.log(
      `   ${(index + 1).toString().padStart(2)}. ${tag.padEnd(25)} ${count.toString().padStart(4)} products (${percentage}%)`,
    );
  });

  // Gaming Category Analysis
  console.log(`\n🎮 GAMING CATEGORIES ANALYSIS:`);
  const gamingTags = Array.from(tagFrequency.entries())
    .filter(
      ([tag]) =>
        tag.includes("pokemon") ||
        tag.includes("magic") ||
        tag.includes("yugioh") ||
        tag.includes("mtg") ||
        tag.includes("tcg") ||
        tag.includes("ccg") ||
        tag.includes("digimon") ||
        tag.includes("dragon ball") ||
        tag.includes("one piece"),
    )
    .sort((a, b) => b[1] - a[1]);

  if (gamingTags.length > 0) {
    gamingTags.forEach(([tag, count]) => {
      const percentage = ((count / productsWithTags) * 100).toFixed(1);
      console.log(
        `   ${tag.padEnd(25)} ${count.toString().padStart(4)} products (${percentage}%)`,
      );
    });
  } else {
    console.log("   No obvious gaming category tags found");
  }

  // Product Type Analysis
  console.log(`\n📦 PRODUCT TYPE BREAKDOWN:`);
  const sortedProductTypes = Array.from(productTypeAnalysis.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15);

  sortedProductTypes.forEach(([type, data]) => {
    const percentage = ((data.count / totalProducts) * 100).toFixed(1);
    console.log(
      `   ${type.padEnd(30)} ${data.count.toString().padStart(4)} products (${percentage}%) - ${data.tags.size} unique tags`,
    );
  });

  // Rare/Niche Tags (appear in very few products)
  console.log(`\n🔍 RARE/NICHE TAGS (1-5 products):`);
  const rareTags = Array.from(tagFrequency.entries())
    .filter(([tag, count]) => count >= 1 && count <= 5)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 20);

  rareTags.forEach(([tag, count]) => {
    console.log(`   ${tag.padEnd(25)} ${count} product${count > 1 ? "s" : ""}`);
  });

  // Potential Point Event Categories
  console.log(`\n🎯 SUGGESTED POINT EVENT CATEGORIES:`);
  console.log(`\n   HIGH VOLUME (Good for regular promotions):`);
  const highVolumeTags = Array.from(tagFrequency.entries())
    .filter(([tag, count]) => count >= 50)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  highVolumeTags.forEach(([tag, count]) => {
    console.log(
      `   • ${tag} (${count} products) - Good for ongoing promotions`,
    );
  });

  console.log(`\n   MEDIUM VOLUME (Good for targeted campaigns):`);
  const mediumVolumeTags = Array.from(tagFrequency.entries())
    .filter(([tag, count]) => count >= 10 && count < 50)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  mediumVolumeTags.forEach(([tag, count]) => {
    console.log(`   • ${tag} (${count} products) - Good for targeted events`);
  });

  console.log(`\n   LOW VOLUME (Good for special/seasonal events):`);
  const lowVolumeTags = Array.from(tagFrequency.entries())
    .filter(([tag, count]) => count >= 3 && count < 10)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  lowVolumeTags.forEach(([tag, count]) => {
    console.log(
      `   • ${tag} (${count} products) - Good for special promotions`,
    );
  });

  // Tag Combination Suggestions
  console.log(`\n🔗 SUGGESTED TAG COMBINATIONS (AND Logic):`);
  console.log(`   These combinations would create targeted point events:`);

  // Find common gaming + product type combinations
  const combinations = [
    ["pokemon", "single"],
    ["pokemon", "sealed"],
    ["magic", "single"],
    ["magic", "sealed"],
    ["yugioh", "single"],
    ["yugioh", "sealed"],
    ["mtg", "single"],
    ["mtg", "booster"],
    ["tcg", "rare"],
    ["ccg", "pack"],
  ];

  combinations.forEach(([tag1, tag2]) => {
    const tag1Count = tagFrequency.get(tag1) || 0;
    const tag2Count = tagFrequency.get(tag2) || 0;

    if (tag1Count > 0 && tag2Count > 0) {
      // Estimate overlap (this is approximate)
      const estimatedOverlap = Math.min(tag1Count, tag2Count) * 0.3; // Rough estimate
      console.log(
        `   • "${tag1}" + "${tag2}" → ~${Math.round(estimatedOverlap)} products`,
      );
    }
  });

  console.log(`\n💡 RECOMMENDATIONS FOR POINT EVENTS:`);
  console.log(`   1. Use high-volume tags for ongoing loyalty bonuses`);
  console.log(
    `   2. Combine gaming category + product type for targeted campaigns`,
  );
  console.log(`   3. Use rare/niche tags for special seasonal promotions`);
  console.log(`   4. Consider product type tags for broad category bonuses`);
  console.log(`   5. Test tag combinations to find optimal targeting`);

  console.log(`\n📋 EXPORT COMPLETE TAG LIST:`);
  console.log(`   All ${tagFrequency.size} unique tags (sorted by frequency):`);

  const allTagsSorted = Array.from(tagFrequency.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  // Group tags by frequency ranges for easier reading
  const frequencyRanges = [
    { min: 100, max: Infinity, label: "VERY HIGH (100+)" },
    { min: 50, max: 99, label: "HIGH (50-99)" },
    { min: 20, max: 49, label: "MEDIUM-HIGH (20-49)" },
    { min: 10, max: 19, label: "MEDIUM (10-19)" },
    { min: 5, max: 9, label: "LOW-MEDIUM (5-9)" },
    { min: 2, max: 4, label: "LOW (2-4)" },
    { min: 1, max: 1, label: "RARE (1)" },
  ];

  frequencyRanges.forEach((range) => {
    const tagsInRange = allTagsSorted.filter(
      ([tag, count]) => count >= range.min && count <= range.max,
    );

    if (tagsInRange.length > 0) {
      console.log(`\n   ${range.label} (${tagsInRange.length} tags):`);
      tagsInRange.forEach(([tag, count]) => {
        console.log(`     ${tag} (${count})`);
      });
    }
  });
}

// Run the analysis
fetchAllShopifyTags();
