const { PrismaClient } = require('@prisma/client');

async function testStudioNameUpdate() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing studio name update functionality...');
    
    // Find a studio to test with
    const testStudio = await prisma.studio.findFirst({
      where: {
        owner: {
          username: 'admin'
        }
      },
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      }
    });
    
    if (!testStudio) {
      console.log('❌ No admin studio found for testing');
      return;
    }
    
    console.log(`📋 Found test studio: ${testStudio.id}`);
    console.log(`📝 Current studio name: "${testStudio.name}"`);
    console.log(`👤 Owner username: "${testStudio.owner.username}"`);
    
    // Test the update
    const testName = `AdminStudio-Test-${Date.now()}`;
    console.log(`🔄 Updating studio name to: "${testName}"`);
    
    await prisma.studio.update({
      where: { id: testStudio.id },
      data: { name: testName }
    });
    
    // Verify the update
    const updatedStudio = await prisma.studio.findUnique({
      where: { id: testStudio.id }
    });
    
    console.log(`✅ Updated studio name: "${updatedStudio.name}"`);
    
    if (updatedStudio.name === testName) {
      console.log('🎉 Studio name update test PASSED!');
    } else {
      console.log('❌ Studio name update test FAILED!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStudioNameUpdate();
