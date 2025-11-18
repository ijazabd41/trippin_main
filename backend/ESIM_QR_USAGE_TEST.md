# eSIM QR Code & Usage Data Testing

## Overview

This document explains how to test if your code correctly extracts and displays QR codes and remaining data from the eSIM Go API.

## What This Tests

1. **QR Code Extraction** - Verifies the code can extract QR codes from the assignments endpoint
2. **Usage Data Extraction** - Verifies the code can extract and calculate remaining data
3. **Response Format Handling** - Tests handling of different API response formats
4. **Data Conversion** - Verifies MB to GB conversion for frontend display

## How to Use

### Step 1: Get an Order Reference

You need an order reference to test QR codes and usage data. You can get one by:

**Option A: Use Validation Mode (Recommended for Testing)**
```bash
cd goon-main/backend
node test-esim-validation.js
```
This will create a validation order and return an order reference (if validation succeeds).

**Option B: Use an Existing Order**
- Check your eSIM Go dashboard for existing orders
- Use the order reference/ID from a previous purchase

**Option C: Make a Real Purchase**
- Make a small test purchase through your application
- Use the order reference from the purchase response

### Step 2: Run the QR & Usage Test

```bash
cd goon-main/backend
node test-esim-qr-usage.js
```

Or with an order reference:
```bash
node test-esim-qr-usage.js <order-reference>
```

### Step 3: Review the Results

The script will test:
1. ✅ Fetching existing orders
2. ✅ Extracting QR code from assignments endpoint
3. ✅ Extracting usage data from assignments endpoint
4. ✅ Verifying data format matches frontend expectations

## Expected Results

### QR Code Extraction

**Success:**
```
✅ QR Code Extraction: SUCCESS
   → Your code can extract and display QR codes correctly
   → QR code format is compatible with eSIM installation
```

**QR Code Format:**
- Should be in format: `LPA:1$smdp-address$matching-id`
- This is the standard eSIM QR code format for installation

### Usage Data Extraction

**Success:**
```
✅ Usage Data Extraction: SUCCESS
   → Your code can extract and calculate usage data correctly
   → Format matches frontend expectations:
      usage: { used: 1.0, total: 3.0 }
```

**Usage Data Format:**
- `used`: Data used in GB (number)
- `total`: Total data in GB (number)
- `dataRemainingMb`: Remaining data in MB (number)
- `dataUsedMb`: Used data in MB (number)
- `dataTotalMb`: Total data in MB (number)
- `percentage`: Usage percentage (0-100)

## API Endpoints Used

### 1. Get Orders
**GET** `https://api.esim-go.com/v2.4/orders`

Returns list of orders with order references.

### 2. Get Assignments (QR Code & Usage)
**GET** `https://api.esim-go.com/v2.4/esims/assignments/{orderReference}`

Returns:
- QR code (RSP URL or constructed from SMDP + Matching ID)
- ICCID
- Activation code (Matching ID)
- SMDP Address
- Usage data (dataRemainingMb, dataUsedMb, dataTotalMb)

## Response Format Handling

The code handles multiple response formats:

### Format 1: Single Object
```json
{
  "RSP URL": "LPA:1$smdp.example.com$matching-id-123",
  "ICCID": "89012345678901234567",
  "Matching ID": "matching-id-123",
  "SMDP Address": "smdp.example.com",
  "dataRemainingMb": 2048,
  "dataUsedMb": 1024,
  "dataTotalMb": 3072
}
```

### Format 2: Array of Objects
```json
[
  {
    "rspUrl": "LPA:1$smdp.example.com$matching-id-123",
    "iccid": "89012345678901234567",
    "matchingId": "matching-id-123",
    "smdpAddress": "smdp.example.com",
    "dataRemainingMb": 2048,
    "dataUsedMb": 1024,
    "dataTotalMb": 3072
  }
]
```

### Format 3: ZIP File
Some responses may return a ZIP file containing QR code PNG images. The code currently handles JSON responses. ZIP file handling would need additional implementation.

## Field Name Variations Handled

The code checks for multiple field name variations:

**QR Code:**
- `RSP URL` (with spaces)
- `rspUrl` (camelCase)
- `qrCode`
- `qr`

**ICCID:**
- `ICCID` (uppercase)
- `iccid` (lowercase)

**Activation Code:**
- `Matching ID` (with space)
- `matchingId` (camelCase)
- `matching_id` (snake_case)

