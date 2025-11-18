#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Backend-Frontend Connection...\n');

// Test backend health
console.log('📡 Testing Backend Health...');
const testBackend = () => {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', 'http://localhost:3001/health'], {
      stdio: 'pipe'
    });
    
    let output = '';
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Backend is running and healthy');
        console.log('Response:', output);
        resolve(true);
      } else {
        console.log('❌ Backend is not responding');
        resolve(false);
      }
    });
    
    curl.on('error', (error) => {
      console.log('❌ Backend connection failed:', error.message);
      resolve(false);
    });
  });
};

// Test frontend
console.log('🌐 Testing Frontend...');
const testFrontend = () => {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', 'http://localhost:5173'], {
      stdio: 'pipe'
    });
    
    let output = '';
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Frontend is running');
        resolve(true);
      } else {
        console.log('❌ Frontend is not responding');
        resolve(false);
      }
    });
    
    curl.on('error', (error) => {
      console.log('❌ Frontend connection failed:', error.message);
      resolve(false);
    });
  });
};

// Run tests
const runTests = async () => {
  console.log('Starting connection tests...\n');
  
  const backendHealthy = await testBackend();
  const frontendHealthy = await testFrontend();
  
  console.log('\n📊 Test Results:');
  console.log(`Backend: ${backendHealthy ? '✅ Healthy' : '❌ Not responding'}`);
  console.log(`Frontend: ${frontendHealthy ? '✅ Running' : '❌ Not responding'}`);
  
  if (backendHealthy && frontendHealthy) {
    console.log('\n🎉 All systems are running! Your backend and frontend are connected.');
    console.log('\n📱 You can now:');
    console.log('1. Visit http://localhost:5173 to see your app');
    console.log('2. Test the questionnaire flow');
    console.log('3. Generate travel plans with OpenAI');
    console.log('4. Check the backend connection test on the dashboard');
  } else {
    console.log('\n⚠️  Some services are not running. Please check:');
    if (!backendHealthy) {
      console.log('- Start backend: cd backend && npm run dev');
    }
    if (!frontendHealthy) {
      console.log('- Start frontend: npm run dev');
    }
  }
};

runTests().catch(console.error);



