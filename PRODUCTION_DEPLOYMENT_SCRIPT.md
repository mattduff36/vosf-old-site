# 🚀 Production Deployment Script

## Issue Diagnosis
The production site (`vosf-old-data.mpdee.co.uk`) is experiencing 500 errors because it's running old code that references the removed `user_profiles.first_name` field, even though it shares the same database as the development environment.

## Required Actions

### 1. SSH into Production Server
```bash
ssh your-username@your-production-server
cd /path/to/your/production/site
```

### 2. Pull Latest Changes
```bash
# Pull the latest code from GitHub
git pull origin main

# Verify you have the latest commits
git log --oneline -3
# Should show:
# 32f3f4a Update README with comprehensive project documentation
# 88f5648 Sync frontend with database schema changes from other project
# 55fc84f Fix HTML entities in studio names after migration
```

### 3. Install Dependencies (if needed)
```bash
npm install
```

### 4. Regenerate Prisma Client
```bash
# This is CRITICAL - the production Prisma client needs to be regenerated
# to match the updated schema (without first_name field)
npx prisma generate
```

### 5. Build the Application
```bash
npm run build
```

### 6. Restart the Application
Depending on your deployment setup:

**If using PM2:**
```bash
pm2 restart your-app-name
# or
pm2 restart all
```

**If using systemd:**
```bash
sudo systemctl restart your-app-service
```

**If using Docker:**
```bash
docker-compose down
docker-compose up -d --build
```

**If using a simple Node.js process:**
```bash
# Kill the existing process
pkill -f "node"
# Start the new process
npm start &
```

### 7. Verify Deployment
```bash
# Check if the application is running
curl -I https://vosf-old-data.mpdee.co.uk/api/admin/stats

# Should return 200 OK instead of 500
```

## Key Changes in Latest Commits

1. **Schema Synchronization (88f5648)**: Updated all database queries to use `studio_name` instead of `first_name`
2. **HTML Entity Fixes (55fc84f)**: Fixed HTML entities in studio names
3. **Field Cleanup (ab6708f)**: Removed references to the deleted `first_name` field
4. **Studio Name Migration (5cd6bac)**: Migrated data from `first_name` to `studios.name`

## Environment Variables Check
Ensure these are set in production:
```env
DATABASE_URL=postgresql://neondb_owner:npg_XOFJ21kRlhpT@ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
AUTH_USERNAME=admin
AUTH_PASSWORD=your-secure-password
NODE_ENV=production
```

## Troubleshooting

### If you still get 500 errors after deployment:

1. **Check application logs:**
   ```bash
   # PM2 logs
   pm2 logs
   
   # Or check your application's log file
   tail -f /path/to/your/app/logs/error.log
   ```

2. **Verify Prisma client was regenerated:**
   ```bash
   ls -la node_modules/.prisma/client/
   # Should show recent timestamps
   ```

3. **Test database connection:**
   ```bash
   node -e "
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   prisma.studio.count().then(count => {
     console.log('Studios count:', count);
     process.exit(0);
   }).catch(err => {
     console.error('Database error:', err);
     process.exit(1);
   });
   "
   ```

4. **Check if the build was successful:**
   ```bash
   ls -la .next/
   # Should show recent build files
   ```

## Expected Result
After successful deployment:
- ✅ `/api/admin/stats` should return 200 OK
- ✅ `/api/admin/studios` should return studio data
- ✅ Admin interface should load without errors
- ✅ Studio editing should work correctly

## Contact
If you encounter issues during deployment, check the application logs and verify each step was completed successfully.
