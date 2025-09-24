# VOSF Database Management Portal

A comprehensive Next.js application for managing the Voice Over Studio Finder (VOSF) database with full CRUD operations for studios, users, and administrative functions. Features advanced studio profile editing, bulk operations, and seamless database synchronization.

## 🚀 Features

- **Advanced Studio Management**: Complete profile management with modal editing interface
- **User Profile System**: Comprehensive user data with studio associations
- **Bulk Operations**: Efficient management of multiple records with confirmation dialogs
- **HTML Entity Cleanup**: Automated detection and fixing of HTML entities in text fields
- **Database Synchronization**: Real-time schema compatibility with multiple projects
- **Analytics Dashboard**: Comprehensive insights and statistics with live data
- **Admin Interface**: Full CRUD operations with advanced filtering and search
- **Modern UI**: Responsive design with Tailwind CSS and smooth animations

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL Database (Neon/Supabase compatible)
- Prisma CLI

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vosf-old-site
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create your environment file:
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your configuration:
   ```env
   # PostgreSQL Database Configuration (Required)
   DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

   # Authentication (Required)
   AUTH_USERNAME=admin
   AUTH_PASSWORD=your-secure-password
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Apply database migrations (if needed)
   npx prisma db push
   ```

## 🗄️ Database Schema

The application uses a PostgreSQL database with Prisma ORM. Key tables include:

### Core Tables
- **users**: User accounts (id, username, display_name, email, role, created_at)
- **user_profiles**: Extended profile data (user_id, studio_name, last_name, location, phone, about, social_urls, rates)
- **studios**: Studio information (id, owner_id, name, description, address, coordinates, verification)
- **studio_images**: Studio gallery images with sorting
- **reviews**: Studio reviews and ratings system
- **faq**: Frequently asked questions with sort ordering

### Recent Schema Updates
- ✅ **Migrated from first_name to studio_name**: Updated user_profiles schema for better studio name management
- ✅ **HTML Entity Cleanup**: Removed HTML entities from all text fields (é, í, ñ, ®, etc.)
- ✅ **Studio Name Synchronization**: Unified studio naming across studios.name and user_profiles.studio_name
- ✅ **Multi-Project Compatibility**: Schema synchronized with other VOSF projects

### Key Features
- Prisma ORM with type-safe database operations
- Foreign key relationships with cascade deletes
- Coordinate validation for studio locations
- Image management with sort ordering
- Review system with moderation
- Real-time schema synchronization

## 🚀 Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the application**
   - Main application: http://localhost:3000
   - Login with your configured credentials

## 📱 Usage

### Public Features
- **Dashboard**: Overview statistics and recent activity
- **Studios**: Browse studio directory with advanced search and filtering
- **Network**: View studio connections and partnerships
- **Venues**: Explore recording locations with coordinate mapping
- **FAQ**: Browse knowledge base entries with search
- **Analytics**: Detailed insights and real-time metrics

### Admin Features
- **Advanced Studio Editor**: Modal-based editing with tabbed interface for comprehensive profile management
- **Bulk Operations**: Select multiple studios for batch actions (delete, update, export) with confirmation dialogs
- **HTML Entity Management**: Automated detection and cleanup of HTML entities in database text fields
- **Studio Name Synchronization**: Unified management of studio names across database tables
- **Image Management**: Upload, organize, and manage studio gallery images with drag-and-drop sorting
- **User Profile Management**: Complete CRUD operations for user accounts and extended profiles
- **Review System**: Moderate and manage studio reviews and ratings
- **Advanced Search**: Multi-field search with filters for status, dates, verification, and more
- **Data Migration Tools**: Scripts for database cleanup, schema synchronization, and data integrity

## 🔧 API Endpoints

### Public APIs
- `GET /api/vosf/dashboard` - Dashboard statistics
- `GET /api/vosf/analytics` - Analytics data
- `GET /api/vosf/studios` - Studios listing
- `GET /api/vosf/studios/[id]` - Individual studio
- `GET /api/vosf/network` - Network connections
- `GET /api/vosf/venues` - Venues listing
- `GET /api/vosf/faq` - FAQ entries

### Admin APIs
- `GET|POST /api/admin/studios` - Studios management with pagination and filtering
- `GET|PUT|DELETE /api/admin/studios/[id]` - Individual studio management
- `GET|POST|DELETE /api/admin/studios/[id]/images` - Studio image management
- `POST /api/admin/bulk` - Bulk operations for multiple studios
- `GET /api/admin/stats` - Administrative statistics and metrics
- `GET|POST /api/admin/faq` - FAQ management with sorting
- `GET|PUT|DELETE /api/admin/faq/[id]` - Individual FAQ management
- `POST /api/admin/upload` - File upload handling

## 🔐 Authentication

The application uses simple cookie-based authentication:
- Login endpoint: `POST /api/auth/login`
- Logout endpoint: `POST /api/auth/logout`
- Protected routes require authentication cookie

