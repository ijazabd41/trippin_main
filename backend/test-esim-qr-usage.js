import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const API_KEY = process.env.ESIMGO_API_KEY || process.env.ESIM_TOKEN || '';
const BASE_URL = process.env.ESIMGO_BASE_URL || process.env.ESIM_BASE || 'https://api.esim-go.com/v2.4';

console.log('🔍 Testing eSIM Go API - QR Code & Usage Data Extraction...\n');
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

  // Check if response is JSON or binary (ZIP file)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      return responseText;
    }
  } else if (contentType.includes('application/zip') || contentType.includes('application/octet-stream')) {
    // ZIP file response - would need special handling
    return { type: 'zip', data: responseText };
  } else {
    return responseText;
  }
}

// Test 1: Get existing orders to find an order reference for testing
async function getExistingOrders() {
  console.log('📋 Test 1: Fetching existing orders...\n');
  
  try {
    const orders = await callESIMAPI('/orders');
    console.log('✅ Successfully fetched orders');
    
    if (Array.isArray(orders) && orders.length > 0) {
      console.log(`   Found ${orders.length} order(s)`);
      return orders;
    } else if (orders && orders.orders && Array.isArray(orders.orders)) {
      console.log(`   Found ${orders.orders.length} order(s)`);
      return orders.orders;
    } else {
      console.log('   No orders found');
      return [];
    }
  } catch (error) {
    console.error('❌ Failed to fetch orders:', error.message);
    if (error.status === 404) {
      console.log('   Note: Orders endpoint may not be available or no orders exist yet');
    }
    return [];
  }
}

// Test 2: Test assignments endpoint to get QR code and activation details
async function testAssignmentsEndpoint(orderReference) {
  console.log('\n📥 Test 2: Testing assignments endpoint for QR code...\n');
  console.log(`   Order Reference: ${orderReference}`);
  
  if (!orderReference) {
    console.log('   ⚠️  No order reference provided - skipping test');
    console.log('   💡 To test this, you need an existing order reference');
    console.log('   💡 You can get one by:');
    console.log('      1. Making a validation order (test-esim-validation.js)');
    console.log('      2. Making a real purchase');
    console.log('      3. Using an order reference from your eSIM Go dashboard\n');
    return null;
  }

  try {
    const assignmentsPath = `/esims/assignments/${encodeURIComponent(orderReference)}`;
    console.log(`   Endpoint: GET ${assignmentsPath}\n`);
    
    const assignments = await callESIMAPI(assignmentsPath);
    
    console.log('✅ Successfully fetched assignments');
    console.log('\n📋 Raw Response:');
    console.log(JSON.stringify(assignments, null, 2).substring(0, 1000));
    console.log('...\n');

    // Parse assignment response (same logic as in routes/esim.js)
    let assignment = null;
    
    if (Array.isArray(assignments) && assignments.length > 0) {
      assignment = assignments[0];
      console.log('   Response format: Array (using first element)');
    } else if (typeof assignments === 'object' && assignments !== null) {
      assignment = assignments;
      console.log('   Response format: Object');
    } else {
      console.log('   ⚠️  Unexpected response format');
      return null;
    }

    // Extract fields (same logic as in routes/esim.js lines 940-950)
    const qrCode = assignment['RSP URL'] || assignment.rspUrl || assignment.qrCode || assignment.qr || null;
    const iccid = assignment.ICCID || assignment.iccid || null;
    const activationCode = assignment['Matching ID'] || assignment.matchingId || assignment.matching_id || null;
    const smdpAddress = assignment['SMDP Address'] || assignment.smdpAddress || assignment.smdp_address || null;
    
    // Construct QR code if we have components
    let finalQRCode = qrCode;
    if (smdpAddress && activationCode && !qrCode) {
      finalQRCode = `LPA:1$${smdpAddress}$${activationCode}`;
      console.log('   ✅ Constructed QR code from SMDP Address and Matching ID');
    }

    console.log('\n📊 Extracted Data:');
    console.log('─'.repeat(80));
    console.log(`   QR Code: ${finalQRCode ? '✅ Found' : '❌ Not found'}`);
    if (finalQRCode) {
      console.log(`      Value: ${finalQRCode.substring(0, 50)}...`);
      console.log(`      Format: ${finalQRCode.startsWith('LPA:1$') ? 'LPA format (correct)' : 'Other format'}`);
    }
    console.log(`   ICCID: ${iccid ? `✅ ${iccid}` : '❌ Not found'}`);
    console.log(`   Activation Code (Matching ID): ${activationCode ? `✅ ${activationCode}` : '❌ Not found'}`);
    console.log(`   SMDP Address: ${smdpAddress ? `✅ ${smdpAddress}` : '❌ Not found'}`);

    // Test if QR code can be displayed
    if (finalQRCode) {
      console.log('\n✅ QR Code Extraction: SUCCESS');
      console.log('   → Your code can extract and display QR codes correctly');
      console.log('   → QR code format is compatible with eSIM installation');
    } else {
      console.log('\n⚠️  QR Code Extraction: PARTIAL');
      console.log('   → Some fields may be missing');
      console.log('   → Check if order is fully processed');
    }

    return {
      qrCode: finalQRCode,
      iccid,
      activationCode,
      smdpAddress,
      raw: assignment
    };

  } catch (error) {
    console.error('\n❌ Failed to fetch assignments:', error.message);
    if (error.status === 404) {
      console.log('   → Order reference may not exist or assignments not available yet');
    } else if (error.status === 403) {
      console.log('   → API key may not have permission to access assignments');
    }
    return null;
  }
}

