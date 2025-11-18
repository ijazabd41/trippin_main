import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const API_KEY = process.env.ESIMGO_API_KEY || process.env.ESIM_TOKEN || '';
const BASE_URL = process.env.ESIMGO_BASE_URL || process.env.ESIM_BASE || 'https://api.esim-go.com/v2.4';

console.log('🔍 Testing eSIM Go API with VALIDATION mode...\n');
console.log('Configuration:');
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  API Key: ${API_KEY ? `${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)} (${API_KEY.length} chars)` : 'NOT SET'}`);
console.log('');

if (!API_KEY || API_KEY.trim() === '') {
  console.error('❌ ERROR: API key is not set!');
  console.error('   Please set ESIMGO_API_KEY or ESIM_TOKEN in your .env file');
  process.exit(1);
}

// Helper function to make eSIM API calls
async function callESIMAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  };

  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };

  if (options.body && typeof options.body === 'object') {
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, requestOptions);
  const responseText = await response.text();

  if (!response.ok) {
    const error = new Error(`eSIM API error: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
    error.status = response.status;
    error.statusText = response.statusText;
    error.body = responseText;
    throw error;
  }

  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    return responseText;
  }
}

// Helper: Find a Japan plan from catalogue
async function findJapanPlan(maxPages = 20) {
  console.log('🔍 Searching for a Japan plan in catalogue...\n');
  
  for (let page = 1; page <= maxPages; page++) {
    try {
      const endpoint = `/catalogue?page=${page}`;
      const response = await callESIMAPI(endpoint);
      const bundles = response?.bundles || [];
      
      if (bundles.length === 0) break;
      
      // Filter for Japan bundles
      const japanBundle = bundles.find((bundle) => {
        if (!bundle || !bundle.countries) return false;
        return bundle.countries.some((country) => {
          if (typeof country === 'object' && country !== null) {
            const iso = (country.iso || '').toUpperCase();
            const name = (country.name || '').toLowerCase();
            return iso === 'JP' || iso === 'JPN' || name.includes('japan');
          }
          if (typeof country === 'string') {
            const countryLower = country.toLowerCase();
            return countryLower === 'jp' || countryLower === 'japan' || countryLower.includes('japan');
          }
          return false;
        });
      });
      
      if (japanBundle) {
        console.log(`✅ Found Japan plan on page ${page}:`);
        console.log(`   Name: ${japanBundle.name}`);
        console.log(`   Description: ${japanBundle.description || 'N/A'}`);
        console.log(`   Data: ${japanBundle.dataAmount || 'N/A'}MB`);
        console.log(`   Duration: ${japanBundle.duration || 'N/A'} days`);
        console.log(`   Price: $${japanBundle.price || 'N/A'}`);
        console.log('');
        return japanBundle;
      }
      
      if (response.pageCount && page >= response.pageCount) break;
    } catch (err) {
      if (page === 1) throw err;
      break;
    }
  }
  
  return null;
}

// Test validation mode
async function testValidationMode() {
  try {
    // Step 1: Find a Japan plan
    const plan = await findJapanPlan(20);
    
    if (!plan) {
      console.error('❌ No Japan plan found in catalogue');
      console.error('   Cannot proceed with validation test');
      process.exit(1);
    }

    // Step 2: Prepare validation payload
    // Use the same structure as transaction, but with type: "validate"
    const planItemIdentifier = plan.sku || plan.bundleCode || plan.bundle_code || plan.code || plan.id || plan.productId || plan.product_id || plan.name;
    
    const validationPayload = {
      type: 'validate', // Use "validate" instead of "transaction" for testing
      order: [{
        item: planItemIdentifier, // Bundle name/identifier from catalogue
        quantity: 1
      }],
      assign: true, // Automatically assign bundle to eSIM
      iccid: '' // Empty string to assign to new eSIM when assign is true
    };

    console.log('📦 Validation Payload:');
    console.log(JSON.stringify(validationPayload, null, 2));
    console.log('');

    // Step 3: Submit validation request
    console.log('📡 Submitting validation request to POST /orders...\n');
    
    const validationResponse = await callESIMAPI('/orders', {
      method: 'POST',
      body: validationPayload
    });

    console.log('✅ VALIDATION SUCCESS! API integration is working correctly.\n');
    console.log('📋 Validation Response:');
    console.log(JSON.stringify(validationResponse, null, 2));
    console.log('');

    // Step 4: Interpret results
    console.log('📊 Validation Results Analysis:');
    console.log('─'.repeat(80));
    
    if (validationResponse && typeof validationResponse === 'object') {
      // Check for bundle details and cost
      if (validationResponse.cost || validationResponse.price || validationResponse.amount) {
        const cost = validationResponse.cost || validationResponse.price || validationResponse.amount;
        const currency = validationResponse.currency || 'USD';
        console.log(`✅ Bundle details and cost returned: ${currency} ${cost}`);
        console.log('   → Your API integration and bundle are VALID');
      }
      
      if (validationResponse.reference || validationResponse.orderReference || validationResponse.id) {
        console.log(`✅ Order reference returned: ${validationResponse.reference || validationResponse.orderReference || validationResponse.id}`);
        console.log('   → Order structure is correct');
      }
      
      if (validationResponse.status) {
        console.log(`✅ Status: ${validationResponse.status}`);
      }
      
      // Check for error indicators
      const responseStr = JSON.stringify(validationResponse).toLowerCase();
      if (responseStr.includes('insufficient') || responseStr.includes('balance') || responseStr.includes('zero')) {
        console.log('\n⚠️  WARNING: Response indicates account balance issues:');
        console.log('   → This suggests the issue is your account balance/credit');
        console.log('   → The API integration itself is working correctly');
        console.log('   → You need to top up your eSIM Go account balance');
      }
    } else {
      console.log('⚠️  Unexpected response format');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Next Steps:');
    console.log('   1. If validation succeeded → Your API integration is correct');
    console.log('   2. If you see balance/credit errors → Top up your eSIM Go account');
    console.log('   3. Once validated, switch "type" back to "transaction" for real purchases');
    console.log('   4. The validation does NOT create a real order or charge your account\n');

  } catch (error) {
    console.error('\n❌ VALIDATION FAILED\n');
    console.error('Error Details:');
    console.error(`   Status: ${error.status || 'N/A'}`);
    console.error(`   Message: ${error.message || error}`);
    if (error.body) {
      console.error(`   Response Body: ${error.body.substring(0, 500)}`);
    }
    console.error('');

    // Interpret common errors
    if (error.status === 403) {
      console.error('🔴 403 Forbidden - Possible causes:');
      console.error('   1. API key is invalid or expired');
      console.error('   2. API key does not have required permissions');
      console.error('   3. API access is not enabled for your account');
    } else if (error.status === 400 || error.status === 422) {
      console.error('🔴 Bad Request - Possible causes:');
      console.error('   1. Invalid bundle/item identifier');
      console.error('   2. Missing required fields in payload');
      console.error('   3. Invalid payload structure');
    } else if (error.status === 402 || (error.body && error.body.toLowerCase().includes('insufficient'))) {
      console.error('🔴 Payment/Balance Issue:');
      console.error('   1. Insufficient account balance');
      console.error('   2. Account balance is zero');
      console.error('   3. Need to top up eSIM Go account');
      console.error('   → This indicates the API integration is working, but account needs funding');
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify your API key is correct');
    console.error('   2. Check that the bundle/item identifier exists in the catalogue');
    console.error('   3. Ensure your eSIM Go account has sufficient balance');
    console.error('   4. Review the payload structure matches API documentation\n');
    
    process.exit(1);
  }
}

// Run the test
testValidationMode();

