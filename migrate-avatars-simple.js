const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { v2: cloudinary } = require('cloudinary');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Path to the uploads folder
const UPLOADS_PATH = path.join(__dirname, 'FULL WEBSITE', 'public_html', 'uploads');

/**
 * Extract username from avatar filename
 */
function extractUsernameFromAvatar(filename) {
  const match = filename.match(/^avatar-voiceover-studio-finder-(.+)\.(jpg|jpeg|png|gif)$/i);
  return match ? match[1] : null;
}

/**
 * Get all avatar image files
 */
function getAvatarFiles() {
  try {
    const files = fs.readdirSync(UPLOADS_PATH);
    const avatarFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      const isAvatar = extractUsernameFromAvatar(file);
      return isImage && isAvatar;
    });

    return avatarFiles.map(file => {
      const fullPath = path.join(UPLOADS_PATH, file);
      const username = extractUsernameFromAvatar(file);
      
      return {
        filename: file,
        fullPath,
        username: username,
        ext: path.extname(file).toLowerCase(),
      };
    });
  } catch (error) {
    console.error('Error reading uploads directory:', error);
    return [];
  }
}

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(imagePath, publicId) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: 'vosf',
      overwrite: true,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update database with avatar URL (using direct SQL)
 */
async function updateUserAvatar(username, avatarUrl) {
  // For now, just log what we would do
  // In a full implementation, we'd connect to Turso here
  console.log(`Would update user ${username} with avatar: ${avatarUrl}`);
  return true;
}

/**
 * Main migration function
 */
async function migrateAvatars() {
  console.log('🚀 Starting avatar migration to Cloudinary...\n');
  
  try {
    // Get all avatar files
    const avatarFiles = getAvatarFiles();
    console.log(`📁 Found ${avatarFiles.length} avatar files`);
    
    if (avatarFiles.length === 0) {
      console.log('No avatar files found. Exiting.');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process first 10 for testing
    const testFiles = avatarFiles.slice(0, 10);
    console.log(`📤 Processing ${testFiles.length} avatars (test batch)...\n`);
    
    for (const avatar of testFiles) {
      try {
        const publicId = `avatars/${avatar.username}`;
        console.log(`Uploading ${avatar.filename}...`);
        
        const result = await uploadToCloudinary(avatar.fullPath, publicId);
        
        if (result.success) {
          await updateUserAvatar(avatar.username, result.url);
          console.log(`✓ ${avatar.filename} → ${result.url}`);
          successCount++;
        } else {
          console.error(`✗ Failed to upload ${avatar.filename}:`, result.error);
          errorCount++;
        }
      } catch (error) {
        console.error(`✗ Error processing ${avatar.filename}:`, error.message);
        errorCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully uploaded: ${successCount} images`);
    console.log(`❌ Failed uploads: ${errorCount} images`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateAvatars().then(() => {
    console.log('\n✨ Avatar migration process completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateAvatars, getAvatarFiles, extractUsernameFromAvatar };
