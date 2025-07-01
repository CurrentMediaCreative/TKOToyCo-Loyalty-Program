#!/usr/bin/env node

/**
 * Shopify Product Analysis Script
 * 
 * This script analyzes your Shopify store's product catalog to identify
 * how singles are categorized vs other products, helping us determine
 * the best approach for excluding singles from bonus point calculations.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from the Shopify app
function loadEnvFile() {
  const envPath = path.join(__dirname, '../tko-loyalty-shopify-app/tko-knock-out-loyalty/.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at:', envPath);
    console.log('Please make sure the Shopify app .env file exists with SHOPIFY_API_KEY and SHOPIFY_API_SECRET');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });

  return envVars;
}

// Make GraphQL request to Shopify Admin API
function makeShopifyRequest(shop, accessToken, query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query,
      variables
    });

    const options = {
      hostname: `${shop}.myshopify.com`,
      port: 443,
      path: '/admin/api/2023-10/graphql.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Shopify-Access-Token': accessToken
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`📡 Response status: ${res.statusCode}`);
        console.log(`📡 Response headers:`, res.headers);
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          return;
        }

        if (!responseData.trim()) {
          reject(new Error('Empty response from Shopify API'));
          return;
        }

        try {
          const parsed = JSON.parse(responseData);
          if (parsed.errors) {
            reject(new Error(`GraphQL errors: ${JSON.stringify(parsed.errors)}`));
          } else {
            resolve(parsed);
          }
        } catch (error) {
          console.log(`📡 Raw response: ${responseData.substring(0, 500)}...`);
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Analyze products and generate report
async function analyzeProducts() {
  console.log('🔍 Starting Shopify Product Analysis...\n');

  // Load environment variables
  const env = loadEnvFile();
  
  // Extract shop name from URL or use provided value
  let shop = process.argv[2] || env.SHOPIFY_SHOP_URL;
  if (shop && shop.includes('.')) {
    // Extract shop name from URL like "tkotoyco.com" -> "tkotoyco"
    shop = shop.replace(/^https?:\/\//, '').split('.')[0];
  }
  const accessToken = process.argv[3] || env.SHOPIFY_ACCESS_TOKEN;

  if (!shop || !accessToken) {
    console.error('❌ Missing required parameters');
    console.log('Usage: node scripts/analyze-products.js <shop-name> <access-token>');
    console.log('Or set SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN in your .env file');
    console.log('\nExample: node scripts/analyze-products.js mystore abc123...');
    process.exit(1);
  }

  const query = `
    query GetProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            productType
            tags
            vendor
            collections(first: 5) {
              edges {
                node {
                  id
                  title
                }
              }
            }
            metafields(first: 5) {
              edges {
                node {
                  namespace
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    console.log(`📡 Connecting to ${shop}.myshopify.com...`);
    
    const response = await makeShopifyRequest(shop, accessToken, query, { first: 25 });
    const products = response.data?.products?.edges || [];

    if (products.length === 0) {
      console.log('⚠️  No products found. Check your access token and shop domain.');
      return;
    }

    console.log(`✅ Found ${products.length} products to analyze\n`);

    // Analyze the data
    const analysis = {
      totalProducts: products.length,
      productTypes: new Map(),
      commonTags: new Map(),
      collections: new Map(),
      vendors: new Map(),
      singlesIndicators: {
        productTypes: [],
        tags: [],
        collections: []
      }
    };

    // Count occurrences and look for singles indicators
    products.forEach(({ node: product }) => {
      // Product types
      const type = product.productType || "No Type";
      analysis.productTypes.set(type, (analysis.productTypes.get(type) || 0) + 1);
      
      if (type.toLowerCase().includes('single')) {
        analysis.singlesIndicators.productTypes.push(type);
      }

      // Tags
      product.tags.forEach(tag => {
        analysis.commonTags.set(tag, (analysis.commonTags.get(tag) || 0) + 1);
        
        if (tag.toLowerCase().includes('single')) {
          analysis.singlesIndicators.tags.push(tag);
        }
      });

      // Collections
      product.collections.edges.forEach(({ node: collection }) => {
        const title = collection.title;
        analysis.collections.set(title, (analysis.collections.get(title) || 0) + 1);
        
        if (title.toLowerCase().includes('single')) {
          analysis.singlesIndicators.collections.push(title);
        }
      });

      // Vendors
      const vendor = product.vendor || "No Vendor";
      analysis.vendors.set(vendor, (analysis.vendors.get(vendor) || 0) + 1);
    });

    // Generate report
    console.log('📊 PRODUCT ANALYSIS REPORT');
    console.log('=' .repeat(50));
    
    console.log(`\n📈 OVERVIEW:`);
    console.log(`   Total Products Analyzed: ${analysis.totalProducts}`);
    
    console.log(`\n🏷️  PRODUCT TYPES (${analysis.productTypes.size} unique):`);
    Array.from(analysis.productTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([type, count]) => {
        const indicator = type.toLowerCase().includes('single') ? ' 🎯 POTENTIAL SINGLES' : '';
        console.log(`   ${type}: ${count}${indicator}`);
      });

    console.log(`\n🏪 VENDORS (${analysis.vendors.size} unique):`);
    Array.from(analysis.vendors.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([vendor, count]) => {
        console.log(`   ${vendor}: ${count}`);
      });

    console.log(`\n🏷️  COMMON TAGS (top 15):`);
    Array.from(analysis.commonTags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([tag, count]) => {
        const indicator = tag.toLowerCase().includes('single') ? ' 🎯 POTENTIAL SINGLES' : '';
        console.log(`   ${tag}: ${count}${indicator}`);
      });

    console.log(`\n📚 COLLECTIONS (${analysis.collections.size} unique):`);
    Array.from(analysis.collections.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([collection, count]) => {
        const indicator = collection.toLowerCase().includes('single') ? ' 🎯 POTENTIAL SINGLES' : '';
        console.log(`   ${collection}: ${count}${indicator}`);
      });

    // Singles detection summary
    console.log(`\n🎯 SINGLES DETECTION SUMMARY:`);
    console.log('=' .repeat(50));
    
    if (analysis.singlesIndicators.productTypes.length > 0) {
      console.log(`✅ Found singles in PRODUCT TYPES:`);
      analysis.singlesIndicators.productTypes.forEach(type => {
        console.log(`   - ${type}`);
      });
    }
    
    if (analysis.singlesIndicators.tags.length > 0) {
      console.log(`✅ Found singles in TAGS:`);
      [...new Set(analysis.singlesIndicators.tags)].forEach(tag => {
        console.log(`   - ${tag}`);
      });
    }
    
    if (analysis.singlesIndicators.collections.length > 0) {
      console.log(`✅ Found singles in COLLECTIONS:`);
      [...new Set(analysis.singlesIndicators.collections)].forEach(collection => {
        console.log(`   - ${collection}`);
      });
    }

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    console.log('=' .repeat(50));
    
    if (analysis.singlesIndicators.productTypes.length > 0) {
      console.log(`🥇 BEST OPTION: Use Product Type filtering`);
      console.log(`   Filter out products with type containing "single"`);
    } else if (analysis.singlesIndicators.tags.length > 0) {
      console.log(`🥈 GOOD OPTION: Use Tag filtering`);
      console.log(`   Filter out products tagged with singles-related tags`);
    } else if (analysis.singlesIndicators.collections.length > 0) {
      console.log(`🥉 OPTION: Use Collection filtering`);
      console.log(`   Filter out products in singles collections`);
    } else {
      console.log(`⚠️  No obvious singles identifiers found`);
      console.log(`   You may need to add tags or organize products to distinguish singles`);
    }

    console.log(`\n📝 Sample products for reference:`);
    products.slice(0, 5).forEach(({ node: product }, index) => {
      console.log(`\n   ${index + 1}. ${product.title}`);
      console.log(`      Type: ${product.productType || 'None'}`);
      console.log(`      Tags: ${product.tags.join(', ') || 'None'}`);
      console.log(`      Collections: ${product.collections.edges.map(e => e.node.title).join(', ') || 'None'}`);
    });

    console.log(`\n✅ Analysis complete! Use this information to configure bonus point exclusions.`);

  } catch (error) {
    console.error('❌ Error analyzing products:', error.message);
    
    if (error.message.includes('Unauthorized')) {
      console.log('\n💡 This might be an access token issue. Make sure your token has the right permissions.');
    }
  }
}

// Run the analysis
analyzeProducts().catch(console.error);
