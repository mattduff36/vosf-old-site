#!/usr/bin/env node

/**
 * HTML Entity Mapping and Decoding Functions
 * Comprehensive mapping of HTML entities found in the database
 */

// Complete HTML entity mapping based on our analysis
const HTML_ENTITY_MAP = {
  // Common apostrophes and quotes
  '&#039;': "'",        // Single quote (most common)
  '&apos;': "'",        // Single quote (XML)
  '&rsquo;': "'",       // Right single quotation mark
  '&lsquo;': "'",       // Left single quotation mark
  '&quot;': '"',        // Double quote
  '&ldquo;': '"',       // Left double quotation mark
  '&rdquo;': '"',       // Right double quotation mark
  
  // Ampersands
  '&amp;': '&',         // Ampersand (very common)
  
  // Accented characters
  '&eacute;': 'é',      // e with acute accent
  '&egrave;': 'è',      // e with grave accent
  '&ecirc;': 'ê',       // e with circumflex
  '&euml;': 'ë',        // e with diaeresis
  '&aacute;': 'á',      // a with acute accent
  '&agrave;': 'à',      // a with grave accent
  '&acirc;': 'â',       // a with circumflex
  '&auml;': 'ä',        // a with diaeresis
  '&iacute;': 'í',      // i with acute accent
  '&igrave;': 'ì',      // i with grave accent
  '&icirc;': 'î',       // i with circumflex
  '&iuml;': 'ï',        // i with diaeresis
  '&oacute;': 'ó',      // o with acute accent
  '&ograve;': 'ò',      // o with grave accent
  '&ocirc;': 'ô',       // o with circumflex
  '&ouml;': 'ö',        // o with diaeresis
  '&uacute;': 'ú',      // u with acute accent
  '&ugrave;': 'ù',      // u with grave accent
  '&ucirc;': 'û',       // u with circumflex
  '&uuml;': 'ü',        // u with diaeresis
  '&ccedil;': 'ç',      // c with cedilla
  '&ntilde;': 'ñ',      // n with tilde
  
  // Special symbols
  '&trade;': '™',       // Trademark symbol
  '&copy;': '©',        // Copyright symbol
  '&reg;': '®',         // Registered trademark
  '&pound;': '£',       // Pound sterling
  '&euro;': '€',        // Euro symbol
  '&yen;': '¥',         // Yen symbol
  '&cent;': '¢',        // Cent symbol
  
  // Spaces and formatting
  '&nbsp;': ' ',        // Non-breaking space
  '&ensp;': ' ',        // En space
  '&emsp;': ' ',        // Em space
  '&thinsp;': ' ',      // Thin space
  
  // Mathematical and technical
  '&lt;': '<',          // Less than
  '&gt;': '>',          // Greater than
  '&le;': '≤',          // Less than or equal
  '&ge;': '≥',          // Greater than or equal
  '&ne;': '≠',          // Not equal
  '&plusmn;': '±',      // Plus-minus
  '&times;': '×',       // Multiplication
  '&divide;': '÷',      // Division
  
  // Punctuation
  '&ndash;': '–',       // En dash
  '&mdash;': '—',       // Em dash
  '&hellip;': '…',      // Horizontal ellipsis
  '&bull;': '•',        // Bullet
  '&middot;': '·',      // Middle dot
  
  // Numeric character references (common ones)
  '&#8217;': "'",       // Right single quotation mark
  '&#8216;': "'",       // Left single quotation mark
  '&#8220;': '"',       // Left double quotation mark
  '&#8221;': '"',       // Right double quotation mark
  '&#8211;': '–',       // En dash
  '&#8212;': '—',       // Em dash
  '&#8230;': '…',       // Horizontal ellipsis
  '&#8482;': '™',       // Trademark
  '&#169;': '©',        // Copyright
  '&#174;': '®',        // Registered trademark
  '&#8364;': '€',       // Euro symbol
  '&#163;': '£',        // Pound sterling
  '&#160;': ' ',        // Non-breaking space
};

/**
 * Decode HTML entities in a string
 * @param {string} text - Text containing HTML entities
 * @returns {string} - Decoded text
 */
