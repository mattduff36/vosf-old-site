# 🚀 VOSF Database Explorer Setup Instructions

## Step 1: Install XAMPP

1. **Download XAMPP**: https://www.apachefriends.org/download.html
2. **Install with default settings** (usually to `C:\xampp\`)
3. **Open XAMPP Control Panel**
4. **Start MySQL service** (click Start button - should turn green)

## Step 2: Import Database

1. **Double-click `setup-database.bat`** in this folder
2. **Wait for it to complete** (may take a few minutes)
3. **You should see "🎉 DATABASE SETUP COMPLETE!"**

## Step 3: Start the Application

1. **Run**: `npm run dev`
2. **Open browser**: http://localhost:3000 (or whatever port it shows)
3. **Login with**:
   - Username: `admin`
   - Password: `GuyM@tt2025!`

## 🎯 What You'll Get

- **Database Overview**: See all tables, sizes, relationships
- **Smart Search**: Find data across the entire database
- **Table Explorer**: Detailed schema information
- **SQL Query Interface**: Run SELECT queries safely
- **Normal & Advanced Modes**: For different user types

## 🌐 Moving Online Later

When you're ready to move this online:

1. **Get a web hosting account** with MySQL support
2. **Upload the SQL file** to your hosting MySQL database
3. **Update `.env.local`** with your hosting database credentials
4. **Deploy the Next.js app** (Vercel, Netlify, or your hosting provider)

## 🔧 Troubleshooting

**If setup-database.bat fails:**
- Make sure XAMPP MySQL is running (green in control panel)
- Try running XAMPP as Administrator
- Check that the SQL file exists in "MAIN DATABASE" folder

**If the app won't connect:**
- Verify MySQL is running in XAMPP
- Check that database was created successfully
- Restart the Next.js dev server

## 📞 Need Help?

The setup script will show detailed error messages if anything goes wrong. Most issues are solved by:
1. Making sure XAMPP MySQL is running
2. Running XAMPP as Administrator
3. Restarting the services



