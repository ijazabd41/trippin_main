# Backend-Frontend Connection Guide

This guide explains how the Trippin app connects the frontend (React/Vite) with the backend (Node.js/Express) and provides fallback mechanisms for development.

## Architecture Overview

```
Frontend (React/Vite) ←→ Backend Service ←→ Backend API (Express)
     ↓                        ↓                    ↓
Mock Data Fallback    Health Check        Real Backend
```

## Quick Start

### Option 1: Start Both Servers
```bash
# From the root directory
npm run start-dev
```

### Option 2: Start Separately
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend  
npm run frontend
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend Configuration
VITE_BACKEND_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Development
NODE_ENV=development
```

### Backend Configuration

The backend runs on port 3001 by default. Key files:
- `backend/server.js` - Main server file
- `backend/routes/` - API route handlers
- `backend/config/supabase.js` - Database configuration

### Frontend Configuration

The frontend runs on port 5173 by default. Key files:
- `src/services/BackendService.ts` - Main service layer
- `src/config/backend-api.ts` - API configuration
- `src/contexts/BackendTripContext.tsx` - Trip management
- `src/contexts/SupabaseAuthContext.tsx` - Authentication

## Connection Flow

### 1. Health Check
The `BackendService` automatically checks if the backend is available:
```typescript
const isBackendAvailable = await backendService.checkHealth();
```

### 2. Fallback Mechanism
If the backend is not available, the service automatically switches to mock data:
```typescript
if (this.config.useMockData) {
  return mockData;
}
```

### 3. API Calls
All API calls go through the `BackendService` which handles:
- Real backend calls when available
- Mock data fallback when backend is down
- Error handling and retries
- Authentication token management

## Testing the Connection

### 1. Backend Connection Test
Visit the Dashboard page to see the connection test component that shows:
- Backend availability status
- Mock data usage status
- Backend URL configuration
- Test results for API calls

### 2. Manual Testing
```bash
# Test backend health
curl http://localhost:3001/health

# Test API endpoint
curl http://localhost:3001/api/trips
```

## Troubleshooting

### Backend Not Starting
1. Check if port 3001 is available
2. Verify Node.js version (>=18.0.0)
3. Install backend dependencies: `cd backend && npm install`
4. Check backend logs for errors

### Frontend Connection Issues
1. Verify backend is running on port 3001
2. Check CORS configuration in backend
3. Look at browser console for errors
4. Use the connection test component

### CORS Issues
The backend is configured with CORS for development:
```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### Mock Data Fallback
If you see "Using mock data" in the console, it means:
- Backend is not running
- Backend is not responding
- Network connectivity issues

The app will still work with mock data for development.

## API Endpoints

### Authentication
- `POST /api/supabase-auth/signup` - User registration
- `POST /api/supabase-auth/signin` - User login
- `POST /api/supabase-auth/signout` - User logout

### Trips
- `GET /api/trips` - Get user trips
- `POST /api/trips` - Create new trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Itineraries
- `GET /api/itineraries/trip/:tripId` - Get trip itinerary
- `POST /api/itineraries` - Create itinerary
- `PUT /api/itineraries/:id` - Update itinerary

## Development Workflow

### 1. Start Development
```bash
npm run start-dev
```

### 2. Make Changes
- Frontend changes: Hot reload automatically
- Backend changes: Restart backend server

### 3. Test Changes
- Use the connection test component
- Check browser console for errors
- Verify API responses

### 4. Debug Issues
- Check backend logs
- Use browser dev tools
- Test API endpoints directly

## Production Deployment

### Environment Variables
Set these in your production environment:
- `VITE_BACKEND_URL` - Production backend URL
- `VITE_SUPABASE_URL` - Production Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Production Supabase key

### Backend Deployment
- Deploy backend to your hosting service
- Configure CORS for production domain
- Set up environment variables
- Configure database connection

### Frontend Deployment
- Build frontend: `npm run build`
- Deploy to static hosting
- Configure environment variables
- Set up redirects for SPA routing

## Support

If you encounter issues:
1. Check the connection test component
2. Review browser console logs
3. Verify backend server status
4. Test API endpoints manually
5. Check environment variable configuration

The app is designed to work with or without the backend, so you can develop frontend features even if the backend is not available.
