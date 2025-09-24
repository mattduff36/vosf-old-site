const { PrismaClient } = require('@prisma/client');

async function verifyStudioNameMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verifying studio name migration status');
    console.log('=' .repeat(50));
    
    // Get all studios with their owner's profile data
    const studios = await prisma.studio.findMany({
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${studios.length} studios\n`);
    
    let matchingCount = 0;
    let differentCount = 0;
    let missingProfileCount = 0;
    
    for (const studio of studios) {
      const studioName = studio.name;
      const profileFirstName = studio.owner?.profile?.firstName;
      const username = studio.owner?.username || 'Unknown';
      
      console.log(`🏢 Studio: ${studio.id.substring(0, 8)}...`);
      console.log(`   Owner: ${username}`);
      console.log(`   Studio Name: "${studioName}"`);
      console.log(`   Profile First Name: "${profileFirstName || 'NULL'}"`);
      
      if (!profileFirstName) {
        console.log(`   ⚠️  Status: No profile first_name`);
        missingProfileCount++;
      } else if (studioName === profileFirstName) {
        console.log(`   ✅ Status: Names match`);
        matchingCount++;
      } else {
        console.log(`   ❌ Status: Names differ`);
        differentCount++;
      }
      console.log('');
    }
    
    console.log('=' .repeat(50));
    console.log('📈 Summary:');
    console.log(`   ✅ Studios with matching names: ${matchingCount}`);
    console.log(`   ❌ Studios with different names: ${differentCount}`);
    console.log(`   ⚠️  Studios without profile first_name: ${missingProfileCount}`);
    console.log(`   📊 Total studios: ${studios.length}`);
    
    if (differentCount === 0) {
      console.log('\n🎉 All studios have correct names!');
      console.log('✅ Migration appears to be successful.');
    } else {
      console.log(`\n⚠️  ${differentCount} studios still need migration.`);
    }
    
    return {
      total: studios.length,
      matching: matchingCount,
      different: differentCount,
      missingProfile: missingProfileCount
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
if (require.main === module) {
  verifyStudioNameMigration()
    .then((results) => {
      console.log('\n✅ Verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyStudioNameMigration };
