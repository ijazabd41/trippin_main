// Test email sending functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fuskrbebtyccnmaprmbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c2tyYmVidHljY25tYXBybWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5ODMsImV4cCI6MjA3NTYxNDk4M30.pDtk2wpcDoN61EASc3Gk4acte4BJEnIpy0jYbSmiS04';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmailSending() {
  console.log('🧪 Testing Supabase Email Sending...\n');
  
  const testEmails = [
    'test1@gmail.com',
    'test2@outlook.com', 
    'test3@yahoo.com',
    'test4@example.com'
  ];

  for (const email of testEmails) {
    console.log(`\n📧 Testing with ${email}...`);
    
    try {
      // Test 1: Sign up
      console.log('  - Attempting signup...');
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password: 'testpassword123',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });
      
      if (signupError) {
        console.log(`  ❌ Signup failed: ${signupError.message}`);
        
        // Check if it's a rate limit error
        if (signupError.message.includes('rate limit') || signupError.message.includes('too many')) {
          console.log('  🚨 RATE LIMIT HIT - This is likely the issue!');
          break;
        }
      } else {
        console.log(`  ✅ Signup successful: ${signupData.user?.email}`);
        console.log(`  📧 Email confirmation required: ${!signupData.user?.email_confirmed_at}`);
      }
      
      // Wait 2 seconds between attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🔍 Summary:');
  console.log('- If you see "RATE LIMIT HIT", that\'s your problem');
  console.log('- If signups work but no emails arrive, check spam folders');
  console.log('- If all signups fail, there might be a Supabase configuration issue');
}

testEmailSending();
