// Script to verify user premium status
import { supabaseAdmin } from './config/supabase.js';

async function verifyUserPremium(email) {
  try {
    console.log(`🔍 Verifying premium status for: ${email}`);
    
    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, is_premium, premium_expires_at, created_at, updated_at')
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

    console.log('👤 User details:', {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_premium: user.is_premium,
      premium_expires_at: user.premium_expires_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    });

    // Check if premium is still valid
    const now = new Date();
    const expiresAt = user.premium_expires_at ? new Date(user.premium_expires_at) : null;
    
    const isPremiumValid = user.is_premium && 
      (!expiresAt || expiresAt > now);

    console.log('\n📊 Premium Status Analysis:');
    console.log('✅ is_premium flag:', user.is_premium);
    console.log('📅 Expires at:', expiresAt ? expiresAt.toISOString() : 'No expiration');
    console.log('⏰ Current time:', now.toISOString());
    console.log('🔍 Premium valid:', isPremiumValid);
    
    if (expiresAt) {
      const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      console.log('📆 Days until expiry:', daysUntilExpiry);
    }

    // Test the subscription status endpoint logic
    console.log('\n🧪 Testing subscription status endpoint logic:');
    const subscriptionData = {
      isPremium: isPremiumValid,
      planName: isPremiumValid ? 'プレミアムプラン' : 'フリープラン',
      amount: isPremiumValid ? 2500 : 0,
      currency: 'JPY',
      interval: 'month',
      nextBillingDate: isPremiumValid ? user.premium_expires_at : null,
      status: isPremiumValid ? 'active' : 'free',
      expiresAt: user.premium_expires_at,
      isActive: isPremiumValid
    };

    console.log('📋 Subscription data that should be returned:', subscriptionData);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2] || 'ijazabd41@gmail.com';

console.log('🚀 Verifying user premium status...');
verifyUserPremium(email);

