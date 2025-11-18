# eSIM Go API Testing Guide

Complete guide for testing the eSIM Go API integration.

## Quick Start

1. **Test API Key:**
   ```bash
   node test-esim-api-key.js
   ```

2. **Test Validation Mode:**
   ```bash
   node test-esim-validation.js
   ```

3. **Test QR Code & Usage Data:**
   ```bash
   node test-esim-qr-usage.js [order-reference]
   ```

## Test Scripts Overview

### 1. `test-esim-api-key.js`
**Purpose:** Verify API key is valid and working

**What it tests:**
- API key authentication
- Basic API connectivity
- Catalogue endpoint access

**Usage:**
```bash
node test-esim-api-key.js
```

**Expected Result:**
- ✅ API key is valid
- ✅ Can access catalogue endpoint
- ✅ Returns bundle data

---

### 2. `test-esim-validation.js`
**Purpose:** Test API integration without making real purchases

**What it tests:**
- Validation mode (`type: "validate"`)
- Order payload structure
- Bundle/item identifier resolution
- Account balance verification

**Usage:**
```bash
node test-esim-validation.js
```

**Expected Result:**
- ✅ Validation succeeds with bundle details + cost
- ✅ API integration is valid
- ⚠️ If balance error → Integration works, but account needs funding

**Key Features:**
- Uses `type: "validate"` instead of `type: "transaction"`
- Does NOT create real orders
- Does NOT charge account
- Safe for testing

**See:** `ESIM_VALIDATION_TEST.md` for details

---

### 3. `test-esim-qr-usage.js`
**Purpose:** Test QR code and usage data extraction

**What it tests:**
- QR code extraction from assignments endpoint
- Usage data extraction and calculation
- Response format handling
- Data conversion (MB to GB)

**Usage:**
```bash
# Auto-detect order reference from existing orders
node test-esim-qr-usage.js

# Use specific order reference
node test-esim-qr-usage.js <order-reference>
```

**Expected Result:**
- ✅ QR code extracted correctly
- ✅ Usage data calculated correctly
- ✅ Format matches frontend expectations

**Prerequisites:**
- Need an order reference (from validation or real purchase)

**See:** `ESIM_QR_USAGE_TEST.md` for details

---

## Testing Workflow

### Step 1: Verify API Key
```bash
node test-esim-api-key.js
```
**Goal:** Ensure API key is valid before proceeding

### Step 2: Test Validation Mode
```bash
node test-esim-validation.js
```
**Goal:** Verify API integration works without spending money

**If validation succeeds:**
- ✅ Your integration is correct
- ✅ Bundle identifiers are valid
- ✅ Payload structure is correct
- ✅ Ready for real purchases

**If validation shows balance error:**
- ✅ Integration is working
- ⚠️ Account needs funding
- 💡 Top up eSIM Go account balance

### Step 3: Test QR Code & Usage (Optional)
```bash
# Get order reference from validation or existing order
node test-esim-qr-usage.js <order-reference>
```
**Goal:** Verify QR codes and usage data display correctly

**If test succeeds:**
- ✅ QR codes can be extracted
- ✅ Usage data can be calculated
- ✅ Frontend can display data correctly

---

## Environment Setup

### Required Environment Variables

Create `.env` file in `goon-main/backend/`:

```env
# eSIM Go API Configuration
ESIMGO_API_KEY=your_api_key_here
# OR
ESIM_TOKEN=your_api_key_here

# Optional: Custom base URL
ESIMGO_BASE_URL=https://api.esim-go.com/v2.4
# OR
ESIM_BASE=https://api.esim-go.com/v2.4
```

### Getting Your API Key

1. Log into https://sso.esim-go.com/login
2. Go to **Account Settings → API Details**
3. Copy your API key
4. Add to `.env` file

---

## Common Test Scenarios

### Scenario 1: First Time Setup

```bash
# 1. Test API key
node test-esim-api-key.js

# 2. Test validation
node test-esim-validation.js

# 3. If validation succeeds, you're ready!
```

### Scenario 2: Testing After Code Changes

```bash
# 1. Quick validation test
node test-esim-validation.js

# 2. If you have existing orders, test QR/usage
node test-esim-qr-usage.js
```

