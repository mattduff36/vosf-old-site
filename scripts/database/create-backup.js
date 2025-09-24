#!/usr/bin/env node

/**
 * Database Backup Script using Raw SQL Export
 * Works even when Prisma connections are unstable
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection from your environment
const DATABASE_URL = 'postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backups/manual-backup-${timestamp}`;
  
  console.log('🚀 Starting manual database backup...\n');
  
  try {
    // Create backup directory
    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups', { recursive: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });
    
    console.log(`📁 Created backup directory: ${backupDir}\n`);
    
    // Connect to database
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Tables to backup with their key fields
    const tablesToBackup = [
      {
        name: 'users',
        query: 'SELECT id, email, username, display_name, avatar_url, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT 1000'
      },
      {
        name: 'user_profiles', 
        query: 'SELECT id, user_id, first_name, last_name, about, short_about, location, home_studio_description, equipment_list, services_offered, created_at FROM user_profiles ORDER BY created_at DESC LIMIT 1000'
      },
      {
        name: 'studios',
        query: 'SELECT id, owner_id, name, description, address, website_url, phone, is_premium, is_verified, status, created_at, updated_at FROM studios ORDER BY created_at DESC LIMIT 1000'
      }
    ];
    
    // Backup each table
    for (const table of tablesToBackup) {
      console.log(`📋 Backing up ${table.name}...`);
      
      try {
        const result = await client.query(table.query);
        
        // Save as JSON
        const backupFile = path.join(backupDir, `${table.name}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(result.rows, null, 2));
        
        // Also save as CSV for easy viewing
        if (result.rows.length > 0) {
          const csvFile = path.join(backupDir, `${table.name}.csv`);
          const headers = Object.keys(result.rows[0]);
          const csvContent = [
            headers.join(','),
            ...result.rows.map(row => 
              headers.map(header => {
                const value = row[header];
                if (value === null) return '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              }).join(',')
            )
          ].join('\n');
          
          fs.writeFileSync(csvFile, csvContent);
        }
        
        console.log(`   ✅ ${result.rows.length} records backed up`);
        
        // Show sample of HTML entities found
        const htmlEntityFields = ['display_name', 'first_name', 'last_name', 'about', 'name', 'description'];
        let entitiesFound = 0;
        
        result.rows.forEach(row => {
          htmlEntityFields.forEach(field => {
            if (row[field] && typeof row[field] === 'string') {
              if (row[field].includes('&#039;') || row[field].includes('&amp;') || row[field].includes('&eacute;') || row[field].includes('&trade;') || row[field].includes('&rsquo;')) {
                if (entitiesFound < 3) {
                  console.log(`   🔍 HTML entity found: ${field} = "${row[field]}"`);
                }
                entitiesFound++;
              }
            }
          });
        });
        
        if (entitiesFound > 3) {
          console.log(`   🔍 ... and ${entitiesFound - 3} more records with HTML entities`);
        }
        
      } catch (error) {
        console.error(`   ❌ Failed to backup ${table.name}:`, error.message);
      }
    }
    
    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      purpose: 'HTML Entity Fix Project - Manual Backup',
      database: 'PostgreSQL on Neon',
      tables: tablesToBackup.map(t => t.name),
      connection: 'Direct PostgreSQL client',
      notes: 'Created before HTML entity fixes'
    };
    
    fs.writeFileSync(
      path.join(backupDir, 'backup-metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );
    
    await client.end();
    
    console.log(`\n🎉 Backup completed successfully!`);
    console.log(`📍 Backup location: ${backupDir}`);
    console.log(`📊 Files created:`);
    console.log(`   - JSON files for data restoration`);
    console.log(`   - CSV files for easy viewing`);
    console.log(`   - Metadata file with backup info`);
    
    return backupDir;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Run backup if called directly
if (require.main === module) {
  createBackup()
    .then((backupDir) => {
      console.log(`\n✨ Ready to proceed with HTML entity fixes!`);
      console.log(`💡 Your data is safely backed up in: ${backupDir}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backup process failed:', error);
      process.exit(1);
    });
}

module.exports = { createBackup };
