# eSIM API 403 Forbidden Error - Troubleshooting Guide

## 🔴 Error Message
```
403 Forbidden - {"message":"access denied"}
```

## 🔍 Root Causes

A **403 Forbidden** error from the eSIM Go API typically means one of the following:

### 1. **API Key is Missing or Empty**
- The `ESIMGO_API_KEY` or `ESIM_TOKEN` environment variable is not set
- The `.env` file is not being loaded properly
- The environment variable name is incorrect

### 2. **API Key is Invalid or Expired**
- The API key in your `.env` file is incorrect
- The API key has been revoked or expired
- The API key was copied incorrectly (extra spaces, missing characters)

### 3. **API Key Lacks Permissions**
- Your eSIM Go account doesn't have API access enabled
- The API key doesn't have permission to access the `/catalogue` endpoint
- Your account tier doesn't include API access

### 4. **API Key Format is Incorrect**
- The API key format doesn't match what eSIM Go expects
- Extra whitespace or newlines in the API key

## ✅ Solutions

### Step 1: Verify API Key is Loaded

When the server starts, you should see:
```
✅ eSIM API configured: https://api.esim-go.com/v2.4 (Key: NLtABd...vdw9)
```

If you see:
```
❌ eSIM API key is MISSING! Set ESIMGO_API_KEY or ESIM_TOKEN in .env file
```

Then the API key is not being loaded. Check:
1. The `.env` file exists in `goon-main/backend/.env`
2. The file contains either `ESIMGO_API_KEY=...` or `ESIM_TOKEN=...`
3. There are no extra spaces around the `=` sign
4. The server was restarted after adding the environment variable

### Step 2: Verify API Key with eSIM Go

1. **Log into your eSIM Go account:**
   - Go to: https://sso.esim-go.com/login
   - Navigate to **Account Settings** → **API Details**

2. **Check:**
   - ✅ API access is enabled
   - ✅ API key is active (not revoked)
   - ✅ The API key matches what's in your `.env` file
   - ✅ Your account has API access permissions

3. **Generate a new API key if needed:**
   - If the key is invalid, generate a new one
   - Update your `.env` file with the new key
   - Restart the backend server

### Step 3: Verify API Key Format

The API key should:
- Be a single line (no line breaks)
- Have no leading/trailing spaces
- Match exactly what's shown in your eSIM Go account

**Example `.env` file:**
```env
# ✅ CORRECT
ESIM_TOKEN=NLtABdW_ItzHFxN7hsNwNU6H7rYCfAtJCM6Dvdw9

# ❌ WRONG - extra spaces
ESIM_TOKEN = NLtABdW_ItzHFxN7hsNwNU6H7rYCfAtJCM6Dvdw9

# ❌ WRONG - quotes (not needed)
ESIM_TOKEN="NLtABdW_ItzHFxN7hsNwNU6H7rYCfAtJCM6Dvdw9"
```

### Step 4: Test API Key Directly

You can test the API key using curl or a tool like Postman:

```bash
curl -X GET "https://api.esim-go.com/v2.4/catalogue?page=1" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

If this returns 403, the API key is definitely invalid or lacks permissions.

### Step 5: Check Account Status

Contact eSIM Go support if:
- Your API key is correct but still getting 403
- API access is not enabled in your account
- You need to upgrade your account tier for API access

## 📋 Current Configuration

Based on your `.env` file:
- **Base URL:** `https://api.esim-go.com/v2.4`
- **API Key Variable:** `ESIM_TOKEN`
- **API Key Length:** Should be visible in server startup logs

## 🔧 Enhanced Error Logging

The code now includes enhanced error logging that will show:
- Whether the API key is configured
- The API key length (to verify it's not empty)
- A preview of the API key (first 6 and last 4 characters)
- Possible causes of the 403 error

When you see a 403 error, check the server logs for detailed diagnostic information.

## 🚀 Next Steps

1. **Restart your backend server** to see the new diagnostic messages
2. **Check the startup logs** for API key configuration status
3. **Verify your API key** in the eSIM Go dashboard
4. **Test the API key** directly using curl or Postman
5. **Contact eSIM Go support** if the key is correct but still not working

## 📞 Support Resources

- **eSIM Go API Documentation:** https://docs.esim-go.com/
- **eSIM Go Support:** Contact through your account dashboard
- **API Status:** Check eSIM Go status page for any service issues

