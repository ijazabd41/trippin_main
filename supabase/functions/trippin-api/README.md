# Trippin API Edge Function

This is a Supabase Edge Function that replaces the Express.js backend server. It provides all the API endpoints for the Trippin travel application.

## Features

- Authentication and user management
- Trip management (CRUD operations)
- Itinerary management
- Payment processing (Stripe integration)
- OpenAI integration for trip planning
- CORS support
- Error handling

## Deployment

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

### Environment Variables

Set the following secrets in your Supabase project:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (for full functionality)
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret-key
FRONTEND_URL=https://your-frontend-url.com
```

To set secrets:
```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set OPENAI_API_KEY=your-openai-key
supabase secrets set STRIPE_SECRET_KEY=your-stripe-secret-key
supabase secrets set FRONTEND_URL=https://your-frontend-url.com
```

### Deploy

Deploy the edge function:
```bash
supabase functions deploy trippin-api
```

### Test Locally

To test locally:
```bash
supabase functions serve trippin-api
```

The function will be available at:
```
http://localhost:54321/functions/v1/trippin-api
```

## API Endpoints

### Health & Test
- `GET /health` - Health check
- `GET /api/test` - Test endpoint

### Authentication
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Supabase Auth
- `POST /api/supabase-auth/signup` - Sign up
- `POST /api/supabase-auth/signin` - Sign in
- `POST /api/supabase-auth/signout` - Sign out
- `GET /api/supabase-auth/user` - Get current user
- `POST /api/supabase-auth/refresh` - Refresh session
- `POST /api/supabase-auth/reset-password` - Reset password

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get single trip
- `POST /api/trips` - Create trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Itineraries
- `GET /api/itineraries/trip/:tripId` - Get itineraries for a trip
- `GET /api/itineraries/:id` - Get single itinerary
- `POST /api/itineraries` - Create itinerary
- `PUT /api/itineraries/:id` - Update itinerary
- `DELETE /api/itineraries/:id` - Delete itinerary

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent

### OpenAI
- `POST /api/openai/generate` - Generate trip plan with AI

## Usage

After deployment, update your frontend API base URL to:
```
https://your-project-ref.supabase.co/functions/v1/trippin-api
```

## Notes

- All endpoints require authentication except signup, signin, and health check
- CORS is enabled for all origins (adjust in production if needed)
- The function uses Deno runtime, not Node.js
- External dependencies are loaded via ESM imports


