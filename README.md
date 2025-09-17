# VOSF Database Management Portal

A comprehensive Next.js application for managing the Voice Over Studio Finder (VOSF) database with full CRUD operations for studios, contacts, venues, and FAQ entries.

## 🚀 Features

- **Studio Management**: Complete profile management with users and profile data
- **Contacts Management**: Handle partnerships and connections
- **Venues Management**: Manage recording locations with coordinate support
- **FAQ Management**: Organize knowledge base with sort ordering
- **Analytics Dashboard**: Comprehensive insights and statistics
- **Admin Interface**: Full CRUD operations for all data types
- **Modern UI**: Responsive design with Tailwind CSS

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Turso Database account

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
   
   Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

   Update `.env.local` with your configuration:
   ```env
   # Turso Database Configuration (Required)
   TURSO_DATABASE_URL=libsql://your-database-url.turso.io
   TURSO_AUTH_TOKEN=your-turso-auth-token

   # Authentication (Required)
   AUTH_USERNAME=admin
   AUTH_PASSWORD=your-secure-password
   ```

## 🗄️ Database Schema

The application uses a Turso (libSQL) database with the following main tables:

### Core Tables
- **users**: User accounts (id, username, displayname, email, status, created_at)
- **profile**: Extended profile data (user_id, first_name, last_name, location, phone, url, instagram, youtubepage, about, latitude, longitude)
- **contacts**: Partnerships and connections (id, name, email, phone, message, created_at)
- **poi**: Points of interest/venues (id, name, description, lat, lon)
- **faq**: Frequently asked questions (id, question, answer, sort_order)

### Key Features
- Users with `status='stub'` are excluded from public listings
- Foreign key relationships between users and profiles
- Coordinate validation for venues
- Sort ordering for FAQ entries

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
- **Studios**: Browse studio directory with search and filtering
- **Network**: View studio connections and partnerships
- **Venues**: Explore recording locations with map integration
- **FAQ**: Browse knowledge base entries
- **Analytics**: Detailed insights and metrics

### Admin Features
- **Studio Management**: Full CRUD operations for user profiles
- **Contact Management**: Manage partnerships and connections
- **Venue Management**: Add/edit recording locations with coordinates
- **FAQ Management**: Organize knowledge base with drag-and-drop ordering
- **Advanced Filtering**: Search, sort, and filter all data types
- **Bulk Operations**: Efficient management of multiple records

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
- `GET|POST /api/admin/studios` - Studios management
- `GET|PUT|DELETE /api/admin/studios/[id]` - Individual studio management
- `GET|POST /api/admin/contacts` - Contacts management
- `GET|PUT|DELETE /api/admin/contacts/[id]` - Individual contact management
- `GET|POST /api/admin/venues` - Venues management
- `GET|PUT|DELETE /api/admin/venues/[id]` - Individual venue management
- `GET|POST /api/admin/faq` - FAQ management
- `GET|PUT|DELETE /api/admin/faq/[id]` - Individual FAQ management

## 🔐 Authentication

The application uses simple cookie-based authentication:
- Login endpoint: `POST /api/auth/login`
- Logout endpoint: `POST /api/auth/logout`
- Protected routes require authentication cookie

## 🏗️ Architecture

- **Frontend**: Next.js 14 with React Server Components
- **Styling**: Tailwind CSS with responsive design
- **Database**: Turso (libSQL) with @libsql/client
- **Authentication**: Cookie-based session management
- **API**: RESTful APIs with comprehensive error handling

## 📊 Data Migration

The application has been migrated from the old MySQL schema to the new Turso schema:

### Old Schema → New Schema
- `shows_users` + `shows_usermeta` → `users` + `profile`
- `shows_contacts` → `contacts`
- `poi_example` → `poi`
- `faq_signuser` → `faq`

All existing functionality has been preserved while improving data structure and relationships.

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Environment Variables**
   Ensure all required environment variables are set in your production environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is proprietary software for Voice Over Studio Finder (VOSF).

## 🆘 Support

For support or questions, please contact the development team.

---

**Note**: This application provides comprehensive database management capabilities for the VOSF platform. All data operations include proper validation, error handling, and security measures.