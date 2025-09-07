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

async function uploadVoiceoverGuyImages() {
  try {
    console.log('🎭 UPLOADING VOICEOVERGUY STUDIO IMAGES');
    console.log('='.repeat(40));
    
    const client = await getConnection();
    console.log('✅ Connected to Turso database');
    
    // Get VoiceoverGuy's images from the gallery table
    const voiceoverGuyImages = await client.execute({
      sql: `
        SELECT id, image_type, image_filename, cloudinary_url, cloudinary_public_id, display_order
        FROM studio_gallery 
        WHERE user_id = 1848 AND image_type = 'gallery'
        ORDER BY display_order ASC
      `
    });
    
    console.log(`📋 Found ${voiceoverGuyImages.rows.length} studio images for VoiceoverGuy`);
    
    let uploadedCount = 0;
    
    for (const imageRecord of voiceoverGuyImages.rows) {
      const { id, image_filename } = imageRecord;
      const imagePath = path.join(UPLOADS_PATH, image_filename);
      
      console.log(`\n📤 Processing: ${image_filename}`);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`   ❌ File not found: ${imagePath}`);
        continue;
      }
      
      try {
        // Generate a clean public ID
        const cleanFilename = image_filename.replace(/\.(jpg|jpeg|png|gif)$/i, '');
        const publicId = `voiceoverguy-${Date.now()}-${uploadedCount + 1}`;
        
        console.log(`   📤 Uploading to Cloudinary...`);
        const result = await uploadToCloudinary(imagePath, publicId, 'vosf/studios');
        
        if (result && result.secure_url) {
          console.log(`   ✅ Uploaded: ${result.secure_url}`);
          
          // Update the database record
          await client.execute({
            sql: `
              UPDATE studio_gallery 
              SET cloudinary_url = ?, cloudinary_public_id = ?
              WHERE id = ?
            `,
            args: [result.secure_url, result.public_id, id]
          });
          
          console.log(`   ✅ Database updated`);
          uploadedCount++;
        } else {
          console.log(`   ❌ Upload failed: No secure_url returned`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Upload error: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Uploaded ${uploadedCount} studio images for VoiceoverGuy!`);
    
    // Verify the updates
    const updatedImages = await client.execute({
      sql: `
        SELECT image_type, image_filename, cloudinary_url, is_primary, display_order
        FROM studio_gallery 
        WHERE user_id = 1848
        ORDER BY is_primary DESC, display_order ASC
      `
    });
    
    console.log('\n🎭 VoiceoverGuy Updated Image Gallery:');
    updatedImages.rows.forEach((row, index) => {
      const primary = row.is_primary ? ' (PRIMARY AVATAR)' : '';
      const order = row.display_order ? ` [Order: ${row.display_order}]` : '';
      console.log(`   ${index + 1}. ${row.image_type}: ${row.image_filename}${primary}${order}`);
      if (row.cloudinary_url) {
        console.log(`      → ${row.cloudinary_url}`);
      } else {
        console.log(`      → Not uploaded yet`);
      }
    });
    
  } catch (error) {
    console.error('💥 Upload failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  uploadVoiceoverGuyImages().then(() => {
    console.log('\n🎉 VoiceoverGuy images upload completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Upload process failed:', error);
    process.exit(1);
  });
}

module.exports = { uploadVoiceoverGuyImages };
