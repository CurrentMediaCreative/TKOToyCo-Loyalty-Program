const { Client } = require('pg');

// Database connection configuration
const DATABASE_URL = 'postgresql://tko_loyalty_db_yk0n_user:uZFPp2aKNkFxfXV0nyvjzyBGzaL0uYLh@dpg-d0ls1todl3ps73boov50-a.oregon-postgres.render.com/tko_loyalty_db_yk0n';

async function inspectDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Connecting to Render.com database with CORRECT column names...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // 1. Check recent orders (last 48 hours) - CORRECTED
    console.log('📦 RECENT ORDERS (Last 48 hours)');
    console.log('='.repeat(50));
    
    const recentOrdersQuery = `
      SELECT 
        id,
        "shopifyId",
        "customerId",
        "totalAmount",
        "fulfillmentStatus",
        "createdAt",
        "updatedAt"
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '48 hours'
      ORDER BY "createdAt" DESC
      LIMIT 20;
    `;
    
    try {
      const recentOrdersResult = await client.query(recentOrdersQuery);
      if (recentOrdersResult.rows.length > 0) {
        console.log(`Found ${recentOrdersResult.rows.length} recent orders:`);
        recentOrdersResult.rows.forEach(order => {
          console.log(`  Order ${order.shopifyId}: $${order.totalAmount} - ${order.fulfillmentStatus} - ${order.createdAt}`);
        });
      } else {
        console.log('❌ No orders found in the last 48 hours');
      }
    } catch (error) {
      console.log(`❌ Error querying orders: ${error.message}`);
    }
    console.log('');

    // 2. Check pending orders - CORRECTED
    console.log('⏳ PENDING ORDERS');
    console.log('='.repeat(50));
    
    const pendingOrdersQuery = `
      SELECT 
        id,
        "shopifyOrderId",
        "customerId",
        status,
        "createdAt"
      FROM "PendingOrder"
      ORDER BY "createdAt" DESC
      LIMIT 10;
    `;
    
    try {
      const pendingOrdersResult = await client.query(pendingOrdersQuery);
      if (pendingOrdersResult.rows.length > 0) {
        console.log(`Found ${pendingOrdersResult.rows.length} pending orders:`);
        pendingOrdersResult.rows.forEach(order => {
          console.log(`  Pending ${order.shopifyOrderId}: ${order.status} - ${order.createdAt}`);
        });
      } else {
        console.log('✅ No pending orders found');
      }
    } catch (error) {
      console.log(`❌ Error querying pending orders: ${error.message}`);
    }
    console.log('');

    // 3. Check customers and their tiers - CORRECTED
    console.log('👥 CUSTOMER OVERVIEW WITH TIERS');
    console.log('='.repeat(50));
    
    const customersQuery = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN "spendPoints" > 0 THEN 1 END) as customers_with_spend_points,
        COUNT(CASE WHEN "bonusPoints" > 0 THEN 1 END) as customers_with_bonus_points,
        COUNT(CASE WHEN "totalPoints" > 0 THEN 1 END) as customers_with_total_points,
        COUNT(CASE WHEN "tierId" IS NOT NULL THEN 1 END) as customers_with_tier,
        AVG("spendPoints") as avg_spend_points,
        AVG("bonusPoints") as avg_bonus_points,
        AVG("totalPoints") as avg_total_points,
        MAX("totalSpend") as max_total_spend
      FROM "Customer";
    `;
    
    try {
      const customersResult = await client.query(customersQuery);
      const stats = customersResult.rows[0];
      console.log(`Total customers: ${stats.total_customers}`);
      console.log(`Customers with spend points: ${stats.customers_with_spend_points}`);
      console.log(`Customers with bonus points: ${stats.customers_with_bonus_points}`);
      console.log(`Customers with total points: ${stats.customers_with_total_points}`);
      console.log(`Customers with tier assigned: ${stats.customers_with_tier}`);
      console.log(`Average spend points: ${Math.round(stats.avg_spend_points || 0)}`);
      console.log(`Average bonus points: ${Math.round(stats.avg_bonus_points || 0)}`);
      console.log(`Average total points: ${Math.round(stats.avg_total_points || 0)}`);
      console.log(`Max total spend: $${stats.max_total_spend || 0}`);
    } catch (error) {
      console.log(`❌ Error querying customer stats: ${error.message}`);
    }
    console.log('');

    // 4. Check tier distribution by points - CORRECTED
    console.log('🏆 CUSTOMER DISTRIBUTION BY POINTS (Tier Assignment)');
    console.log('='.repeat(50));
    
    const tierDistributionQuery = `
      SELECT 
        CASE 
          WHEN "totalPoints" >= 25000 THEN 'Reigning Champion'
          WHEN "totalPoints" >= 5000 THEN 'Heavyweight'
          WHEN "totalPoints" >= 1500 THEN 'Welterweight'
          WHEN "totalPoints" >= 500 THEN 'Lightweight'
          ELSE 'Featherweight'
        END as calculated_tier,
        COUNT(*) as customer_count,
        AVG("totalSpend") as avg_spend,
        AVG("totalPoints") as avg_points
      FROM "Customer"
      GROUP BY calculated_tier
      ORDER BY AVG("totalPoints") DESC;
    `;
    
    try {
      const tierResult = await client.query(tierDistributionQuery);
      if (tierResult.rows.length > 0) {
        console.log('Customers by calculated tier (based on points):');
        tierResult.rows.forEach(tier => {
          console.log(`  ${tier.calculated_tier}: ${tier.customer_count} customers (avg spend: $${Math.round(tier.avg_spend || 0)}, avg points: ${Math.round(tier.avg_points || 0)})`);
        });
      } else {
        console.log('❌ No tier data found');
      }
    } catch (error) {
      console.log(`❌ Error querying tier distribution: ${error.message}`);
    }
    console.log('');

    // 5. Check actual tier assignments vs calculated
    console.log('🔍 TIER ASSIGNMENT ANALYSIS');
    console.log('='.repeat(50));
    
    const tierAssignmentQuery = `
      SELECT 
        t.name as tier_name,
        COUNT(c.id) as assigned_customers,
        AVG(c."totalPoints") as avg_points,
        MIN(c."totalPoints") as min_points,
        MAX(c."totalPoints") as max_points
      FROM "Tier" t
      LEFT JOIN "Customer" c ON c."tierId" = t.id
      GROUP BY t.id, t.name, t."minPoints"
      ORDER BY t."minPoints";
    `;
    
    try {
      const tierAssignmentResult = await client.query(tierAssignmentQuery);
      if (tierAssignmentResult.rows.length > 0) {
        console.log('Actual tier assignments:');
        tierAssignmentResult.rows.forEach(tier => {
          console.log(`  ${tier.tier_name}: ${tier.assigned_customers} customers (avg: ${Math.round(tier.avg_points || 0)} pts, range: ${tier.min_points || 0}-${tier.max_points || 0})`);
        });
      } else {
        console.log('❌ No tier assignment data found');
      }
    } catch (error) {
      console.log(`❌ Error querying tier assignments: ${error.message}`);
    }
    console.log('');

    // 6. Check tier benefits configuration - CORRECTED
    console.log('🎁 TIER BENEFITS CONFIGURATION');
    console.log('='.repeat(50));
    
    const tierBenefitsQuery = `
      SELECT 
        t.id as tier_id,
        t.name as tier_name,
        t."minPoints",
        t."maxPoints",
        tb.id as benefit_id,
        tb.name as benefit_name,
        tb.description as benefit_description
      FROM "Tier" t
      LEFT JOIN "TierBenefit" tb ON t.id = tb."tierId"
      ORDER BY t."minPoints", tb.name;
    `;
    
    try {
      const tierBenefitsResult = await client.query(tierBenefitsQuery);
      if (tierBenefitsResult.rows.length > 0) {
        const tierGroups = {};
        tierBenefitsResult.rows.forEach(row => {
          if (!tierGroups[row.tier_name]) {
            tierGroups[row.tier_name] = {
              minPoints: row.minPoints,
              maxPoints: row.maxPoints,
              benefits: []
            };
          }
          if (row.benefit_name) {
            tierGroups[row.tier_name].benefits.push({
              name: row.benefit_name,
              description: row.benefit_description
            });
          }
        });
        
        Object.entries(tierGroups).forEach(([tierName, tierData]) => {
          console.log(`  ${tierName}:`);
          console.log(`    Min points: ${tierData.minPoints || 'N/A'}`);
          console.log(`    Max points: ${tierData.maxPoints || 'Unlimited'}`);
          console.log(`    Benefits (${tierData.benefits.length}):`);
          if (tierData.benefits.length > 0) {
            tierData.benefits.forEach(benefit => {
              console.log(`      - ${benefit.name}: ${benefit.description || 'No description'}`);
            });
          } else {
            console.log(`      ❌ No benefits configured`);
          }
          console.log('');
        });
      } else {
        console.log('❌ No tier benefits configuration found');
      }
    } catch (error) {
      console.log(`❌ Error querying tier benefits: ${error.message}`);
    }

    // 7. Check recent point transactions - CORRECTED
    console.log('💰 RECENT POINT TRANSACTIONS (Last 24 hours)');
    console.log('='.repeat(50));
    
    const pointTransactionsQuery = `
      SELECT 
        pt.id,
        pt."customerId",
        pt."orderId",
        pt.amount,
        pt.type,
        pt."createdAt",
        CONCAT(c."firstName", ' ', c."lastName") as customer_name,
        o."shopifyId"
      FROM "PointTransaction" pt
      LEFT JOIN "Customer" c ON pt."customerId" = c.id
      LEFT JOIN "Order" o ON pt."orderId" = o.id
      WHERE pt."createdAt" >= NOW() - INTERVAL '24 hours'
      ORDER BY pt."createdAt" DESC
      LIMIT 20;
    `;
    
    try {
      const pointTransactionsResult = await client.query(pointTransactionsQuery);
      if (pointTransactionsResult.rows.length > 0) {
        console.log(`Found ${pointTransactionsResult.rows.length} recent point transactions:`);
        pointTransactionsResult.rows.forEach(transaction => {
          console.log(`  ${transaction.customer_name || 'Unknown'}: ${transaction.amount} points (${transaction.type}) - Order ${transaction.shopifyId || 'N/A'} - ${transaction.createdAt}`);
        });
      } else {
        console.log('❌ No point transactions found in the last 24 hours');
      }
    } catch (error) {
      console.log(`❌ Error querying point transactions: ${error.message}`);
    }
    console.log('');

    // 8. Check for data inconsistencies - CORRECTED
    console.log('⚠️  DATA CONSISTENCY CHECK');
    console.log('='.repeat(50));
    
    const consistencyQuery = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN "totalPoints" != ("spendPoints" + "bonusPoints") THEN 1 END) as inconsistent_points,
        COUNT(CASE WHEN "totalSpend" IS NULL OR "totalSpend" = 0 THEN 1 END) as customers_no_spend,
        COUNT(CASE WHEN "tierId" IS NULL THEN 1 END) as customers_no_tier,
        COUNT(CASE WHEN ("firstName" IS NULL OR "firstName" = '') AND ("lastName" IS NULL OR "lastName" = '') THEN 1 END) as customers_no_name
      FROM "Customer";
    `;
    
    try {
      const consistencyResult = await client.query(consistencyQuery);
      const consistency = consistencyResult.rows[0];
      console.log(`Total customers: ${consistency.total_customers}`);
      console.log(`Customers with inconsistent points: ${consistency.inconsistent_points}`);
      console.log(`Customers with no spend data: ${consistency.customers_no_spend}`);
      console.log(`Customers with no tier assigned: ${consistency.customers_no_tier}`);
      console.log(`Customers with no name: ${consistency.customers_no_name}`);
      
      if (consistency.inconsistent_points > 0) {
        console.log('❌ WARNING: Point calculation inconsistencies detected');
      }
      if (consistency.customers_no_tier > 0) {
        console.log('❌ WARNING: Customers without tier assignments detected');
      }
    } catch (error) {
      console.log(`❌ Error checking data consistency: ${error.message}`);
    }

    console.log('\n🔍 Corrected database inspection complete!');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

// Run the inspection
inspectDatabase().catch(console.error);
