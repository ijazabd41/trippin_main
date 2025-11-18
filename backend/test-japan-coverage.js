// Test script to check if Japan (JP) is in eSIM Go API coverage
// Tests both v2.2 and v2.4 API endpoints for networks/coverage

const token = process.env.ESIMGO_API_KEY || process.env.ESIM_TOKEN || '5mdcjufvuyN_PFyuUazHhSAYJrjdSnoft_AWrFfi';

const testConfigs = [
  // v2.2 networks endpoint - try different parameter formats
  { 
    base: 'https://api.esim-go.com/v2.2', 
    endpoint: '/networks', 
    desc: 'v2.2 /networks (all countries)',
    method: 'GET'
  },
  { 
    base: 'https://api.esim-go.com/v2.2', 
    endpoint: '/networks?iso=JP', 
    desc: 'v2.2 /networks with iso=JP (lowercase)',
    method: 'GET'
  },
  { 
    base: 'https://api.esim-go.com/v2.2', 
    endpoint: '/networks?ISO=JP', 
    desc: 'v2.2 /networks with ISO=JP (uppercase)',
    method: 'GET'
  },
  { 
    base: 'https://api.esim-go.com/v2.2', 
    endpoint: '/networks?country=Japan', 
    desc: 'v2.2 /networks with country=Japan (lowercase)',
    method: 'GET'
  },
  // v2.4 catalogue endpoint - check pagination
  { 
    base: 'https://api.esim-go.com/v2.4', 
    endpoint: '/catalogue', 
    desc: 'v2.4 /catalogue page 1 (will check pagination)',
    method: 'GET'
  },
  { 
    base: 'https://api.esim-go.com/v2.4', 
    endpoint: '/catalogue?page=1&pageSize=500', 
    desc: 'v2.4 /catalogue with larger page size',
    method: 'GET'
  }
];

