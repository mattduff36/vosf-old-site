const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const UPLOADS_PATH = path.join(__dirname, 'FULL WEBSITE', 'public_html', 'uploads');

// Dynamically import modules to avoid ES module issues
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

async function migrateStudioImages() {
  try {
    console.log('🔍 STUDIO IMAGES MIGRATION');
    console.log('='.repeat(40));
    
    if (!fs.existsSync(UPLOADS_PATH)) {
      throw new Error(`Uploads directory not found: ${UPLOADS_PATH}`);
    }
    
    console.log(`📂 Scanning uploads directory: ${UPLOADS_PATH}`);
    
    // Get all image files
    const allFiles = fs.readdirSync(UPLOADS_PATH);
    const imageFiles = allFiles.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });
    
    console.log(`📊 Found ${imageFiles.length} image files out of ${allFiles.length} total files`);
    
    // Categorize images
    const categories = {
      avatars: [],
      banners: [],
      studios: [],
      other: []
    };
    
    imageFiles.forEach(file => {
      const fileName = file.toLowerCase();
      if (fileName.includes('avatar') || fileName.includes('profile')) {
        categories.avatars.push(file);
      } else if (fileName.includes('banner') || fileName.includes('header')) {
        categories.banners.push(file);
      } else if (fileName.includes('studio') || fileName.includes('booth') || fileName.includes('equipment')) {
        categories.studios.push(file);
      } else {
        categories.other.push(file);
      }
    });
    
    console.log('\n📋 IMAGE CATEGORIES:');
    console.log(`   🖼️ Avatars: ${categories.avatars.length}`);
    console.log(`   🎨 Banners: ${categories.banners.length}`);
    console.log(`   🏢 Studios: ${categories.studios.length}`);
    console.log(`   📁 Other: ${categories.other.length}`);
    
    // Sample some files to understand naming patterns
    console.log('\n📝 SAMPLE FILES:');
    console.log('   Avatars:', categories.avatars.slice(0, 5));
    console.log('   Banners:', categories.banners.slice(0, 5));
    console.log('   Studios:', categories.studios.slice(0, 5));
    console.log('   Other:', categories.other.slice(0, 10));
    
    // Check database for users who might have additional images
    const client = await getConnection();
    console.log('\n📊 DATABASE ANALYSIS:');
    
    // Check for image references in usermeta
    const imageRefs = await client.execute(`
      SELECT user_id, meta_key, meta_value 
      FROM shows_usermeta 
      WHERE meta_key LIKE '%image%' OR meta_key LIKE '%photo%' OR meta_key LIKE '%banner%'
      OR meta_value LIKE '%.jpg%' OR meta_value LIKE '%.png%' OR meta_value LIKE '%.jpeg%'
    `);
    
    console.log(`   🔗 Found ${imageRefs.rows.length} image references in usermeta`);
    
    if (imageRefs.rows.length > 0) {
      console.log('\n📋 IMAGE REFERENCES:');
      imageRefs.rows.forEach(row => {
        console.log(`   User ${row.user_id}: ${row.meta_key} = ${row.meta_value}`);
      });
    }
    
    // Start with a small batch migration of studio images
    console.log('\n🚀 STARTING STUDIO IMAGES MIGRATION:');
    
    let uploaded = 0;
    const maxUploads = 20; // Start with 20 images
    
    for (const file of categories.studios.slice(0, maxUploads)) {
      try {
        const filePath = path.join(UPLOADS_PATH, file);
        const fileStats = fs.statSync(filePath);
        
        if (fileStats.size > 10 * 1024 * 1024) { // Skip files larger than 10MB
          console.log(`   ⏭️ Skipping large file: ${file} (${Math.round(fileStats.size / 1024 / 1024)}MB)`);
          continue;
        }
        
        console.log(`   📤 Uploading: ${file}`);
        
        // Generate a clean public ID
        const publicId = `studio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const result = await uploadToCloudinary(filePath, publicId, 'vosf/studios');
        
        console.log(`   ✅ Uploaded: ${file} → ${result.secure_url}`);
        uploaded++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`   ❌ Failed to upload ${file}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Uploaded ${uploaded} studio images!`);
    
    // Recommendations for next steps
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Create studio gallery table to store image associations');
    console.log('   2. Analyze filename patterns to match images to users');
    console.log('   3. Upload banner images for profile headers');
    console.log('   4. Create image management interface in admin');
    console.log('   5. Add image gallery display to enhanced profiles');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateStudioImages().then(() => {
    console.log('\n🎉 Studio images migration analysis completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateStudioImages };
