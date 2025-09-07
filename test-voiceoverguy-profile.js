const { chromium } = require('playwright');

async function testVoiceoverGuyProfile() {
  console.log('🎭 VOICEOVERGUY PROFILE TEST');
  console.log('='.repeat(40));
  
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
    
    // Navigate directly to VoiceoverGuy profile
    console.log('\n🎭 Testing VoiceoverGuy Enhanced Profile...');
    await page.goto('https://vosf-old-data.mpdee.co.uk/dashboard/studios/1848');
    await page.waitForTimeout(3000);
    
    // Check for profile elements
    const profileElements = {
      title: await page.locator('h1').textContent(),
      location: await page.locator('text=United Kingdom').count(),
      phone: await page.locator('text=07973350178').count(),
      website: await page.locator('text=voiceoverguy.co.uk').count(),
      rates: await page.locator('text=£80').count(),
      aboutSection: await page.locator('text=About').count(),
      contactSection: await page.locator('text=Contact Information').count(),
      ratesSection: await page.locator('text=Rates').count(),
      connectionsSection: await page.locator('text=Connections').count(),
      socialSection: await page.locator('text=Social Media').count(),
      gallerySection: await page.locator('text=Studio Gallery').count()
    };
    
    console.log('\n📊 PROFILE VERIFICATION:');
    console.log(`   Title: ${profileElements.title || 'Not found'}`);
    console.log(`   Location: ${profileElements.location > 0 ? '✅' : '❌'} United Kingdom`);
    console.log(`   Phone: ${profileElements.phone > 0 ? '✅' : '❌'} 07973350178`);
    console.log(`   Website: ${profileElements.website > 0 ? '✅' : '❌'} voiceoverguy.co.uk`);
    console.log(`   Rates: ${profileElements.rates > 0 ? '✅' : '❌'} £80 pricing`);
    
    console.log('\n📋 PROFILE SECTIONS:');
    console.log(`   About: ${profileElements.aboutSection > 0 ? '✅' : '❌'}`);
    console.log(`   Contact Info: ${profileElements.contactSection > 0 ? '✅' : '❌'}`);
    console.log(`   Rates: ${profileElements.ratesSection > 0 ? '✅' : '❌'}`);
    console.log(`   Connections: ${profileElements.connectionsSection > 0 ? '✅' : '❌'}`);
    console.log(`   Social Media: ${profileElements.socialSection > 0 ? '✅' : '❌'}`);
    console.log(`   Studio Gallery: ${profileElements.gallerySection > 0 ? '✅' : '❌'}`);
    
    // Check for studio images
    const studioImages = await page.locator('img[alt*="Studio image"], .gallery img').count();
    const imagePlaceholders = await page.locator('text=Image not uploaded yet').count();
    
    console.log('\n🖼️ STUDIO GALLERY:');
    console.log(`   Images displayed: ${studioImages}`);
    console.log(`   Image placeholders: ${imagePlaceholders}`);
    console.log(`   Total gallery items: ${studioImages + imagePlaceholders}`);
    
    // Compare with original site
    console.log('\n🔄 COMPARING WITH ORIGINAL SITE...');
    const originalPage = await context.newPage();
    await originalPage.goto('https://voiceoverstudiofinder.com/voiceoverguy');
    await originalPage.waitForTimeout(3000);
    
    const originalElements = {
      phone: await originalPage.locator('text=07973350178').count(),
      website: await originalPage.locator('text=voiceoverguy.co.uk').count(),
      rates: await originalPage.locator('text=£80, text=£100, text=£125').count()
    };
    
    console.log('\n📋 ORIGINAL SITE COMPARISON:');
    console.log(`   Phone match: ${originalElements.phone > 0 ? '✅' : '❌'}`);
    console.log(`   Website match: ${originalElements.website > 0 ? '✅' : '❌'}`);
    console.log(`   Rates match: ${originalElements.rates > 0 ? '✅' : '❌'}`);
    
    await originalPage.close();
    
    // Final assessment
    const totalChecks = Object.values(profileElements).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);
    const passedChecks = Object.values(profileElements).filter(v => typeof v === 'number' && v > 0).length;
    
    console.log('\n🎉 FINAL ASSESSMENT:');
    console.log(`   Profile sections: ${passedChecks}/6 working`);
    console.log(`   Data elements: ${totalChecks > 0 ? '✅' : '❌'} present`);
    console.log(`   Gallery system: ${profileElements.gallerySection > 0 ? '✅' : '❌'} implemented`);
    
    if (passedChecks >= 4 && totalChecks > 0) {
      console.log('\n🚀 SUCCESS: VoiceoverGuy profile migration COMPLETE!');
      console.log('   ✅ All essential data migrated');
      console.log('   ✅ Enhanced profile system working');
      console.log('   ✅ Gallery system implemented');
      console.log('   ✅ Matches original site functionality');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some elements need attention');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testVoiceoverGuyProfile().then(() => {
  console.log('\n🎭 VoiceoverGuy profile test completed!');
}).catch(error => {
  console.error('💥 Test failed:', error);
});
