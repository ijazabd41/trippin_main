# Supabase Edge Function Deployment Guide

This guide will help you deploy the Trippin API as a Supabase Edge Function.

## Quick Start

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   You can find your project ref in your Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`

4. **Set environment variables**:
   
   **Note:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase Edge Functions - you don't need to set them!
   
   **Option A: Extract secrets from your .env file** (Recommended if you have many variables):
   
   On Windows (PowerShell):
   ```powershell
   .\supabase\scripts\extract-secrets.ps1
   supabase secrets set --env-file .env.secrets
   ```
   
   On Mac/Linux:
   ```bash
   chmod +x supabase/scripts/extract-secrets.sh
   ./supabase/scripts/extract-secrets.sh
   supabase secrets set --env-file .env.secrets
   ```
   
   **Option B: Set secrets individually**:
   ```bash
   supabase secrets set FRONTEND_URL=https://your-frontend-url.com
   supabase secrets set OPENAI_API_KEY=your-openai-key
   supabase secrets set STRIPE_SECRET_KEY=your-stripe-secret-key
   supabase secrets set GOOGLE_MAPS_API_KEY=your-google-maps-key
   supabase secrets set GOOGLE_TRANSLATE_API_KEY=your-google-translate-key
   supabase secrets set ESIMGO_API_KEY=your-esim-key
   ```

5. **Deploy the function**:
   ```bash
   supabase functions deploy trippin-api
   ```

6. **Test the deployment**:
   ```bash
   curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/trippin-api/health
   ```

## Updating Your Frontend

After deployment, update your frontend API configuration to point to the edge function:

```typescript
// In your frontend config
const API_BASE_URL = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/trippin-api';
```

## Local Development

To test the function locally before deploying:

```bash
# Start local Supabase (if using local development)
supabase start

# Serve the function locally
supabase functions serve trippin-api

# The function will be available at:
# http://localhost:54321/functions/v1/trippin-api
```

## Monitoring

View function logs:
```bash
supabase functions logs trippin-api
```

## Troubleshooting

### Function not found
- Make sure you've deployed the function: `supabase functions deploy trippin-api`
- Check that you're using the correct project ref

### Authentication errors
- Verify your `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly
- Check that the keys match your Supabase project

### CORS errors
- The function includes CORS headers, but you may need to adjust them for your specific frontend domain
- Update the `corsHeaders` in `index.ts` if needed

### External API errors (OpenAI, Stripe)
- Verify your API keys are set as secrets
- Check the function logs for detailed error messages

## Environment Variables Reference

| Variable | Required | Auto-provided | Description |
|----------|----------|---------------|-------------|
| `SUPABASE_URL` | Yes | ✅ Yes | Your Supabase project URL (automatically available) |
| `SUPABASE_ANON_KEY` | Yes | ✅ Yes | Your Supabase anonymous key (automatically available) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | ✅ Yes | Your Supabase service role key (automatically available) |
| `FRONTEND_URL` | No | ❌ No | Frontend URL for redirects (defaults to localhost) |
| `OPENAI_API_KEY` | No | ❌ No | OpenAI API key for AI features |
| `STRIPE_SECRET_KEY` | No | ❌ No | Stripe secret key for payments |

## Next Steps

1. Set up your database schema (if not already done)
2. Configure Row Level Security (RLS) policies
3. Test all endpoints
4. Set up monitoring and alerts
5. Configure custom domain (optional)


