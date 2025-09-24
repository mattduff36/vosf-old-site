const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSchemaFixes() {
  console.log('🧪 Testing schema fixes after database changes');
  console.log('=' .repeat(60));
  
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected successfully\n');
    
    // Test 1: Check if we can query users with profiles
    console.log('🔍 Test 1: Querying users with profiles...');
    const usersWithProfiles = await prisma.user.findMany({
      include: {
        profile: true,
        studios: true
      },
      take: 3
    });
    
    console.log(`✅ Found ${usersWithProfiles.length} users with profiles`);
    usersWithProfiles.forEach(user => {
      console.log(`   ${user.username}: studioName="${user.profile?.studioName || 'NULL'}", lastName="${user.profile?.lastName || 'NULL'}"`);
    });
    
    // Test 2: Check if we can query studios with owner profiles
    console.log('\n🔍 Test 2: Querying studios with owner profiles...');
    const studiosWithOwners = await prisma.studio.findMany({
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      },
      take: 3
    });
    
    console.log(`✅ Found ${studiosWithOwners.length} studios with owners`);
    studiosWithOwners.forEach(studio => {
      console.log(`   ${studio.name}: owner="${studio.owner?.username}", profile.studioName="${studio.owner?.profile?.studioName || 'NULL'}"`);
    });
    
    // Test 3: Test search functionality
    console.log('\n🔍 Test 3: Testing search functionality...');
    const searchResults = await prisma.studio.findMany({
      where: {
        OR: [
          { name: { contains: 'Admin', mode: 'insensitive' } },
          { owner: { 
            profile: {
              studioName: { contains: 'Admin', mode: 'insensitive' }
            }
          }}
        ]
      },
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      },
      take: 2
    });
    
    console.log(`✅ Search found ${searchResults.length} results for "Admin"`);
    searchResults.forEach(studio => {
      console.log(`   ${studio.name}: profile.studioName="${studio.owner?.profile?.studioName || 'NULL'}"`);
    });
    
    // Test 4: Test admin stats function
    console.log('\n🔍 Test 4: Testing admin stats...');
    const statsQuery = await prisma.studio.count({
      where: {
        owner: {
          profile: {
            AND: [
              { studioName: { not: null } },
              { about: { not: null } }
            ]
          }
        }
      }
    });
    
    console.log(`✅ Studios with complete profiles (studioName + about): ${statsQuery}`);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All schema tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Schema test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

testSchemaFixes();