### Scenario 3: Debugging Balance Issues

```bash
# 1. Test validation (will show balance errors)
node test-esim-validation.js

# 2. If shows "insufficient funds" → Top up account
# 3. Retry validation
```

### Scenario 4: Testing QR Code Display

```bash
# 1. Get order reference (from validation or purchase)
node test-esim-validation.js

# 2. Test QR extraction
node test-esim-qr-usage.js <order-reference>

# 3. Verify QR code format is correct
```

---

## Understanding Test Results

### ✅ Success Indicators

**API Key Test:**
- Status: 200 OK
- Returns bundle data
- No authentication errors

**Validation Test:**
- Status: 200 OK
- Returns bundle details + cost
- No balance/credit errors

**QR/Usage Test:**
- QR code extracted
- Usage data calculated
- Format matches expectations

### ⚠️ Warning Indicators

**Balance Errors:**
- "Insufficient funds"
- "Balance zero"
- "Account balance low"

**Meaning:** Integration works, but account needs funding

**Action:** Top up eSIM Go account balance

### ❌ Error Indicators

**403 Forbidden:**
- API key invalid
- API key expired
- No API access permission

**Action:** Verify API key in dashboard

**404 Not Found:**
- Endpoint doesn't exist
- Order reference invalid
- Resource not available

**Action:** Check endpoint paths and order references

**400 Bad Request:**
- Invalid payload structure
- Missing required fields
- Invalid bundle identifier

**Action:** Review payload structure and bundle names

---

## Integration Points

### Backend Routes

**File:** `goon-main/backend/routes/esim.js`

**Key Functions:**
- `POST /api/esim/purchase` - Creates order (line 553-1074)
- `GET /api/esim/orders` - Gets user orders (line 1077-1297)
- `GET /api/esim/orders/:id/usage` - Gets usage data (line 1417-1566)

**QR Code Extraction:** Lines 908-966
**Usage Data Extraction:** Lines 1462-1524

### Frontend Components

**File:** `goon-main/src/pages/ESIMManagement.tsx`

**Displays:**
- QR codes for eSIM installation
- Usage data (used/total GB)
- Order status and details

**Expected Data Format:**
```typescript
{
  qrCode: string,
  usage: {
    used: number,  // GB
    total: number  // GB
  }
}
```

---

## Troubleshooting

### API Key Issues

**Problem:** 403 Forbidden errors

**Solutions:**
1. Verify API key in `.env` file
2. Check API key is active in dashboard
3. Ensure API access is enabled
4. Regenerate API key if needed

### Validation Issues

**Problem:** Validation fails with errors

**Solutions:**
1. Check bundle/item identifier exists
2. Verify payload structure matches API docs
3. Ensure account has API access
4. Check API endpoint paths

### QR Code Issues

**Problem:** QR code not found or invalid format

**Solutions:**
1. Verify order reference is correct
2. Check order is fully processed
3. Ensure assignments endpoint is accessible
4. Verify response format handling

### Usage Data Issues

**Problem:** Usage data not showing or incorrect

**Solutions:**
1. Check if plan is unlimited (no usage tracking)
2. Verify API returns usage fields
3. Check field name variations
4. Verify MB to GB conversion

---

## Best Practices

1. **Always test validation first** before real purchases
2. **Use validation mode** for development/testing
3. **Test QR/usage extraction** after making test purchases
4. **Keep API key secure** (never commit to git)
5. **Monitor account balance** regularly
6. **Test with different plan types** (limited, unlimited)
7. **Verify frontend display** matches backend data

---

## Related Documentation

- `ESIM_VALIDATION_TEST.md` - Detailed validation testing guide
- `ESIM_QR_USAGE_TEST.md` - QR code and usage data testing guide
- `ESIM_GO_API_INTEGRATION.md` - API integration documentation
- `ESIM_ENDPOINTS_FIXED.md` - Endpoint reference

---

## Support

If tests fail or you encounter issues:

1. Check error messages in test output
2. Review related documentation files
3. Verify API key and account status
4. Check eSIM Go API documentation: https://docs.esim-go.com/api/v2_4/
5. Contact eSIM Go support: https://help.esim-go.com

