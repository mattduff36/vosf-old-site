const { Client } = require('pg');

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function migrateStudioNames() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔄 Starting studio name migration: user_profiles.first_name → studios.name');
    console.log('=' .repeat(70));
    
    await client.connect();
    console.log('✅ Connected to database');
    
    // First, let's see what we're working with
    console.log('\n🔍 Analyzing current data...');
    
    const analysisQuery = `
      SELECT 
        s.id as studio_id,
        s.name as current_studio_name,
        u.username,
        up.first_name as profile_first_name,
        CASE 
          WHEN up.first_name IS NULL THEN 'NO_PROFILE_NAME'
          WHEN s.name = up.first_name THEN 'ALREADY_MATCHES'
          ELSE 'NEEDS_UPDATE'
        END as status
      FROM studios s
      JOIN users u ON s.owner_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY u.username;
    `;
    
    const analysisResult = await client.query(analysisQuery);
    const studios = analysisResult.rows;
    
    console.log(`📊 Found ${studios.length} studios`);
    
    // Count by status
    const statusCounts = studios.reduce((acc, studio) => {
      acc[studio.status] = (acc[studio.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Current Status:');
    console.log(`   ✅ Already matching: ${statusCounts.ALREADY_MATCHES || 0}`);
    console.log(`   🔄 Need update: ${statusCounts.NEEDS_UPDATE || 0}`);
    console.log(`   ⚠️  No profile name: ${statusCounts.NO_PROFILE_NAME || 0}`);
    
    // Show some examples
    console.log('\n📋 Sample data:');
    studios.slice(0, 5).forEach(studio => {
      console.log(`   ${studio.username}: "${studio.current_studio_name}" | "${studio.profile_first_name || 'NULL'}" | ${studio.status}`);
    });
    
    if (statusCounts.NEEDS_UPDATE > 0) {
      console.log(`\n🔄 Updating ${statusCounts.NEEDS_UPDATE} studios...`);
      
      // Perform the migration
      const updateQuery = `
        UPDATE studios 
        SET name = up.first_name,
            updated_at = NOW()
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        WHERE studios.owner_id = u.id 
          AND up.first_name IS NOT NULL 
          AND up.first_name != ''
          AND studios.name != up.first_name;
      `;
      
      const updateResult = await client.query(updateQuery);
      console.log(`✅ Updated ${updateResult.rowCount} studio names`);
      
      // Verify the changes
      console.log('\n🔍 Verifying changes...');
      const verificationResult = await client.query(analysisQuery);
      const updatedStudios = verificationResult.rows;
      
      const newStatusCounts = updatedStudios.reduce((acc, studio) => {
        acc[studio.status] = (acc[studio.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 After Migration:');
      console.log(`   ✅ Already matching: ${newStatusCounts.ALREADY_MATCHES || 0}`);
      console.log(`   🔄 Need update: ${newStatusCounts.NEEDS_UPDATE || 0}`);
      console.log(`   ⚠️  No profile name: ${newStatusCounts.NO_PROFILE_NAME || 0}`);
      
      // Show updated examples
      console.log('\n📋 Updated studios:');
      const updatedExamples = updatedStudios.filter(s => s.status === 'ALREADY_MATCHES').slice(0, 5);
      updatedExamples.forEach(studio => {
        console.log(`   ✅ ${studio.username}: "${studio.current_studio_name}"`);
      });
      
    } else {
      console.log('\n✨ No updates needed - all studio names are already correct!');
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎉 Migration completed successfully!');
    console.log('💡 You can now test the studio name functionality in the admin interface.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateStudioNames()
    .then(() => {
      console.log('\n✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateStudioNames };
