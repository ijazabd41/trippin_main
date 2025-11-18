# 🌍 Complete eSIM Provider Integration Guide

## Overview
This guide shows you how to practically integrate with real eSIM providers to display plans on your site and handle purchases.

## 🔄 Complete Flow Architecture

```
User → Your Frontend → Your Backend → eSIM Provider API → Real eSIM
                     ↓
                 Stripe Payment
                     ↓
                 Your Database
```

## 🏢 Popular eSIM Providers & APIs

### 1. **Airalo** (Recommended for beginners)
- **API**: https://api.airalo.com/v2
- **Documentation**: https://docs.airalo.com/
- **Features**: Global coverage, easy integration
- **Pricing**: Competitive rates

### 2. **Nomad eSIM**
- **API**: https://api.nomad.com/v1
- **Features**: Good for specific regions
- **Pricing**: Mid-range

### 3. **Holafly**
- **API**: https://api.holafly.com/v1
- **Features**: Unlimited data plans
- **Pricing**: Premium

### 4. **GigSky**
- **API**: https://api.gigsky.com/v1
- **Features**: Enterprise-focused
- **Pricing**: Variable

## 🛠 Implementation Steps

### Step 1: Environment Configuration

Create `.env` file in your backend:

```bash
# eSIM Provider APIs
AIRALO_API_URL=https://api.airalo.com/v2
AIRALO_API_KEY=your_airalo_api_key

NOMAD_API_URL=https://api.nomad.com/v1
NOMAD_API_KEY=your_nomad_api_key

HOLAFLY_API_URL=https://api.holafly.com/v1
HOLAFLY_API_KEY=your_holafly_api_key

# Payment
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Database Schema

```sql
-- eSIM Orders Table
CREATE TABLE esim_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan_id VARCHAR NOT NULL,
  provider VARCHAR NOT NULL,
  provider_order_id VARCHAR NOT NULL,
  stripe_payment_intent_id VARCHAR,
  status VARCHAR DEFAULT 'pending',
  customer_info JSONB,
  plan_details JSONB,
  qr_code TEXT,
  activation_code VARCHAR,
  purchase_date TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP,
  activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_esim_orders_user_id ON esim_orders(user_id);
CREATE INDEX idx_esim_orders_status ON esim_orders(status);
```

### Step 3: Frontend Integration

Update your frontend to handle real provider data:

```typescript
// Enhanced ESIM Service
export class ESIMService {
  // Fetch plans from multiple providers
  async getPlans(country?: string, dataAmount?: string) {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (dataAmount) params.append('dataAmount', dataAmount);
    
    const response = await fetch(`/api/esim/plans?${params}`);
    return response.json();
  }
  
