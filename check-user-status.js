// Check user status in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fuskrbebtyccnmaprmbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c2tyYmVidHljY25tYXBybWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5ODMsImV4cCI6MjA3NTYxNDk4M30.pDtk2wpcDoN61EASc3Gk4acte4BJEnIpy0jYbSmiS04';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserStatus() {
  console.log('🔍 Checking user status in Supabase...\n');
  
  const email = 'test@outlook.com';
  const password = 'testpassword123';
  
  try {
    // Test 1: Try to sign in
    console.log('1. Testing sign in...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signinError) {
      console.log(`❌ Signin failed: ${signinError.message}`);
      console.log(`   Error code: ${signinError.status}`);
    } else {
      console.log(`✅ Signin successful!`);
      console.log(`   User ID: ${signinData.user?.id}`);
      console.log(`   Email: ${signinData.user?.email}`);
      console.log(`   Email confirmed: ${signinData.user?.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Created at: ${signinData.user?.created_at}`);
    }
    
    // Test 2: Try to get current user (if signed in)
    console.log('\n2. Testing get current user...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log(`❌ Get user failed: ${userError.message}`);
    } else {
      console.log(`✅ Get user successful!`);
      console.log(`   User: ${userData.user?.email}`);
      console.log(`   Email confirmed: ${userData.user?.email_confirmed_at ? 'Yes' : 'No'}`);
    }
    
    // Test 3: Try to sign out
    console.log('\n3. Testing sign out...');
    const { error: signoutError } = await supabase.auth.signOut();
    
    if (signoutError) {
      console.log(`❌ Signout failed: ${signoutError.message}`);
    } else {
      console.log(`✅ Signout successful!`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

checkUserStatus();