## 🏗️ Architecture

- **Frontend**: Next.js 14 with React Server Components and Client Components
- **Styling**: Tailwind CSS with responsive design and custom animations
- **Database**: PostgreSQL with Prisma ORM for type-safe operations
- **Authentication**: Cookie-based session management with middleware protection
- **API**: RESTful APIs with comprehensive error handling and validation
- **File Management**: Image upload and processing with organized storage
- **State Management**: React hooks with optimistic updates

## 📊 Recent Updates & Migrations

### Database Schema Synchronization (Latest)
- **Schema Compatibility**: Synchronized with other VOSF projects sharing the same database
- **Field Migration**: `user_profiles.first_name` → `user_profiles.studio_name` for better studio name management
- **Data Integrity**: Migrated 567 studio names from profile first_name to studios.name field
- **HTML Entity Cleanup**: Fixed 255+ records containing HTML entities (&#039;, &aacute;, etc.)
- **Prisma Updates**: Regenerated client and updated all database queries for new schema

### UI/UX Improvements
- **Modal Studio Editor**: Redesigned studio editing with modal interface and tabbed navigation
- **Bulk Operations**: Enhanced bulk actions with confirmation dialogs and progress feedback
- **Responsive Design**: Improved mobile and tablet compatibility
- **Animation System**: Added smooth transitions and loading states

### Performance & Reliability
- **Database Optimization**: Improved query performance with proper indexing
- **Error Handling**: Enhanced error boundaries and user feedback
- **Connection Resilience**: Better handling of database connection issues
- **Schema Validation**: Real-time validation of database operations

All migrations preserve existing data while improving functionality and user experience.

## 🚀 Deployment

### Production Deployment Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Database Setup**
   ```bash
   # Generate Prisma client for production
   npx prisma generate
   
   # Apply any pending migrations
   npx prisma db push
   ```

3. **Start production server**
   ```bash
   npm start
   ```

4. **Environment Variables**
   Ensure all required environment variables are set in your production environment:
   ```env
   DATABASE_URL=postgresql://...
   AUTH_USERNAME=admin
   AUTH_PASSWORD=secure-password
   NODE_ENV=production
   ```

### Production Checklist
- ✅ Database connection verified
- ✅ Prisma client regenerated
- ✅ Environment variables configured
- ✅ Build completed successfully
- ✅ Application server restarted

### Troubleshooting
If you encounter 500 errors after deployment:
1. Check database schema compatibility
2. Regenerate Prisma client: `npx prisma generate`
3. Verify environment variables
4. Check application logs for specific errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🛠️ Development Tools & Scripts

The project includes several utility scripts for database management and maintenance:

### Database Scripts
- `scripts/database/diagnose-connection.js` - Test database connectivity and performance
- `scripts/database/execute-html-entity-fixes.js` - Clean HTML entities from text fields
- `scripts/database/check-schema-changes.js` - Verify database schema compatibility
- `scripts/migration/migrate-studio-names-direct.js` - Migrate studio name data between fields
- `scripts/migration/cleanup-first-name-field.js` - Clean up deprecated database fields

### Testing & Verification
- `scripts/database/test-api-functionality.js` - Test API endpoints and database queries
- `scripts/database/create-backup.js` - Create database backups before major changes
- `scripts/testing/test-studio-name-update.js` - Verify studio name update functionality

### Usage Examples
```bash
# Test database connection
node scripts/database/diagnose-connection.js

# Clean HTML entities from database
node scripts/database/execute-html-entity-fixes.js

# Create database backup
node scripts/database/create-backup.js
```

## 📝 License

This project is proprietary software for Voice Over Studio Finder (VOSF).

## 🆘 Support

For support or questions, please contact the development team.

## 📋 Recent Changelog

### v2.1.0 (Latest)
- ✅ **Database Schema Sync**: Synchronized with other VOSF projects
- ✅ **HTML Entity Cleanup**: Fixed 255+ records with HTML entities
- ✅ **Studio Name Migration**: Migrated 567 studio names to proper fields
- ✅ **Modal Studio Editor**: Redesigned editing interface with tabbed navigation
- ✅ **Bulk Operations**: Enhanced with confirmation dialogs and progress feedback
- ✅ **Performance Improvements**: Optimized database queries and UI responsiveness

### v2.0.0
- 🔄 **Database Migration**: Migrated from MySQL to PostgreSQL with Prisma ORM
- 🎨 **UI Overhaul**: Complete redesign with Tailwind CSS and modern components
- 🔐 **Enhanced Security**: Improved authentication and data validation
- 📊 **Advanced Analytics**: Real-time metrics and comprehensive reporting

---

**Note**: This application provides comprehensive database management capabilities for the VOSF platform. All data operations include proper validation, error handling, and security measures. The system is designed for high reliability and seamless integration with other VOSF projects.