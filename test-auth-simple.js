// Simple test script to verify Supabase authentication
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fuskrbebtyccnmaprmbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c2tyYmVidHljY25tYXBybWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5ODMsImV4cCI6MjA3NTYxNDk4M30.pDtk2wpcDoN61EASc3Gk4acte4BJEnIpy0jYbSmiS04';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🧪 Testing Supabase Authentication...\n');
  
  try {
    // Test 1: Sign up
    console.log('1. Testing user signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'testuser@gmail.com',
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful:', signupData.user?.email);
    }
    
    // Test 2: Sign in
    console.log('\n2. Testing user signin...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: 'testuser@gmail.com',
      password: 'testpassword123'
    });
    
    if (signinError) {
      console.log('❌ Signin failed:', signinError.message);
    } else {
      console.log('✅ Signin successful:', signinData.user?.email);
      console.log('🔑 Session token:', signinData.session?.access_token?.substring(0, 20) + '...');
    }
    
    // Test 3: Get user
    console.log('\n3. Testing get user...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Get user failed:', userError.message);
    } else {
      console.log('✅ Get user successful:', userData.user?.email);
    }
    
    // Test 4: Sign out
    console.log('\n4. Testing signout...');
    const { error: signoutError } = await supabase.auth.signOut();
    
    if (signoutError) {
      console.log('❌ Signout failed:', signoutError.message);
    } else {
      console.log('✅ Signout successful');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAuth();