function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let decodedText = text;
  
  // Apply all entity mappings
  for (const [entity, replacement] of Object.entries(HTML_ENTITY_MAP)) {
    // Use global replace to handle multiple occurrences
    decodedText = decodedText.replace(new RegExp(escapeRegExp(entity), 'g'), replacement);
  }
  
  return decodedText;
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if text contains HTML entities
 * @param {string} text - Text to check
 * @returns {boolean} - True if contains HTML entities
 */
function containsHtmlEntities(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return Object.keys(HTML_ENTITY_MAP).some(entity => text.includes(entity));
}

/**
 * Get all HTML entities found in text
 * @param {string} text - Text to analyze
 * @returns {string[]} - Array of found entities
 */
function findHtmlEntities(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  return Object.keys(HTML_ENTITY_MAP).filter(entity => text.includes(entity));
}

/**
 * Generate SQL REPLACE statements for a field
 * @param {string} tableName - Name of the table
 * @param {string} fieldName - Name of the field
 * @returns {string} - SQL UPDATE statement
 */
function generateSqlReplaceStatement(tableName, fieldName) {
  const entities = Object.keys(HTML_ENTITY_MAP);
  let sql = `UPDATE "${tableName}" SET "${fieldName}" = `;
  
  // Build nested REPLACE statements
  let replaceChain = `"${fieldName}"`;
  for (const entity of entities) {
    const replacement = HTML_ENTITY_MAP[entity];
    replaceChain = `REPLACE(${replaceChain}, '${entity}', '${replacement}')`;
  }
  
  sql += replaceChain;
  
  // Add WHERE clause to only update rows that actually contain entities
  const whereConditions = entities.map(entity => `"${fieldName}" LIKE '%${entity}%'`);
  sql += ` WHERE (${whereConditions.join(' OR ')})`;
  
  return sql + ';';
}

/**
 * Generate Prisma update operations for a model
 * @param {string} modelName - Name of the Prisma model
 * @param {string} fieldName - Name of the field
 * @returns {Object} - Prisma update operation
 */
function generatePrismaUpdate(modelName, fieldName) {
  return {
    model: modelName,
    field: fieldName,
    operation: 'updateMany',
    where: {
      OR: Object.keys(HTML_ENTITY_MAP).map(entity => ({
        [fieldName]: { contains: entity }
      }))
    }
  };
}

/**
 * Test the decoding function with sample data
 */
function testDecoding() {
  console.log('🧪 Testing HTML entity decoding...\n');
  
  const testCases = [
    "Elisa&#039;s Studio",
    "Matin&eacute;e Multilingual", 
    "THE ARABIC VOICE&trade;",
    "we&rsquo;ve cleared this up",
    "Jack &amp; Jones, Lidl",
    "don&#039;t forget to add",
    "MPazVald&eacute;s",
    "&pound;25 per hour",
    "Pra&ccedil;a P&eacute;rola"
  ];
  
  testCases.forEach(testCase => {
    const decoded = decodeHtmlEntities(testCase);
    const hasEntities = containsHtmlEntities(testCase);
    const foundEntities = findHtmlEntities(testCase);
    
    console.log(`Original: "${testCase}"`);
    console.log(`Decoded:  "${decoded}"`);
    console.log(`Has entities: ${hasEntities}`);
    console.log(`Found entities: [${foundEntities.join(', ')}]`);
    console.log('---');
  });
}

// Export functions for use in other scripts
module.exports = {
  HTML_ENTITY_MAP,
  decodeHtmlEntities,
  containsHtmlEntities,
  findHtmlEntities,
  generateSqlReplaceStatement,
  generatePrismaUpdate,
  testDecoding
};

// Run test if called directly
if (require.main === module) {
  testDecoding();
  
  console.log('\n📋 Sample SQL Statement:');
  console.log(generateSqlReplaceStatement('users', 'display_name'));
  
  console.log('\n📋 Sample Prisma Update:');
  console.log(JSON.stringify(generatePrismaUpdate('user', 'displayName'), null, 2));
}
