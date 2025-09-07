import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { uploadImage } from './app/lib/cloudinary.js';
import { getConnection } from './app/lib/database.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the uploads folder
const UPLOADS_PATH = path.join(__dirname, 'FULL WEBSITE', 'public_html', 'uploads');

/**
 * Extract username from avatar filename
 * @param {string} filename - Avatar filename
 * @returns {string|null} Username or null if not an avatar
 */
function extractUsernameFromAvatar(filename) {
  const match = filename.match(/^avatar-voiceover-studio-finder-(.+)\.(jpg|jpeg|png|gif)$/i);
  return match ? match[1] : null;
}

/**
 * Get all image files from uploads directory
 * @returns {Array} Array of image file objects
 */
function getImageFiles() {
  try {
    const files = fs.readdirSync(UPLOADS_PATH);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });

    return imageFiles.map(file => {
      const fullPath = path.join(UPLOADS_PATH, file);
      const stats = fs.statSync(fullPath);
      const username = extractUsernameFromAvatar(file);
      
      return {
        filename: file,
        fullPath,
        size: stats.size,
        isAvatar: !!username,
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
 * Update user record with avatar URL
 * @param {string} username - Username
 * @param {string} avatarUrl - Cloudinary URL
 */
async function updateUserAvatar(username, avatarUrl) {
  try {
    const client = await getConnection();
    
    // Update shows_users table
    await client.execute({
      sql: 'UPDATE shows_users SET avatar_url = ? WHERE username = ?',
      args: [avatarUrl, username]
    });
    
    console.log(`✓ Updated avatar for user: ${username}`);
  } catch (error) {
    console.error(`✗ Failed to update avatar for user ${username}:`, error.message);
  }
}

/**
 * Add avatar_url column to shows_users table if it doesn't exist
 */
async function ensureAvatarColumn() {
  try {
    const client = await getConnection();
    
    // Check if column exists
    const schema = await client.execute('PRAGMA table_info(shows_users)');
    const hasAvatarColumn = schema.rows.some(row => row.name === 'avatar_url');
    
    if (!hasAvatarColumn) {
      await client.execute('ALTER TABLE shows_users ADD COLUMN avatar_url TEXT');
      console.log('✓ Added avatar_url column to shows_users table');
    } else {
      console.log('✓ avatar_url column already exists');
    }
  } catch (error) {
    console.error('Error ensuring avatar column:', error);
    throw error;
  }
}

/**
 * Migrate images to Cloudinary
 */
async function migrateImages() {
  console.log('🚀 Starting image migration to Cloudinary...\n');
  
  try {
    // Ensure avatar_url column exists
    await ensureAvatarColumn();
    
    // Get all image files
    const imageFiles = getImageFiles();
    console.log(`📁 Found ${imageFiles.length} image files`);
    
    // Separate avatars and other images
    const avatars = imageFiles.filter(img => img.isAvatar);
    const otherImages = imageFiles.filter(img => !img.isAvatar);
    
    console.log(`👤 Avatar images: ${avatars.length}`);
    console.log(`📷 Other images: ${otherImages.length}\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Upload avatar images (limit to first 5 for testing)
    console.log('📤 Uploading avatar images...');
    const testAvatars = avatars; // Process all avatars
    console.log(`Processing ${testAvatars.length} avatars...`);
    
    for (const avatar of testAvatars) {
      try {
        const publicId = `avatars/${avatar.username}`;
        const result = await uploadImage(avatar.fullPath, publicId, 'vosf');
        
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
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Skip other images for now - focus on avatars
    console.log('\n⏭️ Skipping other images for now (focusing on avatars)...');
    const sampleOtherImages = []; // Skip for now
    
    for (const image of sampleOtherImages) {
      try {
        const publicId = `general/${path.parse(image.filename).name}`;
        const result = await uploadImage(image.fullPath, publicId, 'vosf');
        
        if (result.success) {
          console.log(`✓ ${image.filename} → ${result.url}`);
          successCount++;
        } else {
          console.error(`✗ Failed to upload ${image.filename}:`, result.error);
          errorCount++;
        }
      } catch (error) {
        console.error(`✗ Error processing ${image.filename}:`, error.message);
        errorCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
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
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  migrateImages().then(() => {
    console.log('\n✨ Image migration process completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });
}

// Also run if called directly with node
if (process.argv[1] && process.argv[1].endsWith('migrate-images.js')) {
  migrateImages().then(() => {
    console.log('\n✨ Image migration process completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });
}

export { migrateImages, getImageFiles, extractUsernameFromAvatar };
