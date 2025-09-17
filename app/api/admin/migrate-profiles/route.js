import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection, extendProfileTable } from '../../../lib/database.js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

export const dynamic = 'force-dynamic';

// POST - Run profile data migration
export async function POST(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🚀 Starting profile migration...');
    
    // Step 1: Extend profile table
    await extendProfileTable();
    console.log('✅ Profile table extended');

    // Step 2: Load CSV data
    const userMetaData = loadCSVData('old-data/usermeta_full.csv');
    console.log(`📊 Loaded ${userMetaData.length} usermeta records`);

    // Step 3: Process user profiles
    const db = await getConnection();
    const userProfiles = {};
    
    // Group metadata by user_id
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

    console.log(`👥 Processing ${Object.keys(userProfiles).length} user profiles`);

    // Step 4: Update profiles in database
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
        
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error.message);
      }
    }

    // Step 5: Get final statistics
    const stats = await db.execute('SELECT COUNT(*) as total FROM profile');
    const usersWithProfiles = await db.execute(`
      SELECT COUNT(*) as total 
      FROM users u 
      JOIN profile p ON p.user_id = u.id 
      WHERE COALESCE(u.status,'') <> 'stub'
    `);

    return NextResponse.json({
      success: true,
      message: 'Profile migration completed successfully',
      statistics: {
        totalProfiles: stats.rows[0].total,
        activeUserProfiles: usersWithProfiles.rows[0].total,
        updated,
        created
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}

function loadCSVData(filePath) {
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
