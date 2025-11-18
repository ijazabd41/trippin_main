#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Setting up backend configuration...\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, 'backend', '.env');
const envTemplate = `# Backend Environment Variables
NODE_ENV=development
PORT=3001

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# OpenAI Configuration (REQUIRED for plan generation)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (if using)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Database Configuration (if using)
DATABASE_URL=your_database_url_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Stripe Configuration (if using)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created backend/.env file');
  console.log('⚠️  Please edit backend/.env and add your OpenAI API key');
} else {
  console.log('✅ backend/.env file already exists');
}

// Check if OpenAI API key is configured
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your_openai_api_key_here')) {
    console.log('⚠️  OpenAI API key not configured in backend/.env');
    console.log('   Please add your OpenAI API key to backend/.env');
  } else {
    console.log('✅ OpenAI API key appears to be configured');
  }
} catch (error) {
  console.log('❌ Could not read backend/.env file');
}

console.log('\n📋 Next Steps:');
console.log('1. Edit backend/.env and add your OpenAI API key');
console.log('2. Restart the backend server: cd backend && npm run dev');
console.log('3. Test the system: open test-all-systems.html');
console.log('\n🎯 The system should work once the OpenAI API key is configured!');



