import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const USER_ID = 'abe05ed2-f8e7-4cac-b1b9-2620b188fa16';

async function deleteUserOrders() {
  console.log('🗑️  Deleting orders for user:', USER_ID);
  console.log('=' .repeat(60));

  try {
    // First, get all orders for this user
    console.log('📋 Fetching orders...');
    const { data: orders, error: fetchError } = await supabase
      .from('esim_orders')
      .select('id, plan_id, esim_provider_order_id, status, created_at')
      .eq('user_id', USER_ID);

    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('ℹ️  No orders found for this user');
      return;
    }

    console.log(`📊 Found ${orders.length} order(s):`);
    orders.forEach((order, index) => {
      console.log(`   ${index + 1}. Order ID: ${order.id}`);
      console.log(`      Plan: ${order.plan_id}`);
      console.log(`      Provider Order ID: ${order.esim_provider_order_id || 'N/A'}`);
      console.log(`      Status: ${order.status}`);
      console.log(`      Created: ${order.created_at}`);
      console.log('');
    });

    // Delete the orders
    console.log('🗑️  Deleting orders...');
    const { data: deletedOrders, error: deleteError } = await supabase
      .from('esim_orders')
      .delete()
      .eq('user_id', USER_ID)
      .select();

    if (deleteError) {
      console.error('❌ Error deleting orders:', deleteError);
      return;
    }

    console.log('✅ Successfully deleted orders!');
    console.log(`   Deleted ${deletedOrders?.length || 0} order(s)`);

    // Also delete related notifications
    console.log('');
    console.log('🗑️  Deleting related notifications...');
    const { data: deletedNotifications, error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', USER_ID)
      .in('type', ['esim_purchased', 'esim_activated'])
      .select();

    if (notificationError) {
      console.warn('⚠️  Error deleting notifications:', notificationError);
    } else {
      console.log(`✅ Deleted ${deletedNotifications?.length || 0} notification(s)`);
    }

    console.log('');
    console.log('✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

deleteUserOrders();


