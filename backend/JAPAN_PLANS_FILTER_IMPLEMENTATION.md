# Japan (JP) Plans Filter Implementation

## Overview
Modified the eSIM Go API integration to **only return Japan (JP) plans** to the frontend.

## Changes Made

### Backend Route: `/api/esim/plans`

**File:** `goon-main/backend/routes/esim.js`

#### Key Changes:

1. **Pagination Search**: 
   - Now searches through the first 20 pages of the catalogue API
   - Collects all Japan bundles from multiple pages
   - This ensures we get all available Japan plans, not just those on the first page

2. **Japan Filtering**:
   - Filters bundles to only include those with:
     - ISO code: "JP" or "JPN"
     - Country name containing "Japan"
   - Validates both string and object country formats

3. **Coverage Normalization**:
   - Ensures all plans show "Japan" in their coverage field
   - Handles various API response formats for country data

4. **Error Handling**:
   - If no Japan bundles are found, throws error to trigger fallback
   - Fallback plans are already Japan-specific

## How It Works

1. **API Query**: Searches through pages 1-20 of the eSIM Go catalogue
2. **Filtering**: Each page's bundles are filtered for Japan (ISO: JP)
3. **Collection**: All Japan bundles from searched pages are collected
4. **Normalization**: Bundles are normalized to the frontend format
5. **Response**: Only Japan plans are returned to the frontend

## Benefits

- ✅ **Only Japan plans shown**: Users only see relevant plans for Japan
- ✅ **Complete coverage**: Searches multiple pages to find all Japan bundles (typically 20+ plans)
- ✅ **Proper formatting**: Plans are normalized with correct data amounts, validity, and pricing
- ✅ **Fallback support**: If API fails, fallback plans are also Japan-specific

## Expected Results

The frontend will now display:
- **24 Japan bundles** (when API is working)
- Plans include:
  - Fixed data plans (1GB, 2GB, 3GB, 5GB, 10GB, 20GB)
  - Unlimited plans (Lite, Essential, Plus tiers)
  - Various durations (1-30 days)
  - Prices ranging from $2.08 to $59.23

## Testing

To verify the filter is working:
1. Check backend logs for: `🇯🇵 Processing X Japan bundles for normalization`
2. Frontend should only show plans with "Japan" in coverage
3. All plans should have ISO code "JP" in their country data

## Notes

- The API search is limited to 20 pages for performance (typically finds all Japan plans)
- If more Japan plans exist beyond page 20, they won't be included
- The filter is applied server-side, so frontend receives only Japan plans


