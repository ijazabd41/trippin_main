#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Trippin Environment Setup');
console.log('============================\n');

const backendDir = path.join(__dirname, 'goon-main', 'backend');
const envExamplePath = path.join(backendDir, 'env.example');
const envPath = path.join(backendDir, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists in backend directory');
  console.log('   If you want to recreate it, delete the existing file first.\n');
  process.exit(0);
}

// Check if env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.log('❌ env.example file not found in backend directory');
  console.log('   Please ensure the backend directory structure is correct.\n');
  process.exit(1);
}

// Copy env.example to .env
try {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env file from env.example');
  console.log(`   Location: ${envPath}\n`);
  
  console.log('📝 Next steps:');
  console.log('1. Edit the .env file with your actual API keys');
  console.log('2. Get your OpenAI API key from: https://platform.openai.com/');
  console.log('3. Get your Supabase credentials from: https://supabase.com/dashboard');
  console.log('4. Start the backend server: cd goon-main/backend && npm start\n');
  
  console.log('🔑 Required environment variables:');
  console.log('   - OPENAI_API_KEY (required for AI features)');
  console.log('   - SUPABASE_URL (required for database)');
  console.log('   - SUPABASE_ANON_KEY (required for database)');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY (required for database)');
  console.log('   - STRIPE_SECRET_KEY (optional, for payments)\n');
  
  console.log('📖 For detailed instructions, see: ENVIRONMENT_SETUP.md\n');
  
} catch (error) {
  console.log('❌ Error creating .env file:', error.message);
  process.exit(1);
}