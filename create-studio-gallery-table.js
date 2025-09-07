const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

let databaseModule;

async function getConnection() {
  if (!databaseModule) {
    databaseModule = await import('./app/lib/database.js');
  }
  return databaseModule.getConnection();
}

async function createStudioGalleryTable() {
  try {
    console.log('🏗️ CREATING STUDIO GALLERY TABLE');
    console.log('='.repeat(40));
    
    const client = await getConnection();
    console.log('✅ Connected to Turso database');
    
    // Create studio_gallery table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS studio_gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        image_type TEXT NOT NULL,
        image_filename TEXT NOT NULL,
        cloudinary_url TEXT,
        cloudinary_public_id TEXT,
        is_primary INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES shows_users(id)
      )
    `;
    
    console.log('🏗️ Creating studio_gallery table...');
    await client.execute(createTableSQL);
    console.log('✅ Table created successfully');
    
    // Now populate it with existing image data from usermeta
    console.log('\n📊 Analyzing existing image data...');
    
    const imageMetaQuery = `
      SELECT user_id, meta_key, meta_value 
      FROM shows_usermeta 
      WHERE meta_key LIKE 'avatar_image%' 
      AND meta_value IS NOT NULL 
      AND meta_value != ''
      ORDER BY user_id, meta_key
    `;
    
    const imageRefs = await client.execute(imageMetaQuery);
    console.log(`📋 Found ${imageRefs.rows.length} image references in usermeta`);
    
    let insertedImages = 0;
    
    for (const row of imageRefs.rows) {
      const { user_id, meta_key, meta_value } = row;
      
      // Determine image type and order
      let imageType = 'gallery';
      let displayOrder = 0;
      let isPrimary = 0;
      
      if (meta_key === 'avatar_image') {
        imageType = 'avatar';
        isPrimary = 1;
        displayOrder = 0;
      } else if (meta_key.startsWith('avatar_image')) {
        imageType = 'gallery';
        const orderMatch = meta_key.match(/avatar_image(\d+)/);
        displayOrder = orderMatch ? parseInt(orderMatch[1]) : 1;
      }
      
      // Generate Cloudinary URL based on filename pattern
      let cloudinaryUrl = null;
      let cloudinaryPublicId = null;
      
      if (meta_value.includes('avatar-voiceover-studio-finder-')) {
        // This is an avatar that should already be uploaded
        const username = meta_value.replace('avatar-voiceover-studio-finder-', '').replace(/\.(jpg|jpeg|png|gif)$/i, '');
        cloudinaryPublicId = `avatars/${username}`;
        cloudinaryUrl = `https://res.cloudinary.com/dmvaawjnx/image/upload/v1757285000/vosf/avatars/${username}.jpg`;
      } else if (meta_value.includes('p1-voiceover-studio-finder-') || 
                 meta_value.includes('p2-voiceover-studio-finder-') ||
                 meta_value.includes('p3-voiceover-studio-finder-') ||
                 meta_value.includes('p6-voiceover-studio-finder-')) {
        // These are studio gallery images
        const cleanFilename = meta_value.replace(/\.(jpg|jpeg|png|gif)$/i, '');
        cloudinaryPublicId = `studios/${cleanFilename}`;
        // We'll need to upload these
      }
      
      try {
        const insertSQL = `
          INSERT INTO studio_gallery 
          (user_id, image_type, image_filename, cloudinary_url, cloudinary_public_id, is_primary, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await client.execute({
          sql: insertSQL,
          args: [user_id, imageType, meta_value, cloudinaryUrl, cloudinaryPublicId, isPrimary, displayOrder]
        });
        
        insertedImages++;
        
      } catch (error) {
        console.error(`❌ Error inserting image for user ${user_id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Inserted ${insertedImages} image records`);
    
    // Show summary by user
    const summaryQuery = `
      SELECT 
        u.username,
        u.display_name,
        COUNT(*) as image_count,
        GROUP_CONCAT(sg.image_type) as image_types
      FROM studio_gallery sg
      JOIN shows_users u ON sg.user_id = u.id
      GROUP BY sg.user_id, u.username, u.display_name
      ORDER BY image_count DESC
      LIMIT 10
    `;
    
    const summary = await client.execute(summaryQuery);
    console.log('\n📊 TOP USERS WITH IMAGES:');
    summary.rows.forEach(row => {
      console.log(`   ${row.username} (${row.display_name}): ${row.image_count} images (${row.image_types})`);
    });
    
    // Check VoiceoverGuy specifically
    const voiceoverGuyImages = await client.execute({
      sql: `
        SELECT image_type, image_filename, cloudinary_url, is_primary, display_order
        FROM studio_gallery 
        WHERE user_id = 1848
        ORDER BY is_primary DESC, display_order ASC
      `
    });
    
    console.log('\n🎭 VoiceoverGuy Images:');
    voiceoverGuyImages.rows.forEach(row => {
      const primary = row.is_primary ? ' (PRIMARY)' : '';
      console.log(`   ${row.image_type}: ${row.image_filename}${primary}`);
      if (row.cloudinary_url) {
        console.log(`      → ${row.cloudinary_url}`);
      }
    });
    
  } catch (error) {
    console.error('💥 Failed to create gallery table:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createStudioGalleryTable().then(() => {
    console.log('\n🎉 Studio gallery table created and populated!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Process failed:', error);
    process.exit(1);
  });
}

module.exports = { createStudioGalleryTable };
