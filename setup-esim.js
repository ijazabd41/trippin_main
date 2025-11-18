#!/usr/bin/env node

/**
 * eSIM Setup Script for Trippin App
 * 
 * This script helps set up the eSIM functionality with the provided API credentials.
 * Run this script to configure your environment for eSIM integration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up eSIM functionality for Trippin App...\n');

// eSIM Configuration
const esimConfig = {
  ESIM_BASE: 'https://tubular-pie-835f20.netlify.app/',
  ESIM_TOKEN: '5mdcjufvuyN_PFyuUazHhSAYJrjdSnoft_AWrFfi'
};

// Frontend Environment Variables
const frontendEnv = `
# eSIM Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_ESIM_BASE_URL=${esimConfig.ESIM_BASE}
`;

// Backend Environment Variables
const backendEnv = `
# eSIM Configuration
ESIM_BASE=${esimConfig.ESIM_BASE}
ESIM_TOKEN=${esimConfig.ESIM_TOKEN}
`;

console.log('📝 Creating environment configuration...\n');

// Create frontend .env file
const frontendEnvPath = path.join(__dirname, '.env');
try {
  if (fs.existsSync(frontendEnvPath)) {
    console.log('✅ Frontend .env file already exists');
  } else {
    fs.writeFileSync(frontendEnvPath, frontendEnv);
    console.log('✅ Created frontend .env file');
  }
} catch (error) {
  console.error('❌ Failed to create frontend .env file:', error.message);
}

// Create backend .env file
const backendEnvPath = path.join(__dirname, 'backend', '.env');
try {
  if (fs.existsSync(backendEnvPath)) {
    console.log('✅ Backend .env file already exists');
  } else {
    fs.writeFileSync(backendEnvPath, backendEnv);
    console.log('✅ Created backend .env file');
  }
} catch (error) {
  console.error('❌ Failed to create backend .env file:', error.message);
}

console.log('\n🎉 eSIM setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Add your Stripe publishable key to the frontend .env file');
console.log('2. Add your Stripe secret key to the backend .env file');
console.log('3. Run the database setup: cd backend && npm run setup');
console.log('4. Start the development servers: npm run start-dev');
console.log('\n🔧 eSIM API Configuration:');
console.log(`   Base URL: ${esimConfig.ESIM_BASE}`);
console.log(`   Token: ${esimConfig.ESIM_TOKEN.substring(0, 10)}...`);
console.log('\n💳 Stripe Configuration:');
console.log('   - Get your publishable key from: https://dashboard.stripe.com/apikeys');
console.log('   - Get your secret key from: https://dashboard.stripe.com/apikeys');
console.log('   - Make sure to use test keys for development');
console.log('\n📱 eSIM Features Available:');
console.log('   - Browse available eSIM plans');
console.log('   - Purchase eSIM plans with Stripe payment');
console.log('   - View QR codes and activation codes');
console.log('   - Track usage and manage orders');
console.log('   - Automatic fallback to mock data when APIs are unavailable');
