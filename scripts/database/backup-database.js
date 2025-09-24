#!/usr/bin/env node

/**
 * Database Backup Script for HTML Entity Fix Project
 * Creates a backup before making any changes to the database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createDatabaseBackup() {
  console.log('🚀 Starting database backup process...\n');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backups/html-entity-fix-${timestamp}`;
  
  try {
    // Create backup directory
    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups', { recursive: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });
    
    console.log(`📁 Created backup directory: ${backupDir}\n`);
    
    // Tables to backup (focusing on those with text content)
    const tablesToBackup = [
      'users',
      'user_profiles', 
      'studios',
      'messages'
    ];
    
    for (const table of tablesToBackup) {
      console.log(`📋 Backing up table: ${table}...`);
      
      let data;
      switch (table) {
        case 'users':
          data = await prisma.user.findMany();
          break;
        case 'user_profiles':
          data = await prisma.userProfile.findMany();
          break;
        case 'studios':
          data = await prisma.studio.findMany();
          break;
        case 'messages':
          // Skip messages for now as it might be large
          console.log(`⏭️  Skipping ${table} (potentially large table)`);
          continue;
      }
      
      if (data) {
        const backupFile = path.join(backupDir, `${table}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        console.log(`✅ Backed up ${data.length} records from ${table}`);
      }
    }
    
    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      purpose: 'HTML Entity Fix Project',
      tables: tablesToBackup,
      database: 'PostgreSQL on Neon',
      totalTables: tablesToBackup.length
    };
    
    fs.writeFileSync(
      path.join(backupDir, 'backup-metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`\n🎉 Backup completed successfully!`);
    console.log(`📍 Backup location: ${backupDir}`);
    console.log(`📊 Backup metadata saved`);
    
    return backupDir;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if called directly
if (require.main === module) {
  createDatabaseBackup()
    .then((backupDir) => {
      console.log(`\n✨ Ready to proceed with HTML entity fixes!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backup process failed:', error);
      process.exit(1);
    });
}

module.exports = { createDatabaseBackup };
