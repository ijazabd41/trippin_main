// Test script for the OpenAI backend endpoint
import fetch from 'node-fetch';

const testOpenAIEndpoint = async () => {
  const testData = {
    tripData: {
      destination: 'Tokyo, Japan',
      duration: 3,
      budget: 150000,
      travelers: 2,
      interests: ['culture', 'food', 'nature'],
      accommodation: 'hotel',
      currency: 'JPY'
    }
  };

  try {
    console.log('🧪 Testing OpenAI endpoint...');
    console.log('📤 Sending request:', testData);

    const response = await fetch('http://localhost:3001/api/openai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📥 Response data:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ OpenAI endpoint is working!');
      console.log('📊 Plan structure:', {
        hasBudget: !!result.data.budget,
        hasItinerary: !!result.data.itinerary,
        hasRecommendations: !!result.data.recommendations,
        hasPracticalInfo: !!result.data.practicalInfo
      });
    } else {
      console.log('❌ OpenAI endpoint failed:', result.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Test health endpoint
const testHealthEndpoint = async () => {
  try {
    console.log('🏥 Testing health endpoint...');
    const response = await fetch('http://localhost:3001/api/openai/health');
    const result = await response.json();
    console.log('✅ Health check:', result);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting backend OpenAI endpoint tests...\n');
  
  await testHealthEndpoint();
  console.log('');
  await testOpenAIEndpoint();
  
  console.log('\n📋 Test Summary:');
  console.log('- Health endpoint: Should return success');
  console.log('- Generate endpoint: Should return a complete travel plan');
  console.log('- Plan should have: budget, itinerary, recommendations, practicalInfo');
};

runTests().catch(console.error);



