# Environment Setup Guide

## Issue Identified

The plan generation is showing "all GPT models failed, using fallback plan" because the backend server cannot start due to missing environment variables, specifically the `OPENAI_API_KEY`.

## Root Cause

1. **Backend server fails to start** - Missing `OPENAI_API_KEY` environment variable
2. **Frontend falls back to Vercel functions** - Which only return mock data
3. **Fallback message appears** - "AI処理が利用できないため、基本プランを表示しています。"

## Solution

### Step 1: Create Environment File

Copy the example environment file in the backend directory:

```bash
cd goon-main/backend
cp env.example .env
```

### Step 2: Configure Environment Variables

Edit the `.env` file with your actual API keys:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development

# External API Keys
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### Step 3: Get Required API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

#### Supabase Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing
3. Go to Settings > API
4. Copy the Project URL and API keys

#### Stripe Keys (Optional - for payments)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your test keys from Developers > API keys

### Step 4: Start the Backend Server

```bash
cd goon-main/backend
npm install
npm start
```

### Step 5: Verify the Fix

1. The backend should start without errors
2. Visit `http://localhost:3001/api/openai/health` to verify the service is running
3. Test plan generation in the frontend - it should now use real OpenAI models instead of fallback

## Testing the Fix

### Test Backend Health
```bash
curl http://localhost:3001/api/openai/health
```

Expected response:
```json
{
  "success": true,
  "message": "OpenAI service is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Plan Generation
```bash
curl -X POST http://localhost:3001/api/openai/generate \
  -H "Content-Type: application/json" \
  -d '{"tripData":{"destination":"Tokyo","duration":3,"budget":100000,"currency":"JPY"}}'
```

Expected response should contain real AI-generated content, not fallback data.

## Troubleshooting

### If Backend Still Won't Start
1. Check that all environment variables are set correctly
2. Verify the OpenAI API key is valid and has credits
3. Check the console for specific error messages

### If Frontend Still Shows Fallback
1. Ensure the backend is running on port 3001
2. Check that the frontend is configured to use the correct backend URL
3. Clear browser cache and try again

### If OpenAI API Calls Fail
1. Check your OpenAI account has sufficient credits
2. Verify the API key has the correct permissions
3. Check OpenAI service status at [status.openai.com](https://status.openai.com)

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes | `sk-...` |
| `SUPABASE_URL` | Supabase project URL | Yes | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | `eyJ...` |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | No | `sk_test_...` |
| `PORT` | Backend server port | No | `3001` |
| `NODE_ENV` | Environment mode | No | `development` |
| `CORS_ORIGIN` | Allowed CORS origins | No | `http://localhost:5173` |
| `FRONTEND_URL` | Frontend URL for redirects | No | `http://localhost:5173` |

## Next Steps

After setting up the environment variables:

1. The backend server should start successfully
2. Plan generation will use real OpenAI models
3. The fallback message should no longer appear
4. Users will get AI-generated travel plans instead of basic templates

The system is designed to gracefully fall back to mock data when the backend is unavailable, but with proper environment setup, it will use the full AI capabilities.



