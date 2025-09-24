#!/usr/bin/env node

/**
 * Database Connection Test for HTML Entity Fix Project
 * Tests connection to PostgreSQL database and verifies table structure
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...\n');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test table access and get sample data with HTML entities
    console.log('\n📊 Testing table access and finding HTML entities...\n');
    
    // Test users table
    const usersWithEntities = await prisma.user.findMany({
      where: {
        OR: [
          { displayName: { contains: '&#039;' } },
          { displayName: { contains: '&amp;' } },
          { displayName: { contains: '&eacute;' } },
          { displayName: { contains: '&trade;' } },
          { displayName: { contains: '&rsquo;' } }
        ]
      },
      take: 5
    });
    
    console.log(`👥 Users with HTML entities: ${usersWithEntities.length}`);
    usersWithEntities.forEach(user => {
      console.log(`   - ID ${user.id}: "${user.displayName}"`);
    });
    
    // Test user_profiles table
    const profilesWithEntities = await prisma.userProfile.findMany({
      where: {
        OR: [
          { firstName: { contains: '&#039;' } },
          { firstName: { contains: '&amp;' } },
          { firstName: { contains: '&eacute;' } },
          { about: { contains: '&#039;' } },
          { about: { contains: '&amp;' } },
          { about: { contains: '&rsquo;' } }
        ]
      },
      take: 5
    });
    
    console.log(`\n📝 User profiles with HTML entities: ${profilesWithEntities.length}`);
    profilesWithEntities.forEach(profile => {
      if (profile.firstName && (profile.firstName.includes('&#039;') || profile.firstName.includes('&amp;') || profile.firstName.includes('&eacute;'))) {
        console.log(`   - Profile ID ${profile.id}: firstName = "${profile.firstName}"`);
      }
      if (profile.about && (profile.about.includes('&#039;') || profile.about.includes('&amp;') || profile.about.includes('&rsquo;'))) {
        console.log(`   - Profile ID ${profile.id}: about contains HTML entities`);
      }
    });
    
    // Test studios table
    const studiosWithEntities = await prisma.studio.findMany({
      where: {
        OR: [
          { name: { contains: '&#039;' } },
          { name: { contains: '&amp;' } },
          { description: { contains: '&#039;' } },
          { description: { contains: '&amp;' } },
          { description: { contains: '&rsquo;' } }
        ]
      },
      take: 5
    });
    
    console.log(`\n🏢 Studios with HTML entities: ${studiosWithEntities.length}`);
    studiosWithEntities.forEach(studio => {
      if (studio.name && (studio.name.includes('&#039;') || studio.name.includes('&amp;'))) {
        console.log(`   - Studio ID ${studio.id}: name = "${studio.name}"`);
      }
      if (studio.description && (studio.description.includes('&#039;') || studio.description.includes('&amp;') || studio.description.includes('&rsquo;'))) {
        console.log(`   - Studio ID ${studio.id}: description contains HTML entities`);
      }
    });
    
    // Get total counts for planning
    const totalUsers = await prisma.user.count();
    const totalProfiles = await prisma.userProfile.count();
    const totalStudios = await prisma.studio.count();
    
    console.log(`\n📈 Database Statistics:`);
    console.log(`   - Total users: ${totalUsers}`);
    console.log(`   - Total user profiles: ${totalProfiles}`);
    console.log(`   - Total studios: ${totalStudios}`);
    
    console.log(`\n🎯 Connection test completed successfully!`);
    console.log(`✨ Ready to proceed with HTML entity fixes!`);
    
    return {
      connected: true,
      usersWithEntities: usersWithEntities.length,
      profilesWithEntities: profilesWithEntities.length,
      studiosWithEntities: studiosWithEntities.length,
      totalRecords: totalUsers + totalProfiles + totalStudios
    };
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if called directly
if (require.main === module) {
  testDatabaseConnection()
    .then((results) => {
      console.log(`\n📋 Test Results Summary:`);
      console.log(`   - Connection: ${results.connected ? '✅ Success' : '❌ Failed'}`);
      console.log(`   - Records with HTML entities found: ${results.usersWithEntities + results.profilesWithEntities + results.studiosWithEntities}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Connection test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
