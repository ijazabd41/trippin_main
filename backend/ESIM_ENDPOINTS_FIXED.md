# eSIM API Endpoints - Fixed According to Documentation

## ✅ All Endpoints Updated

Based on eSIM Go API v2.4 documentation: https://docs.esim-go.com/api/v2_4/

### Fixed Endpoints

1. **Catalogue (Plans)**
   - ✅ **Old:** `/api/plans` ❌
   - ✅ **New:** `/catalogue` ✅
   - **Method:** GET
   - **Response:** `{ bundles: [...] }`
   - **Status:** Fixed ✓

2. **Purchase (Create Order)**
   - ✅ **Old:** `/api/purchase` ❌
   - ✅ **New:** `/orders` ✅
   - **Method:** POST
   - **Payload:** `{ order: [{ type: 'bundleAssignment', item: 'bundle_name', quantity: 1 }] }`
   - **Status:** Fixed ✓

3. **Get Orders**
   - ✅ **Old:** Not using API endpoint
   - ✅ **New:** `/orders` ✅
   - **Method:** GET
   - **Status:** Added ✓

4. **Get eSIM Assignments**
   - ✅ **Old:** Not implemented
   - ✅ **New:** `/esims/assignments/{orderReference}` ✅
   - **Method:** GET
   - **Purpose:** Get QR code, ICCID, and activation details
   - **Status:** Added ✓

5. **Activation**
   - ✅ **Old:** `/api/orders/{orderId}/activate` ❌
   - ✅ **New:** Uses assignments endpoint (automatic activation)
   - **Method:** GET (via assignments)
   - **Status:** Fixed ✓

6. **Usage**
   - ✅ **Old:** `/api/orders/{orderId}/usage` ❌
   - ✅ **New:** Uses assignments endpoint
   - **Method:** GET (via assignments)
   - **Status:** Fixed ✓

7. **Profiles**
   - ✅ **Old:** `/api/profiles` ❌
   - ✅ **New:** Not in v2.4 API (using database fallback)
   - **Status:** Fixed ✓

### Authentication
- ✅ **Fixed:** Changed from `Authorization: Bearer` to `X-API-Key` header
- ✅ **Status:** Correct ✓

### Base URL
- ✅ **Fixed:** Includes version: `https://api.esim-go.com/v2.4`
- ✅ **Status:** Correct ✓

### Data Normalization
- ✅ **Fixed:** Handles `{ bundles: [...] }` response structure
- ✅ **Fixed:** Converts MB to GB format
- ✅ **Fixed:** Maps bundle fields correctly (name, dataAmount, duration, price, countries)
- ✅ **Status:** Correct ✓

### Purchase Flow Updates
- ✅ **Fixed:** Plan lookup from catalogue by bundle name
- ✅ **Fixed:** Order payload structure matches API requirements
- ✅ **Fixed:** Fetches eSIM assignments after purchase to get QR code
- ✅ **Status:** Correct ✓

## 📊 Summary

- **Total Endpoints Reviewed:** 7
- **Endpoints Fixed:** 7
- **Authentication Method:** Fixed ✓
- **Base URL:** Fixed ✓
- **Data Handling:** Fixed ✓

## 🎯 All paths now match eSIM Go API v2.4 documentation!

