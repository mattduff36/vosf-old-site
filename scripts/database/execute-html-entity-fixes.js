#!/usr/bin/env node

/**
 * Execute HTML Entity Fixes - Production Ready
 * Uses direct PostgreSQL client for maximum reliability
 */

const { Client } = require('pg');
const { decodeHtmlEntities, findHtmlEntities } = require('./html-entity-mapping');

// Database connection (proven to work from diagnostics)
const DATABASE_URL = 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

// Tables and fields to fix
const FIXES_TO_APPLY = [
  // High Priority - User facing content
  { table: 'users', field: 'display_name', priority: 'HIGH' },
  { table: 'users', field: 'username', priority: 'HIGH' },
  { table: 'user_profiles', field: 'first_name', priority: 'HIGH' },
  { table: 'user_profiles', field: 'last_name', priority: 'HIGH' },
  { table: 'user_profiles', field: 'about', priority: 'HIGH' },
  { table: 'user_profiles', field: 'short_about', priority: 'MEDIUM' },
  { table: 'user_profiles', field: 'location', priority: 'MEDIUM' },
  { table: 'user_profiles', field: 'home_studio_description', priority: 'MEDIUM' },
  { table: 'user_profiles', field: 'equipment_list', priority: 'MEDIUM' },
  { table: 'user_profiles', field: 'services_offered', priority: 'MEDIUM' },
  
  // Medium Priority - Business content
  { table: 'studios', field: 'name', priority: 'HIGH' },
  { table: 'studios', field: 'description', priority: 'HIGH' },
  { table: 'studios', field: 'address', priority: 'MEDIUM' }
];

// Common HTML entities to fix (most frequent ones first)
const PRIORITY_ENTITIES = [
  '&#039;',  // Single quote - most common
  '&amp;',   // Ampersand - very common
  '&eacute;', // e with acute accent
  '&trade;',  // Trademark symbol
  '&rsquo;',  // Right single quote
  '&quot;',   // Double quote
  '&ccedil;', // c with cedilla
  '&pound;',  // Pound sterling
  '&nbsp;',   // Non-breaking space
  '&#8217;',  // Right single quotation mark
  '&#8216;',  // Left single quotation mark
  '&#8220;',  // Left double quotation mark
  '&#8221;'   // Right double quotation mark
];

async function findRecordsWithEntities(client, table, field) {
  console.log(`🔍 Searching ${table}.${field} for HTML entities...`);
  
  // Build WHERE clause for common entities
  const whereConditions = PRIORITY_ENTITIES.map(entity => 
    `${field} LIKE '%${entity}%'`
  ).join(' OR ');
  
  const query = `
    SELECT id, ${field} 
    FROM ${table} 
    WHERE ${field} IS NOT NULL 
      AND (${whereConditions})
    ORDER BY id
    LIMIT 1000
  `;
  
  try {
    const result = await client.query(query);
    console.log(`   Found ${result.rows.length} records with HTML entities`);
    
    // Show examples
    if (result.rows.length > 0) {
      const examples = result.rows.slice(0, 3);
      examples.forEach(row => {
        const entities = findHtmlEntities(row[field]);
        console.log(`   📝 ID ${row.id}: "${row[field]}" [${entities.join(', ')}]`);
      });
      
      if (result.rows.length > 3) {
        console.log(`   ... and ${result.rows.length - 3} more records`);
      }
    }
    
    return result.rows;
  } catch (error) {
    console.error(`   ❌ Error searching ${table}.${field}:`, error.message);
    return [];
  }
}

async function fixRecord(client, table, field, record, dryRun = false) {
  const originalValue = record[field];
  const decodedValue = decodeHtmlEntities(originalValue);
  
  if (originalValue === decodedValue) {
    return { changed: false, success: true };
  }
  
  if (dryRun) {
    console.log(`   🔄 [DRY RUN] ID ${record.id}: "${originalValue}" → "${decodedValue}"`);
    return { changed: true, success: true, dryRun: true };
  }
  
  try {
    const updateQuery = `
      UPDATE ${table} 
      SET ${field} = $1 
      WHERE id = $2
    `;
    
    await client.query(updateQuery, [decodedValue, record.id]);
    console.log(`   ✅ ID ${record.id}: "${originalValue}" → "${decodedValue}"`);
    
    return { changed: true, success: true };
  } catch (error) {
    console.error(`   ❌ ID ${record.id}: Update failed - ${error.message}`);
    return { changed: false, success: false, error: error.message };
  }
}