async function testEndpoint(config) {
  const url = `${config.base}${config.endpoint}`;
  
  try {
    console.log(`\n📡 Testing: ${config.desc}`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: config.method || 'GET',
      headers: {
        'X-API-Key': token,
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    const contentType = response.headers.get('content-type');
    
    if (status === 200) {
      console.log(`   ✅ SUCCESS! Status: ${status}`);
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log(`   📊 Response type: JSON`);
        console.log(`   📊 Response keys: ${Object.keys(data).join(', ')}`);
        
        // Check for Japan/JP in response - more thorough search
        const responseStr = JSON.stringify(data).toLowerCase();
        const hasJapan = responseStr.includes('japan') || 
                        responseStr.includes('"jp"') || 
                        responseStr.includes('"jpn"') ||
                        responseStr.includes('iso":"jp') ||
                        responseStr.includes('iso":"jpn');
        
        if (hasJapan) {
          console.log(`   🇯🇵 JAPAN DETECTED in response!`);
          
          // Try to extract Japan-specific data
          if (data.bundles && Array.isArray(data.bundles)) {
            const japanBundles = data.bundles.filter(b => {
              if (!b) return false;
              // Check bundle countries array
              if (b.countries && Array.isArray(b.countries)) {
                return b.countries.some(c => {
                  if (typeof c === 'string') return c.toLowerCase().includes('japan') || c.toLowerCase() === 'jp';
                  if (typeof c === 'object' && c !== null) {
                    const iso = (c.iso || '').toLowerCase();
                    const name = (c.name || '').toLowerCase();
                    return iso === 'jp' || iso === 'jpn' || name.includes('japan');
                  }
                  return false;
                });
              }
              // Check other fields
              const bundleStr = JSON.stringify(b).toLowerCase();
              return bundleStr.includes('japan') || bundleStr.includes('"jp"') || bundleStr.includes('"jpn"');
            });
            if (japanBundles.length > 0) {
              console.log(`   📦 Found ${japanBundles.length} Japan-related bundles:`);
              japanBundles.slice(0, 5).forEach((b, i) => {
                const countries = b.countries ? b.countries.map(c => 
                  typeof c === 'object' ? `${c.name || 'Unknown'} (${c.iso || 'N/A'})` : c
                ).join(', ') : 'N/A';
                console.log(`      ${i + 1}. ${b.name || b.id || 'Unknown'}`);
                console.log(`         Countries: ${countries}`);
                console.log(`         Data: ${b.dataAmount || 'N/A'}MB, Duration: ${b.duration || 'N/A'} days`);
                console.log(`         Speed: ${(b.speed || []).join(', ') || 'N/A'}`);
                console.log(`         Price: ${b.price || 'N/A'} ${b.currency || ''}`);
              });
              if (japanBundles.length > 5) {
                console.log(`      ... and ${japanBundles.length - 5} more Japan bundles`);
              }
            }
          }
          
          if (data.networks && Array.isArray(data.networks)) {
            const japanNetworks = data.networks.filter(n => {
              if (!n) return false;
              const netStr = JSON.stringify(n).toLowerCase();
              return netStr.includes('japan') || netStr.includes('"jp"') || netStr.includes('"jpn"');
            });
            if (japanNetworks.length > 0) {
              console.log(`   📡 Found ${japanNetworks.length} Japan networks:`);
              japanNetworks.slice(0, 5).forEach((n, i) => {
                console.log(`      ${i + 1}. ${JSON.stringify(n).substring(0, 300)}`);
              });
            }
          }
          
          if (data.countries && Array.isArray(data.countries)) {
            const japanCountry = data.countries.find(c => {
              if (typeof c === 'string') return c.toLowerCase().includes('japan') || c.toLowerCase() === 'jp';
              if (typeof c === 'object' && c !== null) {
                const iso = (c.iso || '').toLowerCase();
                const name = (c.name || '').toLowerCase();
                return iso === 'jp' || iso === 'jpn' || name.includes('japan');
              }
              return false;
            });
            if (japanCountry) {
              console.log(`   🌍 Found Japan in countries list: ${JSON.stringify(japanCountry)}`);
            }
          }
          
          // Check direct response fields
          if (data.country || data.iso) {
            const country = data.country || '';
            const iso = data.iso || '';
            if (country.toLowerCase().includes('japan') || iso.toLowerCase() === 'jp' || iso.toLowerCase() === 'jpn') {
              console.log(`   📍 Response is for Japan: Country=${country}, ISO=${iso}`);
            }
          }
        } else {
          // For catalogue endpoint, search through all bundles
          if (data.bundles && Array.isArray(data.bundles)) {
            const totalRows = data.rows || data.bundles.length;
            const pageCount = data.pageCount || 1;
            console.log(`   🔍 Searching through ${data.bundles.length} bundles (page info: ${totalRows} total rows, ${pageCount} pages)...`);
            
            const japanBundles = data.bundles.filter(b => {
              if (!b || !b.countries) return false;
              return b.countries.some(c => {
                if (typeof c === 'object' && c !== null) {
                  const iso = (c.iso || '').toLowerCase();
                  return iso === 'jp' || iso === 'jpn';
                }
                return false;
              });
            });
            if (japanBundles.length > 0) {
              console.log(`   🇯🇵 Found ${japanBundles.length} Japan bundles in this page!`);
              japanBundles.slice(0, 5).forEach((b, i) => {
                const jpCountry = b.countries.find(c => {
                  const iso = (c?.iso || '').toLowerCase();
                  return iso === 'jp' || iso === 'jpn';
                });
                console.log(`      ${i + 1}. ${b.name || 'Unknown'}`);
                console.log(`         Description: ${b.description || 'N/A'}`);
                console.log(`         Japan info: ${JSON.stringify(jpCountry)}`);
                console.log(`         Data: ${b.dataAmount || 'N/A'}MB, Duration: ${b.duration || 'N/A'} days`);
                console.log(`         Speed: ${(b.speed || []).join(', ') || 'N/A'}`);
                console.log(`         Price: ${b.price || 'N/A'} ${b.currency || ''}`);
              });
            } else {
              console.log(`   ⚠️  No Japan bundles found in this page (${data.bundles.length} bundles)`);
              if (pageCount > 1) {
                console.log(`   💡 Note: There are ${pageCount} pages total. Japan may be on another page.`);
              }
            }
          } else if (data.networks && Array.isArray(data.networks)) {
            // For v2.2 networks endpoint
            console.log(`   🔍 Searching through ${data.networks.length} networks for Japan...`);
            const japanNetworks = data.networks.filter(n => {
              if (!n) return false;
              const netStr = JSON.stringify(n).toLowerCase();
              return netStr.includes('japan') || netStr.includes('"jp"') || netStr.includes('"jpn"');
            });
            if (japanNetworks.length > 0) {
              console.log(`   🇯🇵 Found ${japanNetworks.length} Japan networks!`);
              japanNetworks.slice(0, 5).forEach((n, i) => {
                console.log(`      ${i + 1}. ${JSON.stringify(n).substring(0, 400)}`);
              });
            } else {
              console.log(`   ⚠️  No Japan networks found in ${data.networks.length} networks`);
            }
          } else {
            console.log(`   ⚠️  Japan not found in response`);
          }
        }
        
        // Show sample of response structure
        console.log(`   📋 Sample response (first 500 chars):`);
        console.log(`      ${JSON.stringify(data).substring(0, 500)}...`);
        
      } else {
        const text = await response.text();
        console.log(`   📊 Response type: ${contentType || 'text'}`);
        console.log(`   📋 Response preview: ${text.substring(0, 500)}`);
      }
      
      return { success: true, data, status };
      
    } else if (status === 401 || status === 403) {
      console.log(`   ⚠️  ${status} - Authentication issue`);
      return { success: false, error: 'Authentication failed', status };
      
    } else if (status === 404) {
      console.log(`   ❌ ${status} - Endpoint not found`);
      return { success: false, error: 'Endpoint not found', status };
      
    } else {
      const text = await response.text().catch(() => 'Unknown error');
      console.log(`   ⚠️  ${status} - ${text.substring(0, 200)}`);
      return { success: false, error: text.substring(0, 200), status };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runJapanCoverageTests() {
  console.log('🔍 Testing eSIM Go API for Japan (JP) Coverage\n');
  console.log('🔑 Using API key:', token.substring(0, 20) + '...\n');
  console.log('=' .repeat(80));
  
  const results = [];
  
  for (const config of testConfigs) {
    const result = await testEndpoint(config);
    results.push({ ...config, result });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  
  const successfulTests = results.filter(r => r.result.success);
  const japanFoundTests = results.filter(r => {
    if (!r.result.success || !r.result.data) return false;
    const dataStr = JSON.stringify(r.result.data).toLowerCase();
    return dataStr.includes('japan') || dataStr.includes('"jp"') || dataStr.includes('"jpn"');
  });
  
  console.log(`✅ Successful API calls: ${successfulTests.length}/${results.length}`);
  console.log(`🇯🇵 Tests with Japan data: ${japanFoundTests.length}/${results.length}`);
  
  if (japanFoundTests.length > 0) {
    console.log('\n✅ JAPAN IS COVERED! Found in the following endpoints:');
    japanFoundTests.forEach(test => {
      console.log(`   - ${test.desc}`);
    });
  } else if (successfulTests.length > 0) {
    console.log('\n⚠️  API calls succeeded but Japan data not found in responses.');
    console.log('   This could mean:');
    console.log('   1. Japan is not in the coverage list');
    console.log('   2. Japan data is in a different format than expected');
    console.log('   3. The endpoint requires different parameters');
  } else {
    console.log('\n❌ No successful API calls. Possible issues:');
    console.log('   1. API credentials may be invalid');
    console.log('   2. Endpoint paths may be incorrect');
    console.log('   3. API version may not support these endpoints');
  }
  
  console.log('\n' + '='.repeat(80));
}

runJapanCoverageTests().catch(console.error);

