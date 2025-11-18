// Script to update an existing user to premium status
import { supabaseAdmin } from './config/supabase.js';

async function updateUserToPremium(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // First, find the user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, is_premium, premium_expires_at')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('❌ Error finding user:', userError);
      return;
    }

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      return;
    }

    console.log('👤 Found user:', {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      current_premium: user.is_premium,
      current_expires_at: user.premium_expires_at
    });

    // Set premium status to true and expiration date to 1 year from now
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: oneYearFromNow.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('id, email, full_name, is_premium, premium_expires_at')
      .single();

    if (updateError) {
      console.error('❌ Error updating user premium status:', updateError);
      return;
    }

    console.log('✅ Successfully updated user to premium!');
    console.log('📊 Updated user details:', {
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      is_premium: updatedUser.is_premium,
      premium_expires_at: updatedUser.premium_expires_at
    });

    // Create a notification for the user
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
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

    console.log('\n🎉 User updated to premium successfully!');
    console.log('📧 Email:', email);
    console.log('⭐ Premium Status: Active');
    console.log('📅 Expires:', oneYearFromNow.toLocaleDateString());

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2] || 'ijazabd41@gmail.com';

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Please provide a valid email address');
  process.exit(1);
}

console.log('🚀 Updating user to premium...');
updateUserToPremium(email);

