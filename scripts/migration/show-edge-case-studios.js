const { Client } = require('pg');

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function showEdgeCaseStudios() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Finding studios that still need manual review');
    console.log('=' .repeat(70));
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Find studios where the name doesn't match the profile first_name
    const edgeCaseQuery = `
      SELECT 
        s.id as studio_id,
        s.name as current_studio_name,
        u.username,
        u.email,
        up.first_name as profile_first_name,
        up.last_name as profile_last_name,
        s.created_at,
        CASE 
          WHEN up.first_name IS NULL THEN 'NO_PROFILE_NAME'
          WHEN s.name = up.first_name THEN 'ALREADY_MATCHES'
          ELSE 'NEEDS_REVIEW'
        END as status,
        LENGTH(s.name) as studio_name_length,
        LENGTH(up.first_name) as profile_name_length
      FROM studios s
      JOIN users u ON s.owner_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE up.first_name IS NOT NULL 
        AND up.first_name != ''
        AND s.name != up.first_name
      ORDER BY u.username;
    `;
    
    const result = await client.query(edgeCaseQuery);
    const edgeCases = result.rows;
    
    console.log(`📊 Found ${edgeCases.length} studios that need manual review\n`);
    
    if (edgeCases.length === 0) {
      console.log('🎉 No edge cases found! All studios have been migrated successfully.');
      return;
    }
    
    console.log('📋 Studios requiring manual review:');
    console.log('=' .repeat(70));
    
    edgeCases.forEach((studio, index) => {
      console.log(`\n${index + 1}. Studio ID: ${studio.studio_id}`);
      console.log(`   Username: ${studio.username}`);
      console.log(`   Email: ${studio.email}`);
      console.log(`   Current Studio Name: "${studio.current_studio_name}" (${studio.studio_name_length} chars)`);
      console.log(`   Profile First Name: "${studio.profile_first_name}" (${studio.profile_name_length} chars)`);
      console.log(`   Profile Last Name: "${studio.profile_last_name || 'NULL'}"`);
      console.log(`   Created: ${studio.created_at.toISOString().split('T')[0]}`);
      
      // Analyze the difference
      if (studio.current_studio_name.includes(studio.profile_first_name)) {
        console.log(`   🔍 Analysis: Studio name contains profile name (may have extra text)`);
      } else if (studio.profile_first_name.includes(studio.current_studio_name)) {
        console.log(`   🔍 Analysis: Profile name contains studio name (profile may be more complete)`);
      } else {
        console.log(`   🔍 Analysis: Names are completely different`);
      }
      
      // Suggest action
      if (studio.studio_name_length > studio.profile_name_length && 
          studio.current_studio_name.includes(studio.profile_first_name)) {
        console.log(`   💡 Suggestion: Keep current studio name (more descriptive)`);
      } else if (studio.profile_name_length > studio.studio_name_length) {
        console.log(`   💡 Suggestion: Consider using profile name (more complete)`);
      } else {
        console.log(`   💡 Suggestion: Manual review needed - check which name is more appropriate`);
      }
    });
    
    console.log('\n' + '=' .repeat(70));
    console.log('📈 Summary by Analysis:');
    
    const analysis = edgeCases.reduce((acc, studio) => {
      if (studio.current_studio_name.includes(studio.profile_first_name)) {
        acc.studioContainsProfile++;
      } else if (studio.profile_first_name.includes(studio.current_studio_name)) {
        acc.profileContainsStudio++;
      } else {
        acc.completelyDifferent++;
      }
      return acc;
    }, { studioContainsProfile: 0, profileContainsStudio: 0, completelyDifferent: 0 });
    
    console.log(`   🔍 Studio name contains profile name: ${analysis.studioContainsProfile}`);
    console.log(`   🔍 Profile name contains studio name: ${analysis.profileContainsStudio}`);
    console.log(`   🔍 Completely different names: ${analysis.completelyDifferent}`);
    
    console.log('\n💡 Recommendations:');
    console.log('   1. Review each case individually in the admin interface');
    console.log('   2. Choose the name that best represents the studio');
    console.log('   3. Consider keeping more descriptive/complete names');
    console.log('   4. Update manually through the admin interface after review');
    
  } catch (error) {
    console.error('❌ Failed to show edge cases:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  showEdgeCaseStudios()
    .then(() => {
      console.log('\n✅ Edge case analysis completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Edge case analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { showEdgeCaseStudios };
