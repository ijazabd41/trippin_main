# eSIM API Validation Mode Testing

## Overview

This document explains how to test the eSIM Go API integration using **validation mode** before making real purchases.

## What is Validation Mode?

Validation mode allows you to test your API integration without creating actual orders or charging your account. It uses the same endpoint and payload structure as real purchases, but with `type: "validate"` instead of `type: "transaction"`.

## Benefits

- ✅ Test API integration without spending money
- ✅ Verify bundle/item identifiers are correct
- ✅ Check account balance and API key validity
- ✅ Validate payload structure before production
- ✅ No real orders created, no account charges

## How to Use

### Step 1: Run the Validation Test Script

```bash
cd goon-main/backend
node test-esim-validation.js
```

### Step 2: Review the Results

The script will:
1. Search for a Japan plan in the catalogue
2. Create a validation request with `type: "validate"`
3. Submit to `POST https://api.esim-go.com/v2.4/orders`
4. Display the response

### Step 3: Interpret the Response

**Success Response (200 OK):**
```json
{
  "reference": "order_ref_123",
  "status": "validated",
  "cost": 10.50,
  "currency": "USD",
  "bundle": {
    "name": "Japan 3GB - 15 Days",
    "dataAmount": 3072,
    "duration": 15
  }
}
```

✅ **If you see bundle details + cost** → Your API integration and bundle are **VALID**

**Error Response (402/403/400):**
```json
{
  "error": "Insufficient funds",
  "message": "Account balance is zero"
}
```

⚠️ **If you see balance/credit errors** → This indicates:
- The API integration is working correctly
- The issue is your account balance/credit
- You need to top up your eSIM Go account

## Request Payload Structure

### Validation Mode (Testing)
```json
{
  "type": "validate",
  "order": [
    {
      "item": "bundle_name_from_catalogue",
      "quantity": 1
    }
  ],
  "assign": true,
  "iccid": ""
}
```

### Transaction Mode (Real Purchase)
```json
{
  "type": "transaction",
  "order": [
    {
      "item": "bundle_name_from_catalogue",
      "quantity": 1
    }
  ],
  "assign": true,
  "iccid": ""
}
```

**Note:** The only difference is `type: "validate"` vs `type: "transaction"`

## API Endpoint

**POST** `https://api.esim-go.com/v2.4/orders`

**Headers:**
```
X-API-Key: your_api_key
Content-Type: application/json
```

## Common Scenarios

### Scenario 1: Validation Succeeds
```
✅ Bundle details and cost returned: USD 10.50
✅ Order reference returned: order_ref_123
✅ Status: validated
```
**Action:** Your integration is correct! Switch to `type: "transaction"` for real purchases.

### Scenario 2: Insufficient Balance Error
```
⚠️ Response indicates account balance issues
→ This suggests the issue is your account balance/credit
→ The API integration itself is working correctly
```
**Action:** Top up your eSIM Go account balance, then retry.

### Scenario 3: Invalid Bundle Error
```
❌ Bad Request: Invalid bundle/item identifier
```
**Action:** Verify the bundle name exists in the catalogue. Check the item identifier format.

### Scenario 4: API Key Error
```
❌ 403 Forbidden: API key is invalid
```
**Action:** 
1. Verify API key in `.env` file
2. Check API key is active in eSIM Go dashboard
3. Ensure API access is enabled for your account

## Environment Variables

Make sure these are set in your `.env` file:

```env
ESIMGO_API_KEY=your_api_key_here
# OR
ESIM_TOKEN=your_api_key_here

ESIMGO_BASE_URL=https://api.esim-go.com/v2.4
# OR
ESIM_BASE=https://api.esim-go.com/v2.4
```

## Next Steps After Validation

Once validation succeeds:

1. ✅ **Verify Integration:** Your API calls are working correctly
2. ✅ **Check Balance:** Ensure account has sufficient funds
3. ✅ **Switch to Transaction:** Change `type: "validate"` to `type: "transaction"` in production code
4. ✅ **Test Real Purchase:** Make a small test purchase to verify end-to-end flow

## Troubleshooting

### Validation Returns Error
- Check API key is valid and active
- Verify bundle/item identifier exists in catalogue
- Ensure account has API access enabled
- Review payload structure matches API documentation

### Cannot Find Japan Plans
- The test script searches first 20 pages of catalogue
- If no Japan plans found, check:
  - API key has access to catalogue
  - Japan plans exist in your account's available bundles
  - Try increasing `maxPages` in the script

### Network/Connection Errors
- Verify internet connection
- Check eSIM Go API status
- Ensure firewall/proxy allows API access

## Related Files

- `test-esim-validation.js` - Validation test script
- `routes/esim.js` - Main eSIM purchase route (uses `type: "transaction"`)
- `test-esim-api-key.js` - API key verification script
- `test-japan-specific.js` - Japan plan search script

## References

- eSIM Go API Documentation: https://docs.esim-go.com/api/v2_4/
- eSIM Go Help: https://help.esim-go.com

