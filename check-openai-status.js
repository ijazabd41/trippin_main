#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🔍 Checking OpenAI API Status...\n');

async function checkOpenAIStatus() {
  try {
    // Test with a simple request
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'your-api-key-here'}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API is accessible');
      console.log(`📊 Available models: ${data.data.length}`);
      
      // Check for specific models
      const models = data.data.map(m => m.id);
      const availableModels = {
        'gpt-3.5-turbo': models.includes('gpt-3.5-turbo'),
        'gpt-4': models.includes('gpt-4'),
        'gpt-4-turbo': models.includes('gpt-4-turbo')
      };
      
      console.log('\n🤖 Model Access:');
      Object.entries(availableModels).forEach(([model, available]) => {
        console.log(`  ${available ? '✅' : '❌'} ${model}`);
      });
      
    } else if (response.status === 401) {
      console.log('❌ OpenAI API key is invalid or missing');
      console.log('💡 Check your OPENAI_API_KEY in backend/.env');
    } else if (response.status === 429) {
      console.log('❌ OpenAI API quota exceeded');
      console.log('💡 Check your billing at: https://platform.openai.com/account/billing');
    } else {
      console.log(`❌ OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.log('❌ Could not connect to OpenAI API');
    console.log('💡 Check your internet connection and API key');
  }
}

async function testBackendEndpoint() {
  try {
    console.log('\n🧪 Testing backend endpoint...');
    const response = await fetch('http://localhost:3001/api/openai/health');
    const data = await response.json();
    console.log('✅ Backend OpenAI endpoint is running');
  } catch (error) {
    console.log('❌ Backend OpenAI endpoint is not running');
    console.log('💡 Start backend with: cd backend && npm run dev');
  }
}

async function runChecks() {
  await checkOpenAIStatus();
  await testBackendEndpoint();
  
  console.log('\n📋 Summary:');
  console.log('1. If OpenAI quota exceeded: System will use fallback plans');
  console.log('2. If models not accessible: System will use fallback plans');
  console.log('3. If backend not running: Start with cd backend && npm run dev');
  console.log('4. If API key invalid: Check backend/.env file');
}

runChecks().catch(console.error);