**SMDP Address:**
- `SMDP Address` (with space)
- `smdpAddress` (camelCase)
- `smdp_address` (snake_case)

**Usage Data:**
- `dataRemainingMb` / `Data Remaining MB`
- `dataUsedMb` / `Data Used MB`
- `dataTotalMb` / `Data Total MB`
- `dataRemaining` / `remainingData`
- `dataUsed` / `usedData`
- `dataTotal` / `totalData`

## QR Code Construction

If the API doesn't return a direct QR code URL, the code constructs it from components:

```
LPA:1${smdpAddress}$${matchingId}
```

Example:
```
LPA:1$smdp.example.com$matching-id-123
```

This format is compatible with eSIM installation on iOS and Android devices.

## Usage Data Calculation

The code calculates usage data in multiple ways:

1. **Direct from API:**
   - If `dataUsedMb` is provided, use it directly
   - Convert MB to GB: `usedGB = dataUsedMb / 1024`

2. **Calculated from Remaining:**
   - If `dataRemainingMb` and `dataTotalMb` are provided:
     - `usedGB = (dataTotalMb - dataRemainingMb) / 1024`

3. **Calculated from Total:**
   - If `dataRemainingMb` and plan total are known:
     - `usedGB = totalGB - (dataRemainingMb / 1024)`

4. **Fallback to Plan Data:**
   - If API doesn't provide usage data, use plan's `dataAmount`
   - Convert plan data to GB if needed

## Frontend Integration

The extracted data is formatted to match frontend expectations:

**Order Object:**
```typescript
{
  qrCode: string,           // QR code for eSIM installation
  usage: {
    used: number,           // Used data in GB
    total: number           // Total data in GB
  },
  iccid: string,            // ICCID for reference
  activationCode: string,  // Activation code
  smdpAddress: string      // SMDP server address
}
```

**Usage Display:**
- Frontend shows: `{plan.usage.used}GB / {plan.usage.total}GB`
- Progress bar: `(plan.usage.used / plan.usage.total) * 100%`

## Troubleshooting

### No QR Code Found

**Possible Causes:**
1. Order is still processing (wait a few minutes)
2. Order reference is incorrect
3. API response format changed
4. Order doesn't have assignments yet

**Solutions:**
- Verify order reference is correct
- Check order status in eSIM Go dashboard
- Wait for order to fully process
- Check API response format matches expected structure

### No Usage Data Found

**Possible Causes:**
1. Plan is unlimited (no usage tracking)
2. Order is too new (usage not available yet)
3. API doesn't return usage data for this order type
4. Field names don't match expected variations

**Solutions:**
- Check if plan is unlimited (usage should show as unlimited)
- Wait for usage data to become available
- Verify API response contains usage fields
- Check field name variations in code

### API Returns 404

**Possible Causes:**
1. Order reference doesn't exist
2. Assignments endpoint path is incorrect
3. Order hasn't been processed yet

**Solutions:**
- Verify order reference from orders endpoint
- Check endpoint path: `/esims/assignments/{orderReference}`
- Ensure order is in a processed state

### API Returns 403

**Possible Causes:**
1. API key doesn't have permission
2. API key is invalid
3. Account doesn't have access to assignments

**Solutions:**
- Verify API key is correct
- Check API key permissions in eSIM Go dashboard
- Ensure account has access to assignments endpoint

## Testing Checklist

- [ ] Can fetch existing orders
- [ ] Can extract QR code from assignments endpoint
- [ ] QR code format is correct (LPA:1$...)
- [ ] Can extract usage data from assignments endpoint
- [ ] Usage data is calculated correctly (MB to GB)
- [ ] Usage format matches frontend expectations
- [ ] Handles array response format
- [ ] Handles object response format
- [ ] Handles different field name variations
- [ ] Constructs QR code from components if needed
- [ ] Handles unlimited plans correctly
- [ ] Handles missing data gracefully

## Related Files

- `test-esim-qr-usage.js` - QR code and usage data test script
- `test-esim-validation.js` - Validation mode test (to get order reference)
- `routes/esim.js` - Main eSIM routes (lines 908-966 for QR, 1416-1566 for usage)
- `src/pages/ESIMManagement.tsx` - Frontend component that displays QR codes and usage

## References

- eSIM Go API Documentation: https://docs.esim-go.com/api/v2_4/
- eSIM Go Help: https://help.esim-go.com
- LPA QR Code Format: https://www.gsma.com/newsroom/wp-content/uploads/TS.43-v4.0.pdf

