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

**Important:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase Edge Functions. You don't need to set them!

Only set your custom secrets:

```bash
# Optional but recommended for full functionality
supabase secrets set FRONTEND_URL=https://your-frontend-url.com
supabase secrets set OPENAI_API_KEY=your-openai-key
supabase secrets set STRIPE_SECRET_KEY=your-stripe-secret-key
```

Or use an env file:
```bash
# Create .env.secrets file (don't commit!)
FRONTEND_URL=https://your-frontend-url.com
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# Set all at once
supabase secrets set --env-file .env.secrets
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
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments` - Get payment history
- `GET /api/payments/:id` - Get single payment

### Subscriptions
- `POST /api/subscriptions/create-checkout-session` - Create premium subscription checkout
- `GET /api/subscriptions/status` - Get subscription status

### Google Maps
- `POST /api/google-maps` - Get nearby places
- `POST /api/google-maps/details` - Get place details

### Google Translate
- `POST /api/google-translate/translate` - Translate text
- `POST /api/google-translate/detect` - Detect language
- `GET /api/google-translate/languages` - Get supported languages

### eSIM
- `GET /api/esim/plans` - Get available eSIM plans (Japan only)
- `POST /api/esim/purchase` - Purchase eSIM plan
- `GET /api/esim/orders` - Get user's eSIM orders

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


