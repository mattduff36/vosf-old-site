#!/usr/bin/env node

/**
 * Database Connection Diagnostic Tool
 * Investigates and troubleshoots connection issues
 */

const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');

// Connection configurations to test
const CONNECTION_CONFIGS = {
  direct_pg: {
    name: 'Direct PostgreSQL Client',
    config: {
      connectionString: 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 1 // Single connection for testing
    }
  },
  direct_pg_no_ssl: {
    name: 'Direct PostgreSQL Client (No SSL Verification)',
    config: {
      connectionString: 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require',
      ssl: false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 1
    }
  },
  prisma_default: {
    name: 'Prisma Client (Default)',
    config: 'prisma'
  }
};

async function testDirectConnection(config) {
  console.log(`\n🔌 Testing: ${config.name}`);
  console.log('─'.repeat(50));
  
  const client = new Client(config.config);
  
  try {
    console.log('⏳ Connecting...');
    const startTime = Date.now();
    
    await client.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Connected successfully in ${connectTime}ms`);
    
    // Test basic query
    console.log('⏳ Testing basic query...');
    const queryStart = Date.now();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    const queryTime = Date.now() - queryStart;
    
    console.log(`✅ Query successful in ${queryTime}ms`);
    console.log(`📊 PostgreSQL Version: ${result.rows[0].pg_version.split(' ')[0]}`);
    console.log(`🕐 Server Time: ${result.rows[0].current_time}`);
    
    // Test table access
    console.log('⏳ Testing table access...');
    const tableTest = await client.query('SELECT COUNT(*) as user_count FROM users LIMIT 1');
    console.log(`✅ Table access successful - ${tableTest.rows[0].user_count} users found`);
    
    // Test HTML entity search
    console.log('⏳ Testing HTML entity search...');
    const entityTest = await client.query(`
      SELECT COUNT(*) as entity_count 
      FROM users 
      WHERE display_name LIKE '%&#039;%' 
         OR display_name LIKE '%&amp;%' 
         OR display_name LIKE '%&eacute;%'
      LIMIT 10
    `);
    console.log(`✅ HTML entity search successful - ${entityTest.rows[0].entity_count} records with entities`);
    
    return {
      success: true,
      connectTime,
      queryTime,
      details: {
        version: result.rows[0].pg_version.split(' ')[0],
        userCount: tableTest.rows[0].user_count,
        entityCount: entityTest.rows[0].entity_count
      }
    };
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    console.log(`🔍 Error Code: ${error.code || 'Unknown'}`);
    console.log(`🔍 Error Details: ${error.detail || 'None'}`);
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error.detail
    };
  } finally {
    try {
      await client.end();
      console.log('🔌 Connection closed');
    } catch (e) {
      console.log('⚠️  Error closing connection:', e.message);
    }
  }
}

async function testPrismaConnection() {
  console.log(`\n🔌 Testing: Prisma Client`);
  console.log('─'.repeat(50));
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
      }
    }
  });
  
  try {
    console.log('⏳ Connecting via Prisma...');
    const startTime = Date.now();
    
    await prisma.$connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Prisma connected successfully in ${connectTime}ms`);
    
    // Test basic query
    console.log('⏳ Testing Prisma query...');
    const queryStart = Date.now();
    const userCount = await prisma.user.count();
    const queryTime = Date.now() - queryStart;
    
    console.log(`✅ Prisma query successful in ${queryTime}ms`);
    console.log(`📊 User count: ${userCount}`);
    
    // Test HTML entity search
    console.log('⏳ Testing Prisma HTML entity search...');
    const entityCount = await prisma.user.count({
      where: {
        OR: [
          { displayName: { contains: '&#039;' } },
          { displayName: { contains: '&amp;' } },
          { displayName: { contains: '&eacute;' } }
        ]
      }
    });
    console.log(`✅ Prisma entity search successful - ${entityCount} records with entities`);
    
    return {
      success: true,
      connectTime,
      queryTime,
      details: {
        userCount,
        entityCount
      }
    };
    
  } catch (error) {
    console.log(`❌ Prisma connection failed: ${error.message}`);
    console.log(`🔍 Error Code: ${error.code || 'Unknown'}`);
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  } finally {
    try {
      await prisma.$disconnect();
      console.log('🔌 Prisma connection closed');
    } catch (e) {
      console.log('⚠️  Error closing Prisma connection:', e.message);
    }
  }
}

async function checkEnvironment() {
  console.log('\n🔍 Environment Check');
  console.log('─'.repeat(50));
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
  
  // Check Node.js version
  console.log(`📋 Node.js Version: ${process.version}`);
  
  // Check installed packages
  try {
    const pgVersion = require('pg/package.json').version;
    console.log(`📋 pg package: v${pgVersion} ✅`);
  } catch (e) {
    console.log('📋 pg package: ❌ Not installed');
  }
  
  try {
    const prismaVersion = require('@prisma/client/package.json').version;
    console.log(`📋 @prisma/client: v${prismaVersion} ✅`);
  } catch (e) {
    console.log('📋 @prisma/client: ❌ Not installed');
  }
  
  // Check network connectivity
  console.log('\n🌐 Network Connectivity Test:');
  try {
    const dns = require('dns').promises;
    const hostname = 'ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech';
    const addresses = await dns.lookup(hostname);
    console.log(`✅ DNS Resolution: ${hostname} → ${addresses.address}`);
  } catch (error) {
    console.log(`❌ DNS Resolution failed: ${error.message}`);
  }
}

async function runDiagnostics() {
  console.log('🚀 Database Connection Diagnostics');
  console.log('='.repeat(60));
  
  await checkEnvironment();
  
  const results = {};
  
  // Test direct PostgreSQL connections
  for (const [key, config] of Object.entries(CONNECTION_CONFIGS)) {
    if (config.config !== 'prisma') {
      results[key] = await testDirectConnection(config);
      
      // Wait between tests to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Test Prisma connection
  results.prisma = await testPrismaConnection();
  
  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  
  const successful = Object.entries(results).filter(([_, result]) => result.success);
  const failed = Object.entries(results).filter(([_, result]) => !result.success);
  
  console.log(`✅ Successful connections: ${successful.length}`);
  console.log(`❌ Failed connections: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎯 RECOMMENDED APPROACH:');
    const best = successful[0];
    console.log(`   Use: ${CONNECTION_CONFIGS[best[0]].name}`);
    console.log(`   Connect Time: ${best[1].connectTime}ms`);
    console.log(`   Query Time: ${best[1].queryTime}ms`);
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    failed.forEach(([name, result]) => {
      console.log(`   ${CONNECTION_CONFIGS[name].name}: ${result.error}`);
    });
  }
  
  return results;
}

// Run diagnostics if called directly
if (require.main === module) {
  runDiagnostics()
    .then((results) => {
      const hasSuccess = Object.values(results).some(r => r.success);
      console.log(`\n${hasSuccess ? '✅' : '❌'} Diagnostics completed`);
      process.exit(hasSuccess ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = { runDiagnostics };