  // Purchase eSIM
  async purchaseESIM(planId: string, customerInfo: any, paymentMethodId: string) {
    const response = await fetch('/api/esim/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        customerInfo,
        paymentMethodId
      })
    });
    return response.json();
  }
}
```

### Step 4: Real Provider API Examples

#### Airalo API Integration
```javascript
// Fetch plans from Airalo
async function getAiraloPlans(country = 'JP') {
  const response = await fetch(`https://api.airalo.com/v2/plans?country=${country}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRALO_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  // Normalize Airalo data to your format
  return data.plans.map(plan => ({
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
    isAvailable: plan.available
  }));
}
```

#### Purchase from Airalo
```javascript
async function purchaseFromAiralo(planId, customerInfo) {
  const response = await fetch('https://api.airalo.com/v2/purchase', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AIRALO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plan_id: planId,
      customer_info: customerInfo
    })
  });
  
  const result = await response.json();
  
  return {
    orderId: result.order_id,
    qrCode: result.qr_code,
    activationCode: result.activation_code,
    expiryDate: result.expiry_date
  };
}
```

## 💰 Revenue Model

### 1. **Markup Strategy**
```javascript
// Add your markup to provider prices
function addMarkup(providerPrice, markupPercentage = 20) {
  return {
    amount: Math.round(providerPrice.amount * (1 + markupPercentage / 100)),
    currency: providerPrice.currency
  };
}
```

### 2. **Commission Tracking**
```sql
-- Add commission tracking
ALTER TABLE esim_orders ADD COLUMN commission_amount DECIMAL(10,2);
ALTER TABLE esim_orders ADD COLUMN markup_percentage DECIMAL(5,2);
```

## 🔒 Security & Best Practices

### 1. **API Key Management**
```javascript
// Secure API key storage
const getProviderConfig = (provider) => {
  const configs = {
    AIRALO: {
      baseUrl: process.env.AIRALO_API_URL,
      apiKey: process.env.AIRALO_API_KEY
    }
  };
  
  if (!configs[provider]) {
    throw new Error(`Provider ${provider} not configured`);
  }
  
  return configs[provider];
};
```

### 2. **Rate Limiting**
```javascript
// Implement rate limiting for provider APIs
const rateLimiter = new Map();

async function callWithRateLimit(provider, endpoint, options) {
  const key = `${provider}_${endpoint}`;
  const lastCall = rateLimiter.get(key);
  
  if (lastCall && Date.now() - lastCall < 1000) { // 1 second between calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  rateLimiter.set(key, Date.now());
  return callESIMProvider(provider, endpoint, options);
}
```

### 3. **Error Handling & Fallbacks**
```javascript
async function getPlansWithFallback(country) {
  try {
    // Try primary provider
    return await getAiraloPlans(country);
  } catch (error) {
    console.warn('Airalo failed, trying Nomad:', error);
    
    try {
      // Try secondary provider
      return await getNomadPlans(country);
    } catch (error) {
      console.warn('All providers failed, using fallback:', error);
      
      // Use fallback data
      return getFallbackPlans(country);
    }
  }
}
```

## 📊 Monitoring & Analytics

### 1. **Provider Performance Tracking**
```javascript
// Track provider success rates
const providerStats = {
  AIRALO: { calls: 0, successes: 0, failures: 0 },
  NOMAD: { calls: 0, successes: 0, failures: 0 }
};

function trackProviderCall(provider, success) {
  providerStats[provider].calls++;
  if (success) {
    providerStats[provider].successes++;
  } else {
    providerStats[provider].failures++;
  }
}
```

### 2. **Revenue Analytics**
```sql
-- Revenue by provider
SELECT 
  provider,
  COUNT(*) as orders,
  SUM(commission_amount) as total_commission,
  AVG(commission_amount) as avg_commission
FROM esim_orders 
WHERE status = 'active'
GROUP BY provider;
```

## 🚀 Deployment Checklist

### 1. **Environment Setup**
- [ ] Configure all provider API keys
- [ ] Set up Stripe payment processing
- [ ] Configure database with proper indexes
- [ ] Set up monitoring and logging

### 2. **Testing**
- [ ] Test plan fetching from all providers
- [ ] Test purchase flow end-to-end
- [ ] Test error handling and fallbacks
- [ ] Test payment processing

### 3. **Production Considerations**
- [ ] Implement proper error logging
- [ ] Set up health checks for all providers
- [ ] Configure rate limiting
- [ ] Set up monitoring dashboards

## 💡 Pro Tips

### 1. **Caching Strategy**
```javascript
// Cache plans for 1 hour to reduce API calls
const planCache = new Map();

async function getCachedPlans(country) {
  const cacheKey = `plans_${country}`;
  const cached = planCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }
  
  const plans = await fetchPlansFromProviders(country);
  planCache.set(cacheKey, {
    data: plans,
    timestamp: Date.now()
  });
  
  return plans;
}
```

### 2. **Multi-Provider Strategy**
```javascript
// Always have multiple providers for redundancy
const PROVIDER_PRIORITY = ['AIRALO', 'NOMAD', 'HOLAFLY'];

async function getBestPlans(country) {
  const allPlans = [];
  
  for (const provider of PROVIDER_PRIORITY) {
    try {
      const plans = await getPlansFromProvider(provider, country);
      allPlans.push(...plans);
    } catch (error) {
      console.warn(`${provider} failed:`, error);
    }
  }
  
  // Sort by price and return best options
  return allPlans.sort((a, b) => a.price.amount - b.price.amount);
}
```

This setup gives you a production-ready eSIM integration that can handle real providers, payments, and user purchases!
