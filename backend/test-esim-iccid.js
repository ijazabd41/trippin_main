import fetch from 'node-fetch';

const ICCID = '8932042000010234523';
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_TOKEN = process.env.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsImtpZCI6Imk2a0UwNjdDbEhrWElzR1AiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Z1c2tyYmVidHljY25tYXBybWJlLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhYmUwNWVkMi1mOGU3LTRjYWMtYjFiOS0yNjIwYjE4OGZhMTYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzMTQ1ODY5LCJpYXQiOjE3NjMxNDIyNjksImVtYWlsIjoiaWphemFiZDQxQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSUhVLVhSVnVvMVZPT0dGQmpMeEVlb0daMUZjcDh5bVJoX1laaHNuWG9PX3FsN1pvMkc9czk2LWMiLCJlbWFpbCI6ImlqYXphYmQ0MUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiQWJkdWxsYWggSWpheiIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJBYmR1bGxhaCBJamF6IiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSUhVLVhSVnVvMVZPT0dGQmpMeEVlb0daMUZjcDh5bVJoX1laaHNuWG9PX3FsN1pvMkc9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNDc1MTAxODk0OTA0NzU4MDE5MSIsInN1YiI6IjExNDc1MTAxODk0OTA0NzU4MDE5MSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzYzMTI3MjkxfV0sInNlc3Npb25faWQiOiI4YWFmMDUwZS1jMmM5LTRmZGUtOTc3My04M2ZkYzQ0MjBhMWMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.4XGq29ABwXKrZyQKlwwRB-X9f8Fg3bQMhItXLG1X0Rc';

async function testICCIDLookup() {
  console.log('🧪 Testing eSIM ICCID Lookup');
  console.log('=' .repeat(60));
  console.log(`ICCID: ${ICCID}`);
  console.log(`Endpoint: ${BASE_URL}/api/esim/esim/${ICCID}`);
  console.log('');

  try {
    const url = `${BASE_URL}/api/esim/esim/${ICCID}`;
    console.log(`📡 Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log('');

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ SUCCESS - eSIM details retrieved!');
      console.log('=' .repeat(60));
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      
      if (data.data) {
        console.log('📋 Summary:');
        console.log(`   ICCID: ${data.data.iccid || 'N/A'}`);
        console.log(`   Status: ${data.data.status || 'N/A'}`);
        console.log(`   Has QR Code: ${!!data.data.qrCode}`);
        console.log(`   Has Activation Code: ${!!data.data.activationCode}`);
        console.log(`   Has SMDP Address: ${!!data.data.smdpAddress}`);
        console.log(`   Order Reference: ${data.data.orderReference || 'N/A'}`);
        console.log(`   Order ID: ${data.data.orderId || 'N/A'}`);
        console.log(`   Source: ${data.source || 'api'}`);
        
        if (data.data.dataRemainingMb !== null && data.data.dataRemainingMb !== undefined) {
          console.log(`   Data Remaining: ${data.data.dataRemainingMb} MB`);
        }
        if (data.data.dataUsedMb !== null && data.data.dataUsedMb !== undefined) {
          console.log(`   Data Used: ${data.data.dataUsedMb} MB`);
        }
        if (data.data.dataTotalMb !== null && data.data.dataTotalMb !== undefined) {
          console.log(`   Data Total: ${data.data.dataTotalMb} MB`);
        }
      }
    } else {
      console.log('❌ FAILED - Could not retrieve eSIM details');
      console.log('=' .repeat(60));
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testICCIDLookup();