async function processTableField(client, table, field, dryRun = false) {
  console.log(`\n📋 Processing ${table}.${field}...`);
  
  const records = await findRecordsWithEntities(client, table, field);
  
  if (records.length === 0) {
    console.log(`   ✨ No HTML entities found`);
    return { processed: 0, updated: 0, errors: 0 };
  }
  
  let updated = 0;
  let errors = 0;
  
  console.log(`\n🔄 ${dryRun ? '[DRY RUN] ' : ''}Processing ${records.length} records...`);
  
  for (const record of records) {
    const result = await fixRecord(client, table, field, record, dryRun);
    
    if (!result.success) {
      errors++;
    } else if (result.changed) {
      updated++;
    }
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`\n📊 ${table}.${field} Summary:`);
  console.log(`   - Records found: ${records.length}`);
  console.log(`   - Records ${dryRun ? 'would be ' : ''}updated: ${updated}`);
  console.log(`   - Errors: ${errors}`);
  
  return { processed: records.length, updated, errors };
}

async function executeHtmlEntityFixes(dryRun = false) {
  console.log(`🚀 ${dryRun ? 'DRY RUN - ' : ''}Starting HTML entity fixes...`);
  console.log(`📅 Started at: ${new Date().toISOString()}\n`);
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    // Process each table/field combination
    for (const fix of FIXES_TO_APPLY) {
      const result = await processTableField(client, fix.table, fix.field, dryRun);
      totalProcessed += result.processed;
      totalUpdated += result.updated;
      totalErrors += result.errors;
      
      // Brief pause between tables
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n🎉 ${dryRun ? 'DRY RUN ' : ''}HTML entity fixes completed!`);
    console.log(`📅 Completed at: ${new Date().toISOString()}`);
    console.log(`\n📈 Final Summary:`);
    console.log(`   - Total records processed: ${totalProcessed}`);
    console.log(`   - Total records ${dryRun ? 'would be ' : ''}updated: ${totalUpdated}`);
    console.log(`   - Total errors: ${totalErrors}`);
    
    if (!dryRun && totalUpdated > 0) {
      console.log(`\n🔍 Running verification...`);
      await runVerification(client);
    }
    
    return {
      success: totalErrors === 0,
      processed: totalProcessed,
      updated: totalUpdated,
      errors: totalErrors
    };
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    throw error;
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Database connection closed');
    } catch (e) {
      console.error('⚠️  Error closing connection:', e.message);
    }
  }
}

async function runVerification(client) {
  console.log('🔍 Verifying fixes...');
  
  const verificationQueries = [
    { name: 'users.display_name', query: "SELECT COUNT(*) as count FROM users WHERE display_name LIKE '%&#039;%' OR display_name LIKE '%&amp;%' OR display_name LIKE '%&eacute;%'" },
    { name: 'user_profiles.first_name', query: "SELECT COUNT(*) as count FROM user_profiles WHERE first_name LIKE '%&#039;%' OR first_name LIKE '%&amp;%' OR first_name LIKE '%&eacute;%'" },
    { name: 'user_profiles.about', query: "SELECT COUNT(*) as count FROM user_profiles WHERE about LIKE '%&#039;%' OR about LIKE '%&amp;%' OR about LIKE '%&eacute;%'" },
    { name: 'studios.name', query: "SELECT COUNT(*) as count FROM studios WHERE name LIKE '%&#039;%' OR name LIKE '%&amp;%' OR name LIKE '%&eacute;%'" }
  ];
  
  for (const check of verificationQueries) {
    try {
      const result = await client.query(check.query);
      const remaining = result.rows[0].count;
      console.log(`   ${check.name}: ${remaining} remaining entities ${remaining === '0' ? '✅' : '⚠️'}`);
    } catch (error) {
      console.log(`   ${check.name}: Verification failed - ${error.message}`);
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('-d');
  
  if (isDryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
  } else {
    console.log('⚠️  LIVE MODE - Changes will be applied to the database!');
    console.log('💡 Use --dry-run flag to preview changes first.\n');
  }
  
  executeHtmlEntityFixes(isDryRun)
    .then((results) => {
      if (results.success) {
        console.log(`\n🎉 ${isDryRun ? 'Dry run' : 'Fixes'} completed successfully!`);
        if (isDryRun) {
          console.log('💡 Run without --dry-run to apply the changes.');
        }
        process.exit(0);
      } else {
        console.log(`\n⚠️  Some errors occurred during processing.`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Processing failed:', error);
      process.exit(1);
    });
}

module.exports = { executeHtmlEntityFixes };
