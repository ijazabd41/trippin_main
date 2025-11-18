// 🚀 Airalo eSIM Integration Example
// This shows you exactly how to integrate with Airalo's real API

import fetch from 'node-fetch';

// Airalo API Configuration
const AIRALO_CONFIG = {
  baseUrl: 'https://api.airalo.com/v2',
  apiKey: process.env.AIRALO_API_KEY, // Get this from Airalo dashboard
  headers: {
    'Authorization': `Bearer ${process.env.AIRALO_API_KEY}`,
    'Content-Type': 'application/json'
  }
};

// 1. Get Available Countries
async function getAiraloCountries() {
  try {
    const response = await fetch(`${AIRALO_CONFIG.baseUrl}/countries`, {
      headers: AIRALO_CONFIG.headers
    });
    
    if (!response.ok) {
      throw new Error(`Airalo API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🌍 Available countries:', data.countries);
    return data.countries;
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    throw error;
  }
}

// 2. Get Plans for a Specific Country
async function getAiraloPlans(countryCode = 'JP') {
  try {
    console.log(`📡 Fetching plans for ${countryCode}...`);
    
    const response = await fetch(`${AIRALO_CONFIG.baseUrl}/plans?country=${countryCode}`, {
      headers: AIRALO_CONFIG.headers
    });
    
    if (!response.ok) {
      throw new Error(`Airalo API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Airalo data to your format
    const normalizedPlans = data.plans.map(plan => ({
      id: `airalo_${plan.id}`,
      provider: 'AIRALO',
      name: plan.name,
      description: plan.description,
      dataAmount: plan.data_limit,
      validity: plan.duration,
      price: {
        amount: plan.price,
        currency: plan.currency
      },
      coverage: [plan.country],
      features: plan.features || [],
      isAvailable: plan.available,
      // Keep original data for purchase
      originalData: plan
    }));
    
    console.log(`✅ Found ${normalizedPlans.length} plans for ${countryCode}`);
    return normalizedPlans;
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    throw error;
  }
}

// 3. Purchase eSIM from Airalo
async function purchaseAiraloESIM(planId, customerInfo) {
  try {
    console.log(`🛒 Purchasing eSIM plan ${planId}...`);
    
    const purchaseData = {
      plan_id: planId,
      customer_info: {
        first_name: customerInfo.name.split(' ')[0],
        last_name: customerInfo.name.split(' ').slice(1).join(' '),
        email: customerInfo.email,
        phone: customerInfo.phone
      }
    };
    
    const response = await fetch(`${AIRALO_CONFIG.baseUrl}/purchase`, {
      method: 'POST',
      headers: AIRALO_CONFIG.headers,
      body: JSON.stringify(purchaseData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Purchase failed: ${errorData.message}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Purchase successful:', {
      orderId: result.order_id,
      hasQRCode: !!result.qr_code,
      activationCode: result.activation_code
    });
    
    return {
      orderId: result.order_id,
      qrCode: result.qr_code,
      activationCode: result.activation_code,
      expiryDate: result.expiry_date,
      status: result.status
    };
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}

// 4. Get Order Status
async function getAiraloOrderStatus(orderId) {
  try {
    const response = await fetch(`${AIRALO_CONFIG.baseUrl}/orders/${orderId}`, {
      headers: AIRALO_CONFIG.headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get order status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get order status:', error);
    throw error;
  }
}

// 5. Activate eSIM
async function activateAiraloESIM(orderId) {
  try {
    console.log(`🔄 Activating eSIM order ${orderId}...`);
    
    const response = await fetch(`${AIRALO_CONFIG.baseUrl}/orders/${orderId}/activate`, {
      method: 'POST',
      headers: AIRALO_CONFIG.headers
    });
    
    if (!response.ok) {
      throw new Error(`Activation failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ eSIM activated successfully');
    return result;
  } catch (error) {
    console.error('Activation failed:', error);
    throw error;
  }
}

// 6. Complete Integration Example
async function completeESIMFlow() {
  try {
    console.log('🚀 Starting complete eSIM flow...');
    
    // Step 1: Get available countries
    const countries = await getAiraloCountries();
    console.log('Available countries:', countries.map(c => c.name));
    
    // Step 2: Get plans for Japan
    const plans = await getAiraloPlans('JP');
    console.log('Available plans:', plans.map(p => `${p.name} - ${p.price.amount} ${p.price.currency}`));
    
    // Step 3: Select a plan (first one for demo)
    const selectedPlan = plans[0];
    if (!selectedPlan) {
      throw new Error('No plans available');
    }
    
    console.log(`Selected plan: ${selectedPlan.name}`);
    
    // Step 4: Customer info
    const customerInfo = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890'
    };
    
    // Step 5: Purchase eSIM
    const purchaseResult = await purchaseAiraloESIM(selectedPlan.originalData.id, customerInfo);
    console.log('Purchase result:', purchaseResult);
    
    // Step 6: Activate eSIM
    const activationResult = await activateAiraloESIM(purchaseResult.orderId);
    console.log('Activation result:', activationResult);
    
    console.log('🎉 Complete eSIM flow successful!');
    return {
      plan: selectedPlan,
      purchase: purchaseResult,
      activation: activationResult
    };
    
  } catch (error) {
    console.error('❌ eSIM flow failed:', error);
    throw error;
  }
}

// Export functions for use in your application
export {
  getAiraloCountries,
  getAiraloPlans,
  purchaseAiraloESIM,
  getAiraloOrderStatus,
  activateAiraloESIM,
  completeESIMFlow
};

// Example usage:
// const result = await completeESIMFlow();
// console.log('Final result:', result);
