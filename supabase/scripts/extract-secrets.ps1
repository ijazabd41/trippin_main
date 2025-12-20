# PowerShell script to extract only the secrets needed for Supabase Edge Function
# Usage: .\supabase\scripts\extract-secrets.ps1

$envFile = ".env"
$secretsFile = ".env.secrets"

# List of environment variables needed for the edge function
# Currently implemented: FRONTEND_URL, STRIPE_SECRET_KEY, OPENAI_API_KEY
# Future: GOOGLE_MAPS_API_KEY, GOOGLE_TRANSLATE_API_KEY, ESIMGO_API_KEY, etc.
$neededSecrets = @(
    "FRONTEND_URL",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "GOOGLE_MAPS_API_KEY",
    "GOOGLE_TRANSLATE_API_KEY",
    "ESIMGO_API_KEY",
    "ESIM_TOKEN",
    "ESIMGO_BASE_URL",
    "ESIM_BASE",
    "ENVIRONMENT"
)

Write-Host "Extracting secrets from $envFile..." -ForegroundColor Cyan

if (-not (Test-Path $envFile)) {
    Write-Host "Error: $envFile not found!" -ForegroundColor Red
    exit 1
}

$secrets = @{}
$lines = Get-Content $envFile

foreach ($line in $lines) {
    # Skip comments and empty lines
    if ($line -match "^\s*#" -or $line -match "^\s*$") {
        continue
    }
    
    # Parse KEY=VALUE
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Check if this key is needed
        if ($neededSecrets -contains $key) {
            $secrets[$key] = $value
            Write-Host "  Found: $key" -ForegroundColor Green
        }
    }
}

# Write to .env.secrets file
$output = @()
foreach ($key in $neededSecrets) {
    if ($secrets.ContainsKey($key)) {
        $output += "$key=$($secrets[$key])"
    }
}

if ($output.Count -eq 0) {
    Write-Host "No matching secrets found in $envFile" -ForegroundColor Yellow
    Write-Host "Creating empty template..." -ForegroundColor Yellow
    $output = $neededSecrets | ForEach-Object { "$_=" }
}

$output | Out-File -FilePath $secretsFile -Encoding utf8
Write-Host "`nCreated $secretsFile with $($output.Count) secrets" -ForegroundColor Green
Write-Host "`nNext step: supabase secrets set --env-file $secretsFile" -ForegroundColor Cyan

