#!/usr/bin/env node

/**
 * Fix HTML Entities in High Priority Tables
 * Updates users and user_profiles tables to decode HTML entities
 */

const { PrismaClient } = require('@prisma/client');
const { decodeHtmlEntities, containsHtmlEntities, findHtmlEntities } = require('./html-entity-mapping');

const prisma = new PrismaClient();

// Define fields to update for each high-priority table
const HIGH_PRIORITY_UPDATES = {
  users: {
    model: 'user',
    fields: ['displayName', 'username'],
    displayName: 'Users'
  },
  user_profiles: {
    model: 'userProfile', 
    fields: ['firstName', 'lastName', 'about', 'shortAbout', 'location', 'homeStudioDescription', 'equipmentList', 'servicesOffered'],
    displayName: 'User Profiles'
  }
};

/**
 * Find records with HTML entities in a specific table and field
 */
async function findRecordsWithEntities(modelName, fieldName) {
  console.log(`🔍 Searching for HTML entities in ${modelName}.${fieldName}...`);
  
  try {
    const records = await prisma[modelName].findMany({
      where: {
        OR: [
          { [fieldName]: { contains: '&#039;' } },
          { [fieldName]: { contains: '&amp;' } },
          { [fieldName]: { contains: '&eacute;' } },
          { [fieldName]: { contains: '&trade;' } },
          { [fieldName]: { contains: '&rsquo;' } },
          { [fieldName]: { contains: '&quot;' } },
          { [fieldName]: { contains: '&ccedil;' } },
          { [fieldName]: { contains: '&pound;' } },
          { [fieldName]: { contains: '&nbsp;' } },
          { [fieldName]: { contains: '&#8217;' } },
          { [fieldName]: { contains: '&#8216;' } },
          { [fieldName]: { contains: '&#8220;' } },
          { [fieldName]: { contains: '&#8221;' } }
        ]
      },
      select: {
        id: true,
        [fieldName]: true
      }
    });
    
    console.log(`   Found ${records.length} records with HTML entities`);
    return records;
    
  } catch (error) {
    console.error(`❌ Error searching ${modelName}.${fieldName}:`, error.message);
    return [];
  }
}

/**
 * Update a single record's field to decode HTML entities
 */
async function updateRecord(modelName, recordId, fieldName, originalValue) {
  const decodedValue = decodeHtmlEntities(originalValue);
  
  if (originalValue === decodedValue) {
    console.log(`   ⏭️  Record ${recordId}: No changes needed`);
    return { success: true, changed: false };
  }
  
  try {
    await prisma[modelName].update({
      where: { id: recordId },
      data: { [fieldName]: decodedValue }
    });
    
    console.log(`   ✅ Record ${recordId}: "${originalValue}" → "${decodedValue}"`);
    return { success: true, changed: true };
    
  } catch (error) {
    console.error(`   ❌ Record ${recordId}: Update failed -`, error.message);
    return { success: false, changed: false, error: error.message };
  }
}

/**
 * Process all records for a specific table and field
 */
async function processTableField(tableName, modelName, fieldName) {
  console.log(`\n📋 Processing ${tableName}.${fieldName}...`);
  
  const records = await findRecordsWithEntities(modelName, fieldName);
  
  if (records.length === 0) {
    console.log(`   ✨ No HTML entities found in ${fieldName}`);
    return { processed: 0, updated: 0, errors: 0 };
  }
  
  let updated = 0;
  let errors = 0;
  
  console.log(`\n🔄 Updating ${records.length} records...`);
  
  for (const record of records) {
    const result = await updateRecord(modelName, record.id, fieldName, record[fieldName]);
    
    if (!result.success) {
      errors++;
    } else if (result.changed) {
      updated++;
    }
    
    // Add small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 ${tableName}.${fieldName} Summary:`);
  console.log(`   - Records processed: ${records.length}`);
  console.log(`   - Records updated: ${updated}`);
  console.log(`   - Errors: ${errors}`);
  
  return { processed: records.length, updated, errors };
}

/**
 * Process all high-priority tables
 */
async function processHighPriorityTables() {
  console.log('🚀 Starting HTML entity fixes for high-priority tables...\n');
  
  const startTime = Date.now();
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  try {
    for (const [tableName, config] of Object.entries(HIGH_PRIORITY_UPDATES)) {
      console.log(`\n🎯 Processing ${config.displayName} (${tableName})...`);
      
      for (const fieldName of config.fields) {
        const result = await processTableField(tableName, config.model, fieldName);
        totalProcessed += result.processed;
        totalUpdated += result.updated;
        totalErrors += result.errors;
      }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`\n🎉 High-priority table updates completed!`);
    console.log(`\n📈 Final Summary:`);
    console.log(`   - Total records processed: ${totalProcessed}`);
    console.log(`   - Total records updated: ${totalUpdated}`);
    console.log(`   - Total errors: ${totalErrors}`);
    console.log(`   - Duration: ${duration} seconds`);
    
    if (totalErrors > 0) {
      console.log(`\n⚠️  ${totalErrors} errors occurred. Please review the logs above.`);
    }
    
    return {
      success: totalErrors === 0,
      processed: totalProcessed,
      updated: totalUpdated,
      errors: totalErrors,
      duration
    };
    
  } catch (error) {
    console.error('💥 Fatal error during processing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Dry run mode - preview changes without applying them
 */
async function dryRun() {
  console.log('🔍 DRY RUN MODE - Previewing changes without applying them...\n');
  
  try {
    for (const [tableName, config] of Object.entries(HIGH_PRIORITY_UPDATES)) {
      console.log(`\n📋 ${config.displayName} (${tableName}):`);
      
      for (const fieldName of config.fields) {
        const records = await findRecordsWithEntities(config.model, fieldName);
        
        if (records.length > 0) {
          console.log(`\n   ${fieldName}: ${records.length} records need updating`);
          
          // Show first 3 examples
          const examples = records.slice(0, 3);
          examples.forEach(record => {
            const original = record[fieldName];
            const decoded = decodeHtmlEntities(original);
            const entities = findHtmlEntities(original);
            
            console.log(`     - ID ${record.id}:`);
            console.log(`       Original: "${original}"`);
            console.log(`       Decoded:  "${decoded}"`);
            console.log(`       Entities: [${entities.join(', ')}]`);
          });
          
          if (records.length > 3) {
            console.log(`     ... and ${records.length - 3} more records`);
          }
        } else {
          console.log(`   ${fieldName}: ✅ No HTML entities found`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Dry run failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('-d');
  
  if (isDryRun) {
    console.log('🔍 Running in DRY RUN mode...\n');
    dryRun()
      .then(() => {
        console.log('\n✨ Dry run completed successfully!');
        console.log('💡 Run without --dry-run to apply the changes.');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Dry run failed:', error);
        process.exit(1);
      });
  } else {
    console.log('⚠️  LIVE MODE - Changes will be applied to the database!');
    console.log('💡 Use --dry-run flag to preview changes first.\n');
    
    processHighPriorityTables()
      .then((results) => {
        if (results.success) {
          console.log('\n🎉 All high-priority tables updated successfully!');
          process.exit(0);
        } else {
          console.log('\n⚠️  Some errors occurred during processing.');
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error('💥 Processing failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  processHighPriorityTables,
  dryRun,
  findRecordsWithEntities,
  updateRecord
};
