import dotenv from 'dotenv';
import fs from 'fs';

console.log('🔍 Testing .env file loading...\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found');
  process.exit(1);
}

console.log('✅ .env file exists');

// Load environment variables
dotenv.config();

// Check specific variables
console.log('\n📋 Environment variables:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

// Show first few characters of API key (for security)
if (process.env.OPENAI_API_KEY) {
  console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
}

console.log('\n🔍 Raw .env file content (first 200 chars):');
const envContent = fs.readFileSync('.env', 'utf8');
console.log(envContent.substring(0, 200));



