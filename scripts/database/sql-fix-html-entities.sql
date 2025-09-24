-- HTML Entity Fix Script for PostgreSQL Database
-- This script fixes HTML entities across all affected tables and fields
-- Based on comprehensive analysis of the database content

-- =============================================================================
-- BACKUP REMINDER
-- =============================================================================
-- IMPORTANT: Make sure you have a database backup before running this script!
-- You can create a backup using pg_dump or your database management tool.

-- =============================================================================
-- PHASE 1: HIGH PRIORITY TABLES (User-facing content)
-- =============================================================================

-- Fix HTML entities in users.display_name
UPDATE users 
SET display_name = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(display_name, '&#039;', ''''),
                    '&apos;', ''''),
                  '&rsquo;', '''),
                '&lsquo;', '''),
              '&quot;', '"'),
            '&amp;', '&'),
          '&eacute;', 'é'),
        '&trade;', '™'),
      '&pound;', '£'),
    '&nbsp;', ' ')
WHERE display_name LIKE '%&#039;%' 
   OR display_name LIKE '%&apos;%'
   OR display_name LIKE '%&rsquo;%'
   OR display_name LIKE '%&lsquo;%'
   OR display_name LIKE '%&quot;%'
   OR display_name LIKE '%&amp;%'
   OR display_name LIKE '%&eacute;%'
   OR display_name LIKE '%&trade;%'
   OR display_name LIKE '%&pound;%'
   OR display_name LIKE '%&nbsp;%';

-- Fix HTML entities in users.username (if any)
UPDATE users 
SET username = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(username, '&#039;', ''''),
                    '&apos;', ''''),
                  '&rsquo;', '''),
                '&lsquo;', '''),
              '&quot;', '"'),
            '&amp;', '&'),
          '&eacute;', 'é'),
        '&trade;', '™'),
      '&pound;', '£'),
    '&nbsp;', ' ')
WHERE username LIKE '%&#039;%' 
   OR username LIKE '%&apos;%'
   OR username LIKE '%&rsquo;%'
   OR username LIKE '%&lsquo;%'
   OR username LIKE '%&quot;%'
   OR username LIKE '%&amp;%'
   OR username LIKE '%&eacute;%'
   OR username LIKE '%&trade;%'
   OR username LIKE '%&pound;%'
   OR username LIKE '%&nbsp;%';

-- Fix HTML entities in user_profiles.first_name
UPDATE user_profiles 
SET first_name = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(first_name, '&#039;', ''''),
                        '&apos;', ''''),
                      '&rsquo;', '''),
                    '&lsquo;', '''),
                  '&quot;', '"'),
                '&amp;', '&'),
              '&eacute;', 'é'),
            '&egrave;', 'è'),
          '&aacute;', 'á'),
        '&ccedil;', 'ç'),
      '&trade;', '™'),
    '&pound;', '£')
WHERE first_name LIKE '%&#039;%' 
   OR first_name LIKE '%&apos;%'
   OR first_name LIKE '%&rsquo;%'
   OR first_name LIKE '%&lsquo;%'
   OR first_name LIKE '%&quot;%'
   OR first_name LIKE '%&amp;%'
   OR first_name LIKE '%&eacute;%'
   OR first_name LIKE '%&egrave;%'
   OR first_name LIKE '%&aacute;%'
   OR first_name LIKE '%&ccedil;%'
   OR first_name LIKE '%&trade;%'
   OR first_name LIKE '%&pound;%';

-- Fix HTML entities in user_profiles.last_name
UPDATE user_profiles 
SET last_name = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(last_name, '&#039;', ''''),
                        '&apos;', ''''),
                      '&rsquo;', '''),
                    '&lsquo;', '''),
                  '&quot;', '"'),
                '&amp;', '&'),
              '&eacute;', 'é'),
            '&egrave;', 'è'),
          '&aacute;', 'á'),
        '&ccedil;', 'ç'),
      '&trade;', '™'),
    '&pound;', '£')
WHERE last_name LIKE '%&#039;%' 
   OR last_name LIKE '%&apos;%'
   OR last_name LIKE '%&rsquo;%'
   OR last_name LIKE '%&lsquo;%'
   OR last_name LIKE '%&quot;%'
   OR last_name LIKE '%&amp;%'
   OR last_name LIKE '%&eacute;%'
   OR last_name LIKE '%&egrave;%'
   OR last_name LIKE '%&aacute;%'
   OR last_name LIKE '%&ccedil;%'
   OR last_name LIKE '%&trade;%'
   OR last_name LIKE '%&pound;%';