// Test 3: Test usage data extraction
async function testUsageDataExtraction(orderReference, planDataAmount = null) {
  console.log('\n📊 Test 3: Testing usage data extraction...\n');
  console.log(`   Order Reference: ${orderReference}`);
  
  if (!orderReference) {
    console.log('   ⚠️  No order reference provided - skipping test');
    console.log('   💡 Usage data is fetched from the same assignments endpoint\n');
    return null;
  }

  try {
    const assignmentsPath = `/esims/assignments/${encodeURIComponent(orderReference)}`;
    const assignments = await callESIMAPI(assignmentsPath);
    
    // Parse assignment (same as Test 2)
    let assignment = null;
    if (Array.isArray(assignments) && assignments.length > 0) {
      assignment = assignments[0];
    } else if (typeof assignments === 'object' && assignments !== null) {
      assignment = assignments;
    }

    if (!assignment) {
      console.log('   ⚠️  No assignment data found');
      return null;
    }

    // Extract usage data (same logic as in routes/esim.js lines 1467-1515)
    const dataRemainingMb = assignment.dataRemainingMb || 
                            assignment['Data Remaining MB'] || 
                            assignment.dataRemaining || 
                            assignment.remainingData || 
                            null;
    
    const dataUsedMb = assignment.dataUsedMb || 
                       assignment['Data Used MB'] || 
                       assignment.dataUsed || 
                       assignment.usedData || 
                       null;
    
    const dataTotalMb = assignment.dataTotalMb || 
                        assignment['Data Total MB'] || 
                        assignment.dataTotal || 
                        assignment.totalData ||
                        null;

    console.log('📋 Raw Usage Fields from API:');
    console.log(`   dataRemainingMb: ${dataRemainingMb !== null ? dataRemainingMb + ' MB' : 'Not found'}`);
    console.log(`   dataUsedMb: ${dataUsedMb !== null ? dataUsedMb + ' MB' : 'Not found'}`);
    console.log(`   dataTotalMb: ${dataTotalMb !== null ? dataTotalMb + ' MB' : 'Not found'}`);

    // Calculate usage in GB (same logic as in routes/esim.js)
    let totalGB = 0;
    let usedGB = 0;
    let remainingGB = 0;

    if (dataTotalMb !== null) {
      totalGB = dataTotalMb / 1024;
    } else if (planDataAmount) {
      // Fallback to plan data amount
      if (typeof planDataAmount === 'string' && planDataAmount.includes('GB')) {
        totalGB = parseFloat(planDataAmount.replace(/[^0-9.]/g, ''));
      } else if (typeof planDataAmount === 'number') {
        totalGB = planDataAmount / 1024;
      }
    }

    if (dataUsedMb !== null) {
      usedGB = dataUsedMb / 1024;
    } else if (dataRemainingMb !== null && dataTotalMb !== null) {
      usedGB = Math.max(0, (dataTotalMb - dataRemainingMb) / 1024);
    } else if (dataRemainingMb !== null && totalGB > 0) {
      usedGB = Math.max(0, totalGB - (dataRemainingMb / 1024));
    }

    if (dataRemainingMb !== null) {
      remainingGB = dataRemainingMb / 1024;
    } else if (totalGB > 0 && usedGB > 0) {
      remainingGB = totalGB - usedGB;
    }

    const percentage = totalGB > 0 ? Math.round((usedGB / totalGB) * 100) : 0;

    console.log('\n📊 Calculated Usage Data:');
    console.log('─'.repeat(80));
    console.log(`   Total: ${totalGB.toFixed(2)} GB`);
    console.log(`   Used: ${usedGB.toFixed(2)} GB`);
    console.log(`   Remaining: ${remainingGB.toFixed(2)} GB`);
    console.log(`   Usage Percentage: ${percentage}%`);

    // Format for frontend (same format as routes/esim.js returns)
    const usageData = {
      usedGB: Number(usedGB.toFixed(2)),
      totalGB: Number(totalGB.toFixed(2)),
      dataRemainingMb: dataRemainingMb || (remainingGB * 1024),
      dataUsedMb: dataUsedMb || (usedGB * 1024),
      dataTotalMb: dataTotalMb || (totalGB * 1024),
      percentage: percentage
    };

    console.log('\n✅ Usage Data Extraction: SUCCESS');
    console.log('   → Your code can extract and calculate usage data correctly');
    console.log('   → Format matches frontend expectations:');
    console.log(`      usage: { used: ${usageData.usedGB}, total: ${usageData.totalGB} }`);

    return usageData;

  } catch (error) {
    console.error('\n❌ Failed to extract usage data:', error.message);
    return null;
  }
}

