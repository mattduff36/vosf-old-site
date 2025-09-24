# 🚀 Production Deployment Checklist

## 🚨 **URGENT: Production Site Errors**

The production site `https://vosf-old-data.mpdee.co.uk` is experiencing 500 errors because:
- Database schema was changed (first_name → studio_name)
- Production code still references the old first_name field
- This causes database errors when the API tries to query non-existent columns

## ✅ **Deployment Steps Required:**

### 1. **Deploy Updated Code**
```bash
# On production server, pull latest changes
git pull origin main

# Verify you have the latest commit with schema fixes
git log --oneline -5
# Should show: "Sync frontend with database schema changes from other project"
```

### 2. **Update Dependencies & Regenerate Prisma**
```bash
# Install any new dependencies
npm install

# Regenerate Prisma client with new schema
npx prisma generate

# Verify Prisma client is updated
npx prisma validate
```

### 3. **Restart Production Application**
```bash
# If using PM2
pm2 restart all

# If using systemd
sudo systemctl restart your-app-service

# If using Docker
docker-compose restart

# If using manual process
# Kill existing process and restart
```

### 4. **Verify Deployment**
After deployment, test these endpoints:
- `GET /api/admin/stats` - Should return statistics without errors
- `GET /api/admin/studios` - Should return studio list without errors
- Admin dashboard should load without 500 errors

### 5. **Monitor Logs**
```bash
# Check application logs for any remaining errors
tail -f /path/to/your/app/logs
# or
pm2 logs
```

## 🔧 **What Was Fixed:**

- ✅ Updated Prisma schema: `firstName` → `studioName`
- ✅ Fixed all database queries to use `studio_name` instead of `first_name`
- ✅ Added fallback logic: `profile.studioName || studio.name`
- ✅ Updated API responses to handle new schema
- ✅ Maintained backward compatibility where possible

## 📊 **Current Database State:**

- `user_profiles.first_name` - ❌ **REMOVED**
- `user_profiles.studio_name` - ✅ **ADDED** (currently all NULL)
- `studios.name` - ✅ **EXISTS** (contains actual studio names)

## ⚠️ **Important Notes:**

1. **Data Migration**: The `studio_name` field is currently empty. The other project needs to populate this field with their migration logic.

2. **Fallback Logic**: Our code uses `profile.studioName || studio.name` so it will work even with NULL studio_name values.

3. **No Data Loss**: All studio names are preserved in `studios.name` field.

## 🆘 **If Deployment Fails:**

If you encounter issues during deployment, you can temporarily revert:

```bash
# Revert to previous commit (before schema changes)
git revert HEAD~1

# Regenerate old Prisma client
npx prisma generate

# Restart application
pm2 restart all
```

Then contact the other project team to coordinate the schema changes properly.

## 📞 **Next Steps After Deployment:**

1. Verify production site works without errors
2. Coordinate with other project to populate `studio_name` field
3. Test admin interface functionality
4. Monitor for any remaining issues

---

**Status**: 🔴 **CRITICAL** - Production site down due to schema mismatch
**Priority**: 🚨 **IMMEDIATE** - Deploy ASAP to restore functionality