-- Fix HTML entities in user_profiles.about (comprehensive fix for longer text)
UPDATE user_profiles 
SET about = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(
                          REPLACE(
                            REPLACE(
                              REPLACE(
                                REPLACE(
                                  REPLACE(
                                    REPLACE(about, '&#039;', ''''),
                                    '&apos;', ''''),
                                  '&rsquo;', '''),
                                '&lsquo;', '''),
                              '&quot;', '"'),
                            '&ldquo;', '"'),
                          '&rdquo;', '"'),
                        '&amp;', '&'),
                      '&eacute;', 'é'),
                    '&egrave;', 'è'),
                  '&aacute;', 'á'),
                '&ccedil;', 'ç'),
              '&trade;', '™'),
            '&pound;', '£'),
          '&nbsp;', ' '),
        '&#8217;', '''),
      '&#8216;', '''),
    '&#8220;', '"'),
  '&#8221;', '"')
WHERE about IS NOT NULL 
  AND (about LIKE '%&#039;%' 
    OR about LIKE '%&apos;%'
    OR about LIKE '%&rsquo;%'
    OR about LIKE '%&lsquo;%'
    OR about LIKE '%&quot;%'
    OR about LIKE '%&ldquo;%'
    OR about LIKE '%&rdquo;%'
    OR about LIKE '%&amp;%'
    OR about LIKE '%&eacute;%'
    OR about LIKE '%&egrave;%'
    OR about LIKE '%&aacute;%'
    OR about LIKE '%&ccedil;%'
    OR about LIKE '%&trade;%'
    OR about LIKE '%&pound;%'
    OR about LIKE '%&nbsp;%'
    OR about LIKE '%&#8217;%'
    OR about LIKE '%&#8216;%'
    OR about LIKE '%&#8220;%'
    OR about LIKE '%&#8221;%');

-- Fix HTML entities in user_profiles.short_about
UPDATE user_profiles 
SET short_about = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(short_about, '&#039;', ''''),
                        '&apos;', ''''),
                      '&rsquo;', '''),
                    '&lsquo;', '''),
                  '&quot;', '"'),
                '&amp;', '&'),
              '&eacute;', 'é'),
            '&egrave;', 'è'),
          '&aacute;', 'á'),
        '&ccedil;', 'ç'),
      '&trade;', '™'),
    '&pound;', '£')
WHERE short_about IS NOT NULL 
  AND (short_about LIKE '%&#039;%' 
    OR short_about LIKE '%&apos;%'
    OR short_about LIKE '%&rsquo;%'
    OR short_about LIKE '%&lsquo;%'
    OR short_about LIKE '%&quot;%'
    OR short_about LIKE '%&amp;%'
    OR short_about LIKE '%&eacute;%'
    OR short_about LIKE '%&egrave;%'
    OR short_about LIKE '%&aacute;%'
    OR short_about LIKE '%&ccedil;%'
    OR short_about LIKE '%&trade;%'
    OR short_about LIKE '%&pound;%');

-- Fix HTML entities in user_profiles.location
UPDATE user_profiles 
SET location = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(location, '&#039;', ''''),
                    '&apos;', ''''),
                  '&rsquo;', '''),
                '&lsquo;', '''),
              '&quot;', '"'),
            '&amp;', '&'),
          '&eacute;', 'é'),
        '&egrave;', 'è'),
      '&aacute;', 'á'),
    '&ccedil;', 'ç')
WHERE location IS NOT NULL 
  AND (location LIKE '%&#039;%' 
    OR location LIKE '%&apos;%'
    OR location LIKE '%&rsquo;%'
    OR location LIKE '%&lsquo;%'
    OR location LIKE '%&quot;%'
    OR location LIKE '%&amp;%'
    OR location LIKE '%&eacute;%'
    OR location LIKE '%&egrave;%'
    OR location LIKE '%&aacute;%'
    OR location LIKE '%&ccedil;%');

-- =============================================================================
-- PHASE 2: MEDIUM PRIORITY TABLES (Studio and service content)
-- =============================================================================

-- Fix HTML entities in studios.name
UPDATE studios 
SET name = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(name, '&#039;', ''''),
                    '&apos;', ''''),
                  '&rsquo;', '''),
                '&lsquo;', '''),
              '&quot;', '"'),
            '&amp;', '&'),
          '&eacute;', 'é'),
        '&trade;', '™'),
      '&pound;', '£'),
    '&nbsp;', ' ')
WHERE name IS NOT NULL 
  AND (name LIKE '%&#039;%' 
    OR name LIKE '%&apos;%'
    OR name LIKE '%&rsquo;%'
    OR name LIKE '%&lsquo;%'
    OR name LIKE '%&quot;%'
    OR name LIKE '%&amp;%'
    OR name LIKE '%&eacute;%'
    OR name LIKE '%&trade;%'
    OR name LIKE '%&pound;%'
    OR name LIKE '%&nbsp;%');

