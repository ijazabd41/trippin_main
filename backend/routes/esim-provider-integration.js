import express from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

// Real eSIM Provider Configuration
const ESIM_PROVIDERS = {
  // Example: Airalo API
  AIRALO: {
    baseUrl: process.env.AIRALO_API_URL || 'https://api.airalo.com/v2',
    apiKey: process.env.AIRALO_API_KEY,
    headers: {
      'Authorization': `Bearer ${process.env.AIRALO_API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  
  // Example: Nomad eSIM
  NOMAD: {
    baseUrl: process.env.NOMAD_API_URL || 'https://api.nomad.com/v1',
    apiKey: process.env.NOMAD_API_KEY,
    headers: {
      'Authorization': `Bearer ${process.env.NOMAD_API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  
  // Example: Holafly
  HOLAFLY: {
    baseUrl: process.env.HOLAFLY_API_URL || 'https://api.holafly.com/v1',
    apiKey: process.env.HOLAFLY_API_KEY,
    headers: {
      'Authorization': `Bearer ${process.env.HOLAFLY_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
};

// Helper function to make API calls to eSIM providers
async function callESIMProvider(provider, endpoint, options = {}) {
  const config = ESIM_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Provider ${provider} not configured`);
  }

  const url = `${config.baseUrl}${endpoint}`;
  const defaultOptions = {
    headers: config.headers,
    ...options
  };

  console.log(`🔄 Calling ${provider} API: ${url}`);
  
  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${provider} API Error:`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`${provider} API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Enhanced plan fetching with multiple providers
router.get('/plans', async (req, res) => {
  try {
    const { country, dataAmount, validity } = req.query;
    const allPlans = [];

    // Fetch from multiple providers in parallel
    const providerPromises = Object.keys(ESIM_PROVIDERS).map(async (provider) => {
      try {
        console.log(`📡 Fetching plans from ${provider}...`);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (country) queryParams.append('country', country);
        if (dataAmount) queryParams.append('data', dataAmount);
        if (validity) queryParams.append('validity', validity);
        
        const endpoint = `/plans${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const plans = await callESIMProvider(provider, endpoint);
        
        // Normalize plan data from different providers
        const normalizedPlans = plans.map(plan => ({
          id: `${provider.toLowerCase()}_${plan.id}`,
          provider: provider,
          originalId: plan.id,
          name: plan.name || plan.title,
          description: plan.description,
          dataAmount: plan.dataAmount || plan.data_limit,
          validity: plan.validity || plan.duration,
          price: {
            amount: plan.price?.amount || plan.cost,
            currency: plan.price?.currency || plan.currency || 'USD'
          },
          coverage: plan.coverage || plan.countries || [country],
          features: plan.features || [],
          isAvailable: plan.available !== false,
          providerData: plan // Keep original data for purchase
        }));
        
        return normalizedPlans;
      } catch (error) {
        console.warn(`⚠️ Failed to fetch from ${provider}:`, error.message);
        return []; // Return empty array if provider fails
      }
    });

    // Wait for all providers to respond
    const providerResults = await Promise.allSettled(providerPromises);
    
    // Combine all plans from all providers
    providerResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allPlans.push(...result.value);
      } else {
        console.error(`Provider ${Object.keys(ESIM_PROVIDERS)[index]} failed:`, result.reason);
      }
    });

    // Sort plans by price
    allPlans.sort((a, b) => a.price.amount - b.price.amount);

    // If no plans from providers, use fallback
    if (allPlans.length === 0) {
      console.log('📦 Using fallback plans - no provider data available');
      const fallbackPlans = [
        {
          id: 'fallback_1',
          provider: 'FALLBACK',
          name: 'Japan 3GB - 15 Days',
          description: '日本全国で使える15日間3GBプラン',
          dataAmount: '3GB',
          validity: '15日',
          price: { amount: 3500, currency: 'JPY' },
          coverage: ['Japan'],
          features: ['High-speed data', '24/7 support'],
          isAvailable: true
        }
      ];
      
      return res.json({
        success: true,
        data: fallbackPlans,
        isMockData: true,
        providers: []
      });
    }

    res.json({
      success: true,
      data: allPlans,
      isMockData: false,
      providers: Object.keys(ESIM_PROVIDERS),
      totalPlans: allPlans.length
    });

  } catch (error) {
    console.error('Failed to fetch eSIM plans:', error);
    res.status(500).json({
      error: 'Failed to fetch eSIM plans',
      code: 'PLANS_FETCH_ERROR',
      details: error.message
    });
  }
});

// Enhanced purchase flow
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Payments service unavailable', 
        code: 'PAYMENTS_UNCONFIGURED' 
      });
    }

    const { planId, customerInfo, paymentMethodId } = req.body;

    if (!planId || !customerInfo || !paymentMethodId) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Extract provider from planId (format: provider_originalId)
    const [provider, originalPlanId] = planId.split('_');
    if (!provider || !originalPlanId) {
      return res.status(400).json({
        error: 'Invalid plan ID format',
        code: 'INVALID_PLAN_ID'
      });
    }

    // Get plan details from the specific provider
    const planDetails = await callESIMProvider(provider, `/plans/${originalPlanId}`);
    
    if (!planDetails || !planDetails.price) {
      return res.status(404).json({
        error: 'Plan not found',
        code: 'PLAN_NOT_FOUND'
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(planDetails.price.amount * 100), // Convert to cents
      currency: planDetails.price.currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        user_id: req.user.id,
        plan_id: planId,
        provider: provider,
        esim_purchase: 'true'
      }
    });

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment failed',
        code: 'PAYMENT_FAILED',
        status: paymentIntent.status
      });
    }

    // Purchase eSIM from the specific provider
    const purchaseData = {
      planId: originalPlanId,
      customerInfo,
      paymentReference: paymentIntent.id
    };

    console.log(`🛒 Purchasing eSIM from ${provider}...`);
    const esimOrder = await callESIMProvider(provider, '/purchase', {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    });

    // Store order in database
    const { data: order, error: orderError } = await supabase
      .from('esim_orders')
      .insert({
        user_id: req.user.id,
        plan_id: planId,
        provider: provider,
        provider_order_id: esimOrder.id,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        customer_info: customerInfo,
        plan_details: planDetails,
        qr_code: esimOrder.qrCode,
        activation_code: esimOrder.activationCode,
        purchase_date: new Date().toISOString(),
        expiry_date: esimOrder.expiryDate
      })
      .select()
      .single();

    if (orderError) {
      console.error('Failed to store eSIM order:', orderError);
      return res.status(500).json({
        error: 'Failed to store order',
        code: 'ORDER_STORAGE_ERROR'
      });
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: req.user.id,
        type: 'esim_purchased',
        title: 'eSIM Purchased Successfully',
        message: `Your eSIM plan "${planDetails.name}" has been purchased successfully.`,
        metadata: {
          order_id: order.id,
          plan_id: planId,
          provider: provider
        }
      });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        qrCode: esimOrder.qrCode,
        activationCode: esimOrder.activationCode,
        planName: planDetails.name,
        expiryDate: esimOrder.expiryDate,
        provider: provider
      }
    });

  } catch (error) {
    console.error('eSIM purchase error:', error);
    res.status(500).json({
      error: 'Failed to purchase eSIM',
      code: 'ESIM_PURCHASE_ERROR',
      details: error.message
    });
  }
});

// Get plan details from specific provider
router.get('/plans/:provider/:planId', async (req, res) => {
  try {
    const { provider, planId } = req.params;
    
    const planDetails = await callESIMProvider(provider, `/plans/${planId}`);
    
    res.json({
      success: true,
      data: planDetails
    });
  } catch (error) {
    console.error('Failed to fetch plan details:', error);
    res.status(500).json({
      error: 'Failed to fetch plan details',
      code: 'PLAN_DETAILS_ERROR'
    });
  }
});

// Activate eSIM with provider
router.post('/orders/:id/activate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from('esim_orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        error: 'Order cannot be activated',
        code: 'INVALID_ACTIVATION_STATUS'
      });
    }

    // Activate with the specific provider
    const activationResult = await callESIMProvider(
      order.provider, 
      `/orders/${order.provider_order_id}/activate`,
      { method: 'POST' }
    );

    // Update order status
    const { error: updateError } = await supabase
      .from('esim_orders')
      .update({
        status: 'active',
        activated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({
        error: 'Failed to update order status',
        code: 'ORDER_UPDATE_ERROR'
      });
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: req.user.id,
        type: 'esim_activated',
        title: 'eSIM Activated',
        message: `Your eSIM plan "${order.plan_details.name}" is now active.`,
        metadata: {
          order_id: id,
          provider: order.provider
        }
      });

    res.json({
      success: true,
      data: activationResult
    });

  } catch (error) {
    console.error('Activate eSIM error:', error);
    res.status(500).json({
      error: 'Failed to activate eSIM',
      code: 'ESIM_ACTIVATION_ERROR'
    });
  }
});

export default router;
