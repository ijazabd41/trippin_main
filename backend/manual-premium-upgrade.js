#!/usr/bin/env node

/**
 * Manual Premium User Upgrade Script
 * 
 * This script allows you to manually upgrade users to premium status
 * for testing purposes or to fix users who didn't get upgraded properly.
 * 
 * Usage:
 * node manual-premium-upgrade.js <user_email_or_id> [days]
 * 
 * Examples:
 * node manual-premium-upgrade.js user@example.com 30
 * node manual-premium-upgrade.js 123e4567-e89b-12d3-a456-426614174000 30
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function upgradeUserToPremium(userIdentifier, days = 30) {
  try {
    console.log(`🔄 Upgrading user to premium: ${userIdentifier}`);
    console.log(`📅 Premium duration: ${days} days`);

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    // Try to find user by email first, then by ID
    let userQuery = supabase
      .from('users')
      .select('id, email, full_name, is_premium, premium_expires_at')
      .or(`email.eq.${userIdentifier},id.eq.${userIdentifier}`)
      .single();

    const { data: user, error: userError } = await userQuery;

    if (userError || !user) {
      console.error('❌ User not found:', userIdentifier);
      console.error('   Error:', userError?.message);
      return false;
    }

    console.log('👤 Found user:', {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      current_premium: user.is_premium,
      current_expires_at: user.premium_expires_at
    });

    // Update user to premium
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update user:', updateError);
      return false;
    }

    // Create notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'subscription_created',
        title: 'Welcome to Premium!',
        message: 'Your premium subscription has been activated. Enjoy all the premium features!',
        metadata: {
          upgraded_by: 'manual_script',
          expires_at: expiresAt,
          days: days
        }
      });

    if (notificationError) {
      console.warn('⚠️ Failed to create notification:', notificationError.message);
    }

    console.log('✅ User successfully upgraded to premium!');
    console.log('📊 Updated user data:', {
      id: updatedUser.id,
      email: updatedUser.email,
      is_premium: updatedUser.is_premium,
      premium_expires_at: updatedUser.premium_expires_at
    });

    return true;
  } catch (error) {
    console.error('❌ Error upgrading user:', error);
    return false;
  }
}

async function listPremiumUsers() {
  try {
    console.log('📋 Listing all premium users...');
    
    const { data: premiumUsers, error } = await supabase
      .from('users')
      .select('id, email, full_name, is_premium, premium_expires_at, created_at')
      .eq('is_premium', true)
      .order('premium_expires_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching premium users:', error);
      return;
    }

    console.log(`\n👑 Premium Users (${premiumUsers.length}):`);
    console.log('─'.repeat(80));
    
    premiumUsers.forEach((user, index) => {
      const expiresAt = user.premium_expires_at ? new Date(user.premium_expires_at) : null;
      const isExpired = expiresAt && expiresAt < new Date();
      const status = isExpired ? '❌ EXPIRED' : '✅ ACTIVE';
      
      console.log(`${index + 1}. ${user.email} (${user.full_name || 'No name'})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Status: ${status}`);
      console.log(`   Expires: ${expiresAt ? expiresAt.toLocaleString() : 'Never'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing premium users:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Manual Premium Upgrade Script');
    console.log('');
    console.log('Usage:');
    console.log('  node manual-premium-upgrade.js <user_email_or_id> [days]');
    console.log('  node manual-premium-upgrade.js list');
    console.log('');
    console.log('Examples:');
    console.log('  node manual-premium-upgrade.js user@example.com 30');
    console.log('  node manual-premium-upgrade.js 123e4567-e89b-12d3-a456-426614174000 30');
    console.log('  node manual-premium-upgrade.js list');
    console.log('');
    process.exit(0);
  }

  if (args[0] === 'list') {
    await listPremiumUsers();
    return;
  }

  const userIdentifier = args[0];
  const days = parseInt(args[1]) || 30;

  if (days <= 0) {
    console.error('❌ Days must be a positive number');
    process.exit(1);
  }

  const success = await upgradeUserToPremium(userIdentifier, days);
  process.exit(success ? 0 : 1);
}

main().catch(console.error);

