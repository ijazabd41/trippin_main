// Specific test for Japan (JP) coverage - searches through multiple pages
const token = process.env.ESIMGO_API_KEY || process.env.ESIM_TOKEN || '5mdcjufvuyN_PFyuUazHhSAYJrjdSnoft_AWrFfi';

async function searchForJapan() {
  const baseUrl = 'https://api.esim-go.com/v2.4';
  let page = 1;
  let japanBundles = [];
  let totalPages = 105;
  const maxPages = 105; // Search all pages to find all Japan bundles
  
  console.log('🔍 Searching for Japan (JP) in eSIM Go catalogue...\n');
  
  while (page <= maxPages) {
    try {
      const url = `${baseUrl}/catalogue?page=${page}`;
      console.log(`📄 Checking page ${page}...`);
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        const data = await response.json();
        const bundles = data.bundles || [];
        
        // Search for Japan bundles
        const jpBundles = bundles.filter(b => {
          if (!b || !b.countries) return false;
          return b.countries.some(c => {
            if (typeof c === 'object' && c !== null) {
              const iso = (c.iso || '').toLowerCase();
              const name = (c.name || '').toLowerCase();
              return iso === 'jp' || iso === 'jpn' || name.includes('japan');
            }
            return false;
          });
        });
        
        if (jpBundles.length > 0) {
          japanBundles.push(...jpBundles);
          console.log(`   ✅ Found ${jpBundles.length} Japan bundle(s) on page ${page}!`);
        }
        
        // Update total pages if available
        if (data.pageCount) {
          totalPages = data.pageCount;
        }
        
        // Check if we've reached the last page
        if (data.pageCount && page >= data.pageCount) {
          break;
        }
        
        page++;
        await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
      } else {
        console.log(`   ⚠️  Page ${page} returned status ${response.status}`);
        break;
      }
    } catch (error) {
      console.log(`   ❌ Error on page ${page}: ${error.message}`);
      break;
    }
  }
  
  console.log(`\n📊 Searched ${page - 1} of ${totalPages} pages`);
  console.log('\n' + '='.repeat(80));
  
  if (japanBundles.length > 0) {
    console.log(`\n🇯🇵 JAPAN IS COVERED! Found ${japanBundles.length} Japan bundle(s):\n`);
    
    // Group by unique bundle names
    const uniqueBundles = [];
    const seenNames = new Set();
    
    japanBundles.forEach(b => {
      if (!seenNames.has(b.name)) {
        seenNames.add(b.name);
        uniqueBundles.push(b);
      }
    });
    
    uniqueBundles.forEach((b, i) => {
      const jpCountry = b.countries.find(c => {
        const iso = (c?.iso || '').toLowerCase();
        return iso === 'jp' || iso === 'jpn';
      });
      
      console.log(`${i + 1}. ${b.name || 'Unknown'}`);
      console.log(`   Description: ${b.description || 'N/A'}`);
      console.log(`   Country: ${jpCountry?.name || 'Japan'} (ISO: ${jpCountry?.iso || 'JP'})`);
      console.log(`   Region: ${jpCountry?.region || 'N/A'}`);
      console.log(`   Data: ${b.dataAmount || 'N/A'}MB`);
      console.log(`   Duration: ${b.duration || 'N/A'} days`);
      console.log(`   Speed: ${(b.speed || []).join(', ') || 'N/A'}`);
      console.log(`   Price: $${b.price || 'N/A'}`);
      console.log(`   Groups: ${(b.groups || []).join(', ') || 'N/A'}`);
      console.log(`   Billing Type: ${b.billingType || 'N/A'}`);
      console.log(`   Autostart: ${b.autostart ? 'Yes' : 'No'}`);
      console.log(`   Unlimited: ${b.unlimited ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Extract unique operators/networks if available
    const operators = new Set();
    japanBundles.forEach(b => {
      if (b.operators && Array.isArray(b.operators)) {
        b.operators.forEach(op => operators.add(op));
      }
      if (b.network) operators.add(b.network);
    });
    
    if (operators.size > 0) {
      console.log(`📡 Available Operators/Networks in Japan:`);
      Array.from(operators).forEach(op => console.log(`   - ${op}`));
      console.log('');
    }
    
    // Summary
    const speeds = new Set();
    japanBundles.forEach(b => {
      if (b.speed && Array.isArray(b.speed)) {
        b.speed.forEach(s => speeds.add(s));
      }
    });
    
    console.log(`📊 Coverage Summary:`);
    console.log(`   ✅ Japan is covered by eSIM Go`);
    console.log(`   📦 Total bundles found: ${uniqueBundles.length}`);
    console.log(`   📡 Connectivity types: ${Array.from(speeds).join(', ') || 'Not specified'}`);
    console.log(`   💰 Price range: $${Math.min(...japanBundles.map(b => b.price || 0))} - $${Math.max(...japanBundles.map(b => b.price || 0))}`);
    
  } else {
    console.log(`\n❌ JAPAN NOT FOUND in the first ${page - 1} pages`);
    console.log(`\nThis could mean:`);
    console.log(`   1. Japan is not in the eSIM Go coverage list`);
    console.log(`   2. Japan bundles are on pages beyond the first ${maxPages} pages`);
    console.log(`   3. Japan may be listed under a different ISO code or name`);
    console.log(`\nNote: Despite this, eSIM Go's website claims coverage in 190+ countries including Japan.`);
    console.log(`      The API may use different naming or the coverage may be via regional/global bundles.`);
  }
  
  console.log('\n' + '='.repeat(80));
}

// Also try v2.2 networks endpoint with proper parameters
async function testV22Networks() {
  console.log('\n🔍 Testing v2.2 /networks endpoint...\n');
  
  // Try as query parameter in body or different format
  const testUrls = [
    'https://api.esim-go.com/v2.2/networks?ISO=JP',
    'https://api.esim-go.com/v2.2/networks?iso=jp',
    'https://api.esim-go.com/v2.2/networks?Country=Japan',
    'https://api.esim-go.com/v2.2/networks?country=japan'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, {
        headers: {
          'X-API-Key': token,
          'Content-Type': 'application/json'
        }
      });
      
      const text = await response.text();
      if (response.status === 200) {
        console.log(`   ✅ SUCCESS!`);
        const data = JSON.parse(text);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 500)}`);
        return data;
      } else {
        console.log(`   ⚠️  Status ${response.status}: ${text.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Run both tests
(async () => {
  await searchForJapan();
  await testV22Networks();
})();

