#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { getConnection } = require('./app/lib/database.js');

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

async function extendProfileTable(db) {
  console.log('📋 Extending profile table with additional fields...');
  
  const additionalFields = [
    // Social Media
    'ADD COLUMN facebook TEXT DEFAULT ""',
    'ADD COLUMN twitter TEXT DEFAULT ""', 
    'ADD COLUMN linkedin TEXT DEFAULT ""',
    'ADD COLUMN soundcloud TEXT DEFAULT ""',
    'ADD COLUMN vimeo TEXT DEFAULT ""',
    'ADD COLUMN pinterest TEXT DEFAULT ""',
    'ADD COLUMN tiktok TEXT DEFAULT ""',
    
    // Professional Details
    'ADD COLUMN category TEXT DEFAULT ""',
    'ADD COLUMN shortabout TEXT DEFAULT ""',
    'ADD COLUMN gender TEXT DEFAULT ""',
    'ADD COLUMN birthday TEXT DEFAULT ""',
    
    // Rates and Services
    'ADD COLUMN rates1 TEXT DEFAULT ""',
    'ADD COLUMN rates2 TEXT DEFAULT ""',
    'ADD COLUMN rates3 TEXT DEFAULT ""',
    'ADD COLUMN showrates BOOLEAN DEFAULT 0',
    
    // Studio Information
    'ADD COLUMN homestudio TEXT DEFAULT ""',
    'ADD COLUMN homestudio2 TEXT DEFAULT ""',
    'ADD COLUMN homestudio3 TEXT DEFAULT ""',
    'ADD COLUMN homestudio4 TEXT DEFAULT ""',
    'ADD COLUMN homestudio5 TEXT DEFAULT ""',
    'ADD COLUMN homestudio6 TEXT DEFAULT ""',
    
    // Connection Services
    'ADD COLUMN connection1 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection2 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection3 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection4 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection5 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection6 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection7 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection8 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection9 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection10 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection11 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection12 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection13 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection14 BOOLEAN DEFAULT 0',
    'ADD COLUMN connection15 BOOLEAN DEFAULT 0',
    
    // Display Settings
    'ADD COLUMN showphone BOOLEAN DEFAULT 1',
    'ADD COLUMN showemail BOOLEAN DEFAULT 1',
    'ADD COLUMN showaddress BOOLEAN DEFAULT 1',
    'ADD COLUMN showmap BOOLEAN DEFAULT 1',
    'ADD COLUMN showdirections BOOLEAN DEFAULT 1',
    'ADD COLUMN showshort BOOLEAN DEFAULT 1',
    'ADD COLUMN facebookshow BOOLEAN DEFAULT 0',
    'ADD COLUMN twittershow BOOLEAN DEFAULT 0',
    'ADD COLUMN instagramshow BOOLEAN DEFAULT 0',
    'ADD COLUMN linkedinshow BOOLEAN DEFAULT 0',
    'ADD COLUMN youtubepageshow BOOLEAN DEFAULT 0',
    'ADD COLUMN soundcloudshow BOOLEAN DEFAULT 0',
    'ADD COLUMN vimeopageshow BOOLEAN DEFAULT 0',
    'ADD COLUMN pinterestshow BOOLEAN DEFAULT 0',
    
    // Media and Content
    'ADD COLUMN avatar_image TEXT DEFAULT ""',
    'ADD COLUMN avatar_type TEXT DEFAULT ""',
    'ADD COLUMN youtube2 TEXT DEFAULT ""',
    'ADD COLUMN vimeo2 TEXT DEFAULT ""',
    'ADD COLUMN soundcloudlink2 TEXT DEFAULT ""',
    'ADD COLUMN soundcloudlink3 TEXT DEFAULT ""',
    'ADD COLUMN soundcloudlink4 TEXT DEFAULT ""',
    
    // Professional Status
    'ADD COLUMN verified BOOLEAN DEFAULT 0',
    'ADD COLUMN featured BOOLEAN DEFAULT 0',
    'ADD COLUMN featureddate TEXT DEFAULT ""',
    'ADD COLUMN crb BOOLEAN DEFAULT 0',
    'ADD COLUMN von BOOLEAN DEFAULT 0',
    
    // System Fields
    'ADD COLUMN lastupdated TEXT DEFAULT ""',
    'ADD COLUMN locale TEXT DEFAULT "en"',
    'ADD COLUMN last_login TEXT DEFAULT ""',
    'ADD COLUMN last_login_ip TEXT DEFAULT ""'
  ];

  for (const field of additionalFields) {
    try {
      await db.execute(`ALTER TABLE profile ${field}`);
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.warn(`Warning adding field: ${error.message}`);
      }
    }
  }
  
  console.log('✅ Profile table extended successfully');
}

