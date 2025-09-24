const fetch = require('node-fetch');

async function migrateStudioNamesViaAPI() {
  try {
    console.log('🔄 Starting studio name migration via API');
    console.log('=' .repeat(60));
    
    // First, get all studios
    console.log('📊 Fetching all studios...');
    const studiosResponse = await fetch('http://localhost:3001/api/admin/studios?limit=1000');
    
    if (!studiosResponse.ok) {
      throw new Error(`Failed to fetch studios: ${studiosResponse.status}`);
    }
    
    const studiosData = await studiosResponse.json();
    const studios = studiosData.studios || [];
    
    console.log(`📋 Found ${studios.length} studios to process\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const studio of studios) {
      try {
        console.log(`🔍 Processing studio: ${studio.id.substring(0, 8)}...`);
        console.log(`   Owner: ${studio.username || 'Unknown'}`);
        
        // Get detailed studio data
        const detailResponse = await fetch(`http://localhost:3001/api/admin/studios/${studio.id}`);
        
        if (!detailResponse.ok) {
          console.log(`   ❌ Failed to fetch studio details`);
          errorCount++;
          continue;
        }
        
        const detailData = await detailResponse.json();
        const profile = detailData.profile;
        
        const currentStudioName = profile._meta?.studio_name || '';
        const profileFirstName = profile._meta?.first_name || '';
        
        console.log(`   Current studio.name: "${currentStudioName}"`);
        console.log(`   Profile first_name: "${profileFirstName}"`);
        
        // Only update if profile has a first_name and it's different from studio name
        if (profileFirstName && profileFirstName.trim()) {
          if (currentStudioName !== profileFirstName) {
            console.log(`   ✅ Updating: "${currentStudioName}" → "${profileFirstName}"`);
            
            // Update the studio name
            const updateData = {
              ...profile,
              _meta: {
                ...profile._meta,
                studio_name: profileFirstName.trim()
              }
            };
            
            const updateResponse = await fetch(`http://localhost:3001/api/admin/studios/${studio.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': 'authenticated=true' // Simulate admin authentication
              },
              body: JSON.stringify(updateData)
            });
            
            if (updateResponse.ok) {
              console.log(`   ✅ Successfully updated`);
              updatedCount++;
            } else {
              console.log(`   ❌ Update failed: ${updateResponse.status}`);
              errorCount++;
            }
            
          } else {
            console.log(`   ⏭️  Names already match`);
            skippedCount++;
          }
        } else {
          console.log(`   ⚠️  No first_name to migrate`);
          skippedCount++;
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Error processing studio:`, error.message);
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
    } else {
      console.log('\n✨ No updates needed.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateStudioNamesViaAPI()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateStudioNamesViaAPI };
