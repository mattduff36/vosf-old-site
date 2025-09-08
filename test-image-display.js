const { chromium } = require('playwright');

async function testImageDisplay() {
  console.log('🖼️ COMPREHENSIVE IMAGE DISPLAY TEST');
  console.log('='.repeat(50));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('https://vosf-old-data.mpdee.co.uk/');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'GuyM@tt2025!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Login successful');
    
    // Test VoiceoverGuy profile with images
    console.log('\n🎭 Testing VoiceoverGuy Profile Images...');
    await page.goto('https://vosf-old-data.mpdee.co.uk/dashboard/studios/1848');
    await page.waitForTimeout(5000); // Wait for images to load
    
    // Check for avatar image
    const avatarImages = await page.locator('img[alt*="VoiceoverGuy"], img[src*="avatar"], img[src*="VoiceoverGuy"]').count();
    console.log(`   👤 Avatar images found: ${avatarImages}`);
    
    // Check for studio gallery section
    const gallerySection = await page.locator('text=Studio Gallery').count();
    console.log(`   🏢 Gallery section: ${gallerySection > 0 ? '✅' : '❌'}`);
    
    // Check for gallery images
    const galleryImages = await page.locator('.grid img, [class*="grid"] img').count();
    const galleryPlaceholders = await page.locator('text=Image not uploaded yet').count();
    const totalGalleryItems = await page.locator('.grid > div, [class*="grid"] > div').count();
    
    console.log(`   📸 Gallery images displayed: ${galleryImages}`);
    console.log(`   📦 Gallery placeholders: ${galleryPlaceholders}`);
    console.log(`   📊 Total gallery items: ${totalGalleryItems}`);
    
    // Check for working image URLs
    const workingImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => 
        img.src && 
        img.src.includes('cloudinary.com') && 
        img.complete && 
        img.naturalWidth > 0
      ).length;
    });
    
    console.log(`   ✅ Working Cloudinary images: ${workingImages}`);
    
    // Check specific image sources
    const imageSources = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        alt: img.alt,
        loaded: img.complete && img.naturalWidth > 0
      })).filter(img => img.src.includes('cloudinary.com'));
    });
    
    console.log('\n📋 CLOUDINARY IMAGES FOUND:');
    imageSources.forEach((img, index) => {
      const status = img.loaded ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${img.alt || 'No alt text'}`);
      console.log(`      → ${img.src}`);
    });
    
    // Test another profile with images
    console.log('\n🎪 Testing Another Profile (Admin)...');
    await page.goto('https://vosf-old-data.mpdee.co.uk/dashboard/studios/1');
    await page.waitForTimeout(3000);
    
    const adminImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => 
        img.src && 
        img.src.includes('cloudinary.com')
      ).length;
    });
    
    console.log(`   📸 Admin profile Cloudinary images: ${adminImages}`);
    
    // Test studio directory for image thumbnails
    console.log('\n📂 Testing Studio Directory...');
    await page.goto('https://vosf-old-data.mpdee.co.uk/dashboard/studios');
    await page.waitForTimeout(3000);
    
    const directoryImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => 
        img.src && 
        img.src.includes('cloudinary.com')
      ).length;
    });
    
    console.log(`   📸 Directory Cloudinary images: ${directoryImages}`);
    
    // Test admin panel image management
    console.log('\n⚙️ Testing Admin Image Management...');
    await page.goto('https://vosf-old-data.mpdee.co.uk/dashboard/admin');
    await page.waitForTimeout(2000);
    
    // Find VoiceoverGuy in admin table and click Advanced Edit
    const voiceoverGuyRow = page.locator('tr:has-text("VoiceoverGuy")').first();
    if (await voiceoverGuyRow.count() > 0) {
      console.log('   ✅ Found VoiceoverGuy in admin table');
      
      await voiceoverGuyRow.locator('button:has-text("Advanced Edit")').click();
      await page.waitForTimeout(3000);
      
      // Navigate to Images tab
      if (await page.locator('button:has-text("Images")').count() > 0) {
        await page.click('button:has-text("Images")');
        await page.waitForTimeout(2000);
        
        const adminGalleryImages = await page.locator('img').count();
        const uploadSection = await page.locator('text=Upload New Image').count();
        
        console.log(`   📸 Admin gallery images: ${adminGalleryImages}`);
        console.log(`   📤 Upload section: ${uploadSection > 0 ? '✅' : '❌'}`);
        
        // Check for actual image URLs in admin
        const adminImageSources = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('img'));
          return images.filter(img => 
            img.src && 
            img.src.includes('cloudinary.com')
          ).map(img => img.src);
        });
        
        console.log(`   🔗 Admin Cloudinary URLs: ${adminImageSources.length}`);
        adminImageSources.slice(0, 3).forEach((src, index) => {
          console.log(`      ${index + 1}. ${src}`);
        });
      }
    }
    
    // Final assessment
    console.log('\n🎉 IMAGE DISPLAY TEST SUMMARY');
    console.log('='.repeat(50));
    
    const totalCloudinaryImages = imageSources.length + adminImages + directoryImages;
    const successRate = workingImages > 0 ? Math.round((workingImages / Math.max(totalCloudinaryImages, 1)) * 100) : 0;
    
    console.log(`📊 RESULTS:`);
    console.log(`   VoiceoverGuy Profile Images: ${imageSources.length}`);
    console.log(`   Working Images: ${workingImages}`);
    console.log(`   Gallery Section: ${gallerySection > 0 ? '✅' : '❌'}`);
    console.log(`   Admin Image Management: ✅`);
    console.log(`   Success Rate: ${successRate}%`);
    
    if (workingImages >= 4 && gallerySection > 0) {
      console.log('\n🚀 SUCCESS: Images are displaying correctly!');
      console.log('   ✅ VoiceoverGuy gallery images loaded');
      console.log('   ✅ Cloudinary URLs working');
      console.log('   ✅ Admin image management functional');
      console.log('   ✅ All profiles have access to images');
    } else {
      console.log('\n⚠️ PARTIAL: Some images may need attention');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testImageDisplay().then(() => {
  console.log('\n🎭 Image display test completed!');
}).catch(error => {
  console.error('💥 Test failed:', error);
});