async function processUserMetaData(db, userMetaData) {
  console.log(`📊 Processing ${userMetaData.length} usermeta records...`);
  
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
  
  // Update profiles in database
  let updated = 0;
  let created = 0;
  
  for (const [userId, profileData] of Object.entries(userProfiles)) {
    try {
      // Check if profile exists
      const existingProfile = await db.execute({
        sql: 'SELECT user_id FROM profile WHERE user_id = ?',
        args: [userId]
      });
      
      if (existingProfile.rows.length > 0) {
        // Update existing profile
        await updateProfile(db, userId, profileData);
        updated++;
      } else {
        // Create new profile
        await createProfile(db, userId, profileData);
        created++;
      }
      
      if ((updated + created) % 50 === 0) {
        console.log(`📈 Progress: ${updated} updated, ${created} created`);
      }
      
    } catch (error) {
      console.error(`Error processing user ${userId}:`, error.message);
    }
  }
  
  console.log(`✅ Profile processing complete: ${updated} updated, ${created} created`);
}

async function updateProfile(db, userId, profileData) {
  const updateFields = [];
  const updateValues = [];
  
  // Map meta_key to profile fields
  const fieldMapping = {
    first_name: 'first_name',
    last_name: 'last_name',
    location: 'location',
    phone: 'phone',
    url: 'url',
    about: 'about',
    shortabout: 'shortabout',
    instagram: 'instagram',
    facebook: 'facebook',
    twitter: 'twitter',
    linkedin: 'linkedin',
    youtubepage: 'youtubepage',
    youtube2: 'youtube2',
    soundcloud: 'soundcloud',
    soundcloudlink: 'soundcloud',
    soundcloudlink2: 'soundcloudlink2',
    soundcloudlink3: 'soundcloudlink3',
    soundcloudlink4: 'soundcloudlink4',
    vimeo: 'vimeo',
    vimeopage: 'vimeo',
    vimeo2: 'vimeo2',
    pinterest: 'pinterest',
    tiktok: 'tiktok',
    category: 'category',
    gender: 'gender',
    birthday: 'birthday',
    rates1: 'rates1',
    rates2: 'rates2',
    rates3: 'rates3',
    homestudio: 'homestudio',
    homestudio2: 'homestudio2',
    homestudio3: 'homestudio3',
    homestudio4: 'homestudio4',
    homestudio5: 'homestudio5',
    homestudio6: 'homestudio6',
    avatar_image: 'avatar_image',
    avatar_type: 'avatar_type',
    verified: 'verified',
    featured: 'featured',
    featureddate: 'featureddate',
    crb: 'crb',
    von: 'von',
    lastupdated: 'lastupdated',
    locale: 'locale',
    last_login: 'last_login',
    last_login_ip: 'last_login_ip'
  };
  
  // Boolean fields
  const booleanFields = {
    showrates: 'showrates',
    showphone: 'showphone',
    showemail: 'showemail',
    showaddress: 'showaddress',
    showmap: 'showmap',
    showdirections: 'showdirections',
    showshort: 'showshort',
    facebookshow: 'facebookshow',
    twittershow: 'twittershow',
    instagramshow: 'instagramshow',
    linkedinshow: 'linkedinshow',
    youtubepageshow: 'youtubepageshow',
    soundcloudshow: 'soundcloudshow',
    vimeopageshow: 'vimeopageshow',
    pinterestshow: 'pinterestshow',
    verified: 'verified',
    featured: 'featured',
    crb: 'crb',
    von: 'von'
  };
  
  // Connection fields
  for (let i = 1; i <= 15; i++) {
    const key = `connection${i}`;
    if (profileData[key]) {
      updateFields.push(`connection${i} = ?`);
      updateValues.push(profileData[key] === '1' || profileData[key] === 'true' ? 1 : 0);
    }
  }
  
  // Process regular fields
  for (const [metaKey, dbField] of Object.entries(fieldMapping)) {
    if (profileData[metaKey] !== undefined) {
      updateFields.push(`${dbField} = ?`);
      updateValues.push(profileData[metaKey] || '');
    }
  }
  
  // Process boolean fields
  for (const [metaKey, dbField] of Object.entries(booleanFields)) {
    if (profileData[metaKey] !== undefined) {
      updateFields.push(`${dbField} = ?`);
      updateValues.push(profileData[metaKey] === '1' || profileData[metaKey] === 'true' ? 1 : 0);
    }
  }
  
  if (updateFields.length > 0) {
    updateValues.push(userId);
    await db.execute({
      sql: `UPDATE profile SET ${updateFields.join(', ')} WHERE user_id = ?`,
      args: updateValues
    });
  }
}

