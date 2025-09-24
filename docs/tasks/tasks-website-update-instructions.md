## Relevant Files

- `app/lib/database.js` - Main database client that needs to be updated to use new Turso schema with proper SQL queries for users, profile, contacts, poi, and faq tables.
- `app/api/vosf/dashboard/route.js` - Dashboard API route that needs updated queries for new table structure.
- `app/api/vosf/analytics/route.js` - Analytics API route requiring new calculations based on updated schema.
- `app/api/vosf/studios/route.js` - Studios API route needing users+profile join logic and stub user exclusion.
- `app/api/vosf/studios/[id]/route.js` - Individual studio API route for detailed profile data.
- `app/api/vosf/network/route.js` - Network API route to use contacts table instead of shows_contacts.
- `app/api/vosf/venues/route.js` - Venues API route to use poi table with lat/lon coordinates.
- `app/api/vosf/faq/route.js` - FAQ API route to use faq table with sort_order.
- `app/api/admin/studios/route.js` - Admin studios management API with CRUD operations for new schema.
- `app/api/admin/studios/[id]/route.js` - Individual studio admin API for profile management.
- `app/api/admin/contacts/route.js` - New admin API for managing contacts/connections.
- `app/api/admin/venues/route.js` - New admin API for managing venues/POI.
- `app/api/admin/faq/route.js` - New admin API for managing FAQ entries.
- `app/components/VOSFDashboard.js` - Dashboard component that displays stats from new data structure.
- `app/components/AnalyticsDashboard.js` - Analytics component showing comprehensive metrics.
- `app/components/StudioDirectory.js` - Studios listing component using new user+profile data.
- `app/components/StudioNetwork.js` - Network component displaying contacts data.
- `app/components/VenueBrowser.js` - Venues component using poi table data.
- `app/components/FAQBrowser.js` - FAQ component with sort_order functionality.
- `app/components/AdminStudioManager.js` - Enhanced admin interface for studio management.
- `app/components/AdminContactsManager.js` - New admin component for managing contacts.
- `app/components/AdminVenuesManager.js` - New admin component for managing venues.
- `app/components/AdminFAQManager.js` - New admin component for managing FAQ.
- `README.md` - Updated documentation explaining new environment variables and Turso setup.

### Notes

- The migration involves changing from old MySQL schema (shows_users, shows_contacts, poi_example, faq_signuser) to new Turso schema (users, profile, contacts, poi, faq).
- All queries must exclude users with status='stub' from public-facing lists.
- New schema uses proper foreign key relationships between users and profile tables.
- Environment variables TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.

## Tasks

- [x] 1.0 Update Database Layer and Core Utilities
  - [x] 1.1 Update database.js with new Turso schema utility functions (studiosCountSql, recentConnectionsSql, analyticsSql)
  - [x] 1.2 Add getDashboardStats() function using new table structure
  - [x] 1.3 Add getRecentConnections() function reading from contacts table
  - [x] 1.4 Add listStudios() function with users+profile join and stub exclusion
  - [x] 1.5 Add utility functions for venues (poi table) and FAQ (faq table with sort_order)
  - [x] 1.6 Update existing query functions to use new schema (users, profile, contacts, poi, faq)

- [x] 2.0 Migrate API Routes to New Schema
  - [x] 2.1 Update /api/vosf/dashboard/route.js to use new getDashboardStats() and getRecentConnections()
  - [x] 2.2 Update /api/vosf/analytics/route.js with new analytics calculations and user timeline queries
  - [x] 2.3 Update /api/vosf/studios/route.js to use listStudios() with proper filtering and stub exclusion
  - [x] 2.4 Update /api/vosf/studios/[id]/route.js for individual studio profiles using users+profile join
  - [x] 2.5 Update /api/vosf/network/route.js to read from contacts table with proper ordering
  - [x] 2.6 Update /api/vosf/venues/route.js to use poi table with lat/lon coordinate handling
  - [x] 2.7 Update /api/vosf/faq/route.js to use faq table with sort_order and proper ordering

- [x] 3.0 Add Comprehensive CRUD Operations
  - [x] 3.1 Create /api/admin/contacts/route.js for managing connections/partnerships
  - [x] 3.2 Create /api/admin/contacts/[id]/route.js for individual contact management
  - [x] 3.3 Create /api/admin/venues/route.js for managing POI/venues with coordinate validation
  - [x] 3.4 Create /api/admin/venues/[id]/route.js for individual venue management
  - [x] 3.5 Create /api/admin/faq/route.js for managing FAQ entries with sort_order
  - [x] 3.6 Create /api/admin/faq/[id]/route.js for individual FAQ management
  - [x] 3.7 Update /api/admin/studios/route.js to work with new users+profile schema
  - [x] 3.8 Update /api/admin/studios/[id]/route.js for comprehensive profile management
  - [x] 3.9 Add bulk operations support for all data types

- [x] 4.0 Update Frontend Components
  - [x] 4.1 Update VOSFDashboard.js to display stats from new data structure
  - [x] 4.2 Update AnalyticsDashboard.js with new metrics and timeline widgets
  - [x] 4.3 Update StudioDirectory.js to use new studio data format and filtering
  - [x] 4.4 Update StudioNetwork.js to display contacts data with proper status badges
  - [x] 4.5 Update VenueBrowser.js to use poi data with coordinate mapping
  - [x] 4.6 Update FAQBrowser.js to use faq data with sort_order functionality
  - [x] 4.7 Update EnhancedStudioProfile.js for new profile data structure
  - [x] 4.8 Update StudioProfileCard.js to display comprehensive profile information

- [x] 5.0 Enhance Admin Management Interface
  - [x] 5.1 Create AdminContactsManager.js component for managing connections
  - [x] 5.2 Create AdminVenuesManager.js component for managing venues/POI
  - [x] 5.3 Create AdminFAQManager.js component for managing FAQ entries
  - [x] 5.4 Update AdminStudioManager.js to work with new profile structure
  - [x] 5.5 Add admin pages for contacts (/dashboard/admin/contacts)
  - [x] 5.6 Add admin pages for venues (/dashboard/admin/venues)
  - [x] 5.7 Add admin pages for FAQ (/dashboard/admin/faq)
  - [x] 5.8 Update navigation to include all admin management sections
  - [x] 5.9 Add data validation and error handling across all admin interfaces
  - [x] 5.10 Create README.md with updated environment variables and setup instructions
