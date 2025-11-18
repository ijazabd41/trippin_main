// Create a fresh user for testing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fuskrbebtyccnmaprmbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c2tyYmVidHljY25tYXBybWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5ODMsImV4cCI6MjA3NTYxNDk4M30.pDtk2wpcDoN61EASc3Gk4acte4BJEnIpy0jYbSmiS04';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createFreshUser() {
  console.log('👤 Creating fresh user for testing...\n');
  
  const email = 'freshuser@outlook.com';
  const password = 'testpassword123';
  
  try {
    // Step 1: Sign up new user
    console.log('1. Creating new user...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Fresh Test User'
        }
      }
    });
    
    if (signupError) {
      console.log(`❌ Signup failed: ${signupError.message}`);
      return;
    }
    
    console.log(`✅ User created: ${signupData.user?.email}`);
    console.log(`📧 Email confirmation required: ${!signupData.user?.email_confirmed_at}`);
    
    if (!signupData.user?.email_confirmed_at) {
      console.log('\n📧 Check your email for verification link');
      console.log('🔗 Click the link to verify the email');
      console.log('⏳ Then try logging in with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createFreshUser();
