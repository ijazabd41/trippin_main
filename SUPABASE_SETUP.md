# Complete Supabase Backend Setup Guide

This guide will help you set up a complete backend with Supabase database integration for your Trippin travel app.

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `trippin-app`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

### 2. Get Your Supabase Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 3. Set Up Environment Variables

#### Backend Environment (.env in backend folder)

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# External API Keys
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

#### Frontend Environment (.env in root folder)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Backend API Configuration
VITE_BACKEND_URL=http://localhost:3001/api

# Frontend Configuration
VITE_APP_NAME=Trippin
VITE_APP_VERSION=1.0.0
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

### 5. Set Up Database Schema

```bash
cd backend
npm run setup
```

This will create all necessary tables, indexes, and Row Level Security policies.

### 6. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will be available at `http://localhost:3001`

### 7. Install Frontend Dependencies

```bash
# In the root directory
npm install @supabase/supabase-js
```

### 8. Update Frontend to Use Supabase

Replace your current App.tsx with the new Supabase version:

```bash
# Backup your current App.tsx
cp src/App.tsx src/App.backup.tsx

# Use the new Supabase version
cp src/AppWithSupabase.tsx src/App.tsx
```

### 9. Update Auth Routes

Replace your current AuthPage with the Supabase version:

```bash
# Backup your current AuthPage
cp src/pages/AuthPage.tsx src/pages/AuthPage.backup.tsx

# Use the new Supabase version
cp src/pages/SupabaseAuthPage.tsx src/pages/AuthPage.tsx
```

### 10. Start the Frontend

```bash
npm run dev
```

## 📊 Database Schema

The setup creates the following tables:

### Core Tables
- **users** - User profiles and authentication
- **user_preferences** - User travel preferences
- **trips** - Travel plans and itineraries
- **itineraries** - Detailed trip activities
- **bookings** - Travel bookings and reservations
- **payments** - Payment records and transactions

### Supporting Tables
- **reviews** - User reviews and ratings
- **favorites** - User favorite trips
- **shared_trips** - Shared trip links
- **notifications** - User notifications

### Security Features
- **Row Level Security (RLS)** enabled on all tables
- **JWT Authentication** with Supabase Auth
- **User-specific data access** policies
- **Public trip sharing** capabilities

## 🔐 Authentication Flow

### 1. User Registration
```typescript
const { signUp } = useSupabaseAuth();
await signUp(email, password, { full_name: 'John Doe' });
```

### 2. User Login
```typescript
const { signIn } = useSupabaseAuth();
await signIn(email, password);
```

### 3. Google OAuth
```typescript
const { signInWithGoogle } = useSupabaseAuth();
await signInWithGoogle();
```

### 4. Password Reset
```typescript
const { resetPassword } = useSupabaseAuth();
await resetPassword(email);
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/supabase-auth/signup` - User registration
- `POST /api/supabase-auth/signin` - User login
- `POST /api/supabase-auth/signin/google` - Google OAuth
- `POST /api/supabase-auth/signout` - User logout

### Trips
- `GET /api/trips` - Get user trips
- `POST /api/trips` - Create new trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Itineraries
- `GET /api/itineraries/trip/:tripId` - Get trip itineraries
- `POST /api/itineraries` - Create itinerary item
- `PUT /api/itineraries/:id` - Update itinerary item

### Bookings & Payments
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment

## 🔧 Configuration

### Supabase Dashboard Setup

1. **Authentication**:
   - Go to Authentication → Settings
   - Enable Email confirmations
   - Configure OAuth providers (Google, etc.)

2. **Database**:
   - Go to SQL Editor
   - Run the schema.sql file to create tables
   - Verify tables are created in Table Editor

3. **Storage** (Optional):
   - Go to Storage
   - Create bucket for user uploads
   - Set up RLS policies for storage

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret
7. Add to Supabase Authentication → Providers → Google

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:3001/health

# Test authentication
curl -X POST http://localhost:3001/api/supabase-auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'
```

### Test Frontend Integration

1. Start both backend and frontend
2. Navigate to `/auth/login`
3. Try creating an account
4. Test login/logout functionality
5. Verify trips are saved to database

## 🚀 Deployment

### Backend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. In backend directory: `vercel`
3. Set environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### Frontend Deployment

1. Update `VITE_BACKEND_URL` to your deployed backend URL
2. Deploy to Vercel/Netlify
3. Update Supabase auth redirect URLs

## 🔍 Troubleshooting

### Common Issues

1. **Database connection failed**:
   - Check SUPABASE_URL and keys
   - Verify project is not paused
   - Check network connectivity

2. **Authentication not working**:
   - Verify Supabase Auth is enabled
   - Check redirect URLs
   - Verify JWT secret is set

3. **RLS policies blocking access**:
   - Check user is authenticated
   - Verify policies are correct
   - Test with service role key

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=supabase:*
```

## 📚 Next Steps

1. **Add Real-time Features**: Use Supabase real-time subscriptions
2. **Implement File Uploads**: Add image upload for trips
3. **Add Push Notifications**: Integrate with service workers
4. **Performance Optimization**: Add caching and optimization
5. **Monitoring**: Add error tracking and analytics

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Check the backend logs
3. Verify all environment variables are set
4. Test API endpoints individually
5. Check Supabase dashboard for errors

## 📖 Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
