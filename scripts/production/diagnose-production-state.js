#!/usr/bin/env node

/**
 * Production State Diagnostic Script
 * 
 * This script helps diagnose the current state of the production deployment
 * and identifies what needs to be updated.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function diagnosePrismaClient() {
  console.log('🔍 Checking Prisma Client...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test basic connection
    const studioCount = await prisma.studio.count();
    console.log(`✅ Database connection successful - ${studioCount} studios found`);
    
    // Test if the old first_name field is still being referenced
    try {
      const profileWithFirstName = await prisma.userProfile.findFirst({
        select: {
          id: true,
          firstName: true // This should fail if schema is updated
        }
      });
      console.log('❌ ERROR: Prisma client still references firstName field - needs regeneration!');
      return false;
    } catch (error) {
      if (error.message.includes('firstName')) {
        console.log('✅ Prisma client correctly updated - firstName field not found');
        return true;
      } else {
        console.log('⚠️  Unexpected error:', error.message);
        return false;
      }
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

function checkGitStatus() {
  console.log('\n🔍 Checking Git Status...');
  
  try {
    const { execSync } = require('child_process');
    
    // Get current commit
    const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log(`Current commit: ${currentCommit.substring(0, 8)}`);
    
    // Get latest commits
    const recentCommits = execSync('git log --oneline -3', { encoding: 'utf8' });
    console.log('Recent commits:');
    console.log(recentCommits);
    
    // Check if we have the critical fix commit
    const criticalCommit = '88f5648'; // Schema sync commit
    const hasFixCommit = recentCommits.includes(criticalCommit);
    
    if (hasFixCommit) {
      console.log('✅ Production has the critical schema fix commit');
      return true;
    } else {
      console.log('❌ Production is missing the critical schema fix commit');
      console.log('   Run: git pull origin main');
      return false;
    }
  } catch (error) {
    console.log('❌ Git check failed:', error.message);
    return false;
  }
}

function checkBuildStatus() {
  console.log('\n🔍 Checking Build Status...');
  
  const nextDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(nextDir)) {
    console.log('❌ No .next directory found - run: npm run build');
    return false;
  }
  
  const buildManifest = path.join(nextDir, 'build-manifest.json');
  if (!fs.existsSync(buildManifest)) {
    console.log('❌ No build manifest found - run: npm run build');
    return false;
  }
  
  const stats = fs.statSync(buildManifest);
  const buildAge = Date.now() - stats.mtime.getTime();
  const buildAgeMinutes = Math.floor(buildAge / (1000 * 60));
  
  console.log(`✅ Build found (${buildAgeMinutes} minutes old)`);
  
  if (buildAgeMinutes > 60) {
    console.log('⚠️  Build is older than 1 hour - consider rebuilding');
  }
  
  return true;
}

function checkEnvironmentVariables() {
  console.log('\n🔍 Checking Environment Variables...');
  
  const requiredVars = ['DATABASE_URL', 'AUTH_USERNAME', 'AUTH_PASSWORD'];
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function main() {
  console.log('🚀 Production State Diagnostic\n');
  console.log('Checking production deployment state...\n');
  
  const checks = [
    { name: 'Git Status', fn: checkGitStatus },
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Build Status', fn: checkBuildStatus },
    { name: 'Prisma Client', fn: diagnosePrismaClient }
  ];
  
  const results = [];
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, passed: result });
    } catch (error) {
      console.log(`❌ ${check.name} check failed:`, error.message);
      results.push({ name: check.name, passed: false });
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('='.repeat(50));
  
  let allPassed = true;
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (!result.passed) allPassed = false;
  }
  
  console.log('='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All checks passed! Production should be working correctly.');
  } else {
    console.log('⚠️  Some checks failed. Follow the deployment script to fix issues.');
    console.log('\nNext steps:');
    console.log('1. git pull origin main');
    console.log('2. npm install');
    console.log('3. npx prisma generate');
    console.log('4. npm run build');
    console.log('5. Restart your application server');
  }
  
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { diagnosePrismaClient, checkGitStatus, checkBuildStatus, checkEnvironmentVariables };
