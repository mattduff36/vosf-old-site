import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../lib/database.js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Helper function to decode HTML entities
function decodeHtmlEntities(str) {
  if (!str) return str;
  
  const htmlEntities = {
    '&pound;': '£',
    '&euro;': '€',
    '&dollar;': '$',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  return str.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return htmlEntities[entity] || entity;
  });
}

// Parse CSV file
function parseCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const data = [];
    
    for (const line of lines) {
      // Simple CSV parsing - split by comma and remove quotes
      const fields = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim()); // Add the last field
      
      data.push(fields);
    }
    
    return data;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

export async function POST(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const prisma = await getConnection();
    const body = await request.json();
    const { action = 'migrate' } = body;

    if (action === 'migrate') {
      console.log('🚀 Starting data migration from old CSV files...');
      
      // 1. Load users data from CSV
      const usersData = parseCSV('./old-data/users.csv');
      const users = usersData.slice(1); // Skip header
      
      // 2. Load usermeta data from CSV  
      const usermetaData = parseCSV('./old-data/usermeta_extracted.csv');
      const usermeta = usermetaData.slice(1); // Skip header
      
      // 3. Group usermeta by user_id
      const userMetaMap = {};
      usermeta.forEach(row => {
        const [id, userId, metaKey, metaValue] = row;
        if (!userMetaMap[userId]) {
          userMetaMap[userId] = {};
        }
        userMetaMap[userId][metaKey] = metaValue;
      });
      
      let updatedCount = 0;
      let errorCount = 0;
      const results = [];
      
      // 4. Process all users
      console.log(`📊 Processing ${users.length} users from CSV...`);
      
      for (let i = 0; i < users.length; i++) {
        const userRow = users[i];
        const [oldId, username, email, password, displayName] = userRow;
        
        if (!username || !email) continue;
        
        // Log progress every 50 users
        if (i % 50 === 0) {
          console.log(`⏳ Progress: ${i}/${users.length} users processed...`);
        }
        
        try {
          // Try to find the user in Prisma database by email first
          let existingUser = await prisma.user.findFirst({
            where: { email: email },
            include: { profile: true, studios: true }
          });
          
          // If not found by email, try by username
          if (!existingUser) {
            existingUser = await prisma.user.findFirst({
              where: { username: username },
              include: { profile: true, studios: true }
            });
          }
          
          if (!existingUser) {
            results.push({ username, email, status: 'not_found' });
            continue;
          }
          
          // Get usermeta for this user
          const meta = userMetaMap[oldId] || {};
          
          // Update user table
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              username: username,
              displayName: displayName || username
            }
          });
          
          // Prepare profile data
          const profileData = {
            firstName: decodeHtmlEntities(meta.first_name),
            lastName: decodeHtmlEntities(meta.last_name),
            phone: meta.phone,
            about: decodeHtmlEntities(meta.about),
            shortAbout: decodeHtmlEntities(meta.shortabout),
            location: meta.location,
            // Rates with HTML entity decoding
            rateTier1: decodeHtmlEntities(meta.rates1),
            rateTier2: decodeHtmlEntities(meta.rates2),
            rateTier3: decodeHtmlEntities(meta.rates3),
            showRates: meta.showrates === '1',
            // Social media
            facebookUrl: meta.facebook,
            twitterUrl: meta.twitter,
            linkedinUrl: meta.linkedin,
            instagramUrl: meta.instagram,
            youtubeUrl: meta.youtubepage,
            vimeoUrl: meta.vimeopage,
            soundcloudUrl: meta.soundcloud,
            // Display settings
            showEmail: meta.showemail === '1',
            showPhone: meta.showphone === '1',
            showAddress: meta.showaddress === '1',
            // Other fields
            isFeatured: meta.featured === '1',
            isSpotlight: meta.spotlight === '1',
            isCrbChecked: meta.crb_checked === '1'
          };
          
          // Remove undefined values
          Object.keys(profileData).forEach(key => {
            if (profileData[key] === undefined) {
              delete profileData[key];
            }
          });
          
          // Update or create profile
          await prisma.userProfile.upsert({
            where: { userId: existingUser.id },
            update: profileData,
            create: {
              userId: existingUser.id,
              ...profileData
            }
          });
          
          // Update studio data if user has studios
          if (existingUser.studios && existingUser.studios.length > 0) {
            for (const studio of existingUser.studios) {
              const studioUpdateData = {};
              
              if (meta.url) studioUpdateData.websiteUrl = meta.url;
              if (meta.phone) studioUpdateData.phone = meta.phone;
              
              if (Object.keys(studioUpdateData).length > 0) {
                await prisma.studio.update({
                  where: { id: studio.id },
                  data: studioUpdateData
                });
              }
            }
          }
          
          results.push({ 
            username, 
            email, 
            status: 'updated',
            rates: [
              decodeHtmlEntities(meta.rates1),
              decodeHtmlEntities(meta.rates2), 
              decodeHtmlEntities(meta.rates3)
            ].filter(Boolean),
            website: meta.url
          });
          
          updatedCount++;
          
        } catch (error) {
          results.push({ username, email, status: 'error', error: error.message });
          errorCount++;
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Migration completed: ${updatedCount} updated, ${errorCount} errors`,
        results: results
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed: ' + error.message }, { status: 500 });
  }
}
