const { Client } = require('pg');

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function cleanupFirstNameField(action = 'mark') {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🧹 Cleaning up user_profiles.first_name field');
    console.log('=' .repeat(60));
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    if (action === 'mark') {
      console.log('📝 Option 1: Marking all first_name entries as "DoNotUse"');
      console.log('   (This is reversible and safer)\n');
      
      // First, check current state
      const countQuery = `
        SELECT 
          COUNT(*) as total_profiles,
          COUNT(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 END) as with_first_name,
          COUNT(CASE WHEN first_name = 'DoNotUse' THEN 1 END) as already_marked
        FROM user_profiles;
      `;
      
      const countResult = await client.query(countQuery);
      const stats = countResult.rows[0];
      
      console.log('📊 Current Status:');
      console.log(`   Total profiles: ${stats.total_profiles}`);
      console.log(`   With first_name: ${stats.with_first_name}`);
      console.log(`   Already marked "DoNotUse": ${stats.already_marked}`);
      
      const toUpdate = parseInt(stats.with_first_name) - parseInt(stats.already_marked);
      
      if (toUpdate > 0) {
        console.log(`\n🔄 Updating ${toUpdate} profiles to "DoNotUse"...`);
        
        const updateQuery = `
          UPDATE user_profiles 
          SET first_name = 'DoNotUse',
              updated_at = NOW()
          WHERE first_name IS NOT NULL 
            AND first_name != '' 
            AND first_name != 'DoNotUse';
        `;
        
        const updateResult = await client.query(updateQuery);
        console.log(`✅ Updated ${updateResult.rowCount} profiles`);
        
        // Verify the changes
        const verifyResult = await client.query(countQuery);
        const newStats = verifyResult.rows[0];
        
        console.log('\n📈 After Update:');
        console.log(`   Total profiles: ${newStats.total_profiles}`);
        console.log(`   With first_name: ${newStats.with_first_name}`);
        console.log(`   Marked "DoNotUse": ${newStats.already_marked}`);
        
      } else {
        console.log('\n✨ All profiles are already marked or empty!');
      }
      
    } else if (action === 'remove') {
      console.log('🗑️  Option 2: Removing first_name field entirely');
      console.log('   ⚠️  WARNING: This is PERMANENT and cannot be undone!\n');
      
      // Check if there are any non-DoNotUse values
      const checkQuery = `
        SELECT COUNT(*) as risky_count
        FROM user_profiles 
        WHERE first_name IS NOT NULL 
          AND first_name != '' 
          AND first_name != 'DoNotUse';
      `;
      
      const checkResult = await client.query(checkQuery);
      const riskyCount = checkResult.rows[0].risky_count;
      
      if (parseInt(riskyCount) > 0) {
        console.log(`❌ ABORT: Found ${riskyCount} profiles with non-DoNotUse first_name values!`);
        console.log('   Please run with "mark" action first to clean up the data.');
        return;
      }
      
      console.log('🔄 Dropping first_name column...');
      
      const dropQuery = `ALTER TABLE user_profiles DROP COLUMN IF EXISTS first_name;`;
      await client.query(dropQuery);
      
      console.log('✅ first_name column removed successfully!');
      
      // Verify removal
      const verifyQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
          AND column_name = 'first_name';
      `;
      
      const verifyResult = await client.query(verifyQuery);
      
      if (verifyResult.rows.length === 0) {
        console.log('✅ Verified: first_name column no longer exists');
      } else {
        console.log('❌ Warning: first_name column still exists');
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
if (require.main === module) {
  const action = process.argv[2] || 'mark'; // Default to 'mark', use 'remove' for permanent deletion
  
  if (action === 'remove') {
    console.log('⚠️  WARNING: You are about to PERMANENTLY remove the first_name field!');
    console.log('   This action cannot be undone. Make sure you have a backup.');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    setTimeout(() => {
      cleanupFirstNameField(action)
        .then(() => {
          console.log('\n✅ Cleanup script completed');
          process.exit(0);
        })
        .catch((error) => {
          console.error('\n❌ Cleanup script failed:', error);
          process.exit(1);
        });
    }, 5000);
  } else {
    cleanupFirstNameField(action)
      .then(() => {
        console.log('\n✅ Cleanup script completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Cleanup script failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { cleanupFirstNameField };
