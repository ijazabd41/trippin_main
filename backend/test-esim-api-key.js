import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const API_KEY = process.env.ESIMGO_API_KEY || process.env.ESIM_TOKEN || '';
const BASE_URL = process.env.ESIMGO_BASE_URL || process.env.ESIM_BASE || 'https://api.esim-go.com/v2.4';
const ENDPOINT = '/catalogue?page=1';

console.log('🔍 Testing eSIM Go API Key...\n');
console.log('Configuration:');
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  Endpoint: ${ENDPOINT}`);
console.log(`  API Key: ${API_KEY ? `${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)} (${API_KEY.length} chars)` : 'NOT SET'}`);
console.log('');

if (!API_KEY || API_KEY.trim() === '') {
  console.error('❌ ERROR: API key is not set!');
  console.error('   Please set ESIMGO_API_KEY or ESIM_TOKEN in your .env file');
  process.exit(1);
}

const url = `${BASE_URL}${ENDPOINT}`;
console.log(`📡 Making request to: ${url}\n`);

try {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  });

  console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
  console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  
  if (response.ok) {
    console.log('\n✅ SUCCESS! API key is valid and working.\n');
    try {
      const json = JSON.parse(responseText);
      console.log('Response data (first 500 chars):');
      console.log(JSON.stringify(json, null, 2).substring(0, 500));
    } catch (e) {
      console.log('Response text:', responseText.substring(0, 500));
    }
  } else {
    console.log('\n❌ ERROR: API request failed\n');
    console.log('Response body:', responseText);
    
    if (response.status === 403) {
      console.log('\n🔴 403 Forbidden - Possible causes:');
      console.log('  1. API key is invalid or expired');
      console.log('  2. API key does not have required permissions');
      console.log('  3. API access is not enabled for your account');
      console.log('  4. API key format is incorrect');
      console.log('\n💡 Next steps:');
      console.log('  1. Log into https://sso.esim-go.com/login');
      console.log('  2. Go to Account Settings → API Details');
      console.log('  3. Verify API key is active and matches: ' + API_KEY.substring(0, 10) + '...');
      console.log('  4. Check if API access is enabled for your account');
      console.log('  5. Generate a new API key if needed');
    } else if (response.status === 401) {
      console.log('\n🔴 401 Unauthorized - API key authentication failed');
      console.log('   The API key format might be incorrect or the key is invalid');
    } else if (response.status === 404) {
      console.log('\n🔴 404 Not Found - Endpoint does not exist');
      console.log('   Check if the API endpoint path is correct');
    }
  }
} catch (error) {
  console.error('\n❌ Network/Request Error:', error.message);
  console.error('Stack:', error.stack);
}

