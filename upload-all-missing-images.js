const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const UPLOADS_PATH = path.join(__dirname, 'FULL WEBSITE', 'public_html', 'uploads');

let cloudinaryModule;
let databaseModule;

async function uploadToCloudinary(imagePath, publicId, folder = 'vosf/studios') {
  if (!cloudinaryModule) {
    cloudinaryModule = await import('./app/lib/cloudinary.js');
  }
  return cloudinaryModule.uploadImage(imagePath, publicId, folder);
}

async function getConnection() {
  if (!databaseModule) {
    databaseModule = await import('./app/lib/database.js');
  }
  return databaseModule.getConnection();
}

async function uploadAllMissingImages() {
  try {
    console.log('📤 UPLOADING ALL MISSING IMAGES');
    console.log('='.repeat(50));
    
    const client = await getConnection();
    console.log('✅ Connected to Turso database');
    
    // Get all images that need uploading (no cloudinary_url or empty)
    const missingImages = await client.execute({
      sql: `
        SELECT 
          sg.id, sg.user_id, sg.image_type, sg.image_filename, 
          sg.cloudinary_url, sg.display_order,
          u.username, u.display_name
        FROM studio_gallery sg
        JOIN shows_users u ON sg.user_id = u.id
        WHERE sg.cloudinary_url IS NULL 
           OR sg.cloudinary_url = '' 
           OR sg.cloudinary_url NOT LIKE '%cloudinary.com%'
        ORDER BY sg.user_id, sg.is_primary DESC, sg.display_order ASC
      `
    });
    
    console.log(`📋 Found ${missingImages.rows.length} images needing upload`);
    
    if (missingImages.rows.length === 0) {
      console.log('🎉 All images are already uploaded!');
      return;
    }
    
    let uploadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    const batchSize = 5; // Upload in small batches to avoid rate limits
    
    for (let i = 0; i < missingImages.rows.length; i += batchSize) {
      const batch = missingImages.rows.slice(i, i + batchSize);
      
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(missingImages.rows.length/batchSize)}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (image) => {
        const { id, user_id, username, image_filename, image_type } = image;
        const imagePath = path.join(UPLOADS_PATH, image_filename);
        
        console.log(`   📤 ${username}: ${image_filename}`);
        
        // Check if file exists locally
        if (!fs.existsSync(imagePath)) {
          console.log(`   ❌ File not found: ${image_filename}`);
          return { status: 'skipped', reason: 'file_not_found' };
        }
        
        try {
          // Generate appropriate public ID and folder
          let folder = 'vosf/studios';
          let publicId = `${username}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          if (image_type === 'avatar') {
            folder = 'vosf/avatars';
            publicId = username;
          } else {
            // For gallery images, use a more descriptive name
            const cleanFilename = image_filename.replace(/\.(jpg|jpeg|png|gif)$/i, '');
            publicId = cleanFilename;
          }
          
          // Upload to Cloudinary
          const result = await uploadToCloudinary(imagePath, publicId, folder);
          
          if (result && result.secure_url) {
            // Update database with new URL
            await client.execute({
              sql: `
                UPDATE studio_gallery 
                SET cloudinary_url = ?, cloudinary_public_id = ?
                WHERE id = ?
              `,
              args: [result.secure_url, result.public_id, id]
            });
            
            console.log(`   ✅ Uploaded: ${result.secure_url}`);
            return { status: 'success', url: result.secure_url };
          } else {
            console.log(`   ❌ Upload failed: No secure_url returned`);
            return { status: 'error', reason: 'no_url' };
          }
          
        } catch (error) {
          console.log(`   ❌ Upload error: ${error.message}`);
          return { status: 'error', reason: error.message };
        }
      });
      
      // Wait for batch to complete
      const results = await Promise.all(batchPromises);
      
      // Count results
      results.forEach(result => {
        if (result.status === 'success') uploadedCount++;
        else if (result.status === 'skipped') skippedCount++;
        else if (result.status === 'error') errorCount++;
      });
      
      console.log(`   📊 Batch complete: ${results.filter(r => r.status === 'success').length} uploaded`);
      
      // Small delay between batches
      if (i + batchSize < missingImages.rows.length) {
        console.log('   ⏳ Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n🎉 UPLOAD COMPLETE!');
    console.log(`   ✅ Successfully uploaded: ${uploadedCount}`);
    console.log(`   ⚠️ Skipped (file not found): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Success rate: ${Math.round((uploadedCount / missingImages.rows.length) * 100)}%`);
    
    // Verify VoiceoverGuy's images
    console.log('\n🎭 VOICEOVERGUY VERIFICATION:');
    const voiceoverGuyImages = await client.execute({
      sql: `
        SELECT image_type, image_filename, cloudinary_url, is_primary, display_order
        FROM studio_gallery 
        WHERE user_id = 1848
        ORDER BY is_primary DESC, display_order ASC
      `
    });
    
    console.log(`   📊 Total images: ${voiceoverGuyImages.rows.length}`);
    voiceoverGuyImages.rows.forEach((row, index) => {
      const status = row.cloudinary_url && row.cloudinary_url.includes('cloudinary.com') ? '✅' : '❌';
      const primary = row.is_primary ? ' (PRIMARY)' : '';
      console.log(`   ${index + 1}. ${status} ${row.image_type}: ${row.image_filename}${primary}`);
      if (row.cloudinary_url) {
        console.log(`      → ${row.cloudinary_url}`);
      }
    });
    
    // Final statistics
    const finalStats = await client.execute({
      sql: `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN cloudinary_url IS NOT NULL AND cloudinary_url LIKE '%cloudinary.com%' THEN 1 END) as uploaded
        FROM studio_gallery
      `
    });
    
    const total = finalStats.rows[0].total;
    const uploaded = finalStats.rows[0].uploaded;
    
    console.log('\n📈 FINAL STATISTICS:');
    console.log(`   Total images in database: ${total}`);
    console.log(`   Successfully uploaded: ${uploaded}`);
    console.log(`   Upload completion: ${Math.round((uploaded / total) * 100)}%`);
    
    if (uploaded === total) {
      console.log('\n🚀 SUCCESS: ALL IMAGES UPLOADED TO CLOUDINARY!');
    } else {
      console.log(`\n⚠️ PARTIAL: ${total - uploaded} images still need attention`);
    }
    
  } catch (error) {
    console.error('💥 Upload process failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  uploadAllMissingImages().then(() => {
    console.log('\n🎉 Mass upload process completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Upload process failed:', error);
    process.exit(1);
  });
}

module.exports = { uploadAllMissingImages };
