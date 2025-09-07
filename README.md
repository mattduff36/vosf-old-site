# VOSF Database Explorer

A Next.js application for exploring and managing Voice Over Studio Finder (VOSF) databases. This application provides a web interface to browse, query, and analyze multiple databases containing voice over professionals, studios, and community data.

## 🚀 Features

- **Multi-Database Support**: Browse 4 different databases (Shows, FAQ, Maps, Community)
- **Interactive Dashboard**: Real-time database overview and statistics
- **Advanced Query Interface**: Execute custom SQL queries with syntax highlighting
- **Table Explorer**: Browse table schemas, relationships, and data
- **Search Functionality**: Search across tables and data
- **Column Analysis**: Detailed analysis of column data distribution
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Database**: Turso (LibSQL) - Serverless SQLite
- **Authentication**: Custom JWT-based auth
- **Deployment**: Vercel-ready

## 📊 Database Structure

The application manages 4 databases with 19+ tables:

### Shows Database (`shows_*`)
- User management and authentication
- Comments and community features
- Roles and permissions
- Configuration options

### Community Database (`community_*`)
- User interactions and messaging
- Comment voting system
- User metadata and sessions

### FAQ Database (`faq_*`)
- User signup and management system

### Maps Database (`maps_*`)
- Geographic points of interest
- Location-based data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Turso database account

### Environment Variables

Create a `.env.local` file with:

```env
# Turso Database Configuration
TURSO_DATABASE_URL="your-turso-database-url"
TURSO_AUTH_TOKEN="your-turso-auth-token"

# Authentication
JWT_SECRET="your-jwt-secret-key"
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Authentication

Default login credentials:
- **Username**: `admin`
- **Password**: `GuyM@tt2025!`

## 📁 Project Structure

```
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   └── database/       # Database API endpoints
│   ├── components/         # React components
│   ├── dashboard/          # Dashboard pages
│   ├── lib/               # Utility libraries
│   │   ├── auth.js        # Authentication logic
│   │   └── database.js    # Database connection & queries
│   └── globals.css        # Global styles
├── middleware.js          # Next.js middleware for auth
└── migrate-to-turso.js   # Database migration script
```

## 🌐 Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Set these in your Vercel dashboard:

- `TURSO_DATABASE_URL`: Your Turso database URL
- `TURSO_AUTH_TOKEN`: Your Turso authentication token  
- `JWT_SECRET`: Secret key for JWT tokens

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Database Operations
- `GET /api/database/databases` - List all databases
- `GET /api/database/overview` - Database overview and statistics
- `GET /api/database/tables` - List all tables
- `GET /api/database/browse` - Browse table data
- `GET /api/database/schema` - Get table schema
- `POST /api/database/query` - Execute custom queries
- `GET /api/database/search` - Search across tables
- `GET /api/database/column-analysis` - Analyze column data

## 🎯 Usage

1. **Login**: Access the application and login with admin credentials
2. **Dashboard**: View database overview and statistics
3. **Browse Tables**: Explore table structures and data
4. **Run Queries**: Execute custom SQL queries
5. **Search**: Find specific data across tables
6. **Analyze**: Get insights into column data distribution

## 🔒 Security Features

- JWT-based authentication
- SQL injection protection
- Query validation (SELECT-only)
- Secure environment variable handling
- Protected API routes

## 📈 Performance

- Turso serverless database for global low-latency
- Next.js optimizations and caching
- Efficient query execution
- Responsive design for all devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ for the Voice Over Studio Finder community**