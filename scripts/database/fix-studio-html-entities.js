const { Client } = require('pg');

// Use the same connection string that works in other scripts
const DATABASE_URL = 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

// HTML entity mapping from our previous script
const HTML_ENTITY_MAP = {
  '&#039;': "'", '&apos;': "'", '&rsquo;': "'", '&lsquo;': "'",
  '&quot;': '"', '&ldquo;': '"', '&rdquo;': '"',
  '&amp;': '&',
  '&eacute;': 'é', '&egrave;': 'è', '&ecirc;': 'ê', '&euml;': 'ë',
  '&aacute;': 'á', '&agrave;': 'à', '&acirc;': 'â', '&auml;': 'ä',
  '&iacute;': 'í', '&igrave;': 'ì', '&icirc;': 'î', '&iuml;': 'ï',
  '&oacute;': 'ó', '&ograve;': 'ò', '&ocirc;': 'ô', '&ouml;': 'ö',
  '&uacute;': 'ú', '&ugrave;': 'ù', '&ucirc;': 'û', '&uuml;': 'ü',
  '&ccedil;': 'ç', '&ntilde;': 'ñ',
  '&trade;': '™', '&copy;': '©', '&reg;': '®',
  '&pound;': '£', '&euro;': '€', '&yen;': '¥', '&cent;': '¢',
  '&nbsp;': ' ', '&ensp;': ' ', '&emsp;': ' ', '&thinsp;': ' ',
  '&lt;': '<', '&gt;': '>', '&le;': '≤', '&ge;': '≥', '&ne;': '≠',
  '&plusmn;': '±', '&times;': '×', '&divide;': '÷',
  '&ndash;': '–', '&mdash;': '—', '&hellip;': '…', '&bull;': '•', '&middot;': '·',
  '&#8217;': "'", '&#8216;': "'", '&#8220;': '"', '&#8221;': '"',
  '&#8211;': '–', '&#8212;': '—', '&#8230;': '…', '&#8482;': '™',
  '&#169;': '©', '&#174;': '®', '&#8364;': '€', '&#163;': '£', '&#160;': ' '
};

function decodeHtmlEntities(text) {
  if (typeof text !== 'string') {
    return { decodedText: text, foundEntities: [], hasEntities: false };
  }
  
  let decodedText = text;
  const foundEntities = [];
  
  for (const entity in HTML_ENTITY_MAP) {
    if (decodedText.includes(entity)) {
      decodedText = decodedText.split(entity).join(HTML_ENTITY_MAP[entity]);
      foundEntities.push(entity);
    }
  }
  
  return { 
    decodedText, 
    foundEntities, 
    hasEntities: foundEntities.length > 0 
  };
}

async function fixStudioHtmlEntities(dryRun = false) {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔧 Fixing HTML entities in studio names');
    console.log('=' .repeat(70));
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
    } else {
      console.log('⚠️  LIVE MODE - Changes will be applied to the database!');
    }
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Get all studios with potential HTML entities
    const htmlEntityPatterns = Object.keys(HTML_ENTITY_MAP);
    const conditions = htmlEntityPatterns.map((_, index) => `name LIKE $${index + 1}`).join(' OR ');
    const values = htmlEntityPatterns.map(entity => `%${entity}%`);
    
    const query = `
      SELECT id, name, owner_id
      FROM studios 
      WHERE ${conditions}
      ORDER BY name;
    `;
    
    console.log('🔍 Finding studios with HTML entities...');
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      console.log('✨ No HTML entities found in studio names!');
      return;
    }
    
    console.log(`📋 Found ${result.rows.length} studios with HTML entities:\n`);
    
    const updates = [];
    
    for (const studio of result.rows) {
      const decoded = decodeHtmlEntities(studio.name);
      
      if (decoded.hasEntities) {
        console.log(`📝 ${studio.id.substring(0, 8)}: "${studio.name}"`);
        console.log(`   → "${decoded.decodedText}"`);
        console.log(`   Entities: ${decoded.foundEntities.join(', ')}\n`);
        
        updates.push({
          id: studio.id,
          originalName: studio.name,
          decodedName: decoded.decodedText,
          entities: decoded.foundEntities
        });
      }
    }
    
    if (updates.length === 0) {
      console.log('✨ No valid HTML entities found to fix!');
      return;
    }
    
    console.log(`📊 Total studios to update: ${updates.length}`);
    
    if (!dryRun) {
      console.log('\n🔄 Applying fixes...');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const update of updates) {
        try {
          const updateQuery = `
            UPDATE studios 
            SET name = $1, updated_at = NOW()
            WHERE id = $2;
          `;
          
          await client.query(updateQuery, [update.decodedName, update.id]);
          console.log(`✅ Updated: ${update.id.substring(0, 8)}`);
          successCount++;
          
        } catch (error) {
          console.error(`❌ Error updating ${update.id}: ${error.message}`);
          errorCount++;
        }
      }
      
      console.log(`\n📈 Results:`);
      console.log(`   ✅ Successfully updated: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      
      // Verify the fixes
      console.log('\n🔍 Verifying fixes...');
      const verifyQuery = `
        SELECT id, name 
        FROM studios 
        WHERE id = ANY($1);
      `;
      
      const studioIds = updates.map(u => u.id);
      const verifyResult = await client.query(verifyQuery, [studioIds]);
      
      console.log('📋 Verification results:');
      verifyResult.rows.forEach(studio => {
        const original = updates.find(u => u.id === studio.id);
        const stillHasEntities = decodeHtmlEntities(studio.name).hasEntities;
        
        if (stillHasEntities) {
          console.log(`❌ ${studio.id.substring(0, 8)}: Still has entities - "${studio.name}"`);
        } else {
          console.log(`✅ ${studio.id.substring(0, 8)}: Fixed - "${studio.name}"`);
        }
      });
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎉 Studio HTML entity fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  
  fixStudioHtmlEntities(dryRun)
    .then(() => {
      console.log('\n✅ Fix script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixStudioHtmlEntities };
