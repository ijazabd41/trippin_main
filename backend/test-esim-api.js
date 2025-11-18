// Test script to check eSIM API endpoints
const token = '5mdcjufvuyN_PFyuUazHhSAYJrjdSnoft_AWrFfi';

const testUrls = [
  'https://api.esim-go.com/v2.4/plans',
  'https://api.esim-go.com/v2/plans',
  'https://api.esim-go.com/plans',
  'https://api.esim-go.com/v2.4/api/products',
  'https://api.esim-go.com/v2.4/products'
];

async function testEndpoint(url) {
  try {
    console.log(`\n🔍 Testing: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    
    if (response.status === 200) {
      console.log('   ✅ SUCCESS!');
      try {
        const json = JSON.parse(text);
        console.log('   Response preview:', JSON.stringify(json).substring(0, 300));
        return true;
      } catch {
        console.log('   Response:', text.substring(0, 200));
        return true;
      }
    } else {
      console.log('   Response:', text.substring(0, 150));
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing eSIM API endpoints...\n');
  console.log('🔑 Using token:', token.substring(0, 20) + '...\n');
  
  for (const url of testUrls) {
    const success = await testEndpoint(url);
    if (success) {
      console.log(`\n✅ Found working endpoint: ${url}`);
      break;
    }
  }
  
  console.log('\n📊 Test complete.');
}

runTests();

