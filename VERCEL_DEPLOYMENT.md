# 🚀 Vercel Deployment Guide

## Quick Deployment Steps

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your `vosf-old-site` repository

### 2. Configure Environment Variables
In your Vercel project settings, add these environment variables:

```env
TURSO_DATABASE_URL=libsql://vosf-old-dbs-vercel-icfg-iyhpcldkzams285cfidsao6f.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTcyNzQ1NDEsImlkIjoiNzdiYTRhYWQtYTI4My00N2I0LTkwNGYtOTA0MjZmZjBhYTJhIiwicmlkIjoiMGFhYTU2NzItMTc3OC00NzYzLTkxZDgtZTYwODI1NjdjODkwIn0.-Gpk2iP0ede-hwjlZSaSGM1UsEkthQdhX3Jj1FOUvAf72luj0b5Uo7-gM-yr8JsthmRRY83osWMSDpU4fKtwDA
JWT_SECRET=your-secure-jwt-secret-key-here
```

### 3. Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

## 🔐 Login Credentials

Once deployed, login with:
- **Username**: `admin`
- **Password**: `GuyM@tt2025!`

## 📊 What You'll See

After deployment, your application will have:
- ✅ 19 database tables ready to explore
- ✅ Sample data for testing
- ✅ Interactive dashboard
- ✅ Query interface
- ✅ Table browser
- ✅ Search functionality

## 🛠 Build Configuration

The project is pre-configured for Vercel with:
- Next.js 14 (automatically detected)
- Node.js 18+ runtime
- Automatic dependency installation
- Environment variable support

## 🔧 Troubleshooting

### Build Issues
- Ensure all environment variables are set
- Check that Turso credentials are correct
- Verify Node.js version compatibility

### Runtime Issues
- Check Vercel function logs
- Verify database connection
- Ensure JWT_SECRET is set

### Database Connection
- Test Turso connection from local environment first
- Verify auth token hasn't expired
- Check database URL format

## 📈 Performance

Your deployed app will benefit from:
- Vercel's global CDN
- Turso's edge database locations
- Next.js automatic optimizations
- Serverless function scaling

## 🔄 Updates

To update your deployment:
1. Make changes locally
2. Commit and push to GitHub
3. Vercel will automatically redeploy

## 🌐 Custom Domain

To add a custom domain:
1. Go to Vercel project settings
2. Click "Domains"
3. Add your domain
4. Configure DNS as instructed

---

**Your VOSF Database Explorer is ready for the world! 🎉**
