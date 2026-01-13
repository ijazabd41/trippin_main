# Mock Data Behavior Explanation

## Overview
The Trippin app uses **mock/fallback data** in several scenarios. This document explains when and why mock data is used instead of real API calls.

---

## 🔍 When Mock Data is Used

### 1. **Backend Health Check Fails** ❌
**Location:** `src/services/BackendService.ts`

**When it happens:**
- Backend server is unreachable (network issues, server down)
- Health check endpoint (`/api/test`) fails or times out
- Backend URL is misconfigured

**Code:**
```typescript
private async checkBackendHealth(): Promise<boolean> {
  // If health check fails, sets useMockData = true
  if (!this.isBackendAvailable) {
    this.config.useMockData = true;
  }
}
```

**What happens:**
- All API calls use mock data instead of real backend
- Console shows: `⚠️ Backend not available, switching to mock data`
- User sees sample trips, itineraries, etc.

---

### 2. **API Call Fails (Network/Server Errors)** 🌐
**Location:** `src/services/BackendService.ts` (all methods)

**When it happens:**
- Network timeout (408, 504 errors)
- Server errors (500, 502, 503)
- Connection refused
- Any exception during API call

**Code:**
```typescript
async createTrip(tripData: any, token?: string) {
  try {
    return await backendApiCall(...);
  } catch (error) {
    console.warn('Backend call failed, using mock data:', error);
    // Returns mock trip data
    return { success: true, data: this.generateMockTrip() };
  }
}
```

**What happens:**
- Individual API call falls back to mock data
- Other API calls still attempt real backend
- Console shows: `❌ Backend call failed, using mock data`

---

### 3. **401 Unauthorized (Missing/Invalid Token)** 🔐
**Location:** `src/config/backend-api.ts` + `src/services/BackendService.ts`

**When it happens:**
- User is **NOT logged in** (no session token)
- Token is expired or invalid
- Token is missing from request headers

**Code:**
```typescript
// In backend-api.ts - 401 errors are thrown, not caught
case 401:
  const authError = createBackendAPIError(
    '認証が必要です。ログインしてください。',
    401,
    'UNAUTHORIZED',
    endpoint
  );
  throw authError; // This error propagates up

// In BackendService.ts - catch block handles it
catch (error) {
  console.warn('Backend call failed, using mock data:', error);
  return { success: true, data: mockData };
}
```

**What happens:**
- **Protected endpoints** (like `/api/trips`) return 401
- Error is caught and falls back to mock data
- Console shows: `❌ Backend API Error (/api/trips): Invalid or expired token`
- Then: `Backend call failed, using mock data`

**Important:** 
- **Public endpoints** (like `/api/openai/generate`) work WITHOUT authentication
- They use Supabase anon key, not user token
- Plan generation works even when not logged in!

---

### 4. **User Not Logged In (No Session)** 👤
**Location:** `src/contexts/BackendTripContext.tsx`

**When it happens:**
- User hasn't signed in
- Session expired
- User cleared browser storage

**Code:**
```typescript
const fetchTrips = async () => {
  if (!session) {
    console.log('No session, returning early');
    return; // Doesn't even attempt API call
  }
  // ... makes API call with token
};
```

**What happens:**
- Some functions return early without calling API
- Others attempt API call without token → get 401 → fallback to mock
- Console shows: `No session, returning early` or `hasToken: false`

---

## 📊 Flow Diagram

```
User Action
    ↓
Check: Is user logged in?
    ├─ NO → Use mock data OR skip call
    └─ YES → Check: Is backend healthy?
              ├─ NO → Use mock data
              └─ YES → Make API call
                        ├─ Success → Use real data ✅
                        ├─ 401 → Use mock data (auth issue)
                        └─ Other error → Use mock data (network/server issue)
```

---

## 🎯 Specific Scenarios

### Scenario 1: User Not Logged In + Plan Generation
**What happens:**
- ✅ Plan generation **WORKS** (uses Supabase anon key)
- ❌ Saving trip **FAILS** → falls back to mock/local storage
- Console: `User not authenticated, skipping backend save`

**Code:**
```typescript
// In Confirmation.tsx
if (session?.access_token) {
  planId = await planGenerationService.savePlan(...);
} else {
  planId = `local-plan-${Date.now()}`; // Mock ID
}
```

---

### Scenario 2: User Logged In + Backend Down
**What happens:**
- Health check fails → `useMockData = true`
- All API calls use mock data
- User sees sample trips, can't save real data

**Console:**
```
⚠️ Backend health check failed
⚠️ Backend not available, switching to mock data
Using mock data for trips
```

---

### Scenario 3: User Logged In + Invalid Token
**What happens:**
- API call made with expired token
- Backend returns 401
- Error caught → falls back to mock data

**Console:**
```
🚀 Backend API Request: POST /api/trips
📡 Backend API Response: 401
❌ Backend API Error: Invalid or expired token
Backend call failed, using mock data
```

---

## 🔑 Key Points

### Authentication vs Authorization

1. **Authentication (Who you are):**
   - Determined by `session?.access_token`
   - Required for: saving trips, viewing user trips, user-specific data
   - **NOT required for:** plan generation (uses anon key)

2. **Authorization (What you can do):**
   - Determined by backend after validating token
   - Backend checks: token validity, user permissions, RLS policies
   - Returns 401 if token invalid, 403 if insufficient permissions

### Public vs Protected Endpoints

**Public Endpoints (work without login):**
- `/api/openai/generate` - Uses Supabase anon key
- `/api/esim/plans` - Public catalog
- `/api/google-maps/*` - Public API

**Protected Endpoints (require login):**
- `/api/trips/*` - User's trips
- `/api/itineraries/*` - User's itineraries
- `/api/payments/*` - User's payments
- `/api/subscriptions/*` - User's subscriptions

---

## 🛠️ How to Debug

### Check if mock data is being used:

1. **Open browser console**
2. **Look for these messages:**
   - `Using mock data for...` → Mock data active
   - `Backend call failed, using mock data` → Fallback triggered
   - `hasToken: false` → No authentication token
   - `No session, returning early` → User not logged in

### Check authentication status:

```javascript
// In browser console
const { session } = useSupabaseAuth();
console.log('Session:', session);
console.log('Token:', session?.access_token);
```

### Check backend health:

```javascript
// In browser console
import { backendHealthCheck } from './config/backend-api';
backendHealthCheck().then(healthy => {
  console.log('Backend healthy:', healthy);
});
```

---

## ✅ Summary

**Mock data is used when:**
1. ❌ Backend is unreachable (health check fails)
2. ❌ Network/server errors occur
3. ❌ **User is not logged in** (for protected endpoints)
4. ❌ Token is invalid/expired (401 errors)

**Mock data is NOT used when:**
1. ✅ User is logged in with valid token
2. ✅ Backend is healthy and reachable
3. ✅ API calls succeed
4. ✅ Using public endpoints (plan generation, etc.)

**Most common reason:** User not logged in → 401 error → fallback to mock data

---

## 🔧 Fixing Mock Data Issues

### If you see mock data when you shouldn't:

1. **Check if user is logged in:**
   - Look for login button/status
   - Check console for `hasToken: false`

2. **Check backend health:**
   - Look for `⚠️ Backend health check failed`
   - Verify backend URL is correct

3. **Check network:**
   - Open DevTools → Network tab
   - See if API calls are failing

4. **Check token:**
   - Verify `session?.access_token` exists
   - Check if token is expired

### To force real data:
- Log in with valid credentials
- Ensure backend is running and accessible
- Check that Supabase anon key is configured

