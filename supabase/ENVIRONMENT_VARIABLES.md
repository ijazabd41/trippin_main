# Environment Variables for Edge Function

## Currently Implemented Routes

The edge function implements all routes:
- ✅ Authentication (signup, signin, profile)
- ✅ Trips (CRUD operations)
- ✅ Itineraries (CRUD operations)
- ✅ Payments (Stripe integration)
- ✅ Subscriptions (premium plans)
- ✅ Google Maps (places, details)
- ✅ Google Translate (translate, detect, languages)
- ✅ eSIM (plans, purchase, orders)
- ✅ OpenAI (trip planning)

## Required Environment Variables

### Automatically Provided (Don't Set These!)

These are **automatically available** in Supabase Edge Functions - you don't need to set them:

- ✅ `SUPABASE_URL` - Automatically provided
- ✅ `SUPABASE_ANON_KEY` - Automatically provided
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided

### Optional Variables (Set These If Needed)

| Variable | Required | Default | Used For |
|----------|----------|---------|----------|
| `FRONTEND_URL` | No | `http://localhost:5173` | Email redirect URLs for auth |
| `STRIPE_SECRET_KEY` | No* | - | Payment processing (required for `/api/payments/*`) |
| `OPENAI_API_KEY` | No* | - | AI trip planning (required for `/api/openai/generate`) |
| `ENVIRONMENT` | No | `production` | Error details in development mode |

\* Required only if you use those specific features

## Minimum Setup

For basic functionality (auth, trips, itineraries), you don't need to set any secrets:

```bash
# No secrets needed! The function will work with defaults.
supabase functions deploy trippin-api
```

## Full Setup (With All Features)

If you want payments and AI features:

```bash
supabase secrets set FRONTEND_URL=https://your-frontend-url.com
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set OPENAI_API_KEY=sk-...
```

## Additional Variables (For Full Functionality)

For Google Maps, Google Translate, and eSIM features:

- `GOOGLE_MAPS_API_KEY` - For Google Maps/Places API (optional, fallback data available)
- `GOOGLE_TRANSLATE_API_KEY` - For translation features (optional, fallback available)
- `ESIMGO_API_KEY` or `ESIM_TOKEN` - For eSIM provider integration (optional)
- `ESIMGO_BASE_URL` or `ESIM_BASE` - For eSIM API base URL (defaults to https://api.esim-go.com/v2.4)

## Quick Reference

**What you MUST set:** Nothing (for basic features)

**What you SHOULD set:** `FRONTEND_URL` (for production)

**What you CAN set:** `STRIPE_SECRET_KEY`, `OPENAI_API_KEY` (for those features)

