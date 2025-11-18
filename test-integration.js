#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Trippin Integration...\n');

// Test 1: Check if Supabase dependency is installed
console.log('1. Checking Supabase dependency...');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.dependencies['@supabase/supabase-js']) {
  console.log('✅ Supabase dependency found');
} else {
  console.log('❌ Supabase dependency missing');
  process.exit(1);
}

// Test 2: Check if App.tsx uses Supabase
console.log('\n2. Checking App.tsx integration...');
const appPath = path.join(__dirname, 'src', 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');

if (appContent.includes('SupabaseAuthProvider') && appContent.includes('BackendTripProvider')) {
  console.log('✅ App.tsx uses Supabase integration');
} else {
  console.log('❌ App.tsx not properly configured');
  process.exit(1);
}

// Test 3: Check if main.tsx is clean
console.log('\n3. Checking main.tsx...');
const mainPath = path.join(__dirname, 'src', 'main.tsx');
const mainContent = fs.readFileSync(mainPath, 'utf8');

if (!mainContent.includes('Auth0') && mainContent.includes('App')) {
  console.log('✅ main.tsx is properly configured');
} else {
  console.log('❌ main.tsx needs cleanup');
  process.exit(1);
}

// Test 4: Check if environment files exist
console.log('\n4. Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
const backendEnvPath = path.join(__dirname, 'backend', '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ Frontend .env exists');
} else {
  console.log('⚠️  Frontend .env missing - run: node setup-environment.js');
}

if (fs.existsSync(backendEnvPath)) {
  console.log('✅ Backend .env exists');
} else {
  console.log('⚠️  Backend .env missing - run: node setup-environment.js');
}

// Test 5: Check if backend has required files
console.log('\n5. Checking backend configuration...');
const backendServerPath = path.join(__dirname, 'backend', 'server.js');
const backendPackagePath = path.join(__dirname, 'backend', 'package.json');

if (fs.existsSync(backendServerPath) && fs.existsSync(backendPackagePath)) {
  console.log('✅ Backend files present');
} else {
  console.log('❌ Backend files missing');
  process.exit(1);
}

console.log('\n🎉 Integration test completed!');
console.log('\n📋 Next steps:');
console.log('1. Set up Supabase project');
console.log('2. Configure environment variables');
console.log('3. Run: cd backend && npm run setup');
console.log('4. Start backend: cd backend && npm run dev');
console.log('5. Start frontend: npm run dev');
console.log('\n📚 See INTEGRATION_FIX_GUIDE.md for detailed instructions');
