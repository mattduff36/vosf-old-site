#!/usr/bin/env node

const fs = require('fs');
const { parse } = require('csv-parse/sync');

console.log('🚀 Starting comprehensive profile data migration...');

async function loadCSVData(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parse(content, { 
      columns: true, 
      skip_empty_lines: true,
      relax_quotes: true,
      escape: '"'
    });
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return [];
  }
}

async function main() {
  try {
    console.log('📊 Analyzing profile data...');
    
    // Load the data files
    const userMetaData = await loadCSVData('old-data/usermeta_full.csv');
    const profileFlatData = await loadCSVData('old-data/profile_flat.csv');
    const usersData = await loadCSVData('old-data/users.csv');
    
    console.log(`📈 Data loaded:`);
    console.log(`   - Users: ${usersData.length}`);
    console.log(`   - UserMeta records: ${userMetaData.length}`);
    console.log(`   - Profile flat records: ${profileFlatData.length}`);
    
    // Group metadata by user_id
    const userProfiles = {};
    
    for (const record of userMetaData) {
      const userId = record.user_id;
      const metaKey = record.meta_key;
      const metaValue = record.meta_value || '';
      
      if (!userId || !metaKey) continue;
      
      if (!userProfiles[userId]) {
        userProfiles[userId] = {};
      }
      
      userProfiles[userId][metaKey] = metaValue;
    }
    
    console.log(`👥 Found profiles for ${Object.keys(userProfiles).length} users`);
    
    // Analyze the most common fields
    const fieldCounts = {};
    for (const profile of Object.values(userProfiles)) {
      for (const key of Object.keys(profile)) {
        fieldCounts[key] = (fieldCounts[key] || 0) + 1;
      }
    }
    
    console.log('\n📋 Most common profile fields:');
    Object.entries(fieldCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .forEach(([field, count]) => {
        console.log(`   ${field}: ${count} users`);
      });
    
    // Generate SQL for extending profile table
    console.log('\n🔧 Generating SQL to extend profile table...');
    
    const sqlStatements = [
      '-- Extend profile table with comprehensive fields',
      'ALTER TABLE profile ADD COLUMN facebook TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN twitter TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN linkedin TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN soundcloud TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN vimeo TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN pinterest TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN tiktok TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN category TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN shortabout TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN gender TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN birthday TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN rates1 TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN rates2 TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN rates3 TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN showrates BOOLEAN DEFAULT 0;',
      'ALTER TABLE profile ADD COLUMN homestudio TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN avatar_image TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN verified BOOLEAN DEFAULT 0;',
      'ALTER TABLE profile ADD COLUMN featured BOOLEAN DEFAULT 0;',
      'ALTER TABLE profile ADD COLUMN last_login TEXT DEFAULT "";',
      'ALTER TABLE profile ADD COLUMN locale TEXT DEFAULT "en";'
    ];
    
    // Add connection fields
    for (let i = 1; i <= 15; i++) {
      sqlStatements.push(`ALTER TABLE profile ADD COLUMN connection${i} BOOLEAN DEFAULT 0;`);
    }
    
    // Add display settings
    const displayFields = [
      'showphone', 'showemail', 'showaddress', 'showmap', 'showdirections',
      'facebookshow', 'twittershow', 'instagramshow', 'linkedinshow',
      'youtubepageshow', 'soundcloudshow', 'vimeopageshow'
    ];
    
    for (const field of displayFields) {
      sqlStatements.push(`ALTER TABLE profile ADD COLUMN ${field} BOOLEAN DEFAULT 1;`);
    }
    
    // Write SQL file
    fs.writeFileSync('extend-profile-table.sql', sqlStatements.join('\n'));
    console.log('✅ SQL file created: extend-profile-table.sql');
    
    // Generate sample data for testing
    const sampleUsers = Object.entries(userProfiles).slice(0, 5);
    console.log('\n📝 Sample user profiles:');
    
    for (const [userId, profile] of sampleUsers) {
      console.log(`\nUser ${userId}:`);
      console.log(`  Name: ${profile.first_name || ''} ${profile.last_name || ''}`);
      console.log(`  Location: ${profile.location || 'Not specified'}`);
      console.log(`  About: ${(profile.about || '').substring(0, 100)}...`);
      console.log(`  Instagram: ${profile.instagram || 'Not specified'}`);
      console.log(`  Phone: ${profile.phone || 'Not specified'}`);
    }
    
    console.log('\n🎉 Analysis completed successfully!');
    console.log('Next steps:');
    console.log('1. Run the SQL file to extend the profile table');
    console.log('2. Create data import script for production');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
