const { Client } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function diagnoseProductionErrors() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Diagnosing production API errors');
    console.log('=' .repeat(60));
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Test 1: Check current schema state
    console.log('🔍 Test 1: Checking current database schema...');
    const schemaCheck = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('users', 'user_profiles', 'studios')
        AND column_name IN ('first_name', 'studio_name', 'name')
      ORDER BY table_name, column_name;
    `;
    
    const schemaResult = await client.query(schemaCheck);
    console.log('📋 Current schema:');
    schemaResult.rows.forEach(row => {
      console.log(`   ${row.table_name}.${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Test 2: Simulate the admin stats query that's failing
    console.log('\n🔍 Test 2: Testing admin stats query...');
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_studios,
          COUNT(CASE WHEN up.studio_name IS NOT NULL AND up.about IS NOT NULL THEN 1 END) as complete_profiles,
          COUNT(CASE WHEN u.avatar_url IS NOT NULL THEN 1 END) as with_avatars,
          COUNT(CASE WHEN up.rate_tier_1 IS NOT NULL OR up.rate_tier_2 IS NOT NULL OR up.rate_tier_3 IS NOT NULL THEN 1 END) as with_rates
        FROM studios s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id;
      `;
      
      const statsResult = await client.query(statsQuery);
      const stats = statsResult.rows[0];
      console.log('✅ Admin stats query successful:');
      console.log(`   Total studios: ${stats.total_studios}`);
      console.log(`   Complete profiles: ${stats.complete_profiles}`);
      console.log(`   With avatars: ${stats.with_avatars}`);
      console.log(`   With rates: ${stats.with_rates}`);
    } catch (error) {
      console.log('❌ Admin stats query failed:', error.message);
    }
    
    // Test 3: Simulate the admin studios list query
    console.log('\n🔍 Test 3: Testing admin studios list query...');
    try {
      const studiosQuery = `
        SELECT 
          s.id, s.name as studio_name, s.created_at,
          u.username, u.display_name, u.email,
          up.studio_name as profile_studio_name, up.last_name
        FROM studios s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        ORDER BY s.created_at DESC
        LIMIT 5;
      `;
      
      const studiosResult = await client.query(studiosQuery);
      console.log(`✅ Admin studios query successful - ${studiosResult.rows.length} results:`);
      studiosResult.rows.forEach(row => {
        console.log(`   ${row.studio_name}: user="${row.username}", profile_studio_name="${row.profile_studio_name || 'NULL'}"`);
      });
    } catch (error) {
      console.log('❌ Admin studios query failed:', error.message);
    }
    
    // Test 4: Check for any queries that might still reference first_name
    console.log('\n🔍 Test 4: Testing problematic first_name query...');
    try {
      const problematicQuery = `
        SELECT 
          COUNT(*) as count_with_first_name
        FROM studios s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE up.first_name IS NOT NULL;
      `;
      
      const problematicResult = await client.query(problematicQuery);
      console.log('❌ This query should fail if first_name is removed:', problematicResult.rows[0]);
    } catch (error) {
      console.log('✅ Expected error - first_name column does not exist:', error.message);
    }
    
    // Test 5: Check data population in studio_name field
    console.log('\n🔍 Test 5: Checking studio_name field population...');
    const populationQuery = `
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(CASE WHEN studio_name IS NOT NULL AND studio_name != '' THEN 1 END) as with_studio_name,
        COUNT(CASE WHEN studio_name IS NULL OR studio_name = '' THEN 1 END) as without_studio_name
      FROM user_profiles;
    `;
    
    const populationResult = await client.query(populationQuery);
    const pop = populationResult.rows[0];
    console.log('📊 Studio name field population:');
    console.log(`   Total profiles: ${pop.total_profiles}`);
    console.log(`   With studio_name: ${pop.with_studio_name}`);
    console.log(`   Without studio_name: ${pop.without_studio_name}`);
    
    // Test 6: Sample data check
    console.log('\n🔍 Test 6: Sample data check...');
    const sampleQuery = `
      SELECT 
        s.name as studio_name,
        u.username,
        up.studio_name as profile_studio_name,
        up.last_name
      FROM studios s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE s.name ILIKE '%admin%'
      LIMIT 3;
    `;
    
    const sampleResult = await client.query(sampleQuery);
    console.log('📋 Sample admin-related data:');
    sampleResult.rows.forEach(row => {
      console.log(`   Studio: "${row.studio_name}", User: "${row.username}", Profile Studio: "${row.profile_studio_name || 'NULL'}", Last Name: "${row.last_name || 'NULL'}"`);
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 DIAGNOSIS SUMMARY:');
    console.log('If you see errors above, the production site likely needs:');
    console.log('1. Updated code deployed (our schema fixes)');
    console.log('2. Prisma client regenerated on production');
    console.log('3. Environment variables updated if needed');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

diagnoseProductionErrors();
