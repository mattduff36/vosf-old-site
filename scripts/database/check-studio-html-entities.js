const { Client } = require('pg');

// Use the same connection string that works in other scripts
const DATABASE_URL = 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function checkStudioHtmlEntities() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Checking for HTML entities in studio names after migration');
    console.log('=' .repeat(70));
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Check for common HTML entities in studio names
    const htmlEntityPatterns = [
      '&#039;', '&apos;', '&rsquo;', '&lsquo;',
      '&quot;', '&ldquo;', '&rdquo;',
      '&amp;',
      '&eacute;', '&egrave;', '&ecirc;', '&euml;',
      '&aacute;', '&agrave;', '&acirc;', '&auml;',
      '&iacute;', '&igrave;', '&icirc;', '&iuml;',
      '&oacute;', '&ograve;', '&ocirc;', '&ouml;',
      '&uacute;', '&ugrave;', '&ucirc;', '&uuml;',
      '&ccedil;', '&ntilde;',
      '&#8217;', '&#8216;', '&#8220;', '&#8221;'
    ];
    
    console.log('🔍 Searching for HTML entities in studios.name...');
    
    let totalFound = 0;
    const foundEntities = [];
    
    for (const entity of htmlEntityPatterns) {
      const query = `
        SELECT id, name, owner_id
        FROM studios 
        WHERE name LIKE $1
        LIMIT 10;
      `;
      
      const result = await client.query(query, [`%${entity}%`]);
      
      if (result.rows.length > 0) {
        console.log(`\n📋 Found ${result.rows.length} studios with "${entity}":`);
        result.rows.forEach(row => {
          console.log(`   ${row.id.substring(0, 8)}: "${row.name}"`);
          foundEntities.push({
            id: row.id,
            name: row.name,
            entity: entity,
            owner_id: row.owner_id
          });
        });
        totalFound += result.rows.length;
      }
    }
    
    if (totalFound === 0) {
      console.log('✨ No HTML entities found in studio names!');
      
      // Let's also check some sample studio names to see what they look like
      console.log('\n📋 Sample studio names (first 20):');
      const sampleQuery = `
        SELECT name 
        FROM studios 
        WHERE name IS NOT NULL 
        ORDER BY updated_at DESC 
        LIMIT 20;
      `;
      
      const sampleResult = await client.query(sampleQuery);
      sampleResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. "${row.name}"`);
      });
      
    } else {
      console.log(`\n📊 Total studios with HTML entities: ${totalFound}`);
      console.log('\n🔧 Would you like me to fix these automatically?');
      
      // Show what the fixes would look like
      console.log('\n📋 Preview of fixes:');
      foundEntities.slice(0, 5).forEach(item => {
        let fixed = item.name;
        // Apply common fixes
        fixed = fixed.replace(/&#039;/g, "'");
        fixed = fixed.replace(/&apos;/g, "'");
        fixed = fixed.replace(/&rsquo;/g, "'");
        fixed = fixed.replace(/&lsquo;/g, "'");
        fixed = fixed.replace(/&quot;/g, '"');
        fixed = fixed.replace(/&ldquo;/g, '"');
        fixed = fixed.replace(/&rdquo;/g, '"');
        fixed = fixed.replace(/&amp;/g, '&');
        fixed = fixed.replace(/&#8217;/g, "'");
        fixed = fixed.replace(/&#8216;/g, "'");
        fixed = fixed.replace(/&#8220;/g, '"');
        fixed = fixed.replace(/&#8221;/g, '"');
        
        console.log(`   "${item.name}" → "${fixed}"`);
      });
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ Check completed');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkStudioHtmlEntities();
