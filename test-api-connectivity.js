#!/usr/bin/env node

/**
 * API Connectivity Test Script
 * 
 * This script tests all backend API endpoints to ensure they're working correctly
 * and provides detailed feedback on any issues found.
 */

import fetch from 'node-fetch';

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || null;

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make API calls
async function testEndpoint(method, endpoint, data = null, token = null) {
  const url = `${BACKEND_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`🧪 Testing ${method} ${endpoint}...`);
    const response = await fetch(url, options);
    const responseData = await response.json();

    const result = {
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      data: responseData,
      error: response.ok ? null : responseData.error || responseData.message
    };

    if (response.ok) {
      console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
      testResults.passed++;
    } else {
      console.log(`❌ ${method} ${endpoint} - Status: ${response.status} - Error: ${result.error}`);
      testResults.failed++;
    }

    testResults.total++;
    testResults.details.push(result);
    return result;

  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Network Error: ${error.message}`);
    testResults.failed++;
    testResults.total++;
    
    const result = {
      endpoint,
      method,
      status: 0,
      success: false,
      data: null,
      error: error.message
    };
    
    testResults.details.push(result);
    return result;
  }
}

// Test suite
async function runApiTests() {
  console.log('🚀 Starting API Connectivity Tests');
  console.log('=====================================');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test Token: ${TEST_USER_TOKEN ? 'Provided' : 'Not provided'}`);
  console.log('');

  // Test 1: Health endpoints
  console.log('📋 Test 1: Health Endpoints');
  console.log('------------------------');
  
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/api/test');
  
  console.log('');

  // Test 2: Authentication endpoints (without token)
  console.log('📋 Test 2: Authentication Endpoints (No Token)');
  console.log('---------------------------------------------');
  
  await testEndpoint('GET', '/api/auth/profile');
  await testEndpoint('GET', '/api/subscriptions/status');
  await testEndpoint('GET', '/api/trips');
  
  console.log('');

  // Test 3: Authentication endpoints (with token if available)
  if (TEST_USER_TOKEN) {
    console.log('📋 Test 3: Authentication Endpoints (With Token)');
    console.log('-----------------------------------------------');
    
    await testEndpoint('GET', '/api/auth/profile', null, TEST_USER_TOKEN);
    await testEndpoint('GET', '/api/subscriptions/status', null, TEST_USER_TOKEN);
    await testEndpoint('GET', '/api/trips', null, TEST_USER_TOKEN);
    
    console.log('');
  } else {
    console.log('📋 Test 3: Authentication Endpoints (With Token) - SKIPPED (No token provided)');
    console.log('');
  }

  // Test 4: Public endpoints
  console.log('📋 Test 4: Public Endpoints');
  console.log('--------------------------');
  
  await testEndpoint('GET', '/api/trips/public');
  
  console.log('');

  // Test 5: Subscription endpoints (without token)
  console.log('📋 Test 5: Subscription Endpoints (No Token)');
  console.log('-------------------------------------------');
  
  await testEndpoint('GET', '/api/subscriptions/status');
  await testEndpoint('POST', '/api/subscriptions/create-checkout-session', {
    planId: 'premium',
    successUrl: 'http://localhost:5173/payment-success',
    cancelUrl: 'http://localhost:5173/checkout'
  });
  
  console.log('');

  // Test 6: OpenAI endpoints (without token)
  console.log('📋 Test 6: OpenAI Endpoints (No Token)');
  console.log('-------------------------------------');
  
  await testEndpoint('POST', '/api/openai/chat', {
    message: 'Hello, this is a test message',
    context: 'test'
  });
  
  console.log('');

  // Test 7: Google Maps endpoints (without token)
  console.log('📋 Test 7: Google Maps Endpoints (No Token)');
  console.log('-------------------------------------------');
  
  await testEndpoint('GET', '/api/google-maps/places?query=Tokyo&location=35.6762,139.6503');
  
  console.log('');

  // Test 8: eSIM endpoints (without token)
  console.log('📋 Test 8: eSIM Endpoints (No Token)');
  console.log('-----------------------------------');
  
  await testEndpoint('GET', '/api/esim/plans');
  
  console.log('');

  // Generate report
  console.log('📊 Test Results Summary');
  console.log('=======================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log('');

  // Detailed results
  console.log('📋 Detailed Results');
  console.log('==================');
  
  testResults.details.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.method} ${result.endpoint}`);
    console.log(`   Status: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.data && result.data.message) {
      console.log(`   Message: ${result.data.message}`);
    }
    console.log('');
  });

  // Recommendations
  console.log('💡 Recommendations');
  console.log('==================');
  
  const failedTests = testResults.details.filter(r => !r.success);
  
  if (failedTests.length === 0) {
    console.log('🎉 All tests passed! Your API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Here are the recommendations:');
    console.log('');
    
    failedTests.forEach(result => {
      console.log(`❌ ${result.method} ${result.endpoint}:`);
      
      if (result.status === 401) {
        console.log('   → This endpoint requires authentication. Provide a valid token.');
      } else if (result.status === 404) {
        console.log('   → Endpoint not found. Check if the route is properly configured.');
      } else if (result.status === 500) {
        console.log('   → Internal server error. Check server logs for details.');
      } else if (result.status === 0) {
        console.log('   → Network error. Check if the backend server is running.');
      } else {
        console.log(`   → HTTP ${result.status}: ${result.error}`);
      }
      console.log('');
    });
  }

  // Environment check
  console.log('🔧 Environment Check');
  console.log('===================');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Test Token Provided: ${TEST_USER_TOKEN ? 'Yes' : 'No'}`);
  console.log('');

  // Exit with appropriate code
  if (testResults.failed === 0) {
    console.log('🎉 All API tests passed successfully!');
    process.exit(0);
  } else {
    console.log(`❌ ${testResults.failed} test(s) failed. Please fix the issues above.`);
    process.exit(1);
  }
}

// Run the tests
runApiTests().catch(console.error);

export { runApiTests, testEndpoint };
