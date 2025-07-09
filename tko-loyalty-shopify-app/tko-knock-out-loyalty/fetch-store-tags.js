// Fetch all product tags from TKO Toy Co store
// Run with: node fetch-store-tags.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mock request object for authentication (same approach as test-shopify-integration.js)
const createMockRequest = () => ({
  url: "https://tkotoyco-loyalty-program.onrender.com/analyze-tags",
  headers: new Headers({
    "X-Shopify-Shop-Domain": "82cc2c.myshopify.com",
    "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN || "",
  }),
  method: "GET",
});

async function fetchAllStoreTags() {
  console.log("🔍 Fetching ALL product tags from TKO Toy Co store...");
  console.log("This may take a moment for stores with many products...\n");

  try {
    // Try to use the same authentication approach as our working integration
    const { authenticate } = await import("./app/shopify.server.ts");
    const request = createMockRequest();

    let admin;
    try {
      const { admin: shopifyAdmin } = await authenticate.admin(request);
      admin = shopifyAdmin;
      console.log("✅ Successfully authenticated with Shopify");
    } catch (authError) {
      console.log("⚠️ Authentication failed, trying fallback approach");
      console.log("Auth error:", authError.message);

      // Fallback: Use direct API calls with environment variables
      if (!process.env.SHOPIFY_ACCESS_TOKEN) {
        console.log("❌ No SHOPIFY_ACCESS_TOKEN found in environment");
        console.log("Please check your .env file or Shopify app configuration");
        return;
      }
    }

    let allProducts = [];
    let pageCount = 0;
    let hasNextPage = true;
    let cursor = null;

    // Fetch all products using GraphQL with pagination
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

      let response;
      if (admin) {
        // Use authenticated admin API
        response = await admin.graphql(query, {
          variables: {
            first: 250,
            after: cursor,
          },
        });
      } else {
        // Fallback: Use direct API call
        const shopDomain = "82cc2c.myshopify.com";
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

        const fetchResponse = await fetch(
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

        if (!fetchResponse.ok) {
          throw new Error(
            `Shopify API error: ${fetchResponse.status} ${fetchResponse.statusText}`,
          );
        }

        response = { json: () => fetchResponse.json() };
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

    // Save results to a file for reference
    const fs = await import("fs");
    const analysisData = {
      timestamp: new Date().toISOString(),
      totalProducts: allProducts.length,
      analysis: tagAnalysis,
      allProducts: allProducts.map((p) => ({
        id: p.id,
        title: p.title,
        productType: p.productType,
        vendor: p.vendor,
        tags: p.tags,
      })),
    };

    fs.writeFileSync(
      "tag-analysis-results.json",
      JSON.stringify(analysisData, null, 2),
    );
    console.log("\n💾 Results saved to tag-analysis-results.json");
  } catch (error) {
    console.error("❌ Error fetching Shopify data:", error.message);
    if (error.message.includes("401")) {
      console.log("\n💡 This might be an authentication issue.");
      console.log(
        "Make sure your Shopify app has the 'read_products' permission.",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

function analyzeProductTags(products) {
  const tagFrequency = new Map();
  const productTypeAnalysis = new Map();

  let totalProducts = 0;
  let productsWithTags = 0;
  let totalTagInstances = 0;

  products.forEach((product) => {
    totalProducts++;

    if (product.tags && product.tags.length > 0) {
      productsWithTags++;
      const tags = product.tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

      tags.forEach((tag) => {
        totalTagInstances++;
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    }

    // Analyze by product type
    const productType = product.productType || "Unknown";
    if (!productTypeAnalysis.has(productType)) {
      productTypeAnalysis.set(productType, { count: 0, tags: new Set() });
    }
    const typeData = productTypeAnalysis.get(productType);
    typeData.count++;

    if (product.tags) {
      const tags = product.tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
      tags.forEach((tag) => typeData.tags.add(tag));
    }
  });

  return {
    totalProducts,
    productsWithTags,
    totalTagInstances,
    uniqueTags: tagFrequency.size,
    averageTagsPerProduct: parseFloat(
      (totalTagInstances / productsWithTags).toFixed(1),
    ),
    tagFrequency,
    productTypeAnalysis,
  };
}

function displayTagAnalysis(analysis) {
  const {
    totalProducts,
    productsWithTags,
    totalTagInstances,
    tagFrequency,
    productTypeAnalysis,
  } = analysis;

  console.log("📊 COMPREHENSIVE TAG ANALYSIS FOR TKO TOY CO");
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
        tag.includes("one piece") ||
        tag.includes("lorcana") ||
        tag.includes("flesh and blood") ||
        tag.includes("fab"),
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

  // Point Event Recommendations
  console.log(`\n🎯 POINT EVENT RECOMMENDATIONS:`);

  console.log(`\n   HIGH VOLUME TAGS (Good for regular promotions):`);
  const highVolumeTags = Array.from(tagFrequency.entries())
    .filter(([tag, count]) => count >= 50)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  highVolumeTags.forEach(([tag, count]) => {
    console.log(
      `   • ${tag} (${count} products) - Good for ongoing promotions`,
    );
  });

  console.log(`\n   MEDIUM VOLUME TAGS (Good for targeted campaigns):`);
  const mediumVolumeTags = Array.from(tagFrequency.entries())
    .filter(([tag, count]) => count >= 10 && count < 50)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  mediumVolumeTags.forEach(([tag, count]) => {
    console.log(`   • ${tag} (${count} products) - Good for targeted events`);
  });

  console.log(`\n   LOW VOLUME TAGS (Good for special/seasonal events):`);
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

  const combinations = [
    ["pokemon", "single"],
    ["pokemon", "sealed"],
    ["magic", "single"],
    ["magic", "sealed"],
    ["yugioh", "single"],
    ["yugioh", "sealed"],
    ["mtg", "single"],
    ["mtg", "booster"],
    ["lorcana", "single"],
    ["lorcana", "sealed"],
    ["tcg", "rare"],
    ["ccg", "pack"],
  ];

  combinations.forEach(([tag1, tag2]) => {
    const tag1Count = tagFrequency.get(tag1) || 0;
    const tag2Count = tagFrequency.get(tag2) || 0;

    if (tag1Count > 0 && tag2Count > 0) {
      const estimatedOverlap = Math.round(Math.min(tag1Count, tag2Count) * 0.3);
      console.log(`   • "${tag1}" + "${tag2}" → ~${estimatedOverlap} products`);
    }
  });

  console.log(`\n💡 IMPLEMENTATION RECOMMENDATIONS:`);
  console.log(`   1. Use high-volume tags for ongoing loyalty bonuses`);
  console.log(
    `   2. Combine gaming category + product type for targeted campaigns`,
  );
  console.log(`   3. Use rare/niche tags for special seasonal promotions`);
  console.log(`   4. Consider product type tags for broad category bonuses`);
  console.log(`   5. Test tag combinations to find optimal targeting`);
  console.log(`   6. Implement AND logic for multiple tag requirements`);
  console.log(`   7. Create admin interface with tag dropdown from store data`);
}

// Run the analysis
fetchAllStoreTags();
