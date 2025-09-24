# HTML Entity Fix Implementation Plan

## 🎯 **Project Overview**

This document outlines the comprehensive plan to fix HTML entity encoding issues throughout the PostgreSQL database. Based on extensive analysis, we've identified widespread HTML entity problems affecting user-facing content across multiple tables.

## 📊 **Problem Analysis**

### **Common HTML Entities Found**
- `&#039;` → `'` (apostrophe) - **Most common**
- `&amp;` → `&` (ampersand) - **Very common**
- `&eacute;` → `é` (e with acute accent)
- `&trade;` → `™` (trademark symbol)
- `&rsquo;` → `'` (right single quote)
- `&quot;` → `"` (double quote)
- `&ccedil;` → `ç` (c with cedilla)
- `&pound;` → `£` (pound sterling)
- `&#8217;` → `'` (right single quotation mark)
- `&#8216;` → `'` (left single quotation mark)
- `&#8220;` → `"` (left double quotation mark)
- `&#8221;` → `"` (right double quotation mark)

### **Examples from Database**
- `"Elisa&#039;s Studio"` → `"Elisa's Studio"`
- `"Matin&eacute;e Multilingual"` → `"Matinée Multilingual"`
- `"THE ARABIC VOICE&trade;"` → `"THE ARABIC VOICE™"`
- `"Jack &amp; Jones, Lidl"` → `"Jack & Jones, Lidl"`
- `"MPazVald&eacute;s"` → `"MPazValdés"`

## 🗂️ **Affected Tables and Fields**

### **High Priority (User-facing content)**
| Table | Field | Impact | Examples |
|-------|-------|--------|----------|
| `users` | `display_name` | High | User display names with apostrophes |
| `users` | `username` | Medium | Usernames (less common) |
| `user_profiles` | `first_name` | High | Names with accents and apostrophes |
| `user_profiles` | `last_name` | High | Surnames with special characters |
| `user_profiles` | `about` | High | Biography text with quotes and entities |
| `user_profiles` | `short_about` | Medium | Short descriptions |
| `user_profiles` | `location` | Medium | Location names with accents |

### **Medium Priority (Business content)**
| Table | Field | Impact | Examples |
|-------|-------|--------|----------|
| `studios` | `name` | High | Studio names with apostrophes and symbols |
| `studios` | `description` | High | Studio descriptions with various entities |
| `studios` | `address` | Medium | Addresses with special characters |

## 🚀 **Implementation Phases**

### **Phase 1: Preparation ✅**
- [x] Create database backup scripts
- [x] Test database connectivity
- [x] Analyze HTML entity patterns
- [x] Create comprehensive mapping functions

### **Phase 2: Core Fixes ✅**
- [x] Develop HTML entity mapping system
- [x] Create SQL update scripts
- [x] Build verification queries
- [x] Prepare rollback procedures

### **Phase 3: Execution (Ready to Deploy)**
- [ ] **BACKUP DATABASE** (Critical - do this first!)
- [ ] Execute SQL fixes for high-priority tables
- [ ] Execute SQL fixes for medium-priority tables
- [ ] Run verification queries
- [ ] Test sample records

### **Phase 4: Verification**
- [ ] Verify all HTML entities are decoded
- [ ] Check data integrity
- [ ] Test frontend display
- [ ] Monitor for any issues

## 📋 **Execution Instructions**

### **Step 1: Create Database Backup**
```bash
# Using pg_dump (recommended)
pg_dump -h ep-plain-glitter-abljx7c3-pooler.eu-west-2.aws.neon.tech \
        -U neondb_owner \
        -d neondb \
        --no-password \
        > backup_before_html_entity_fix_$(date +%Y%m%d_%H%M%S).sql

# Or use your preferred database backup method
```

### **Step 2: Execute SQL Fixes**
```sql
-- Connect to your PostgreSQL database
-- Run the contents of: scripts/database/sql-fix-html-entities.sql

-- The script includes:
-- 1. High-priority table fixes (users, user_profiles)
-- 2. Medium-priority table fixes (studios)
-- 3. Verification queries
-- 4. Completion summary
```

### **Step 3: Verify Results**
The SQL script includes verification queries that will show:
- Count of remaining HTML entities per table/field
- Summary of fixes applied
- Completion timestamp

## 🛠️ **Available Tools**

### **Scripts Created**
1. **`backup-database.js`** - Creates JSON backups of key tables
2. **`test-connection.js`** - Tests database connectivity
3. **`html-entity-mapping.js`** - Core mapping and decoding functions
4. **`fix-high-priority-tables.js`** - Prisma-based fixes (alternative approach)
5. **`sql-fix-html-entities.sql`** - **Main SQL script for execution**

### **Recommended Approach**
Use the **SQL script** (`sql-fix-html-entities.sql`) as it:
- Works directly with the database
- Handles all entity types comprehensively
- Includes verification queries
- Is database-agnostic (works with any PostgreSQL client)
- Avoids Node.js/Prisma connection issues

## ⚠️ **Safety Measures**

### **Before Execution**
1. **MANDATORY**: Create a full database backup
2. Test the script on a small subset first (add LIMIT clauses)
3. Review the verification queries
4. Ensure you have database admin access

### **During Execution**
1. Monitor query execution times
2. Check for any error messages
3. Verify row counts match expectations

### **After Execution**
1. Run all verification queries
2. Test frontend functionality
3. Check sample records manually
4. Monitor for any user reports

## 📈 **Expected Results**

### **Performance Impact**
- **Minimal**: Updates only affect records with HTML entities
- **Efficient**: Uses indexed LIKE queries with WHERE clauses
- **Safe**: No data loss, only character decoding

### **User Experience Impact**
- **Immediate**: All HTML entities will display as proper characters
- **Positive**: Names, descriptions, and content will look professional
- **Seamless**: No functional changes, only visual improvements

## 🔄 **Rollback Plan**

If issues occur, you can:
1. **Restore from backup** (full rollback)
2. **Reverse specific changes** using the backup data
3. **Re-run with modifications** if needed

## ✅ **Success Criteria**

The fix is successful when:
- [ ] All verification queries return 0 remaining entities
- [ ] Sample records display correctly in the frontend
- [ ] No user complaints about garbled text
- [ ] Database performance remains normal

## 📞 **Support**

If you encounter issues:
1. Check the verification query results
2. Review the database logs for errors
3. Test a few sample records manually
4. Consider running the script in smaller batches

---

**Ready to execute!** The comprehensive SQL script is prepared and tested. Just create your backup and run the SQL file.
