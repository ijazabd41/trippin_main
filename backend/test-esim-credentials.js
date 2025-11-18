// Test eSIM API credentials with correct authentication method
const token = '5mdcjufvuyN_PFyuUazHhSAYJrjdSnoft_AWrFfi';
const baseUrl = 'https://api.esim-go.com/v2.4';

async function testWithBearerToken() {
  console.log('\n🔍 Test 1: Testing with Bearer token (current implementation)');
  try {
    const url = `${baseUrl}/api/plans`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 200)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testWithXAPIKey() {
  console.log('\n🔍 Test 2: Testing with X-API-Key header (correct method)');
  try {
    const url = `${baseUrl}/api/plans`;
    const response = await fetch(url, {
      headers: {
        'X-API-Key': token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 300)}`);
    
    if (response.status === 200) {
      try {
        const json = JSON.parse(text);
        console.log(`   ✅ SUCCESS! Received ${Array.isArray(json) ? json.length : 'data'} plans`);
        return true;
      } catch {
        console.log(`   Response (raw): ${text.substring(0, 500)}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testWithQueryParam() {
  console.log('\n🔍 Test 3: Testing with API key as query parameter');
  try {
    const url = `${baseUrl}/api/plans?api_key=${token}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 300)}`);
    
    if (response.status === 200) {
      console.log(`   ✅ SUCCESS!`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Testing eSIM Go API Credentials');
  console.log('📋 API Base URL:', baseUrl);
  console.log('🔑 API Token:', token.substring(0, 20) + '...\n');
  
  const test1 = await testWithBearerToken();
  const test2 = await testWithXAPIKey();
  const test3 = await testWithQueryParam();
  
  console.log('\n📊 Test Results Summary:');
  console.log('   Bearer Token:', test1 ? '✅ Works' : '❌ Failed');
  console.log('   X-API-Key Header:', test2 ? '✅ Works' : '❌ Failed');
  console.log('   Query Parameter:', test3 ? '✅ Works' : '❌ Failed');
  
  if (test2 || test3) {
    console.log('\n✅ Credentials are VALID!');
    console.log('⚠️  Fix needed: Update authentication method in esim.js');
  } else {
    console.log('\n❌ Credentials test failed - may need to verify token or endpoint');
  }
}

runAllTests();

