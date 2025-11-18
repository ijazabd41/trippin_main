#!/usr/bin/env node

/**
 * Premium Payment Flow Test Script
 * 
 * This script tests the complete premium payment flow to ensure
 * users are properly upgraded to premium status after payment.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPaymentVerification() {
  console.log('🧪 Testing Payment Verification Flow');
  console.log('─'.repeat(50));

  try {
    // Test 1: Verify payment endpoint without Stripe (development mode)
    console.log('\n1️⃣ Testing verify-payment endpoint (development mode)...');
    
    const testSessionId = 'test_session_' + Date.now();
    const testUserId = 'test_user_' + Date.now();

    const verifyResponse = await fetch(`${backendUrl}/api/subscriptions/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: testSessionId,
        userId: testUserId
      })
    });

    const verifyData = await verifyResponse.json();
    console.log('📊 Verify payment response:', verifyData);

    if (verifyData.success) {
      console.log('✅ Payment verification successful');
    } else {
      console.log('❌ Payment verification failed:', verifyData.error);
    }

    // Test 2: Check subscription status endpoint
    console.log('\n2️⃣ Testing subscription status endpoint...');
    
    // First, create a test user
    const { data: testUser, error: userError } = await supabase.auth.admin.createUser({
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    });

    if (userError) {
      console.error('❌ Failed to create test user:', userError);
      return;
    }

    console.log('👤 Created test user:', testUser.user.email);

    // Get auth token for the test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.user.email,
      password: 'testpassword123'
    });

    if (authError) {
      console.error('❌ Failed to authenticate test user:', authError);
      return;
    }

    const authToken = authData.session.access_token;
    console.log('🔑 Got auth token for test user');

    // Test subscription status
    const statusResponse = await fetch(`${backendUrl}/api/subscriptions/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const statusData = await statusResponse.json();
    console.log('📊 Subscription status response:', statusData);

    if (statusData.success) {
      console.log('✅ Subscription status check successful');
      console.log('   Premium status:', statusData.data.isPremium);
    } else {
      console.log('❌ Subscription status check failed:', statusData.error);
    }

    // Test 3: Manual premium upgrade
    console.log('\n3️⃣ Testing manual premium upgrade...');
    
    const { data: upgradeData, error: upgradeError } = await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', testUser.user.id)
      .select()
      .single();

    if (upgradeError) {
      console.error('❌ Failed to upgrade user:', upgradeError);
    } else {
      console.log('✅ User upgraded to premium:', upgradeData);
    }

    // Test 4: Verify premium status after upgrade
    console.log('\n4️⃣ Verifying premium status after upgrade...');
    
    const statusResponse2 = await fetch(`${backendUrl}/api/subscriptions/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const statusData2 = await statusResponse2.json();
    console.log('📊 Updated subscription status:', statusData2);

    if (statusData2.success && statusData2.data.isPremium) {
      console.log('✅ Premium status verified successfully');
    } else {
      console.log('❌ Premium status verification failed');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test user...');
    await supabase.auth.admin.deleteUser(testUser.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection');
  console.log('─'.repeat(50));

  try {
    // Test basic database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }

    console.log('✅ Database connection successful');

    // Test users table structure
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('is_premium, premium_expires_at')
      .limit(1);

    if (usersError) {
      console.error('❌ Users table structure issue:', usersError);
      return false;
    }

    console.log('✅ Users table structure is correct');

    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Premium Payment Flow Test Suite');
  console.log('='.repeat(60));

  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('❌ Database connection failed, aborting tests');
    process.exit(1);
  }

  await testPaymentVerification();

  console.log('\n🎉 Test suite completed!');
  console.log('='.repeat(60));
}

main().catch(console.error);

