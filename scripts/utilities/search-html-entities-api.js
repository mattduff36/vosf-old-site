#!/usr/bin/env node

/**
 * Script to find HTML entities using the existing API endpoints
 * This bypasses database connection issues by using the working web API
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

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

async function searchForEntity(entity) {
  try {
    const response = await fetch(`${BASE_URL}/api/database/search?term=${encodeURIComponent(entity)}&includeData=true&limit=50`, {
      headers: {
        'Cookie': 'authenticated=true'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`    ❌ Error searching for "${entity}": ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting HTML entity search using API endpoints...\n');
  console.log(`🌐 Using base URL: ${BASE_URL}\n`);
  
  const allResults = [];
  
  for (const entity of HTML_ENTITIES) {
    console.log(`🔍 Searching for: "${entity}"`);
    
    const searchResult = await searchForEntity(entity);
    
    if (searchResult && searchResult.results && searchResult.results.length > 0) {
      console.log(`    ⚠️  Found ${searchResult.results.length} matches`);
      
      searchResult.results.forEach(result => {
        console.log(`      📋 Table: ${result.table}, Column: ${result.column}, Matches: ${result.matches}`);
        
        if (result.data && result.data.length > 0) {
          result.data.forEach(record => {
            console.log(`        ID: ${record.id || 'N/A'} - "${record.value}"`);
          });
        }
        
        allResults.push({
          entity: entity,
          table: result.table,
          column: result.column,
          matches: result.matches,
          examples: result.data || []
        });
      });
    } else {
      console.log(`    ✅ No matches found`);
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(50));
  
  if (allResults.length === 0) {
    console.log('✅ No HTML entities found in the database!');
  } else {
    console.log(`⚠️  Found HTML entities in ${allResults.length} location(s):`);
    
    // Group by table
    const byTable = {};
    allResults.forEach(result => {
      const key = `${result.table}.${result.column}`;
      if (!byTable[key]) {
        byTable[key] = [];
      }
      byTable[key].push(result);
    });
    
    Object.entries(byTable).forEach(([tableColumn, results]) => {
      console.log(`\n📋 ${tableColumn}:`);
      results.forEach(result => {
        console.log(`  - "${result.entity}": ${result.matches} matches`);
      });
    });
    
    // Most common entities
    const entityCounts = {};
    allResults.forEach(result => {
      entityCounts[result.entity] = (entityCounts[result.entity] || 0) + result.matches;
    });
    
    console.log('\n🔢 Most common HTML entities:');
    Object.entries(entityCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([entity, count]) => {
        console.log(`  ${entity}: ${count} occurrences`);
      });
  }
  
  return allResults;
}

// Run the search
main()
  .then(results => {
    console.log('\n✅ Search completed successfully!');
    
    // Save results to file for reference
    import('fs').then(fs => {
      fs.writeFileSync('html-entities-found.json', JSON.stringify(results, null, 2));
      console.log('📄 Results saved to html-entities-found.json');
    });
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Search failed:', error);
    process.exit(1);
  });
