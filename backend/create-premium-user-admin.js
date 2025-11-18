// Script to create a user and make them premium using admin privileges
import { supabaseAdmin } from './config/supabase.js';

// Simple UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createUserAndMakePremium(email, fullName = null) {
  try {
    console.log(`🚀 Creating user and making premium: ${email}`);
    
    // Generate a UUID for the user
    const userId = generateUUID();
    
    console.log(`📝 Creating user with ID: ${userId}`);
    
    // Set premium status to true and expiration date to 1 year from now
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    // Create the user directly in the users table using admin client
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: fullName || 'Premium User',
        is_premium: true,
        premium_expires_at: oneYearFromNow.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, full_name, is_premium, premium_expires_at')
      .single();

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }

    console.log('✅ Successfully created premium user!');
    console.log('📊 User details:', {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      is_premium: newUser.is_premium,
      premium_expires_at: newUser.premium_expires_at
    });

    // Create a notification for the user
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'subscription_created',
        title: 'Welcome to Premium!',
        message: 'Your premium subscription has been activated. Enjoy all the premium features!',
        metadata: {
          plan_id: 'premium',
          plan_name: 'プレミアムプラン',
          activated_by: 'admin'
        }
      });

    if (notificationError) {
      console.warn('⚠️ Warning: Could not create notification:', notificationError);
    } else {
      console.log('📧 Notification created for user');
    }

    console.log('\n🎉 User created successfully!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', fullName || 'Premium User');
    console.log('⭐ Premium Status: Active');
    console.log('📅 Expires:', oneYearFromNow.toLocaleDateString());

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2] || 'ijazabd41@gmail.com';
const fullName = process.argv[3] || 'Ijaz Ahmed';

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Please provide a valid email address');
  process.exit(1);
}

console.log('🚀 Creating user and making premium...');
createUserAndMakePremium(email, fullName);

