#!/usr/bin/env node

/**
 * Fix Missing Profile Data Migration Script
 * 
 * This script addresses the issue where multi-line "about" sections from the old database
 * were truncated during migration, causing profiles to show incomplete information.
 * 
 * The issue: Frank's profile shows only "I'm equipped with a professional studio in my home that includes:"
 * But the complete text should include equipment details across multiple lines.
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
let tursoClient = null;

async function getConnection() {
  if (!tursoClient) {
    tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    console.log('Connected to Turso database');
  }
  return tursoClient;
}

// Parse CSV data with proper handling of multi-line fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      i++;
      continue;
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current);
  return result.map(field => field.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

// Load and parse usermeta data
async function loadUserMetaData() {
  console.log('📖 Loading usermeta data...');
  
  const filePath = path.join(__dirname, 'old-data', 'usermeta_extracted.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  console.log(`Found ${lines.length} usermeta records`);
  
  const userMetaData = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const fields = parseCSVLine(line);
      if (fields.length >= 4) {
        const [metaId, userId, metaKey, metaValue] = fields;
        userMetaData.push({
          meta_id: metaId?.replace(/"/g, ''),
          user_id: userId?.replace(/"/g, ''),
          meta_key: metaKey?.replace(/"/g, ''),
          meta_value: metaValue?.replace(/"/g, '').replace(/&#039;/g, "'")
        });
      }
    } catch (error) {
      console.warn(`Error parsing line ${i + 1}: ${error.message}`);
    }
  }
  
  return userMetaData;
}

// Load users data to map user IDs to usernames
async function loadUsersData() {
  console.log('👥 Loading users data...');
  
  const filePath = path.join(__dirname, 'old-data', 'users.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const users = {};
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const fields = parseCSVLine(line);
      if (fields.length >= 3) {
        const [userId, username] = fields;
        users[userId?.replace(/"/g, '')] = username?.replace(/"/g, '');
      }
    } catch (error) {
      console.warn(`Error parsing user line: ${error.message}`);
    }
  }
  
  console.log(`Loaded ${Object.keys(users).length} users`);
  return users;
}

// Check current profile data in Turso
async function checkCurrentProfiles(db) {
  console.log('🔍 Checking current profile data...');
  
  try {
    const result = await db.execute('SELECT COUNT(*) as count FROM profile');
    console.log(`Current profiles in database: ${result.rows[0].count}`);
    
    // Check Frank's current profile
    const frankProfile = await db.execute({
      sql: 'SELECT user_id, username, about FROM profile WHERE username = ?',
      args: ['FrankS']
    });
    
    if (frankProfile.rows.length > 0) {
      console.log('Frank\'s current profile:');
      console.log('About:', frankProfile.rows[0].about);
      return frankProfile.rows[0];
    } else {
      console.log('Frank\'s profile not found in current database');
      return null;
    }
  } catch (error) {
    console.error('Error checking profiles:', error);
    return null;
  }
}

// Update profile with complete data
async function updateProfileData(db, userId, username, profileData) {
  try {
    const updateFields = [];
    const updateValues = [];
    
    // Map the important fields
    const fieldMapping = {
      'about': 'about',
      'shortabout': 'shortabout',
      'phone': 'phone',
      'url': 'url',
      'location': 'location',
      'category': 'category',
      'gender': 'gender',
      'birthday': 'birthday',
      'twitter': 'twitter',
      'facebook': 'facebook',
      'linkedin': 'linkedin',
      'soundcloud': 'soundcloud',
      'vimeo': 'vimeo',
      'youtube': 'youtube',
      'homestudio': 'homestudio',
      'avatar_image': 'avatar_image',
      'rates1': 'rates1',
      'rates2': 'rates2',
      'rates3': 'rates3'
    };
    
    for (const [oldKey, newKey] of Object.entries(fieldMapping)) {
      if (profileData[oldKey] !== undefined && profileData[oldKey] !== '') {
        updateFields.push(`${newKey} = ?`);
        updateValues.push(profileData[oldKey]);
      }
    }
    
    // Handle connection fields
    for (let i = 1; i <= 15; i++) {
      const connectionKey = `connection${i}`;
      if (profileData[connectionKey] !== undefined) {
        updateFields.push(`${connectionKey} = ?`);
        updateValues.push(profileData[connectionKey] === '1' ? 1 : 0);
      }
    }
    
    // Handle display settings
    const displayFields = [
      'showphone', 'showemail', 'showaddress', 'showmap', 'showdirections',
      'facebookshow', 'twittershow', 'instagramshow', 'linkedinshow',
      'youtubepageshow', 'soundcloudshow', 'vimeopageshow'
    ];
    
    for (const field of displayFields) {
      if (profileData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(profileData[field] === '1' ? 1 : 0);
      }
    }
    
    if (updateFields.length > 0) {
      updateValues.push(userId);
      const sql = `UPDATE profile SET ${updateFields.join(', ')} WHERE user_id = ?`;
      
      await db.execute({
        sql: sql,
        args: updateValues
      });
      
      console.log(`✅ Updated profile for ${username} (user_id: ${userId})`);
      return true;
    } else {
      console.log(`⚠️  No data to update for ${username}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error updating profile for ${username}:`, error.message);
    return false;
  }
}

// Main migration function
async function main() {
  try {
    console.log('🚀 Starting missing profile data migration...\n');
    
    // Load data
    const [userMetaData, usersData] = await Promise.all([
      loadUserMetaData(),
      loadUsersData()
    ]);
    
    // Connect to database
    const db = await getConnection();
    
    // Check current state
    await checkCurrentProfiles(db);
    
    // Group metadata by user_id
    console.log('\n📊 Processing usermeta records...');
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
    
    // Focus on Frank first to verify the fix
    const frankUserId = '2004'; // From the usermeta data
    const frankUsername = 'FrankS';
    
    if (userProfiles[frankUserId]) {
      console.log('\n🎯 Updating Frank\'s profile...');
      console.log('Complete about section:');
      console.log(userProfiles[frankUserId].about);
      
      const success = await updateProfileData(db, frankUserId, frankUsername, userProfiles[frankUserId]);
      
      if (success) {
        // Verify the update
        const updatedProfile = await db.execute({
          sql: 'SELECT about FROM profile WHERE user_id = ?',
          args: [frankUserId]
        });
        
        if (updatedProfile.rows.length > 0) {
          console.log('\n✅ Frank\'s updated about section:');
          console.log(updatedProfile.rows[0].about);
        }
      }
    }
    
    // Update all other profiles
    console.log('\n🔄 Updating all profiles...');
    let updated = 0;
    let errors = 0;
    
    for (const [userId, profileData] of Object.entries(userProfiles)) {
      if (userId === frankUserId) continue; // Already done
      
      const username = usersData[userId] || `user_${userId}`;
      
      try {
        // Check if profile exists
        const existingProfile = await db.execute({
          sql: 'SELECT user_id FROM profile WHERE user_id = ?',
          args: [userId]
        });
        
        if (existingProfile.rows.length > 0) {
          const success = await updateProfileData(db, userId, username, profileData);
          if (success) updated++;
        } else {
          console.log(`⚠️  Profile not found for user ${username} (${userId})`);
        }
        
        if ((updated + errors) % 50 === 0) {
          console.log(`📈 Progress: ${updated} updated, ${errors} errors`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${username}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ ${updated} profiles updated`);
    console.log(`❌ ${errors} errors encountered`);
    
    // Final verification
    console.log('\n🔍 Final verification - Frank\'s profile:');
    const finalCheck = await db.execute({
      sql: 'SELECT username, about FROM profile WHERE username = ?',
      args: ['FrankS']
    });
    
    if (finalCheck.rows.length > 0) {
      console.log('Username:', finalCheck.rows[0].username);
      console.log('About:', finalCheck.rows[0].about);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
