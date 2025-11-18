import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing Trippin Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData.status);
    console.log('');

    // Test API documentation
    console.log('2. Testing API documentation...');
    const docResponse = await fetch(`${BASE_URL}/`);
    const docData = await docResponse.json();
    console.log('✅ API documentation available:', docData.message);
    console.log('📚 Available endpoints:', Object.keys(docData.endpoints).join(', '));
    console.log('');

    // Test authentication endpoints (without credentials)
    console.log('3. Testing authentication endpoints...');
    
    // Test signup endpoint
    try {
      const signupResponse = await fetch(`${BASE_URL}/api/supabase-auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User'
        })
      });
      
      if (signupResponse.status === 200 || signupResponse.status === 201) {
        console.log('✅ Signup endpoint is working');
      } else {
        console.log('⚠️  Signup endpoint returned:', signupResponse.status);
      }
    } catch (error) {
      console.log('⚠️  Signup endpoint test failed (expected if Supabase not configured)');
    }

    // Test protected endpoints (should return 401)
    console.log('4. Testing protected endpoints...');
    const tripsResponse = await fetch(`${BASE_URL}/api/trips`);
    if (tripsResponse.status === 401) {
      console.log('✅ Protected endpoints are properly secured (401 Unauthorized)');
    } else {
      console.log('⚠️  Protected endpoint returned:', tripsResponse.status);
    }
    console.log('');

    // Test CORS
    console.log('5. Testing CORS configuration...');
    const corsResponse = await fetch(`${BASE_URL}/health`, {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    const corsHeaders = corsResponse.headers.get('access-control-allow-origin');
    if (corsHeaders) {
      console.log('✅ CORS is configured:', corsHeaders);
    } else {
      console.log('⚠️  CORS headers not found');
    }
    console.log('');

    console.log('🎉 API testing completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your Supabase project');
    console.log('2. Configure environment variables');
    console.log('3. Run: npm run setup');
    console.log('4. Test with real Supabase credentials');

  } catch (error) {
    console.error('❌ API testing failed:', error.message);
    console.log('');
    console.log('Make sure the backend server is running:');
    console.log('cd backend && npm run dev');
  }
}

// Run the test
testAPI();
