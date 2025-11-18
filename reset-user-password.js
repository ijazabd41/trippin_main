// Reset user password in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fuskrbebtyccnmaprmbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c2tyYmVidHljY25tYXBybWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5ODMsImV4cCI6MjA3NTYxNDk4M30.pDtk2wpcDoN61EASc3Gk4acte4BJEnIpy0jYbSmiS04';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetUserPassword() {
  console.log('🔄 Resetting user password...\n');
  
  const email = 'test@outlook.com';
  const newPassword = 'testpassword123';
  
  try {
    // Step 1: Send password reset email
    console.log('1. Sending password reset email...');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/supabase-auth/verify-email'
    });
    
    if (resetError) {
      console.log(`❌ Reset email failed: ${resetError.message}`);
      return;
    }
    
    console.log(`✅ Password reset email sent to ${email}`);
    console.log('📧 Check your email for the reset link');
    console.log('🔗 Click the link and set a new password');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetUserPassword();
