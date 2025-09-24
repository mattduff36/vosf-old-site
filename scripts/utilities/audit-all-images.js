const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const UPLOADS_PATH = path.join(__dirname, 'FULL WEBSITE', 'public_html', 'uploads');

let databaseModule;

async function getConnection() {
  if (!databaseModule) {
    databaseModule = await import('./app/lib/database.js');
  }
  return databaseModule.getConnection();
}

async function auditAllImages() {
  try {
    console.log('🔍 COMPREHENSIVE IMAGE AUDIT');
    console.log('='.repeat(50));
    
    const client = await getConnection();
    console.log('✅ Connected to Turso database');
    
    // Get all images from studio_gallery
    const galleryImages = await client.execute({
      sql: `
        SELECT 
          sg.id, sg.user_id, sg.image_type, sg.image_filename, 
          sg.cloudinary_url, sg.cloudinary_public_id,
          u.username, u.display_name
        FROM studio_gallery sg
        JOIN shows_users u ON sg.user_id = u.id
        ORDER BY sg.user_id, sg.is_primary DESC, sg.display_order ASC
      `
    });
    
    console.log(`📊 Found ${galleryImages.rows.length} images in gallery table`);
    
    // Check which files exist locally
    let localFilesFound = 0;
    let localFilesMissing = 0;
    let cloudinaryUploaded = 0;
    let cloudinaryMissing = 0;
    
    const imagesByUser = {};
    const missingFiles = [];
    const needsUpload = [];
    
    for (const image of galleryImages.rows) {
      const { user_id, username, display_name, image_filename, cloudinary_url } = image;
      
      if (!imagesByUser[user_id]) {
        imagesByUser[user_id] = {
          username,
          display_name,
          images: [],
          localCount: 0,
          uploadedCount: 0
        };
      }
      
      // Check if file exists locally
      const localPath = path.join(UPLOADS_PATH, image_filename);
      const fileExists = fs.existsSync(localPath);
      
      if (fileExists) {
        localFilesFound++;
        imagesByUser[user_id].localCount++;
      } else {
        localFilesMissing++;
        missingFiles.push({
          username,
          filename: image_filename,
          path: localPath
        });
      }
      
      // Check if uploaded to Cloudinary
      if (cloudinary_url && cloudinary_url.includes('cloudinary.com')) {
        cloudinaryUploaded++;
        imagesByUser[user_id].uploadedCount++;
      } else {
        cloudinaryMissing++;
        if (fileExists) {
          needsUpload.push({
            ...image,
            localPath
          });
        }
      }
      
      imagesByUser[user_id].images.push({
        filename: image_filename,
        type: image.image_type,
        exists: fileExists,
        uploaded: !!(cloudinary_url && cloudinary_url.includes('cloudinary.com'))
      });
    }
    
    console.log('\n📈 OVERALL STATISTICS:');
    console.log(`   Total Images in Database: ${galleryImages.rows.length}`);
    console.log(`   Local Files Found: ${localFilesFound}`);
    console.log(`   Local Files Missing: ${localFilesMissing}`);
    console.log(`   Uploaded to Cloudinary: ${cloudinaryUploaded}`);
    console.log(`   Need Cloudinary Upload: ${cloudinaryMissing}`);
    
    console.log('\n👥 USERS WITH IMAGES:');
    const userIds = Object.keys(imagesByUser).sort((a, b) => 
      imagesByUser[b].images.length - imagesByUser[a].images.length
    );
    
    userIds.slice(0, 20).forEach(userId => {
      const user = imagesByUser[userId];
      const status = user.uploadedCount === user.images.length ? '✅' : 
                    user.uploadedCount > 0 ? '⚠️' : '❌';
      
      console.log(`   ${status} ${user.username} (${user.display_name}): ${user.images.length} images, ${user.uploadedCount} uploaded`);
    });
    
    if (userIds.length > 20) {
      console.log(`   ... and ${userIds.length - 20} more users with images`);
    }
    
    // Check VoiceoverGuy specifically
    const voiceoverGuyData = imagesByUser['1848'];
    if (voiceoverGuyData) {
      console.log('\n🎭 VOICEOVERGUY DETAILED STATUS:');
      console.log(`   Total Images: ${voiceoverGuyData.images.length}`);
      console.log(`   Local Files: ${voiceoverGuyData.localCount}`);
      console.log(`   Uploaded: ${voiceoverGuyData.uploadedCount}`);
      
      voiceoverGuyData.images.forEach((img, index) => {
        const status = img.uploaded ? '✅' : img.exists ? '📤' : '❌';
        console.log(`      ${index + 1}. ${status} ${img.filename} (${img.type})`);
      });
    }
    
    // Show files that need uploading
    if (needsUpload.length > 0) {
      console.log(`\n📤 FILES READY FOR UPLOAD (${needsUpload.length}):`);
      needsUpload.slice(0, 10).forEach(item => {
        console.log(`   📁 ${item.username}: ${item.image_filename}`);
      });
      
      if (needsUpload.length > 10) {
        console.log(`   ... and ${needsUpload.length - 10} more files`);
      }
    }
    
    // Show missing files
    if (missingFiles.length > 0) {
      console.log(`\n❌ MISSING LOCAL FILES (${missingFiles.length}):`);
      missingFiles.slice(0, 10).forEach(item => {
        console.log(`   🚫 ${item.username}: ${item.filename}`);
      });
      
      if (missingFiles.length > 10) {
        console.log(`   ... and ${missingFiles.length - 10} more missing files`);
      }
    }
    
    // Check uploads directory structure
    console.log('\n📂 UPLOADS DIRECTORY SCAN:');
    if (fs.existsSync(UPLOADS_PATH)) {
      const allFiles = fs.readdirSync(UPLOADS_PATH);
      const imageFiles = allFiles.filter(file => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );
      
      console.log(`   Total files in uploads: ${allFiles.length}`);
      console.log(`   Image files: ${imageFiles.length}`);
      
      // Count by pattern
      const avatarFiles = imageFiles.filter(f => f.includes('avatar-voiceover-studio-finder-'));
      const studioFiles = imageFiles.filter(f => /p[1-9]-voiceover-studio-finder-/.test(f));
      const otherFiles = imageFiles.filter(f => 
        !f.includes('avatar-voiceover-studio-finder-') && 
        !/p[1-9]-voiceover-studio-finder-/.test(f)
      );
      
      console.log(`   Avatar files: ${avatarFiles.length}`);
      console.log(`   Studio gallery files: ${studioFiles.length}`);
      console.log(`   Other image files: ${otherFiles.length}`);
    } else {
      console.log('   ❌ Uploads directory not found!');
    }
    
    return {
      totalImages: galleryImages.rows.length,
      needsUpload: needsUpload.length,
      missingFiles: missingFiles.length,
      readyToUpload: needsUpload
    };
    
  } catch (error) {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  auditAllImages().then((results) => {
    console.log('\n🎉 Image audit completed!');
    console.log(`📊 Summary: ${results.totalImages} total, ${results.needsUpload} need upload, ${results.missingFiles} missing`);
    process.exit(0);
  }).catch(error => {
    console.error('💥 Audit process failed:', error);
    process.exit(1);
  });
}

module.exports = { auditAllImages };
