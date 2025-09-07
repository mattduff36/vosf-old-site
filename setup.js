#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Next.js Database Query Interface...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  const envExample = `# Authentication
USERNAME=Admin
PASSWORD=change_this_password

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=cl59_theshows2

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateRandomString(32)}
`;
  
  fs.writeFileSync(envPath, envExample);
  console.log('✅ .env.local created! Please update the PASSWORD and database credentials.\n');
} else {
  console.log('✅ .env.local already exists.\n');
}

// Check if node_modules exists
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed!\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed.\n');
}

// Check database connection
console.log('🔍 Checking database setup...');
try {
  require('dotenv').config({ path: envPath });
  const mysql = require('mysql2/promise');
  
  (async () => {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
      });
      
      // Check if database exists
      const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [process.env.DB_NAME || 'cl59_theshows2']);
      
      if (databases.length === 0) {
        console.log('⚠️  Database not found. Please import the SQL file:');
        console.log(`   mysql -u ${process.env.DB_USER || 'root'} -p -e "CREATE DATABASE ${process.env.DB_NAME || 'cl59_theshows2'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
        console.log(`   mysql -u ${process.env.DB_USER || 'root'} -p ${process.env.DB_NAME || 'cl59_theshows2'} < "../MAIN DATABASE/cl59-theshows2.sql"\n`);
      } else {
        console.log('✅ Database found!\n');
        
        // Check tables
        await connection.changeUser({ database: process.env.DB_NAME || 'cl59_theshows2' });
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📊 Found ${tables.length} tables in database.\n`);
      }
      
      await connection.end();
    } catch (error) {
      console.log('⚠️  Database connection failed:', error.message);
      console.log('   Please check your database credentials in .env.local\n');
    }
  })();
  
} catch (error) {
  console.log('⚠️  Could not check database (dependencies may not be installed yet)\n');
}

console.log('🎉 Setup complete! Next steps:');
console.log('   1. Update .env.local with your credentials');
console.log('   2. Import the database if needed');
console.log('   3. Run: npm run dev');
console.log('   4. Visit: http://localhost:3000\n');

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
