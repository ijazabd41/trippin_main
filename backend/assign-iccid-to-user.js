import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const args = process.argv.slice(2);
const [iccidArg, userIdArg, orderIdArg, referenceArg] = args;

if (!iccidArg || !userIdArg) {
  console.error('❌ Usage: node assign-iccid-to-user.js <ICCID> <USER_ID> [ORDER_ID] [REFERENCE_ID]');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ICCID = iccidArg.trim();
const USER_ID = userIdArg.trim();
const ORDER_ID = orderIdArg ? orderIdArg.trim() : null;
const REFERENCE_ID = referenceArg ? referenceArg.trim() : null;

const MANUAL_PLAN_ID = 'manual-iccid-assignment';
const MANUAL_PLAN_DETAILS = {
  name: 'Manual ICCID Assignment',
  description: 'Placeholder order created manually for ICCID debugging',
  dataAmount: '0GB',
  validityDays: 30,
  priceAmount: 0,
  priceCurrency: 'USD',
  addedFromScript: true
};

function buildUsageData(existingUsage = {}) {
  const timestamp = new Date().toISOString();
  return {
    ...existingUsage,
    iccid: ICCID,
    ICCID,
    assignedManually: true,
    assignedAt: timestamp
  };
}

async function assignIccidToUser() {
  console.log('🔄 Assigning ICCID to user');
  console.log(`   User:  ${USER_ID}`);
  console.log(`   ICCID: ${ICCID}`);
  if (ORDER_ID) {
    console.log(`   Target order ID: ${ORDER_ID}`);
  }
  if (REFERENCE_ID) {
    console.log(`   Using reference ID: ${REFERENCE_ID}`);
  }
  console.log('='.repeat(60));

  const { data: orders, error: ordersError } = await supabase
    .from('esim_orders')
    .select('*')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('❌ Failed to fetch existing orders:', ordersError.message);
    process.exit(1);
  }

  let targetOrder = null;
  if (orders && orders.length > 0) {
    if (ORDER_ID) {
      targetOrder = orders.find((order) => order.id === ORDER_ID);
      if (!targetOrder) {
        console.warn('⚠️ Specified order not found for user, will create placeholder order');
      }
    } else {
      targetOrder = orders[0];
      console.log(`ℹ️ Updating most recent order (${targetOrder.id})`);
    }
  } else {
    console.log('ℹ️ No existing orders found for this user');
  }

  if (targetOrder) {
    const usageData = buildUsageData(targetOrder.usage_data || {});

    // Also update esim_provider_order_id if reference is provided
    const updateData = {
      usage_data: usageData,
      updated_at: new Date().toISOString()
    };
    
    if (REFERENCE_ID) {
      updateData.esim_provider_order_id = REFERENCE_ID;
      console.log(`   Will also update reference ID to: ${REFERENCE_ID}`);
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('esim_orders')
      .update(updateData)
      .eq('id', targetOrder.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update existing order:', updateError.message);
      process.exit(1);
    }

    console.log('✅ ICCID added to existing order');
    console.log(JSON.stringify(updatedOrder, null, 2));
    return;
  }

  const now = new Date().toISOString();
  const manualOrderReference = REFERENCE_ID || `manual-${Date.now()}`;
  const usageData = buildUsageData();

  const { data: insertedOrder, error: insertError } = await supabase
    .from('esim_orders')
    .insert({
      user_id: USER_ID,
      plan_id: MANUAL_PLAN_ID,
      esim_provider_order_id: manualOrderReference,
      status: 'active',
      customer_info: {
        name: 'Manual ICCID Assignment',
        email: 'support@local.dev',
        source: 'assign-iccid-to-user.js'
      },
      plan_details: MANUAL_PLAN_DETAILS,
      qr_code: null,
      activation_code: null,
      purchase_date: now,
      activated_at: now,
      usage_data: usageData
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to insert placeholder order:', insertError.message);
    process.exit(1);
  }

  console.log('✅ Placeholder order created with ICCID');
  console.log(JSON.stringify(insertedOrder, null, 2));
}

assignIccidToUser().then(() => {
  console.log('🎉 Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});


