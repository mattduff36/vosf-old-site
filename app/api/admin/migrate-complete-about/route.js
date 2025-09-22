import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { batchSize = 50, startFrom = 0 } = body;

    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'old-data', 'profile_flat_edited.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Simple CSV parsing - split by lines and process each line
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log(`📊 Total lines in CSV: ${lines.length}`);
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    // Parse profiles with multi-line about content
    const profiles = {};
    let currentProfile = null;
    
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;
      
      // Check if this line starts with a user ID (number at the beginning)
      const userIdMatch = line.match(/^(\d+),/);
      
      if (userIdMatch) {
        // New profile starts
        const userId = parseInt(userIdMatch[1]);
        
        // Parse CSV line properly handling quoted fields
        const parts = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Escaped quote
              current += '"';
              i += 2;
            } else {
              // Start or end of quoted field
              inQuotes = !inQuotes;
              i++;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator
            parts.push(current.trim());
            current = '';
            i++;
          } else {
            current += char;
            i++;
          }
        }
        parts.push(current.trim());
        
        if (parts.length >= 13) {
          const firstName = parts[1] ? parts[1].replace(/^"|"$/g, '').trim() : '';
          const aboutContent = parts[12] ? parts[12].replace(/^"|"$/g, '').trim() : '';
          
          if (firstName && firstName !== 'NULL') {
            currentProfile = {
              userId: userId,
              firstName: firstName,
              about: aboutContent || ''
            };
            profiles[userId] = currentProfile;
            console.log(`📝 New profile: ${firstName} (ID: ${userId}) - Initial about: ${aboutContent ? aboutContent.length + ' chars' : 'NO ABOUT'}`);
          }
        }
      } else if (currentProfile && line.startsWith(',')) {
        // Continuation line - extract about content from column 13 (index 12)
        // Parse CSV line properly handling quoted fields
        const parts = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Escaped quote
              current += '"';
              i += 2;
            } else {
              // Start or end of quoted field
              inQuotes = !inQuotes;
              i++;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator
            parts.push(current.trim());
            current = '';
            i++;
          } else {
            current += char;
            i++;
          }
        }
        parts.push(current.trim());
        
        if (parts.length >= 13 && parts[12]) {
          const additionalAbout = parts[12].replace(/^"|"$/g, '').trim();
          if (additionalAbout && additionalAbout !== 'NULL') {
            if (currentProfile.about) {
              currentProfile.about += '\n' + additionalAbout;
            } else {
              currentProfile.about = additionalAbout;
            }
            console.log(`📝 Added to ${currentProfile.firstName}: "${additionalAbout.substring(0, 50)}..."`);
          }
        }
      }
    }
    
    console.log(`📊 Parsed ${Object.keys(profiles).length} profiles from CSV`);
    
    // Show sample of parsed data
    const sampleProfiles = Object.values(profiles).slice(0, 3);
    sampleProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.firstName} - About: ${profile.about ? profile.about.length + ' chars' : 'NO ABOUT'}`);
    });
    
    // Process batch
    const profileArray = Object.values(profiles);
    const batch = profileArray.slice(startFrom, startFrom + batchSize);
    
    console.log(`🔄 Processing batch: ${batch.length} profiles (${startFrom + 1}-${startFrom + batch.length})`);
    
    let updated = 0;
    let errors = 0;
    const results = [];
    
    // HTML entity decoder
    const decodeHtmlEntities = (str) => {
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
        '&nbsp;': ' ',
        '&rsquo;': "'",
        '&ldquo;': '"',
        '&rdquo;': '"',
        '&ndash;': '–',
        '&hellip;': '…'
      };
      
      return str.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
        return htmlEntities[entity] || entity;
      });
    };
    
    for (const profile of batch) {
      try {
        // Find matching user profile in database
        let userProfile = null;
        
        // Strategy 1: Match by firstName
        userProfile = await prisma.userProfile.findFirst({
          where: {
            firstName: {
              contains: profile.firstName,
              mode: 'insensitive'
            }
          },
          include: {
            user: true
          }
        });
        
        // Strategy 2: Match by first word of firstName
        if (!userProfile) {
          const firstWord = profile.firstName.split(' ')[0];
          userProfile = await prisma.userProfile.findFirst({
            where: {
              firstName: {
                contains: firstWord,
                mode: 'insensitive'
              }
            },
            include: {
              user: true
            }
          });
        }
        
        // Strategy 3: Match by username (extracted from firstName)
        if (!userProfile) {
          const potentialUsername = profile.firstName.split(' - ')[0].split(' ')[0];
          const user = await prisma.user.findFirst({
            where: {
              username: potentialUsername
            }
          });
          
          if (user) {
            userProfile = await prisma.userProfile.findFirst({
              where: {
                userId: user.id
              },
              include: {
                user: true
              }
            });
          }
        }
        
        if (!userProfile) {
          console.log(`⚠️  User not found for profile: ${profile.firstName} (user_id: ${profile.userId})`);
          continue;
        }
        
        console.log(`🔍 Processing ${userProfile.user.username} (${userProfile.firstName})`);
        
        // Check if about content exists
        if (!profile.about || profile.about.trim() === '' || profile.about === 'NULL') {
          console.log(`⚠️  Skipping ${userProfile.user.username}: No about content (raw: "${profile.about}")`);
          continue;
        }
        
        // Decode HTML entities and update
        const decodedAbout = decodeHtmlEntities(profile.about);
        
        await prisma.userProfile.update({
          where: {
            id: userProfile.id
          },
          data: {
            about: decodedAbout
          }
        });
        
        console.log(`✅ Updated ${userProfile.user.username}: ${decodedAbout.length} chars`);
        results.push({
          username: userProfile.user.username,
          email: userProfile.user.email,
          aboutLength: decodedAbout.length,
          aboutPreview: decodedAbout.substring(0, 100) + '...'
        });
        updated++;
        
      } catch (error) {
        console.error(`❌ Error updating profile ${profile.firstName}:`, error.message);
        errors++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Migration completed: ${updated} updated, ${errors} errors`,
      results: results,
      totalProfiles: Object.keys(profiles).length,
      processed: batch.length,
      updated,
      errors
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}