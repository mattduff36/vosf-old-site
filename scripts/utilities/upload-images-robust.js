const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { v2: cloudinary } = require('cloudinary');

dotenv.config({ path: '.env.local' });

const UPLOADS_PATH = path.join(__dirname, 'FULL WEBSITE', 'public_html', 'uploads');

// Configure Cloudinary directly
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let databaseModule;

async function getConnection() {
  if (!databaseModule) {
    databaseModule = await import('./app/lib/database.js');
  }
  return databaseModule.getConnection();
}

async function uploadImageToCloudinary(imagePath, publicId, folder = 'vosf/studios') {
  try {
    console.log(`      🔄 Uploading to folder: ${folder}, publicId: ${publicId}`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: folder,
      overwrite: true,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });
    
    console.log(`      ✅ Success: ${result.secure_url}`);
    return {
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.log(`      ❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function uploadRobustImages() {
  try {
    console.log('🚀 ROBUST IMAGE UPLOAD PROCESS');
    console.log('='.repeat(50));
    
    // Test Cloudinary connection first
    console.log('🔧 Testing Cloudinary connection...');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING'}`);
    console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'}`);
    
    const client = await getConnection();
    console.log('✅ Connected to Turso database');
    
    // Get VoiceoverGuy's images first as a test
    console.log('\n🎭 Testing with VoiceoverGuy images...');
    const voiceoverGuyImages = await client.execute({
      sql: `
        SELECT 
          sg.id, sg.user_id, sg.image_type, sg.image_filename, 
          sg.cloudinary_url, sg.display_order,
          u.username
        FROM studio_gallery sg
        JOIN shows_users u ON sg.user_id = u.id
        WHERE sg.user_id = 1848
          AND (sg.cloudinary_url IS NULL 
               OR sg.cloudinary_url = '' 
               OR sg.cloudinary_url NOT LIKE '%cloudinary.com%')
        ORDER BY sg.is_primary DESC, sg.display_order ASC
      `
    });
    
    console.log(`📋 Found ${voiceoverGuyImages.rows.length} VoiceoverGuy images to upload`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const image of voiceoverGuyImages.rows) {
      const { id, username, image_filename, image_type } = image;
      const imagePath = path.join(UPLOADS_PATH, image_filename);
      
      console.log(`\n📤 Processing: ${image_filename}`);
      console.log(`   Path: ${imagePath}`);
      console.log(`   Exists: ${fs.existsSync(imagePath) ? '✅' : '❌'}`);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`   ⚠️ Skipping - file not found`);
        continue;
      }
      
      // Generate appropriate public ID and folder
      let folder = 'vosf/studios';
      let publicId = `${username}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      if (image_type === 'avatar') {
        folder = 'vosf/avatars';
        publicId = username;
      } else {
        // For gallery images, use the original filename pattern
        const cleanFilename = image_filename.replace(/\.(jpg|jpeg|png|gif)$/i, '');
        publicId = cleanFilename;
      }
      
      const result = await uploadImageToCloudinary(imagePath, publicId, folder);
      
      if (result.success) {
        // Update database
        try {
          await client.execute({
            sql: `
              UPDATE studio_gallery 
              SET cloudinary_url = ?, cloudinary_public_id = ?
              WHERE id = ?
            `,
            args: [result.secure_url, result.public_id, id]
          });
          
          console.log(`   💾 Database updated successfully`);
          successCount++;
        } catch (dbError) {
          console.log(`   ❌ Database update failed: ${dbError.message}`);
          errorCount++;
        }
      } else {
        errorCount++;
      }
      
      // Small delay between uploads
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n📊 VoiceoverGuy Results: ${successCount} success, ${errorCount} errors`);
    
    if (successCount > 0) {
      console.log('\n🎉 SUCCESS! Cloudinary is working. Proceeding with all images...');
      
      // Now upload all remaining images
      const allMissingImages = await client.execute({
        sql: `
          SELECT 
            sg.id, sg.user_id, sg.image_type, sg.image_filename, 
            sg.cloudinary_url, sg.display_order,
            u.username
          FROM studio_gallery sg
          JOIN shows_users u ON sg.user_id = u.id
          WHERE sg.cloudinary_url IS NULL 
             OR sg.cloudinary_url = '' 
             OR sg.cloudinary_url NOT LIKE '%cloudinary.com%'
          ORDER BY sg.user_id, sg.is_primary DESC, sg.display_order ASC
        `
      });
      
      console.log(`\n📋 Found ${allMissingImages.rows.length} total images to upload`);
      
      let totalSuccess = successCount;
      let totalErrors = errorCount;
      
      // Process in smaller batches
      const batchSize = 3;
      for (let i = 0; i < allMissingImages.rows.length; i += batchSize) {
        const batch = allMissingImages.rows.slice(i, i + batchSize);
        
        console.log(`\n📦 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allMissingImages.rows.length/batchSize)}`);
        
        for (const image of batch) {
          const { id, username, image_filename, image_type } = image;
          const imagePath = path.join(UPLOADS_PATH, image_filename);
          
          console.log(`   📤 ${username}: ${image_filename}`);
          
          if (!fs.existsSync(imagePath)) {
            console.log(`      ⚠️ File not found`);
            continue;
          }
          
          // Generate public ID
          let folder = 'vosf/studios';
          let publicId = `${username}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          
          if (image_type === 'avatar') {
            folder = 'vosf/avatars';
            publicId = username;
          } else {
            const cleanFilename = image_filename.replace(/\.(jpg|jpeg|png|gif)$/i, '');
            publicId = cleanFilename;
          }
          
          const result = await uploadImageToCloudinary(imagePath, publicId, folder);
          
          if (result.success) {
            try {
              await client.execute({
                sql: `
                  UPDATE studio_gallery 
                  SET cloudinary_url = ?, cloudinary_public_id = ?
                  WHERE id = ?
                `,
                args: [result.secure_url, result.public_id, id]
              });
              
              totalSuccess++;
            } catch (dbError) {
              console.log(`      ❌ DB Error: ${dbError.message}`);
              totalErrors++;
            }
          } else {
            totalErrors++;
          }
          
          // Delay between uploads
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        console.log(`   📊 Batch complete. Running total: ${totalSuccess} success, ${totalErrors} errors`);
        
        // Longer delay between batches
        if (i + batchSize < allMissingImages.rows.length) {
          console.log('   ⏳ Waiting 5 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      console.log(`\n🎉 FINAL RESULTS: ${totalSuccess} uploaded, ${totalErrors} errors`);
    } else {
      console.log('\n❌ Cloudinary connection failed. Please check credentials.');
    }
    
    // Final verification
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
    
    console.log('\n📈 FINAL DATABASE STATUS:');
    console.log(`   Total images: ${total}`);
    console.log(`   Uploaded: ${uploaded}`);
    console.log(`   Completion: ${Math.round((uploaded / total) * 100)}%`);
    
  } catch (error) {
    console.error('💥 Process failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  uploadRobustImages().then(() => {
    console.log('\n🎉 Robust upload process completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Process failed:', error);
    process.exit(1);
  });
}

module.exports = { uploadRobustImages };
