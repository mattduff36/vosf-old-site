const { Client } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function checkSchemaChanges() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Checking database schema for changes');
    console.log('=' .repeat(70));
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Check if first_name column exists (we removed it)
    console.log('🔍 Checking user_profiles table structure...');
    const userProfilesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 user_profiles columns:');
    userProfilesColumns.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if first_name was re-added
    const hasFirstName = userProfilesColumns.rows.some(col => col.column_name === 'first_name');
    if (hasFirstName) {
      console.log('\n⚠️  WARNING: first_name column has been re-added to user_profiles!');
    } else {
      console.log('\n✅ first_name column is still removed from user_profiles');
    }
    
    // Check studios table structure
    console.log('\n🔍 Checking studios table structure...');
    const studiosColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'studios' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 studios columns:');
    studiosColumns.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check users table structure
    console.log('\n🔍 Checking users table structure...');
    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 users columns:');
    usersColumns.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check for any new tables
    console.log('\n🔍 Checking for all tables...');
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 All tables in database:');
    allTables.rows.forEach(table => {
      console.log(`   ${table.table_name}`);
    });
    
    // Test a sample query to see what errors we get
    console.log('\n🔍 Testing sample queries...');
    
    try {
      const sampleUser = await client.query(`
        SELECT u.id, u.username, u.display_name, up.first_name, up.last_name, s.name as studio_name
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN studios s ON u.id = s.owner_id
        LIMIT 1;
      `);
      console.log('✅ Sample query with first_name successful');
      if (sampleUser.rows.length > 0) {
        console.log('📋 Sample data:', sampleUser.rows[0]);
      }
    } catch (error) {
      console.log('❌ Sample query with first_name failed:', error.message);
    }
    
    try {
      const sampleUserNoFirstName = await client.query(`
        SELECT u.id, u.username, u.display_name, up.last_name, s.name as studio_name
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN studios s ON u.id = s.owner_id
        LIMIT 1;
      `);
      console.log('✅ Sample query without first_name successful');
      if (sampleUserNoFirstName.rows.length > 0) {
        console.log('📋 Sample data:', sampleUserNoFirstName.rows[0]);
      }
    } catch (error) {
      console.log('❌ Sample query without first_name failed:', error.message);
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ Schema check completed');
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkSchemaChanges();
