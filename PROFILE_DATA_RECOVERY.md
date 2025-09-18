# Profile Data Recovery

## Issue Description

During the migration from the old WordPress-based system to the new Next.js application with Turso database, multi-line profile data (particularly the "about" sections) was truncated. This resulted in incomplete profile information being displayed on the live site.

### Example: Frank's Profile

**Live site shows:**
```
"I'm equipped with a professional studio in my home that includes:"
```

**Should show:**
```
"I'm equipped with a professional studio in my home that includes:
SE 2000 Series Whisper room
Rode NT1A microphone (along with others)
Samson SR950 Headphones
Behringer Q802USB mixing board
M-Audio AV 40 Studio Monitors
Recording Software includes: Audacity, Presonus Studio One"
```

## Root Cause Analysis

1. **Data Source**: The complete profile data exists in `old-data/usermeta_extracted.csv`
2. **Migration Issue**: The original migration scripts only imported the first line of multi-line "about" fields
3. **Data Structure**: In the old system, profile data was stored in a `usermeta` table with key-value pairs
4. **Current Structure**: The new system uses a `profile` table with dedicated columns

## Data Location

The complete profile data is found in:
- `old-data/usermeta_extracted.csv` - Main source of profile metadata
- `old-data/users.csv` - User ID to username mapping
- `old-data/cl59-theshows2.sql` - Original database dump

### Frank's Data in usermeta_extracted.csv (lines 10948-10954):
```csv
"30275","2004","about","I&#039;m equipped with a professional studio in my home that includes:
SE 2000 Series Whisper room
Rode NT1A microphone (along with others)
Samson SR950 Headphones
Behringer Q802USB mixing board
M-Audio AV 40 Studio Monitors
Recording Software includes: Audacity, Presonus Studio One"
```

## Solution

### Files Created:

1. **`verify-profile-data.js`** - Diagnostic script to compare original vs current data
2. **`fix-missing-profile-data.js`** - Migration script to restore complete profile data
3. **`fix-profiles.bat`** - Batch script to run the complete recovery process

### Recovery Process:

1. **Verification**: Check current profile data and identify truncated fields
2. **Data Loading**: Parse the original usermeta CSV files with proper multi-line handling
3. **Migration**: Update the Turso database with complete profile information
4. **Validation**: Verify that the data has been correctly restored

### Key Technical Solutions:

1. **CSV Parsing**: Proper handling of quoted multi-line fields in CSV data
2. **HTML Entity Decoding**: Convert `&#039;` to `'` and other HTML entities
3. **Field Mapping**: Map old usermeta keys to new profile table columns
4. **Batch Updates**: Efficient database updates with proper error handling

## Usage

### Quick Fix:
```bash
# Run the complete recovery process
fix-profiles.bat
```

### Manual Steps:
```bash
# 1. Verify current state
node verify-profile-data.js

# 2. Run the migration
node fix-missing-profile-data.js

# 3. Verify the fix
node verify-profile-data.js
```

## Environment Requirements

- Node.js with ES modules support
- Access to Turso database (TURSO_DATABASE_URL and TURSO_AUTH_TOKEN)
- Original data files in `old-data/` directory

## Expected Results

After running the recovery scripts:

1. **Frank's Profile**: Complete "about" section with all equipment details
2. **All Profiles**: Restored multi-line descriptions, social media links, and contact information
3. **Data Integrity**: No data loss, only additions of previously truncated content

## Verification

The scripts will output:
- Character count comparisons
- Line-by-line differences
- Success/failure statistics
- Before/after samples

## Impact

This fix will restore the complete profile information for all users, making the new site match the functionality and content richness of the original live site.

## Future Prevention

To prevent similar issues in future migrations:
1. Always verify multi-line field handling in CSV parsers
2. Compare character counts and line counts before/after migration
3. Test with known complex profiles (like Frank's) during development
4. Implement data validation checks in migration scripts