-- Fix HTML entities in studios.description
UPDATE studios 
SET description = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(
                          REPLACE(
                            REPLACE(
                              REPLACE(
                                REPLACE(
                                  REPLACE(
                                    REPLACE(description, '&#039;', ''''),
                                    '&apos;', ''''),
                                  '&rsquo;', '''),
                                '&lsquo;', '''),
                              '&quot;', '"'),
                            '&ldquo;', '"'),
                          '&rdquo;', '"'),
                        '&amp;', '&'),
                      '&eacute;', 'é'),
                    '&egrave;', 'è'),
                  '&aacute;', 'á'),
                '&ccedil;', 'ç'),
              '&trade;', '™'),
            '&pound;', '£'),
          '&nbsp;', ' '),
        '&#8217;', '''),
      '&#8216;', '''),
    '&#8220;', '"'),
  '&#8221;', '"')
WHERE description IS NOT NULL 
  AND (description LIKE '%&#039;%' 
    OR description LIKE '%&apos;%'
    OR description LIKE '%&rsquo;%'
    OR description LIKE '%&lsquo;%'
    OR description LIKE '%&quot;%'
    OR description LIKE '%&ldquo;%'
    OR description LIKE '%&rdquo;%'
    OR description LIKE '%&amp;%'
    OR description LIKE '%&eacute;%'
    OR description LIKE '%&egrave;%'
    OR description LIKE '%&aacute;%'
    OR description LIKE '%&ccedil;%'
    OR description LIKE '%&trade;%'
    OR description LIKE '%&pound;%'
    OR description LIKE '%&nbsp;%'
    OR description LIKE '%&#8217;%'
    OR description LIKE '%&#8216;%'
    OR description LIKE '%&#8220;%'
    OR description LIKE '%&#8221;%');

-- Fix HTML entities in studios.address
UPDATE studios 
SET address = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(address, '&#039;', ''''),
                    '&apos;', ''''),
                  '&rsquo;', '''),
                '&lsquo;', '''),
              '&quot;', '"'),
            '&amp;', '&'),
          '&eacute;', 'é'),
        '&egrave;', 'è'),
      '&aacute;', 'á'),
    '&ccedil;', 'ç')
WHERE address IS NOT NULL 
  AND (address LIKE '%&#039;%' 
    OR address LIKE '%&apos;%'
    OR address LIKE '%&rsquo;%'
    OR address LIKE '%&lsquo;%'
    OR address LIKE '%&quot;%'
    OR address LIKE '%&amp;%'
    OR address LIKE '%&eacute;%'
    OR address LIKE '%&egrave;%'
    OR address LIKE '%&aacute;%'
    OR address LIKE '%&ccedil;%');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Count remaining HTML entities after fixes
SELECT 'users.display_name' as table_field, COUNT(*) as remaining_entities
FROM users 
WHERE display_name LIKE '%&#039;%' 
   OR display_name LIKE '%&amp;%'
   OR display_name LIKE '%&eacute;%'
   OR display_name LIKE '%&trade;%'
   OR display_name LIKE '%&rsquo;%'

UNION ALL

SELECT 'user_profiles.first_name' as table_field, COUNT(*) as remaining_entities
FROM user_profiles 
WHERE first_name LIKE '%&#039;%' 
   OR first_name LIKE '%&amp;%'
   OR first_name LIKE '%&eacute;%'
   OR first_name LIKE '%&trade;%'
   OR first_name LIKE '%&rsquo;%'

UNION ALL

SELECT 'user_profiles.about' as table_field, COUNT(*) as remaining_entities
FROM user_profiles 
WHERE about LIKE '%&#039;%' 
   OR about LIKE '%&amp;%'
   OR about LIKE '%&eacute;%'
   OR about LIKE '%&trade;%'
   OR about LIKE '%&rsquo;%'

UNION ALL

SELECT 'studios.name' as table_field, COUNT(*) as remaining_entities
FROM studios 
WHERE name LIKE '%&#039;%' 
   OR name LIKE '%&amp;%'
   OR name LIKE '%&eacute;%'
   OR name LIKE '%&trade;%'
   OR name LIKE '%&rsquo;%'

UNION ALL

SELECT 'studios.description' as table_field, COUNT(*) as remaining_entities
FROM studios 
WHERE description LIKE '%&#039;%' 
   OR description LIKE '%&amp;%'
   OR description LIKE '%&eacute;%'
   OR description LIKE '%&trade;%'
   OR description LIKE '%&rsquo;%'

ORDER BY table_field;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- This will show a summary of the fixes applied
SELECT 
  'HTML Entity Fix Complete' as status,
  NOW() as completed_at,
  'All major HTML entities have been decoded across users, user_profiles, and studios tables' as summary;