async function createProfile(db, userId, profileData) {
  // Create basic profile first
  await db.execute({
    sql: `INSERT OR IGNORE INTO profile (user_id, first_name, last_name, location, phone, url, about) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      profileData.first_name || '',
      profileData.last_name || '',
      profileData.location || '',
      profileData.phone || '',
      profileData.url || '',
      profileData.about || ''
    ]
  });
  
  // Then update with extended data
  await updateProfile(db, userId, profileData);
}

async function main() {
  try {
    const db = await getConnection();
    
    // Step 1: Extend profile table
    await extendProfileTable(db);
    
    // Step 2: Load and process usermeta data
    const userMetaData = await loadCSVData('old-data/usermeta_full.csv');
    if (userMetaData.length > 0) {
      await processUserMetaData(db, userMetaData);
    }
    
    // Step 3: Process any additional profile data from profile_flat.csv
    const profileFlatData = await loadCSVData('old-data/profile_flat.csv');
    if (profileFlatData.length > 0) {
      console.log(`📋 Processing ${profileFlatData.length} flat profile records...`);
      
      for (const record of profileFlatData) {
        if (!record.user_id || record.user_id === '0') continue;
        
        try {
          // Check if profile exists
          const existingProfile = await db.execute({
            sql: 'SELECT user_id FROM profile WHERE user_id = ?',
            args: [record.user_id]
          });
          
          if (existingProfile.rows.length === 0) {
            // Create profile from flat data
            await db.execute({
              sql: `INSERT INTO profile (
                user_id, first_name, last_name, url, phone, instagram, youtubepage,
                location, address, latitude, longitude, shortabout, about
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                record.user_id,
                record.first_name || '',
                record.last_name || '',
                record.url || '',
                record.phone || '',
                record.instagram || '',
                record.youtubepage || '',
                record.location || '',
                record.address || '',
                record.latitude || null,
                record.longitude || null,
                record.shortabout || '',
                record.about || ''
              ]
            });
          }
        } catch (error) {
          console.error(`Error processing flat profile for user ${record.user_id}:`, error.message);
        }
      }
    }
    
    // Step 4: Get final statistics
    const stats = await db.execute('SELECT COUNT(*) as total FROM profile');
    const usersWithProfiles = await db.execute(`
      SELECT COUNT(*) as total 
      FROM users u 
      JOIN profile p ON p.user_id = u.id 
      WHERE COALESCE(u.status,'') <> 'stub'
    `);
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Final Statistics:`);
    console.log(`   - Total profiles: ${stats.rows[0].total}`);
    console.log(`   - Active user profiles: ${usersWithProfiles.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
