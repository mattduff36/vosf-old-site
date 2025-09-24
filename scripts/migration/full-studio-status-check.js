const { Client } = require('pg');

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function fullStudioStatusCheck() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Full studio status check after migration');
    console.log('=' .repeat(70));
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Get comprehensive status of all studios
    const statusQuery = `
      SELECT 
        s.id as studio_id,
        s.name as current_studio_name,
        u.username,
        up.first_name as profile_first_name,
        CASE 
          WHEN up.first_name IS NULL OR up.first_name = '' THEN 'NO_PROFILE_NAME'
          WHEN s.name = up.first_name THEN 'MATCHES'
          WHEN s.name ILIKE '%' || up.first_name || '%' THEN 'STUDIO_CONTAINS_PROFILE'
          WHEN up.first_name ILIKE '%' || s.name || '%' THEN 'PROFILE_CONTAINS_STUDIO'
          ELSE 'DIFFERENT'
        END as status,
        s.updated_at
      FROM studios s
      JOIN users u ON s.owner_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY 
        CASE 
          WHEN up.first_name IS NULL OR up.first_name = '' THEN 3
          WHEN s.name = up.first_name THEN 1
          ELSE 2
        END,
        u.username;
    `;
    
    const result = await client.query(statusQuery);
    const studios = result.rows;
    
    console.log(`📊 Total studios analyzed: ${studios.length}\n`);
    
    // Count by status
    const statusCounts = studios.reduce((acc, studio) => {
      acc[studio.status] = (acc[studio.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 Current Status Distribution:');
    console.log(`   ✅ Perfect matches: ${statusCounts.MATCHES || 0}`);
    console.log(`   🔍 Studio contains profile name: ${statusCounts.STUDIO_CONTAINS_PROFILE || 0}`);
    console.log(`   🔍 Profile contains studio name: ${statusCounts.PROFILE_CONTAINS_STUDIO || 0}`);
    console.log(`   ❌ Completely different: ${statusCounts.DIFFERENT || 0}`);
    console.log(`   ⚠️  No profile name: ${statusCounts.NO_PROFILE_NAME || 0}`);
    
    // Show examples of each category
    console.log('\n📋 Examples by Category:');
    console.log('=' .repeat(70));
    
    Object.keys(statusCounts).forEach(status => {
      if (statusCounts[status] > 0) {
        console.log(`\n${getStatusIcon(status)} ${status} (${statusCounts[status]} studios):`);
        const examples = studios.filter(s => s.status === status).slice(0, 3);
        examples.forEach(studio => {
          console.log(`   ${studio.username}: "${studio.current_studio_name}" | "${studio.profile_first_name || 'NULL'}"`);
        });
        if (statusCounts[status] > 3) {
          console.log(`   ... and ${statusCounts[status] - 3} more`);
        }
      }
    });
    
    // Check for recently updated studios (potential edge cases that were fixed)
    console.log('\n🕐 Recently Updated Studios (last 24 hours):');
    const recentlyUpdated = studios.filter(s => {
      const updateTime = new Date(s.updated_at);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return updateTime > oneDayAgo;
    });
    
    if (recentlyUpdated.length > 0) {
      console.log(`   Found ${recentlyUpdated.length} recently updated studios:`);
      recentlyUpdated.forEach(studio => {
        console.log(`   ${studio.username}: "${studio.current_studio_name}" (${studio.status})`);
      });
    } else {
      console.log('   No studios updated in the last 24 hours');
    }
    
    // Show any remaining issues
    const needsAttention = studios.filter(s => 
      s.status === 'DIFFERENT' || s.status === 'STUDIO_CONTAINS_PROFILE' || s.status === 'PROFILE_CONTAINS_STUDIO'
    );
    
    if (needsAttention.length > 0) {
      console.log(`\n⚠️  Studios that may need attention (${needsAttention.length}):`);
      needsAttention.slice(0, 10).forEach((studio, index) => {
        console.log(`\n${index + 1}. ${studio.username} (${studio.status})`);
        console.log(`   Studio: "${studio.current_studio_name}"`);
        console.log(`   Profile: "${studio.profile_first_name || 'NULL'}"`);
      });
      if (needsAttention.length > 10) {
        console.log(`\n   ... and ${needsAttention.length - 10} more studios`);
      }
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 Migration Success Rate:');
    const totalWithProfiles = studios.length - (statusCounts.NO_PROFILE_NAME || 0);
    const successfulMatches = statusCounts.MATCHES || 0;
    const successRate = totalWithProfiles > 0 ? ((successfulMatches / totalWithProfiles) * 100).toFixed(1) : 0;
    console.log(`   Perfect matches: ${successfulMatches}/${totalWithProfiles} (${successRate}%)`);
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'MATCHES': return '✅';
    case 'STUDIO_CONTAINS_PROFILE': return '🔍';
    case 'PROFILE_CONTAINS_STUDIO': return '🔍';
    case 'DIFFERENT': return '❌';
    case 'NO_PROFILE_NAME': return '⚠️';
    default: return '❓';
  }
}

// Run the script
if (require.main === module) {
  fullStudioStatusCheck()
    .then(() => {
      console.log('\n✅ Full status check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Status check failed:', error);
      process.exit(1);
    });
}

module.exports = { fullStudioStatusCheck };
