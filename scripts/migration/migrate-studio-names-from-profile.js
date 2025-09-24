const { PrismaClient } = require('@prisma/client');

async function migrateStudioNames() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting migration: user_profiles.first_name → studios.name');
    console.log('=' .repeat(60));
    
    // Get all studios with their owner's profile data
    const studios = await prisma.studio.findMany({
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${studios.length} studios to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const studio of studios) {
      try {
        const currentStudioName = studio.name;
        const profileFirstName = studio.owner?.profile?.firstName;
        
        console.log(`\n🔍 Processing studio: ${studio.id}`);
        console.log(`   Owner: ${studio.owner?.username || 'Unknown'}`);
        console.log(`   Current studio.name: "${currentStudioName}"`);
        console.log(`   Profile first_name: "${profileFirstName || 'NULL'}"`);
        
        // Only update if profile has a first_name and studio name is different
        if (profileFirstName && profileFirstName.trim()) {
          if (currentStudioName !== profileFirstName) {
            console.log(`   ✅ Updating studio.name: "${currentStudioName}" → "${profileFirstName}"`);
            
            await prisma.studio.update({
              where: { id: studio.id },
              data: { name: profileFirstName.trim() }
            });
            
            updatedCount++;
          } else {
            console.log(`   ⏭️  Studio name already matches profile first_name`);
            skippedCount++;
          }
        } else {
          console.log(`   ⚠️  No first_name in profile, keeping current studio name`);
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing studio ${studio.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📈 Migration Summary:');
    console.log(`   ✅ Studios updated: ${updatedCount}`);
    console.log(`   ⏭️  Studios skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total processed: ${studios.length}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 You can now test the studio name functionality.');
      console.log('⚠️  After testing, you can remove the user_profiles.first_name field.');
    } else {
      console.log('\n✨ No updates needed - all studio names are already correct.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateStudioNames()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateStudioNames };
