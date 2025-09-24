const { Client } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function testApiFunctionality() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🧪 Testing API functionality after schema fixes');
    console.log('=' .repeat(60));
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Test 1: Simulate the admin studios query
    console.log('🔍 Test 1: Simulating admin studios query...');
    const adminQuery = `
      SELECT 
        s.id, s.name as studio_name, s.owner_id, s.created_at,
        u.username, u.display_name, u.email,
        up.studio_name as profile_studio_name, up.last_name, up.location
      FROM studios s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY s.created_at DESC
      LIMIT 5;
    `;
    
    const adminResult = await client.query(adminQuery);
    console.log(`✅ Found ${adminResult.rows.length} studios`);
    adminResult.rows.forEach(row => {
      console.log(`   ${row.studio_name}: profile_studio_name="${row.profile_studio_name || 'NULL'}", username="${row.username}"`);
    });
    
    // Test 2: Test search functionality
    console.log('\n🔍 Test 2: Testing search functionality...');
    const searchQuery = `
      SELECT 
        s.id, s.name as studio_name,
        u.username,
        up.studio_name as profile_studio_name
      FROM studios s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 
        s.name ILIKE '%Admin%' OR 
        up.studio_name ILIKE '%Admin%' OR
        u.username ILIKE '%Admin%'
      LIMIT 3;
    `;
    
    const searchResult = await client.query(searchQuery);
    console.log(`✅ Search found ${searchResult.rows.length} results for "Admin"`);
    searchResult.rows.forEach(row => {
      console.log(`   ${row.studio_name}: profile_studio_name="${row.profile_studio_name || 'NULL'}"`);
    });
    
    // Test 3: Test stats query
    console.log('\n🔍 Test 3: Testing stats query...');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_studios,
        COUNT(CASE WHEN up.studio_name IS NOT NULL AND up.about IS NOT NULL THEN 1 END) as complete_profiles
      FROM studios s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id;
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    console.log(`✅ Total studios: ${stats.total_studios}`);
    console.log(`✅ Studios with complete profiles: ${stats.complete_profiles}`);
    
    // Test 4: Check for any remaining first_name references
    console.log('\n🔍 Test 4: Checking for first_name column...');
    const columnCheck = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'first_name';
    `;
    
    const columnResult = await client.query(columnCheck);
    if (columnResult.rows.length > 0) {
      console.log('⚠️  WARNING: first_name column still exists!');
    } else {
      console.log('✅ first_name column has been removed as expected');
    }
    
    // Test 5: Check studio_name column exists
    console.log('\n🔍 Test 5: Checking for studio_name column...');
    const studioNameCheck = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'studio_name';
    `;
    
    const studioNameResult = await client.query(studioNameCheck);
    if (studioNameResult.rows.length > 0) {
      console.log('✅ studio_name column exists as expected');
    } else {
      console.log('❌ WARNING: studio_name column is missing!');
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 API functionality tests completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

testApiFunctionality();
