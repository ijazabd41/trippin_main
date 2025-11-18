# eSIM Purchase 404 Error - Troubleshooting Guide

## Error Description

When attempting to purchase an eSIM, you may see:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
Backend API Error (/api/esim/purchase): 404 Not Found
```

However, the app may still show "Purchase successful" because it falls back to mock data.

## Root Causes

### 1. Backend Server Not Running
The most common cause is that the backend server isn't running on port 3001.

**Solution:**
```bash
cd goon-main/backend
npm run dev
# or
node server.js
```

Verify the server is running:
- Check console for: `🚀 Trippin Backend API running on port 3001`
- Visit: http://localhost:3001/health
- Should return: `{ "status": "OK", ... }`

### 2. Route Not Registered
The route might not be properly mounted in the server.

**Check:**
- File: `goon-main/backend/server.js`
- Line 95 should have: `app.use('/api/esim', esimRoutes);`

### 3. Authentication Middleware Issue
The `authenticateToken` middleware might be rejecting the request.

**Check:**
- Ensure you're sending the Authorization header:
  ```
  Authorization: Bearer <your-token>
  ```
- Check backend logs for authentication errors

### 4. Path Mismatch
The frontend and backend paths must match exactly.

**Frontend calls:** `/api/esim/purchase` (POST)
**Backend defines:** `router.post('/purchase', ...)` mounted at `/api/esim`

This should work, but verify the base URL in `backend-api.ts`:
```typescript
BASE_URL: import.meta.env.DEV ? 'http://localhost:3001' : ...
```

## Diagnostic Steps

### Step 1: Verify Backend is Running
```bash
# Check if port 3001 is in use
# Windows:
netstat -ano | findstr :3001

# Mac/Linux:
lsof -i :3001
```

### Step 2: Test Backend Health
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": 123.45
}
```

### Step 3: Test eSIM Endpoint Directly
```bash
# Test the endpoint (will fail auth, but should return 401, not 404)
curl -X POST http://localhost:3001/api/esim/purchase \
  -H "Content-Type: application/json" \
  -d '{"planId":"test","customerInfo":{},"paymentMethodId":"test"}'
```

- **If 401/403:** Route exists, auth issue
- **If 404:** Route doesn't exist or server not running
- **If connection refused:** Backend not running

### Step 4: Check Backend Logs
Look for:
- `[TIMESTAMP] POST /api/esim/purchase` - Route was hit
- `📦 Purchase endpoint called:` - Handler executed
- Any error messages

### Step 5: Verify Route Registration Order
Check `server.js` - routes should be registered before the 404 handler:

```javascript
// ✅ Correct order
app.use('/api/esim', esimRoutes);  // Line 95
// ... other routes ...
app.use('*', (req, res) => { ... });  // 404 handler - should be last
```

## Quick Fixes

### Fix 1: Restart Backend Server
```bash
cd goon-main/backend
# Stop the server (Ctrl+C)
npm run dev
```

### Fix 2: Check Environment Variables
Ensure `.env` file exists in `goon-main/backend/`:
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_key
ESIMGO_API_KEY=your_esimgo_key
```

### Fix 3: Verify Route File Exports
Check `goon-main/backend/routes/esim.js`:
- Should export default: `export default router;`
- Should import in server.js: `import esimRoutes from './routes/esim.js';`

### Fix 4: Check CORS Settings
If frontend is on different port, ensure CORS is configured:
```javascript
// backend/server.js
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};
```

## Expected Behavior After Fix

1. **Before Purchase:**
   - Backend logs: `📦 Purchase endpoint called:`
   - Request reaches the handler

2. **During Purchase:**
   - Stripe payment processing
   - eSIM API call to provider
   - Database save

3. **After Purchase:**
   - Returns 200 with order data
   - Frontend shows success message
   - Order appears in ESIMManagement page

## Mock Data Fallback

Currently, if the backend call fails, the app falls back to mock data:
```typescript
// BackendService.ts line 631
catch (error) {
  console.warn('Backend call failed, using mock data:', error);
  return { success: true, data: { ...mock data... } };
}
```

This is why you see "Purchase successful" even with a 404 error.

**To disable mock fallback for testing:**
- Set `useMockData: false` in BackendService config
- Or remove the catch block temporarily

## Testing Checklist

- [ ] Backend server running on port 3001
- [ ] Health endpoint returns 200: `/health`
- [ ] Route exists: `/api/esim/purchase` (POST)
- [ ] Authentication token is valid
- [ ] CORS allows frontend origin
- [ ] Environment variables are set
- [ ] Backend logs show request received
- [ ] No 404 errors in backend logs

## Common Issues

### Issue: "Cannot GET /api/esim/purchase"
**Cause:** Using GET instead of POST
**Fix:** Frontend should use POST method

### Issue: "Route not found" but server is running
**Cause:** Route not mounted in server.js
**Fix:** Check `app.use('/api/esim', esimRoutes)` exists

### Issue: 404 only for purchase, other endpoints work
**Cause:** Route handler might have syntax error
**Fix:** Check `goon-main/backend/routes/esim.js` for syntax errors

### Issue: 404 in production but works locally
**Cause:** Base URL misconfiguration
**Fix:** Check `VITE_BACKEND_URL` environment variable

## Still Having Issues?

1. Check backend console for detailed error messages
2. Check browser Network tab for exact request/response
3. Verify the route path matches exactly: `/api/esim/purchase`
4. Ensure POST method is used (not GET)
5. Check authentication token is included in headers


