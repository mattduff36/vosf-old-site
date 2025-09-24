#!/usr/bin/env node

/**
 * Script to find HTML entities in SQLite database
 * Uses the existing database connection from the app
 */

import { getConnection, executeQuery } from '../../app/lib/database.js';

// Common HTML entities to search for
const HTML_ENTITIES = [
  '&#039;',  // Single quote
  '&apos;',  // Single quote (XML)
  '&quot;',  // Double quote
  '&amp;',   // Ampersand
  '&lt;',    // Less than
  '&gt;',    // Greater than
  '&nbsp;',  // Non-breaking space
  '&#8217;', // Right single quotation mark
  '&#8216;', // Left single quotation mark
  '&#8220;', // Left double quotation mark
  '&#8221;', // Right double quotation mark
  '&#8211;', // En dash
  '&#8212;', // Em dash
  '&#8230;', // Horizontal ellipsis
];

async function findHtmlEntitiesInDatabase() {
  console.log('🚀 Starting HTML entity search across SQLite database...\n');
  
  try {
    // First, let's see what tables exist
    const tables = await executeQuery(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('📋 Found tables:', tables.map(t => t.name).join(', '));
    
    const allResults = [];
    
    for (const table of tables) {
      const tableName = table.name;
      console.log(`\n🔍 Checking table: ${tableName}`);
      
      // Get column info for this table
      const columns = await executeQuery(`PRAGMA table_info(${tableName})`);
      const textColumns = columns.filter(col => 
        col.type.toLowerCase().includes('text') || 
        col.type.toLowerCase().includes('varchar') ||
        col.type.toLowerCase().includes('char')
      );
      
      console.log(`  Text columns: ${textColumns.map(c => c.name).join(', ')}`);
      
      for (const column of textColumns) {
        const columnName = column.name;
        
        for (const entity of HTML_ENTITIES) {
          try {
            const query = `
              SELECT id, "${columnName}" as field_value 
              FROM "${tableName}" 
              WHERE "${columnName}" LIKE '%${entity}%' 
              AND "${columnName}" IS NOT NULL
              LIMIT 10
            `;
            
            const records = await executeQuery(query);
            
            if (records.length > 0) {
              allResults.push({
                table: tableName,
                field: columnName,
                entity: entity,
                count: records.length,
                examples: records.map(r => ({
                  id: r.id,
                  value: r.field_value
                }))
              });
              
              console.log(`    ⚠️  Found ${records.length} records with "${entity}" in ${columnName}`);
              records.forEach(record => {
                console.log(`      ID: ${record.id} - "${record.field_value}"`);
              });
            }
          } catch (error) {
            // Skip columns that don't exist or have issues
            if (!error.message.includes('no such column')) {
              console.log(`    ❌ Error checking ${columnName}: ${error.message}`);
            }
          }
        }
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(50));
    
    if (allResults.length === 0) {
      console.log('✅ No HTML entities found in the database!');
    } else {
      console.log(`⚠️  Found HTML entities in ${allResults.length} field(s):`);
      
      // Group by table
      const byTable = {};
      allResults.forEach(result => {
        if (!byTable[result.table]) {
          byTable[result.table] = [];
        }
        byTable[result.table].push(result);
      });
      
      Object.entries(byTable).forEach(([table, results]) => {
        console.log(`\n📋 Table: ${table}`);
        results.forEach(result => {
          console.log(`  - ${result.field}: ${result.count} records with "${result.entity}"`);
        });
      });
      
      // Most common entities
      const entityCounts = {};
      allResults.forEach(result => {
        entityCounts[result.entity] = (entityCounts[result.entity] || 0) + result.count;
      });
      
      console.log('\n🔢 Most common HTML entities:');
      Object.entries(entityCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([entity, count]) => {
          console.log(`  ${entity}: ${count} occurrences`);
        });
    }
    
    return allResults;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run the search
findHtmlEntitiesInDatabase()
  .then(results => {
    console.log('\n✅ Search completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Search failed:', error);
    process.exit(1);
  });
