const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Dynamically import database connection
let databaseModule;

async function getConnection() {
  if (!databaseModule) {
    databaseModule = await import('./app/lib/database.js');
  }
  return databaseModule.getConnection();
}

async function verifyDataMigration() {
  try {
    console.log('🔍 COMPREHENSIVE DATA MIGRATION VERIFICATION');
    console.log('='.repeat(50));
    
    const client = await getConnection();
    console.log('✅ Connected to Turso database');
    
    // 1. Check basic user data
    console.log('\n📊 BASIC USER DATA:');
    const userCount = await client.execute('SELECT COUNT(*) as count FROM shows_users');
    console.log(`   Total users: ${userCount.rows[0].count}`);
    
    // 2. Check usermeta data
    console.log('\n📋 EXTENDED PROFILE DATA (USERMETA):');
    const metaCount = await client.execute('SELECT COUNT(*) as count FROM shows_usermeta');
    console.log(`   Total usermeta records: ${metaCount.rows[0].count}`);
    
    // 3. Check VoiceoverGuy specifically
    console.log('\n🎭 VOICEOVERGUY PROFILE VERIFICATION:');
    
    // Basic user data
    const voiceoverGuy = await client.execute({
      sql: 'SELECT * FROM shows_users WHERE username = ?',
      args: ['VoiceoverGuy']
    });
    
    if (voiceoverGuy.rows.length > 0) {
      const user = voiceoverGuy.rows[0];
      console.log(`   ✅ Found VoiceoverGuy (ID: ${user.id})`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📅 Joined: ${user.joined}`);
      console.log(`   🖼️ Avatar: ${user.avatar_url ? 'Yes' : 'No'}`);
      
      // Extended profile data
      const voiceoverMeta = await client.execute({
        sql: 'SELECT meta_key, meta_value FROM shows_usermeta WHERE user_id = ?',
        args: [user.id]
      });
      
      console.log(`   📋 Extended data records: ${voiceoverMeta.rows.length}`);
      
      if (voiceoverMeta.rows.length > 0) {
        console.log('\n   📝 PROFILE DATA FOUND:');
        const meta = {};
        voiceoverMeta.rows.forEach(row => {
          meta[row.meta_key] = row.meta_value;
        });
        
        // Check key profile elements
        console.log(`   📍 Location: ${meta.location || 'NOT SET'}`);
        console.log(`   📖 About: ${meta.about ? meta.about.substring(0, 100) + '...' : 'NOT SET'}`);
        console.log(`   🏷️ Category: ${meta.category || 'NOT SET'}`);
        console.log(`   💰 Rates: ${meta.rates1 || 'NOT SET'}, ${meta.rates2 || 'NOT SET'}, ${meta.rates3 || 'NOT SET'}`);
        console.log(`   🔗 Website: ${meta.url || 'NOT SET'}`);
        console.log(`   📱 Phone: ${meta.phone || 'NOT SET'}`);
        
        // Social media
        console.log('\n   🌐 SOCIAL MEDIA:');
        console.log(`   🐦 Twitter: ${meta.twitter || 'NOT SET'}`);
        console.log(`   📘 Facebook: ${meta.facebook || 'NOT SET'}`);
        console.log(`   📺 YouTube: ${meta.youtubepage || 'NOT SET'}`);
        console.log(`   💼 LinkedIn: ${meta.linkedin || 'NOT SET'}`);
        
        // Connections
        console.log('\n   🔌 CONNECTIONS:');
        console.log(`   Source Connect: ${meta.connection1 === '1' ? 'YES' : 'NO'}`);
        console.log(`   Cleanfeed: ${meta.connection2 === '1' ? 'YES' : 'NO'}`);
        console.log(`   Phone Patch: ${meta.connection3 === '1' ? 'YES' : 'NO'}`);
        console.log(`   Session Link Pro: ${meta.connection4 === '1' ? 'YES' : 'NO'}`);
        
      } else {
        console.log('   ❌ NO EXTENDED PROFILE DATA FOUND');
      }
      
    } else {
      console.log('   ❌ VoiceoverGuy not found in database');
    }
    
    // 4. Check avatar migration
    console.log('\n🖼️ AVATAR MIGRATION STATUS:');
    const avatarCount = await client.execute('SELECT COUNT(*) as count FROM shows_users WHERE avatar_url IS NOT NULL AND avatar_url != ""');
    console.log(`   Users with avatars: ${avatarCount.rows[0].count}`);
    
    // 5. Check all tables
    console.log('\n📊 ALL TABLES STATUS:');
    const tables = await client.execute('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('   Available tables:');
    tables.rows.forEach(table => {
      console.log(`   - ${table.name}`);
    });
    
    // 6. Missing data analysis
    console.log('\n❌ MISSING DATA ANALYSIS:');
    
    // Check if we have enough usermeta records
    const expectedMetaRecords = 62554; // From the original SQL file
    const actualMetaRecords = metaCount.rows[0].count;
    
    if (actualMetaRecords < expectedMetaRecords) {
      console.log(`   ⚠️ Missing usermeta records: ${expectedMetaRecords - actualMetaRecords} out of ${expectedMetaRecords}`);
      console.log(`   📊 Import completion: ${Math.round((actualMetaRecords / expectedMetaRecords) * 100)}%`);
    } else {
      console.log('   ✅ All usermeta records imported');
    }
    
    // 7. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (actualMetaRecords < expectedMetaRecords) {
      console.log('   1. Complete usermeta import with better parsing');
      console.log('   2. Handle special characters and escaping properly');
    }
    console.log('   3. Create enhanced profile display components');
    console.log('   4. Import studio gallery images');
    console.log('   5. Build contact/messaging system');
    console.log('   6. Add location mapping integration');
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyDataMigration().then(() => {
    console.log('\n🎉 Data migration verification completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Verification process failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyDataMigration };
