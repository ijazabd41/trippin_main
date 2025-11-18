// Detailed test of eSIM API - testing various endpoints and authentication
const token = '5mdcjufvuyN_PFyuUazHhSAYJrjdSnoft_AWrFfi';

const testConfigs = [
  // Test different base URLs
  { base: 'https://api.esim-go.com/v2.4', endpoint: '/api/plans', desc: 'v2.4 with /api/plans' },
  { base: 'https://api.esim-go.com/v2.4', endpoint: '/plans', desc: 'v2.4 with /plans' },
  { base: 'https://api.esim-go.com/v2', endpoint: '/api/plans', desc: 'v2 with /api/plans' },
  { base: 'https://api.esim-go.com/v2', endpoint: '/plans', desc: 'v2 with /plans' },
  { base: 'https://api.esim-go.com', endpoint: '/v2.4/api/plans', desc: 'root with /v2.4/api/plans' },
  { base: 'https://api.esim-go.com', endpoint: '/api/plans', desc: 'root with /api/plans' },
  { base: 'https://api.esim-go.com', endpoint: '/plans', desc: 'root with /plans' },
];

const authMethods = [
  { name: 'X-API-Key header', headers: { 'X-API-Key': token, 'Content-Type': 'application/json' } },
  { name: 'Bearer token', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } },
  { name: 'Query param', headers: { 'Content-Type': 'application/json' }, addQuery: true }
];

async function testEndpoint(config, authMethod) {
  const url = authMethod.addQuery 
    ? `${config.base}${config.endpoint}?api_key=${token}`
    : `${config.base}${config.endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: authMethod.headers
    });
    
    const status = response.status;
    const text = await response.text();
    
    if (status === 200) {
      console.log(`   ✅ SUCCESS with ${authMethod.name}!`);
      try {
        const json = JSON.parse(text);
        console.log(`   📊 Response: ${JSON.stringify(json).substring(0, 400)}`);
      } catch {
        console.log(`   📊 Response: ${text.substring(0, 400)}`);
      }
      return true;
    } else if (status === 401 || status === 403) {
      console.log(`   ⚠️  ${status} - Authentication issue (credentials may be wrong)`);
      return false;
    } else if (status === 404) {
      console.log(`   ❌ ${status} - Not Found (endpoint path may be wrong)`);
      return false;
    } else {
      console.log(`   ⚠️  ${status} - ${text.substring(0, 150)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runDetailedTests() {
  console.log('🔍 Detailed eSIM API Credential Testing\n');
  console.log('🔑 Testing with token:', token.substring(0, 20) + '...\n');
  
  let foundWorking = false;
  
  for (const config of testConfigs) {
    console.log(`\n📡 Testing: ${config.desc}`);
    console.log(`   URL: ${config.base}${config.endpoint}`);
    
    for (const authMethod of authMethods) {
      console.log(`   Method: ${authMethod.name}`);
      const success = await testEndpoint(config, authMethod);
      if (success) {
        foundWorking = true;
        console.log(`\n✅ FOUND WORKING CONFIGURATION!`);
        console.log(`   Base URL: ${config.base}`);
        console.log(`   Endpoint: ${config.endpoint}`);
        console.log(`   Auth Method: ${authMethod.name}`);
        return;
      }
    }
  }
  
  if (!foundWorking) {
    console.log('\n❌ No working configuration found');
    console.log('\n💡 Possible issues:');
    console.log('   1. API token may be invalid or expired');
    console.log('   2. API endpoint structure may have changed');
    console.log('   3. Account may not have API access enabled');
    console.log('   4. Need to verify credentials at https://sso.esim-go.com/login');
  }
}

runDetailedTests();