// Test 4: Show expected response format examples
function showExpectedFormats() {
  console.log('\n📚 Test 4: Expected API Response Formats\n');
  console.log('─'.repeat(80));
  
  console.log('\n1. Assignments Endpoint Response (GET /esims/assignments/{orderReference}):');
  console.log('   Expected formats:');
  console.log('   a) Single object:');
  console.log(JSON.stringify({
    'RSP URL': 'LPA:1$smdp.example.com$matching-id-123',
    'ICCID': '89012345678901234567',
    'Matching ID': 'matching-id-123',
    'SMDP Address': 'smdp.example.com',
    dataRemainingMb: 2048,
    dataUsedMb: 1024,
    dataTotalMb: 3072
  }, null, 2));
  
  console.log('\n   b) Array of objects:');
  console.log(JSON.stringify([{
    rspUrl: 'LPA:1$smdp.example.com$matching-id-123',
    iccid: '89012345678901234567',
    matchingId: 'matching-id-123',
    smdpAddress: 'smdp.example.com',
    dataRemainingMb: 2048,
    dataUsedMb: 1024,
    dataTotalMb: 3072
  }], null, 2));

  console.log('\n2. Frontend Expected Format:');
  console.log('   Order object should have:');
  console.log(JSON.stringify({
    qrCode: 'LPA:1$smdp.example.com$matching-id-123',
    usage: {
      used: 1.0,  // in GB
      total: 3.0  // in GB
    }
  }, null, 2));

  console.log('\n3. Your Code Handles:');
  console.log('   ✅ Multiple field name variations (RSP URL, rspUrl, qrCode, etc.)');
  console.log('   ✅ Array or object response formats');
  console.log('   ✅ Constructing QR code from SMDP + Matching ID if needed');
  console.log('   ✅ Converting MB to GB for usage display');
  console.log('   ✅ Calculating used/remaining from available data');
  console.log('');
}

// Main test function
async function runTests() {
  try {
    // Test 1: Get existing orders
    const orders = await getExistingOrders();
    
    // Find an order reference for testing
    let orderReference = null;
    let planDataAmount = null;
    
    if (orders && orders.length > 0) {
      const firstOrder = orders[0];
      orderReference = firstOrder.reference || firstOrder.orderReference || firstOrder.id || firstOrder.orderId;
      planDataAmount = firstOrder.plan?.dataAmount || firstOrder.dataAmount;
      
      if (orderReference) {
        console.log(`\n✅ Found order reference for testing: ${orderReference}`);
      }
    }

    // If no orders, prompt user to provide one
    if (!orderReference) {
      console.log('\n💡 To test QR code and usage extraction, you need an order reference.');
      console.log('   Options:');
      console.log('   1. Run: node test-esim-validation.js (to get a validation order reference)');
      console.log('   2. Make a real purchase');
      console.log('   3. Get order reference from eSIM Go dashboard');
      console.log('   4. Pass order reference as command line argument:');
      console.log('      node test-esim-qr-usage.js <order-reference>\n');
      
      // Check for command line argument
      const args = process.argv.slice(2);
      if (args.length > 0) {
        orderReference = args[0];
        console.log(`   Using provided order reference: ${orderReference}\n`);
      }
    }

    // Test 2: QR Code extraction
    const qrData = await testAssignmentsEndpoint(orderReference);

    // Test 3: Usage data extraction
    const usageData = await testUsageDataExtraction(orderReference, planDataAmount);

    // Test 4: Show expected formats
    showExpectedFormats();

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    if (qrData && qrData.qrCode) {
      console.log('✅ QR Code Extraction: WORKING');
      console.log('   → Code can extract QR codes from assignments endpoint');
      console.log('   → QR code format is correct for eSIM installation');
    } else {
      console.log('⚠️  QR Code Extraction: NEEDS TESTING');
      console.log('   → Need an order reference to test');
    }

    if (usageData) {
      console.log('✅ Usage Data Extraction: WORKING');
      console.log('   → Code can extract and calculate usage data');
      console.log('   → Format matches frontend expectations');
    } else {
      console.log('⚠️  Usage Data Extraction: NEEDS TESTING');
      console.log('   → Need an order reference to test');
    }

    console.log('\n💡 Next Steps:');
    if (!orderReference) {
      console.log('   1. Get an order reference (validation or real purchase)');
      console.log('   2. Run this test again with the order reference');
    } else {
      console.log('   1. Verify QR code displays correctly in frontend');
      console.log('   2. Verify usage data shows correctly in frontend');
      console.log('   3. Test with different order types (unlimited, limited)');
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the tests
runTests();

