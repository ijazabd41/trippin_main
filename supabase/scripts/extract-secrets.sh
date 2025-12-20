#!/bin/bash
# Script to extract only the secrets needed for Supabase Edge Function
# Usage: ./supabase/scripts/extract-secrets.sh

ENV_FILE=".env"
SECRETS_FILE=".env.secrets"

# List of environment variables needed for the edge function
# Currently implemented: FRONTEND_URL, STRIPE_SECRET_KEY, OPENAI_API_KEY
# Future: GOOGLE_MAPS_API_KEY, GOOGLE_TRANSLATE_API_KEY, ESIMGO_API_KEY, etc.
NEEDED_SECRETS=(
    "FRONTEND_URL"
    "OPENAI_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "GOOGLE_MAPS_API_KEY"
    "GOOGLE_TRANSLATE_API_KEY"
    "ESIMGO_API_KEY"
    "ESIM_TOKEN"
    "ESIMGO_BASE_URL"
    "ESIM_BASE"
    "ENVIRONMENT"
)

echo "Extracting secrets from $ENV_FILE..."

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found!"
    exit 1
fi

> "$SECRETS_FILE"  # Clear the file

for secret in "${NEEDED_SECRETS[@]}"; do
    # Extract the value from .env file
    value=$(grep "^${secret}=" "$ENV_FILE" | cut -d '=' -f2- | sed 's/^"//;s/"$//')
    
    if [ -n "$value" ]; then
        echo "${secret}=${value}" >> "$SECRETS_FILE"
        echo "  Found: $secret"
    else
        echo "${secret}=" >> "$SECRETS_FILE"
    fi
done

echo ""
echo "Created $SECRETS_FILE"
echo "Next step: supabase secrets set --env-file $SECRETS_FILE"

