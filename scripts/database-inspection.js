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
    console.log('🔍 Connecting to Render.com database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // 1. Get all tables and their row counts
    console.log('📊 DATABASE OVERVIEW');
    console.log('='.repeat(50));
    
    const tablesQuery = `
      SELECT 
        schemaname,
        tablename,
        (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
      FROM (
        SELECT 
          schemaname, 
          tablename, 
          query_to_xml(format('select count(*) as cnt from %I.%I', schemaname, tablename), false, true, '') as xml_count
        FROM pg_tables 
        WHERE schemaname = 'public'
      ) t
      ORDER BY tablename;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('Tables and row counts:');
    tablesResult.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.row_count} rows`);
    });
    console.log('');

    // 2. Check recent orders (last 48 hours)
    console.log('📦 RECENT ORDERS (Last 48 hours)');
    console.log('='.repeat(50));
    
    const recentOrdersQuery = `
      SELECT 
        id,
        "shopifyOrderId",
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
          console.log(`  Order ${order.shopifyOrderId}: $${order.totalAmount} - ${order.fulfillmentStatus} - ${order.createdAt}`);
        });
      } else {
        console.log('❌ No orders found in the last 48 hours');
      }
    } catch (error) {
      console.log(`❌ Error querying orders: ${error.message}`);
    }
    console.log('');

    // 3. Check pending orders
    console.log('⏳ PENDING ORDERS');
    console.log('='.repeat(50));
    
    const pendingOrdersQuery = `
      SELECT 
        id,
        "shopifyOrderId",
        "customerId",
        "totalAmount",
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
          console.log(`  Pending ${order.shopifyOrderId}: $${order.totalAmount} - ${order.status} - ${order.createdAt}`);
        });
      } else {
        console.log('✅ No pending orders found');
      }
    } catch (error) {
      console.log(`❌ Error querying pending orders: ${error.message}`);
    }
    console.log('');

    // 4. Check customers and their points
    console.log('👥 CUSTOMER OVERVIEW');
    console.log('='.repeat(50));
    
    const customersQuery = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN "spendPoints" > 0 THEN 1 END) as customers_with_spend_points,
        COUNT(CASE WHEN "bonusPoints" > 0 THEN 1 END) as customers_with_bonus_points,
        COUNT(CASE WHEN "totalPoints" > 0 THEN 1 END) as customers_with_total_points,
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
      console.log(`Average spend points: ${Math.round(stats.avg_spend_points || 0)}`);
      console.log(`Average bonus points: ${Math.round(stats.avg_bonus_points || 0)}`);
      console.log(`Average total points: ${Math.round(stats.avg_total_points || 0)}`);
      console.log(`Max total spend: $${stats.max_total_spend || 0}`);
    } catch (error) {
      console.log(`❌ Error querying customer stats: ${error.message}`);
    }
    console.log('');

    // 5. Check tier distribution
    console.log('🏆 TIER DISTRIBUTION');
    console.log('='.repeat(50));
    
    const tierDistributionQuery = `
      SELECT 
        tier,
        COUNT(*) as customer_count,
        AVG("totalSpend") as avg_spend,
        AVG("totalPoints") as avg_points
      FROM "Customer"
      GROUP BY tier
      ORDER BY customer_count DESC;
    `;
    
    try {
      const tierResult = await client.query(tierDistributionQuery);
      if (tierResult.rows.length > 0) {
        tierResult.rows.forEach(tier => {
          console.log(`  ${tier.tier}: ${tier.customer_count} customers (avg spend: $${Math.round(tier.avg_spend || 0)}, avg points: ${Math.round(tier.avg_points || 0)})`);
        });
      } else {
        console.log('❌ No tier data found');
      }
    } catch (error) {
      console.log(`❌ Error querying tier distribution: ${error.message}`);
    }
    console.log('');

    // 6. Check tier benefits configuration
    console.log('🎁 TIER BENEFITS CONFIGURATION');
    console.log('='.repeat(50));
    
    const tierBenefitsQuery = `
      SELECT 
        t.id as tier_id,
        t.name as tier_name,
        t."pointsRequired",
        t."spendRequired",
        tb.id as benefit_id,
        tb.name as benefit_name,
        tb.description as benefit_description
      FROM "Tier" t
      LEFT JOIN "TierBenefit" tb ON t.id = tb."tierId"
      ORDER BY t."pointsRequired", tb.name;
    `;
    
    try {
      const tierBenefitsResult = await client.query(tierBenefitsQuery);
      if (tierBenefitsResult.rows.length > 0) {
        const tierGroups = {};
        tierBenefitsResult.rows.forEach(row => {
          if (!tierGroups[row.tier_name]) {
            tierGroups[row.tier_name] = {
              pointsRequired: row.pointsRequired,
              spendRequired: row.spendRequired,
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
          console.log(`    Points required: ${tierData.pointsRequired || 'N/A'}`);
          console.log(`    Spend required: $${tierData.spendRequired || 'N/A'}`);
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

    // 7. Check recent point transactions
    console.log('💰 RECENT POINT TRANSACTIONS (Last 24 hours)');
    console.log('='.repeat(50));
    
    const pointTransactionsQuery = `
      SELECT 
        pt.id,
        pt."customerId",
        pt."orderId",
        pt.points,
        pt.type,
        pt."createdAt",
        c.name as customer_name,
        o."shopifyOrderId"
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
          console.log(`  ${transaction.customer_name || 'Unknown'}: ${transaction.points} points (${transaction.type}) - Order ${transaction.shopifyOrderId || 'N/A'} - ${transaction.createdAt}`);
        });
      } else {
        console.log('❌ No point transactions found in the last 24 hours');
      }
    } catch (error) {
      console.log(`❌ Error querying point transactions: ${error.message}`);
    }
    console.log('');

    // 8. Check point events
    console.log('📈 RECENT POINT EVENTS (Last 24 hours)');
    console.log('='.repeat(50));
    
    const pointEventsQuery = `
      SELECT 
        pe.id,
        pe."customerId",
        pe."orderId",
        pe.points,
        pe.type,
        pe."createdAt",
        c.name as customer_name
      FROM "PointEvent" pe
      LEFT JOIN "Customer" c ON pe."customerId" = c.id
      WHERE pe."createdAt" >= NOW() - INTERVAL '24 hours'
      ORDER BY pe."createdAt" DESC
      LIMIT 20;
    `;
    
    try {
      const pointEventsResult = await client.query(pointEventsQuery);
      if (pointEventsResult.rows.length > 0) {
        console.log(`Found ${pointEventsResult.rows.length} recent point events:`);
        pointEventsResult.rows.forEach(event => {
          console.log(`  ${event.customer_name || 'Unknown'}: ${event.points} points (${event.type}) - ${event.createdAt}`);
        });
      } else {
        console.log('❌ No point events found in the last 24 hours');
      }
    } catch (error) {
      console.log(`❌ Error querying point events: ${error.message}`);
    }
    console.log('');

    // 9. Check for data inconsistencies
    console.log('⚠️  DATA CONSISTENCY CHECK');
    console.log('='.repeat(50));
    
    const consistencyQuery = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN "totalPoints" != ("spendPoints" + "bonusPoints") THEN 1 END) as inconsistent_points,
        COUNT(CASE WHEN "totalSpend" IS NULL OR "totalSpend" = 0 THEN 1 END) as customers_no_spend,
        COUNT(CASE WHEN tier IS NULL OR tier = '' THEN 1 END) as customers_no_tier
      FROM "Customer";
    `;
    
    try {
      const consistencyResult = await client.query(consistencyQuery);
      const consistency = consistencyResult.rows[0];
      console.log(`Total customers: ${consistency.total_customers}`);
      console.log(`Customers with inconsistent points: ${consistency.inconsistent_points}`);
      console.log(`Customers with no spend data: ${consistency.customers_no_spend}`);
      console.log(`Customers with no tier: ${consistency.customers_no_tier}`);
      
      if (consistency.inconsistent_points > 0) {
        console.log('❌ WARNING: Point calculation inconsistencies detected');
      }
      if (consistency.customers_no_tier > 0) {
        console.log('❌ WARNING: Customers without tier assignments detected');
      }
    } catch (error) {
      console.log(`❌ Error checking data consistency: ${error.message}`);
    }

    console.log('\n🔍 Database inspection complete!');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

// Run the inspection
inspectDatabase().catch(console.error);
