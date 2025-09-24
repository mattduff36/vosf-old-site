#!/usr/bin/env node

/**
 * Script to find HTML entities in the database
 * Searches all text fields for common HTML entities like &#039;, &amp;, &quot;, etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// Define which fields to check for each table
const FIELDS_TO_CHECK = {
  users: ['username', 'display_name'],
  user_profiles: [
    'first_name', 'last_name', 'about', 'short_about', 'location',
    'rate_tier_1', 'rate_tier_2', 'rate_tier_3',
    'home_studio_description', 'equipment_list', 'services_offered'
  ],
  studios: ['name', 'description', 'address'],
  studio_images: ['alt_text'],
  messages: ['subject', 'content'],
  notifications: ['title', 'message'],
  reviews: ['content'],
  review_responses: ['content'],
  content_reports: ['custom_reason', 'resolution'],
  saved_searches: ['name', 'filters'],
  faq: ['question', 'answer'],
  poi: ['name', 'description', 'address', 'category'],
  user_metadata: ['value']
};

async function findHtmlEntitiesInTable(tableName, fields) {
  console.log(`\n🔍 Checking table: ${tableName}`);
  
  const results = [];
  
  for (const field of fields) {
    console.log(`  Checking field: ${field}`);
    
    for (const entity of HTML_ENTITIES) {
      try {
        // Use raw query to search for HTML entities
        const query = `
          SELECT id, "${field}" as field_value 
          FROM "${tableName}" 
          WHERE "${field}" LIKE '%${entity}%' 
          AND "${field}" IS NOT NULL
          LIMIT 10
        `;
        
        const records = await prisma.$queryRawUnsafe(query);
        
        if (records.length > 0) {
          results.push({
            table: tableName,
            field: field,
            entity: entity,
            count: records.length,
            examples: records.map(r => ({
              id: r.id,
              value: r.field_value
            }))
          });
          
          console.log(`    ⚠️  Found ${records.length} records with "${entity}" in ${field}`);
          records.forEach(record => {
            console.log(`      ID: ${record.id} - "${record.field_value}"`);
          });
        }
      } catch (error) {
        console.log(`    ❌ Error checking ${field}: ${error.message}`);
      }
    }
  }
  
  return results;
}

async function main() {
  console.log('🚀 Starting HTML entity search across database...\n');
  
  const allResults = [];
  
  for (const [tableName, fields] of Object.entries(FIELDS_TO_CHECK)) {
    try {
      const tableResults = await findHtmlEntitiesInTable(tableName, fields);
      allResults.push(...tableResults);
    } catch (error) {
      console.log(`❌ Error processing table ${tableName}: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('=' * 50);
  
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
  
  await prisma.$disconnect();
}

main().catch(console.error);
