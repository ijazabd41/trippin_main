# eSIM Go API - Japan (JP) Coverage Verification Report

**Date:** Generated automatically  
**API Version Tested:** v2.2 and v2.4  
**ISO Country Code:** JP (Japan)

## Executive Summary

✅ **Japan IS COVERED by eSIM Go API**

Japan (ISO code: JP) is confirmed to be in the eSIM Go supported coverage list. The verification was conducted by querying the eSIM Go API v2.4 catalogue endpoint and searching through all available bundles.

## Verification Method

1. **API Endpoint Tested:** 
   - Primary: `GET /v2.4/catalogue` (eSIM Go API v2.4)
   - Secondary: `GET /v2.2/networks` (eSIM Go API v2.2) - encountered parameter format issues

2. **Search Method:**
   - Searched through 104 pages of the catalogue (5,248 total bundles)
   - Filtered bundles by country ISO code "JP" and country name "Japan"

3. **Results:**
   - Found **24 Japan-specific bundles** across multiple pages
   - All bundles correctly identified with ISO code "JP" and country name "Japan"

## Coverage Details

### Available Bundles

eSIM Go provides **24 different bundles** for Japan, including:

#### Fixed Data Plans:
- **1GB / 7 Days** - $2.08
- **2GB / 15 Days** - $3.37
- **3GB / 30 Days** - $4.49
- **5GB / 30 Days** - $6.65
- **10GB / 30 Days** - $10.26
- **20GB / 30 Days** - $16.67

#### Unlimited Plans (Lite):
- **1 Day** - $2.24
- **3 Days** - $5.45
- **5 Days** - $8.65
- **7 Days** - $11.86
- **10 Days** - $16.67
- **15 Days** - $24.68

#### Unlimited Plans (Essential):
- **1 Day** - $2.69
- **3 Days** - $6.54
- **5 Days** - $10.38
- **7 Days** - $14.23
- **10 Days** - $20.00
- **15 Days** - $29.62

#### Unlimited Plans (Plus):
- **1 Day** - $5.38
- **3 Days** - $13.08
- **5 Days** - $20.76
- **7 Days** - $28.46
- **10 Days** - $40.01
- **15 Days** - $59.23

### Connectivity Information

**Supported Network Types:**
- ✅ 2G
- ✅ 3G
- ✅ 4G
- ❌ 5G (not listed in current bundles)

**Note:** While eSIM Go's website claims 250 5G agreements globally, the current API bundles for Japan only list 2G/3G/4G support. This may indicate:
- 5G plans are available but not yet reflected in the API catalogue
- 5G coverage may be included under 4G designation
- 5G bundles may be in a different category or require separate query

### Network Operators

**Specific operators are not listed in the bundle data.** The API response includes:
- Country information (name: "Japan", ISO: "JP", region: "Asia")
- Bundle specifications (data amount, duration, speed, price)
- Billing type and group classifications

Operator/network details would need to be obtained from:
- The v2.2 `/networks` endpoint (requires correct parameter format)
- Direct inquiry with eSIM Go support
- Bundle activation details after purchase

### Bundle Characteristics

All Japan bundles share these characteristics:
- **Autostart:** Yes (automatic activation)
- **Billing Type:** FixedCost
- **Region:** Asia
- **Unlimited Options:** Available in three tiers (Lite, Essential, Plus)
- **Fixed Data Options:** Available in multiple data/duration combinations

## API Endpoint Results

### ✅ v2.4 /catalogue Endpoint
- **Status:** Successfully queried
- **Result:** Found 24 Japan bundles
- **Method:** Paginated search through all 104 pages
- **ISO Code Used:** JP (confirmed in response)

### ⚠️ v2.2 /networks Endpoint
- **Status:** Parameter format issues encountered
- **Error Message:** "invalid request: either Country or ISO must be provided if not returning all countries"
- **Attempted Parameters:**
  - `?ISO=JP`
  - `?iso=jp`
  - `?Country=Japan`
  - `?country=japan`
- **Note:** The endpoint exists but requires a different parameter format (possibly POST body or different parameter names). Documentation may need to be consulted for the exact format.

## Conclusion

### Summary

1. ✅ **Japan is covered** - Confirmed through API query
2. ✅ **24 bundles available** - Multiple plan options for different needs
3. ✅ **ISO code JP confirmed** - Correctly identified in API responses
4. ✅ **Multiple plan types** - Fixed data and unlimited options available
5. ⚠️ **5G support** - Not explicitly listed in current bundles (may be available via other means)

### Connectivity Types Supported

- **2G:** ✅ Yes
- **3G:** ✅ Yes  
- **4G:** ✅ Yes
- **5G:** ⚠️ Not explicitly listed (website claims 5G agreements exist)

### Recommended Next Steps

1. **For v2.2 /networks endpoint:** Consult official API documentation for correct parameter format to retrieve specific network operator information
2. **For 5G support:** Contact eSIM Go support to confirm 5G availability and bundle names
3. **For operator details:** Use the networks endpoint once parameter format is confirmed, or check activation details after purchase

## Test Results Files

- Test script: `test-japan-specific.js`
- This report: `JAPAN_COVERAGE_VERIFICATION.md`

---

**Verification Completed:** ✅  
**Japan Coverage Status:** ✅ CONFIRMED  
**Total Bundles Found:** 24  
**Price Range:** $2.08 - $59.23


