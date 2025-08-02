const { Client } = require('pg');

// Database connection configuration
const DATABASE_URL = 'postgresql://tko_loyalty_db_yk0n_user:uZFPp2aKNkFxfXV0nyvjzyBGzaL0uYLh@dpg-d0ls1todl3ps73boov50-a.oregon-postgres.render.com/tko_loyalty_db_yk0n';

async function discoverSchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Discovering actual database schema...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Get all table structures
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      console.log(`📋 TABLE: ${tableName}`);
      console.log('='.repeat(50));
      
      // Get column information for each table
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await client.query(columnsQuery, [tableName]);
      
      columnsResult.rows.forEach(column => {
        const nullable = column.is_nullable === 'YES' ? '(nullable)' : '(required)';
        const defaultVal = column.column_default ? ` default: ${column.column_default}` : '';
        console.log(`  ${column.column_name}: ${column.data_type} ${nullable}${defaultVal}`);
      });
      
      // Get sample data for key tables
      if (['Customer', 'Order', 'PendingOrder', 'Tier', 'TierBenefit', 'PointTransaction'].includes(tableName)) {
        try {
          const sampleQuery = `SELECT * FROM "${tableName}" LIMIT 3`;
          const sampleResult = await client.query(sampleQuery);
          
          if (sampleResult.rows.length > 0) {
            console.log('\n  📄 Sample data:');
            sampleResult.rows.forEach((row, index) => {
              console.log(`    Row ${index + 1}:`, JSON.stringify(row, null, 6));
            });
          }
        } catch (error) {
          console.log(`  ❌ Error getting sample data: ${error.message}`);
        }
      }
      
      console.log('\n');
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await client.end();
  }
}

// Run the schema discovery
discoverSchema().catch(console.error);
