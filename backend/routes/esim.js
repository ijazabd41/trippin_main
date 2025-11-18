import express from 'express';
import Stripe from 'stripe';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

// eSIMGo API configuration (override via env)
// Base URL should include version: https://api.esim-go.com/v2.4
// Normalize base URL - remove trailing slash if present
const rawBaseUrl = process.env.ESIMGO_BASE_URL || process.env.ESIM_BASE || 'https://api.esim-go.com/v2.4';
const ESIMGO_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const ESIMGO_API_KEY = process.env.ESIMGO_API_KEY || process.env.ESIM_TOKEN || '';
const ESIMGO_SKIP_PAYMENTS = (process.env.ESIMGO_SKIP_PAYMENTS || '').toLowerCase() === 'true';

// Log API configuration (without exposing full key)
if (ESIMGO_API_KEY) {
  const keyPreview = ESIMGO_API_KEY.length > 10 
    ? `${ESIMGO_API_KEY.substring(0, 6)}...${ESIMGO_API_KEY.substring(ESIMGO_API_KEY.length - 4)}`
    : '***';
  console.log(`✅ eSIM API configured: ${ESIMGO_BASE_URL} (Key: ${keyPreview})`);
  console.log('⚠️  VALIDATION MODE ENABLED - eSIM purchases will use type: "validate" (testing mode)');
  console.log('   No real orders will be created, account will not be charged');
} else {
  console.error('❌ eSIM API key is MISSING! Set ESIMGO_API_KEY or ESIM_TOKEN in .env file');
  console.error('   This will cause 403 Forbidden errors when calling the eSIM API');
}

// Endpoint path mapping based on eSIM Go API v2.4 documentation
// Documentation: https://docs.esim-go.com/api/v2_4/
const ESIMGO_PATHS = {
  plans: process.env.ESIMGO_PLANS_PATH || '/catalogue', // GET /v2.4/catalogue - Get available bundles
  planDetails: process.env.ESIMGO_PLAN_DETAILS_PATH || '/catalogue', // Filter catalogue by bundle name
  purchase: process.env.ESIMGO_PURCHASE_PATH || '/orders', // POST /v2.4/orders - Create order
  organisation: process.env.ESIMGO_ORGANISATION_PATH || '/organisation', // GET /v2.4/organisation - Reseller account + balance
  getOrders: process.env.ESIMGO_GET_ORDERS_PATH || '/orders', // GET /v2.4/orders - List orders
  getOrder: process.env.ESIMGO_GET_ORDER_PATH || '/orders/{orderId}', // GET /v2.4/orders/{orderId} - Get specific order
  esimAssignments: process.env.ESIMGO_ESIM_ASSIGNMENTS_PATH || '/esims/assignments/{orderReference}', // GET /v2.4/esims/assignments/{orderReference} - Get eSIM assignment details
  bundleStatus: process.env.ESIMGO_BUNDLE_STATUS_PATH || '/esims/{iccid}/bundles/{name}', // GET /v2.4/esims/{iccid}/bundles/{name} - Get bundle status
  activateOrder: process.env.ESIMGO_ACTIVATE_ORDER_PATH || null, // Activation may be automatic or handled via assignments endpoint
  orderUsage: process.env.ESIMGO_ORDER_USAGE_PATH || null, // Usage may be tracked via assignments endpoint
  profiles: process.env.ESIMGO_PROFILES_PATH || null // Not found in v2.4 docs
};

const ORDER_STATUS_PROMPTS = {
  success: (planName) => `🎉 Order confirmed! Your eSIM plan "${planName}" is ready. Check your email or dashboard for activation details.`,
  storageFailure: (orderReference) => `⚠️ Your payment went through, but we could not store the order in our database. Your order reference is: ${orderReference || 'N/A'}. Please contact support with this reference number.`,
  storageFailureWithReference: (orderReference) => `⚠️ Your payment was successful and your eSIM order was created (Reference: ${orderReference}), but we encountered an issue storing it in our database. Please save this reference number and contact support if you need assistance.`,
  noOrderReference: '⚠️ Order created but missing confirmation from the provider. Please contact support with your payment receipt.',
  missingFields: '⚠️ We need a plan, customer information, and payment method to place your eSIM order.',
  planNotFound: '⚠️ The selected plan is no longer available. Please refresh the catalogue and choose an available plan.',
  paymentFailed: '⚠️ Your payment did not complete. Please check your card details or try another payment method.',
  serviceUnavailable: '⚠️ Payments are temporarily unavailable. Please try again later.',
  genericFailure: '⚠️ We could not complete your eSIM order. Please try again or contact support if the issue persists.'
};

const VALID_ESIM_STATUSES = new Set(['pending', 'processing', 'active', 'expired', 'cancelled']);
const PROVIDER_STATUS_MAP = {
  complete: 'active',
  completed: 'active',
  success: 'active',
  succeeded: 'active',
  activated: 'active',
  activating: 'processing',
  processing: 'processing',
  inprogress: 'processing',
  'in-progress': 'processing',
  pending: 'pending',
  awaitingpayment: 'pending',
  awaiting_payment: 'pending',
  expired: 'expired',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  failed: 'cancelled',
  error: 'cancelled',
  refunded: 'cancelled'
};

function normalizeEsimStatus(providerStatus, fallback = 'pending') {
  if (!providerStatus || typeof providerStatus !== 'string') {
    return fallback;
  }
  const normalized = providerStatus.trim().toLowerCase();
  if (VALID_ESIM_STATUSES.has(normalized)) {
    return normalized;
  }
  if (PROVIDER_STATUS_MAP[normalized]) {
    return PROVIDER_STATUS_MAP[normalized];
  }
  return fallback;
}

// Helper: Find plan details across paginated catalogue by bundle name
async function findPlanDetailsByName(planName, maxPages = 20) {
  let lastError = null;
  for (let page = 1; page <= maxPages; page++) {
    try {
      const endpoint = `${ESIMGO_PATHS.plans}?page=${page}`;
      const response = await callESIMAPI(endpoint);
      const bundles = response?.bundles || [];
      if (bundles.length === 0) break;
      const plan = bundles.find(b => b?.name === planName);
      if (plan) return plan;
      if (response.pageCount && page >= response.pageCount) break;
    } catch (err) {
      lastError = err;
      // stop on first page error; otherwise break out
      if (page === 1) throw err;
      break;
    }
  }
  if (lastError) {
    throw lastError;
  }
  return null;
}

// Helper function to make eSIM API calls
async function callESIMAPI(endpoint, options = {}) {
  // Check if API key is configured
  if (!ESIMGO_API_KEY || ESIMGO_API_KEY.trim() === '') {
    throw new Error('eSIM API key is not configured. Please set ESIMGO_API_KEY or ESIM_TOKEN in your .env file.');
  }

  const url = `${ESIMGO_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'X-API-Key': ESIMGO_API_KEY, // eSIM Go API uses X-API-Key header, not Bearer token
      'Content-Type': 'application/json'
    },
    redirect: 'manual' // Don't automatically follow redirects
  };

  const { rawResponse = false, ...restOptions } = options;
  const mergedHeaders = {
    ...defaultOptions.headers,
    ...(restOptions.headers || {})
  };
  const requestOptions = {
    ...defaultOptions,
    ...restOptions,
    headers: mergedHeaders
  };

  const response = await fetch(url, requestOptions);
  const responseText = await response.text().catch(() => '');
  
  // Handle redirects (3xx status codes)
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    console.warn(`⚠️ eSIM API redirect detected: ${response.status} to ${location || 'unknown'}`);
    throw new Error(`eSIM API redirect to ${location || 'root'}. Check API endpoint paths.`);
  }
  
  if (!response.ok) {
    const errorText = responseText || 'Unknown error';
    // Attach rich metadata to the thrown error for upstream handling
    const richError = new Error(`eSIM API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
    richError.status = response.status;
    richError.statusText = response.statusText;
    richError.body = errorText;
    richError.url = url;
    richError.endpoint = endpoint;
    richError.options = { ...requestOptions, headers: undefined }; // avoid dumping secrets

    // Enhanced error logging for 403 errors
    if (response.status === 403) {
      const keyPreview = ESIMGO_API_KEY.length > 10 
        ? `${ESIMGO_API_KEY.substring(0, 6)}...${ESIMGO_API_KEY.substring(ESIMGO_API_KEY.length - 4)}`
        : '***';
      console.error(`❌ eSIM API 403 Forbidden - Access Denied`, {
        url, errorText,
        apiKeyConfigured: !!ESIMGO_API_KEY,
        apiKeyLength: ESIMGO_API_KEY.length,
        apiKeyPreview: keyPreview,
        possibleCauses: [
          'API key is invalid or expired',
          'API key does not have required permissions',
          'API access is not enabled for your account',
          'API key format is incorrect'
        ]
      });
      throw richError;
    }
    
    console.error(`❌ eSIM API error: ${response.status} ${response.statusText}`, { url, errorText });
    throw richError;
  }

  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      data = responseText;
    }
  }

  if (rawResponse) {
    return {
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  return data;
}
function resolvePlanItemIdentifier(planDetails, fallbackId) {
  if (!planDetails || typeof planDetails !== 'object') {
    return fallbackId;
  }

  const candidates = [
    planDetails.sku,
    planDetails.bundleCode,
    planDetails.bundle_code,
    planDetails.code,
    planDetails.id,
    planDetails.productId,
    planDetails.product_id,
    planDetails.name,
    fallbackId
  ];

  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0) || fallbackId;
}

function extractPlanPriceInfo(planDetails) {
  if (!planDetails || typeof planDetails !== 'object') {
    return { amount: 0, currency: 'USD' };
  }

  let amount = 0;
  let currency = 'USD';

  if (typeof planDetails.price === 'number') {
    amount = planDetails.price;
    currency = planDetails.currency || planDetails.priceCurrency || 'USD';
  } else if (planDetails.price && typeof planDetails.price === 'object') {
    amount = Number(planDetails.price.amount ?? planDetails.price.price ?? planDetails.price.value ?? 0);
    currency = planDetails.price.currency || planDetails.priceCurrency || planDetails.currency || 'USD';
  } else {
    amount = Number(planDetails.cost ?? planDetails.amount ?? 0);
    currency = planDetails.currency || planDetails.priceCurrency || 'USD';
  }

  if (!Number.isFinite(amount)) {
    amount = 0;
  }

  if (typeof currency === 'string') {
    currency = currency.toUpperCase();
  } else {
    currency = 'USD';
  }

  return { amount, currency };
}

function extractProviderErrorMessage(providerError) {
  if (!providerError) return 'Unknown provider error';

  if (providerError.body) {
    try {
      const parsed = JSON.parse(providerError.body);
      if (parsed && typeof parsed === 'object') {
        return parsed.message || parsed.error || providerError.message || 'Unknown provider error';
      }
    } catch (parseError) {
      // fall through to message extraction below
    }
  }

  return providerError.message || providerError.statusText || 'Unknown provider error';
}

function interpretOrganisationBalance(orgData) {
  if (!orgData || typeof orgData !== 'object') {
    return { available: null, currency: null };
  }

  const numericCandidates = [
    orgData.availableBalance,
    orgData.balance,
    orgData.accountBalance,
    orgData.credit,
    orgData.available,
    orgData.walletBalance,
    orgData.wallet?.balance,
    orgData.wallet?.available
  ];

  let available = null;
  for (const candidate of numericCandidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) {
      available = value;
      break;
    }
  }

  let currency = orgData.balanceCurrency || orgData.currency || orgData.wallet?.currency || null;

  if ((available === null || !currency) && Array.isArray(orgData.balances)) {
    const balanceEntry = orgData.balances.find((entry) => {
      const entryValue = Number(entry?.available ?? entry?.balance ?? entry?.amount);
      return Number.isFinite(entryValue);
    });

    if (balanceEntry) {
      const entryValue = Number(balanceEntry.available ?? balanceEntry.balance ?? balanceEntry.amount);
      if (Number.isFinite(entryValue)) {
        available = entryValue;
      }
      currency = currency || balanceEntry.currency || balanceEntry.currencyCode || null;
    }
  }

  if (currency && typeof currency === 'string') {
    currency = currency.toUpperCase();
  } else {
    currency = null;
  }

  return { available, currency };
}

async function fetchEsimGoAccountBalance() {
  if (!ESIMGO_PATHS.organisation) {
    console.warn('⚠️ eSIM Go organisation endpoint not configured, skipping balance check');
    return { status: 'skipped' };
  }

  try {
    console.log('💰 Checking eSIM Go account balance via organisation endpoint...');
    const organisationResponse = await callESIMAPI(ESIMGO_PATHS.organisation, { rawResponse: true });
    const organisationData = organisationResponse?.data ?? organisationResponse;
    const { available, currency } = interpretOrganisationBalance(organisationData);

    console.log('💰 eSIM Go balance fetched', {
      status: organisationResponse?.status ?? 'unknown',
      availableBalance: available,
      balanceCurrency: currency || null
    });

    return {
      status: 'ok',
      available,
      currency,
      raw: organisationData
    };
  } catch (error) {
    console.warn('⚠️ Unable to fetch eSIM Go account balance', {
      message: error.message,
      status: error.status,
      endpoint: ESIMGO_PATHS.organisation
    });
    return {
      status: 'error',
      error
    };
  }
}


// Debug route to verify router is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'eSIM router is working', path: req.path });
});

// Get available eSIM plans - Only returns Japan (JP) plans
router.get('/plans', async (req, res) => {
  try {
    // Always filter for Japan (JP) plans only
    // The API doesn't support direct country filtering in catalogue, so we'll search through pages
    const maxPagesToSearch = 20; // Search first 20 pages to find Japan plans (faster response)
    let allJapanBundles = [];
    let pageCount = 1;
    let totalBundlesChecked = 0;

    console.log('🔄 Fetching Japan (JP) eSIM plans from API...');

    // Search through multiple pages to find all Japan bundles
    for (let page = 1; page <= maxPagesToSearch; page++) {
      try {
        const endpoint = `${ESIMGO_PATHS.plans}?page=${page}`;
        const response = await callESIMAPI(endpoint);
        
        const bundles = response.bundles || [];
        totalBundlesChecked += bundles.length;
        
        // Filter for Japan bundles
        const japanBundles = bundles.filter((bundle) => {
          if (!bundle || !bundle.countries) return false;
          return bundle.countries.some((country) => {
            if (typeof country === 'object' && country !== null) {
              const iso = (country.iso || '').toUpperCase();
              const name = (country.name || '').toLowerCase();
              return iso === 'JP' || iso === 'JPN' || name.includes('japan');
            }
            if (typeof country === 'string') {
              const countryLower = country.toLowerCase();
              return countryLower === 'jp' || countryLower === 'japan' || countryLower.includes('japan');
            }
            return false;
          });
        });
        
        if (japanBundles.length > 0) {
          allJapanBundles.push(...japanBundles);
          console.log(`   📄 Page ${page}: Found ${japanBundles.length} Japan bundles`);
        }
        
        // Check if we've reached the last page
        if (response.pageCount) {
          pageCount = response.pageCount;
          if (page >= pageCount) break;
        }
        
        // If no bundles on this page, we might have reached the end
        if (bundles.length === 0) break;
        
      } catch (pageError) {
        console.warn(`⚠️ Error fetching page ${page}:`, pageError.message);
        // Continue to next page
        if (page === 1) {
          // If first page fails, throw error to trigger fallback
          throw pageError;
        }
        break;
      }
    }

    console.log(`✅ Searched ${Math.min(maxPagesToSearch, pageCount)} pages, found ${allJapanBundles.length} Japan bundles from ${totalBundlesChecked} total bundles`);
    
    if (allJapanBundles.length === 0) {
      throw new Error('No Japan plans available from eSIM API');
    }

    // Use the collected Japan bundles
    const bundles = allJapanBundles;

    console.log(`🇯🇵 Processing ${bundles.length} Japan bundles for normalization`);

    // Normalize plan structure for the frontend
    const normalized = bundles.map((p) => {
      // Convert dataAmount from MB to GB if needed
      // Handle unlimited plans (dataAmount: -1 or unlimited: true)
      const dataAmountMB = p.dataAmount || 0;
      const isUnlimited = p.unlimited === true || dataAmountMB === -1 || dataAmountMB < 0;
      
      let dataAmountGB = '';
      if (isUnlimited) {
        dataAmountGB = 'Unlimited';
      } else if (dataAmountMB >= 1024) {
        dataAmountGB = `${(dataAmountMB / 1024).toFixed(1)}GB`;
      } else if (dataAmountMB > 0) {
        dataAmountGB = `${dataAmountMB}MB`;
      } else {
        dataAmountGB = 'N/A';
      }
      
      // Extract price and currency from API response
      // API may return price as: number, {amount: number, currency: string}, or {price: number, currency: string}
      let priceAmount = 0;
      let priceCurrency = 'USD'; // Default fallback
      
      if (typeof p.price === 'number') {
        priceAmount = p.price;
        // Try to find currency in other fields
        priceCurrency = p.currency || p.priceCurrency || (p.priceInfo && p.priceInfo.currency) || 'USD';
      } else if (p.price && typeof p.price === 'object') {
        priceAmount = p.price.amount || p.price.price || p.price.value || 0;
        priceCurrency = p.price.currency || p.currency || 'USD';
      } else {
        priceAmount = p.cost || p.amount || 0;
        priceCurrency = p.currency || p.priceCurrency || 'USD';
      }
      
      // Extract validity from API response
      // API may return: duration (number), validityDays (number), validity (string), or validityPeriod (string)
      let validity = '';
      if (p.duration) {
        // Format duration: "7 days" or "7日" for Japanese
        const duration = p.duration;
        validity = `${duration} ${duration === 1 ? 'day' : 'days'}`;
      } else if (p.validityDays) {
        const days = p.validityDays;
        validity = `${days} ${days === 1 ? 'day' : 'days'}`;
      } else if (p.validity) {
        validity = p.validity; // Use as-is if it's already a string
      } else if (p.validityPeriod) {
        validity = p.validityPeriod;
      }
      
      // Extract coverage from API response
      // Since we're filtering for Japan only, ensure coverage shows Japan
      // API may return: countries (array), coverage (array), regions (array), or coverageArea (array)
      // Coverage may be array of strings or array of objects with name/code properties
      const rawCoverage = p.countries || p.coverage || p.regions || p.coverageArea || [];
      
      // Normalize coverage to always be an array of strings, ensuring Japan is included
      let coverage = [];
      if (Array.isArray(rawCoverage)) {
        coverage = rawCoverage.map((item) => {
          if (typeof item === 'string') {
            return item;
          } else if (typeof item === 'object' && item !== null) {
            // Extract country name from object (could be name, country, countryName, code, etc.)
            return item.name || item.country || item.countryName || item.code || item.iso || JSON.stringify(item);
          }
          return String(item);
        });
      }
      
      // Ensure Japan is in coverage (all bundles are Japan, so this should always be true)
      if (coverage.length === 0 || !coverage.some(c => c.toLowerCase().includes('japan') || c.toUpperCase() === 'JP')) {
        coverage = ['Japan'];
      }
      
      return {
        id: p.name || String(p.id || p.productId || p.code || ''),
        name: p.name || p.title || '', // Use API name directly for consistency
        description: p.description || '',
        dataAmount: dataAmountGB,
        validity: validity, // Use API validity directly
        price: {
          amount: priceAmount,
          currency: priceCurrency.toUpperCase() // Normalize to uppercase (USD, JPY, etc.)
        },
        coverage: coverage, // Normalized array of strings
        features: p.speed || p.features || [],
        imageUrl: p.imageUrl || null,
        autostart: p.autostart || false,
        unlimited: isUnlimited, // Properly set unlimited flag
        // Keep original data for purchase
        originalData: p
      };
    });

    console.log(`✅ Returning ${normalized.length} normalized plans to frontend`);
    res.json({ success: true, data: normalized, isMockData: false });
  } catch (error) {
    console.error('❌ Failed to fetch eSIM plans from external API:', {
      error: error.message,
      stack: error.stack,
      endpoint: ESIMGO_PATHS.plans,
      baseUrl: ESIMGO_BASE_URL
    });
    console.warn('⚠️ Using fallback hardcoded plans');
    
    // Fallback to mock data when external API is unavailable
    const fallbackPlans = [
      {
        id: 'plan_1',
        name: 'Japan 3GB - 15 Days',
        description: '日本全国で使える15日間3GBプラン',
        dataAmount: '3GB',
        validity: '15日',
        price: { amount: 3500, currency: 'JPY' },
        coverage: ['Japan'],
        features: ['High-speed data', '24/7 support'],
        isAvailable: true
      },
      {
        id: 'plan_2',
        name: 'Japan 10GB - 30 Days',
        description: '日本全国で使える30日間10GBプラン',
        dataAmount: '10GB',
        validity: '30日',
        price: { amount: 8500, currency: 'JPY' },
        coverage: ['Japan'],
        features: ['High-speed data', '24/7 support'],
        isAvailable: true
      }
    ];
    
    res.json({
      success: true,
      data: fallbackPlans,
      isMockData: true,
      message: 'eSIM APIが利用できないため、サンプルプランを表示しています。'
    });
  }
});

// Purchase eSIM plan
router.post('/purchase', (req, res, next) => {
  console.log('🔍 Purchase route middleware hit:', {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path,
    baseUrl: req.baseUrl,
    url: req.url,
    headers: req.headers
  });
  next();
}, authenticateToken, async (req, res) => {
  console.log('📦 Purchase endpoint called:', {
    method: req.method,
    path: req.path,
    url: req.url,
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    userId: req.user?.id
  });
  let purchaseStage = 'initializing';
  let orderReference = null; // Declare outside try block so it's accessible in catch block

  try {
    purchaseStage = 'validating-request';
    
    if (!stripe && !ESIMGO_SKIP_PAYMENTS) {
      console.error('❌ eSIM purchase blocked - payments service unavailable', {
        userId: req.user?.id,
        purchaseStage
      });
      return res.status(503).json({ 
        success: false,
        error: 'Payments service unavailable', 
        code: 'PAYMENTS_UNCONFIGURED',
        userPrompt: ORDER_STATUS_PROMPTS.serviceUnavailable
      });
    }

    const { planId, customerInfo, paymentMethodId } = req.body;

    if (!planId || !customerInfo || !paymentMethodId) {
      const missing = [
        !planId && 'planId',
        !customerInfo && 'customerInfo',
        !paymentMethodId && 'paymentMethodId'
      ].filter(Boolean);

      console.warn('⚠️ Purchase validation failed: missing fields', {
        userId: req.user?.id,
        purchaseStage,
        missing
      });

      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
        details: {
          missing
        },
        userPrompt: ORDER_STATUS_PROMPTS.missingFields
      });
    }

    // Get plan details from eSIMGo API catalogue (search across pages)
    purchaseStage = 'fetching-plan-details';
    const planDetails = await findPlanDetailsByName(planId, 20);
    
    if (!planDetails || !planDetails.price) {
      console.warn('⚠️ Selected plan not found in catalogue', {
        userId: req.user?.id,
        planId,
        purchaseStage
      });

      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        code: 'PLAN_NOT_FOUND',
        details: { planId },
        userPrompt: ORDER_STATUS_PROMPTS.planNotFound
      });
    }

    const { amount: planPriceAmount, currency: planPriceCurrency } = extractPlanPriceInfo(planDetails);

    if (planPriceAmount <= 0) {
      console.error('❌ Plan price missing or invalid for plan', {
        planId,
        planPriceAmount
      });
      return res.status(422).json({
        success: false,
        error: 'Invalid plan price',
        code: 'INVALID_PLAN_PRICE',
        details: {
          planId,
          planPriceAmount
        },
        userPrompt: '⚠️ The selected plan has an invalid price. Please refresh the catalogue and try again.'
      });
    }

    const balanceCheck = await fetchEsimGoAccountBalance();
    if (balanceCheck.status === 'ok' && balanceCheck.available !== null) {
      const accountCurrency = balanceCheck.currency ? balanceCheck.currency.toLowerCase() : null;
      const desiredCurrency = planPriceCurrency ? planPriceCurrency.toLowerCase() : null;
      const currencyMatches = !accountCurrency || !desiredCurrency || accountCurrency === desiredCurrency;

      if (currencyMatches && balanceCheck.available < planPriceAmount) {
        console.error('❌ Insufficient eSIM Go account balance', {
          availableBalance: balanceCheck.available,
          requiredAmount: planPriceAmount,
          currency: balanceCheck.currency || planPriceCurrency,
          userId: req.user?.id,
          planId
        });
        return res.status(409).json({
          success: false,
          error: 'Insufficient provider balance',
          code: 'ESIM_BALANCE_INSUFFICIENT',
          details: {
            availableBalance: balanceCheck.available,
            requiredAmount: planPriceAmount,
            balanceCurrency: balanceCheck.currency
          },
          userPrompt: '⚠️ The eSIM provider account has insufficient balance to fulfill this order. Please try again later or contact support.'
        });
      }
    } else if (balanceCheck.status === 'error') {
      console.warn('⚠️ Proceeding without confirmed provider balance due to lookup failure', {
        userId: req.user?.id,
        planId,
        error: balanceCheck.error?.message
      });
    }

    let paymentIntentId = null;
    if (!ESIMGO_SKIP_PAYMENTS && stripe) {
      purchaseStage = 'processing-payment';
      // Process payment via Stripe first
      // Note: eSIM Go API requires prepaid account balance.
      // Stripe payment ensures we have funds before creating order.
      // In production, you may want to top up eSIM Go account balance
      // after successful Stripe payment, or ensure account is pre-funded.
      
      console.log('💳 Processing Stripe payment:', {
        amount: planPriceAmount,
        currency: planPriceCurrency.toLowerCase(),
        planId: planId,
        paymentMethodId: paymentMethodId
      });
      
      // Create or retrieve Stripe Customer for this user
      // This allows PaymentMethod to be reused if needed
      let customer;
      try {
        // Try to find existing customer by email
        const existingCustomers = await stripe.customers.list({
          email: customerInfo.email,
          limit: 1
        });
        
        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
          console.log('✅ Found existing Stripe customer:', customer.id);
        } else {
          // Create new customer
          customer = await stripe.customers.create({
            email: customerInfo.email,
            name: customerInfo.name,
            metadata: {
              user_id: req.user.id,
              source: 'esim_purchase'
            }
          });
          console.log('✅ Created new Stripe customer:', customer.id);
        }
      } catch (customerError) {
        console.warn('⚠️ Could not create/retrieve customer, proceeding without customer:', customerError.message);
      }
      
      // Attach payment method to customer if customer exists
      // This allows PaymentMethod to be reused
      if (customer) {
        try {
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id
          });
          console.log('✅ Attached payment method to customer');
        } catch (attachError) {
          // PaymentMethod might already be attached, that's okay
          if (!attachError.message.includes('already been attached')) {
            console.warn('⚠️ Could not attach payment method:', attachError.message);
          }
        }
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(planPriceAmount * 100), // Convert to cents
        currency: planPriceCurrency.toLowerCase(),
        payment_method: paymentMethodId,
        customer: customer?.id, // Attach to customer if available
        confirmation_method: 'manual',
        confirm: true,
        // Explicitly set payment method types to only accept card payments
        // This prevents redirect-based payment methods that require return_url
        payment_method_types: ['card'],
        metadata: {
          user_id: req.user.id,
          plan_id: planId,
          esim_purchase: 'true'
        }
      });

      if (paymentIntent.status !== 'succeeded') {
        console.error('❌ Stripe payment failed:', {
          status: paymentIntent.status,
          error: paymentIntent.last_payment_error,
          userId: req.user?.id,
          purchaseStage
        });
        return res.status(400).json({
          success: false,
          error: 'Payment failed',
          code: 'PAYMENT_FAILED',
          status: paymentIntent.status,
          details: paymentIntent.last_payment_error?.message || 'Payment did not succeed',
          userPrompt: ORDER_STATUS_PROMPTS.paymentFailed
        });
      }
      
      paymentIntentId = paymentIntent.id;
      console.log('✅ Stripe payment succeeded:', paymentIntentId);
      
      // Idempotency check: After payment, check again if order exists
      // This handles race conditions where multiple requests process payment simultaneously
      const { data: existingOrderAfterPayment } = await supabase
        .from('esim_orders')
        .select('id, status, esim_provider_order_id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (existingOrderAfterPayment) {
        console.log('⚠️ Order already exists for this payment intent - returning existing order:', {
          orderId: existingOrderAfterPayment.id,
          paymentIntentId: paymentIntentId,
          userId: req.user?.id
        });
        // Refund the duplicate payment if it was just created
        if (stripe) {
          try {
            await stripe.refunds.create({
              payment_intent: paymentIntentId,
              reason: 'duplicate',
              metadata: {
                original_order_id: existingOrderAfterPayment.id,
                reason: 'duplicate_purchase_request'
              }
            });
            console.log('↩️ Refunded duplicate payment intent:', paymentIntentId);
          } catch (refundError) {
            console.warn('⚠️ Could not refund duplicate payment:', refundError.message);
          }
        }
        return res.json({
          success: true,
          data: {
            orderId: existingOrderAfterPayment.id,
            orderReference: existingOrderAfterPayment.esim_provider_order_id,
            status: existingOrderAfterPayment.status,
            message: 'Order already processed'
          },
          message: 'This purchase was already processed',
          isDuplicate: true
        });
      }
    }

    // Purchase eSIM from eSIMGo - POST /v2.4/orders
    // According to eSIM Go API v2.4 documentation:
    // - Use "type": "transaction" for actual purchases (deducts from account balance)
    // - Use "type": "validate" for testing (validates integration without creating order)
    // - Use "order" array with "item" (bundle name/identifier) and "quantity"
    // - Set "assign": true to automatically assign bundle to eSIM
    // - Optionally include "iccid": "" when assign is true to create new eSIM
    // Note: eSIM Go requires prepaid account balance. Stripe payment ensures
    // we collect funds from the customer before consuming reseller balance.
    // For testing, use validation mode: see test-esim-validation.js
    purchaseStage = 'creating-esim-order';
    const planItemIdentifier = resolvePlanItemIdentifier(planDetails, planId);
    console.log('🆔 Resolved plan identifier for order payload', {
      requestedPlanId: planId,
      planItemIdentifier
    });
    const purchasePayload = {
      type: 'transaction', // Transaction mode creates real orders and consumes reseller balance
      assign: true, // Automatically assign bundle to eSIM
      order: [{
        type: 'bundle',
        quantity: 1,
        item: planItemIdentifier, // Bundle name/identifier from catalogue
        allowReassign: false
      }]
    };

    console.log('📦 Creating eSIM order with payload:', JSON.stringify(purchasePayload, null, 2));
    let esimOrder = null;
    try {
      const esimOrderResponse = await callESIMAPI(ESIMGO_PATHS.purchase, {
        method: 'POST',
        body: JSON.stringify(purchasePayload),
        rawResponse: true
      });
      console.log('📫 eSIM Go order response status:', {
        status: esimOrderResponse?.status,
        hasData: !!esimOrderResponse?.data
      });
      esimOrder = esimOrderResponse?.data ?? null;
    } catch (providerError) {
      const providerMessage = extractProviderErrorMessage(providerError);
      console.error('❌ eSIM order creation failed', {
        status: providerError?.status,
        providerMessage,
        endpoint: ESIMGO_PATHS.purchase
      });
      // Compensating action: refund Stripe payment if taken
      let refundId = null;
      if (!ESIMGO_SKIP_PAYMENTS && stripe && paymentIntentId) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
              esim_provider_error_status: String(providerError.status || ''),
              esim_provider_error_message: (providerError.body || providerError.message || '').substring(0, 200)
            }
          });
          refundId = refund?.id || null;
          console.warn('↩️ Stripe refund issued due to provider order failure', {
            paymentIntentId,
            refundId
          });
        } catch (refundError) {
          console.error('❌ Failed to issue Stripe refund after provider failure', {
            paymentIntentId,
            error: refundError?.message
          });
        }
      }

      const truncatedProviderMessage = (providerError?.body || providerError?.message || '').substring(0, 200) || providerMessage;
      const providerStatus = providerError?.status || 500;
      // Craft a clearer, user-facing prompt based on common provider messages
      let friendlyUserPrompt = '⚠️ We could not complete your eSIM order with the provider. Any payment has been reversed. Please try again later or choose a different plan.';
      const lowerMsg = (truncatedProviderMessage || '').toLowerCase();
      if (lowerMsg.includes('no payment taken')) {
        friendlyUserPrompt = '⚠️ The eSIM provider could not process the order due to insufficient reseller balance. Your payment has been reversed. Please try again later.';
      } else if (lowerMsg.includes('insufficient') && lowerMsg.includes('balance')) {
        friendlyUserPrompt = '⚠️ The eSIM provider account has insufficient balance. Your payment has been reversed. Please try again later.';
      }
      
      // Map provider errors to a non-retryable upstream error for client
      // Use 502 Bad Gateway to indicate upstream provider failure
      return res.status(502).json({
        success: false,
        error: 'Provider failed to process order',
        code: 'PROVIDER_ORDER_FAILED',
        retryable: false,
        details: {
          providerStatus,
          providerMessage: truncatedProviderMessage,
          providerUrl: providerError?.url,
          refundId,
          purchaseStage
        },
        userPrompt: friendlyUserPrompt
      });
    }

    console.log('✅ eSIM order created:', JSON.stringify(esimOrder, null, 2));

    // Extract order reference from response
    // eSIM Go API v2.4 returns order with "reference" field
    // Response structure: { reference: "order_ref", status: "...", ... }
    // For validation mode, the API may not return a reference, so we use createdDate as fallback
    orderReference = esimOrder.reference || esimOrder.orderReference || esimOrder.id || esimOrder.orderId;
    
    if (!orderReference) {
      // Use createdDate as fallback order reference if available
      // Format: timestamp-based reference for validation orders
      const fallbackReference = esimOrder.createdDate 
        ? `val_${esimOrder.createdDate.replace(/[^0-9]/g, '')}_${req.user.id.substring(0, 8)}`
        : `temp_${Date.now()}_${req.user.id.substring(0, 8)}`;
      console.warn('⚠️ No order reference in eSIM Go response, using fallback:', fallbackReference);
      orderReference = fallbackReference;
    }
    
    console.log('📋 Order reference:', orderReference);
    
    // Extract ICCID and activation details from purchase response first
    // The purchase response may already contain eSIM details in order[0].esims[0]
    let qrCode = null;
    let activationCode = null;
    let iccid = null;
    let smdpAddress = null;
    
    // Try to extract from purchase response structure: { order: [{ esims: [{ iccid, matchingId, smdpAddress }] }] }
    if (esimOrder.order && Array.isArray(esimOrder.order) && esimOrder.order.length > 0) {
      const firstOrder = esimOrder.order[0];
      if (firstOrder.esims && Array.isArray(firstOrder.esims) && firstOrder.esims.length > 0) {
        const firstEsim = firstOrder.esims[0];
        iccid = firstEsim.iccid || iccid;
        activationCode = firstEsim.matchingId || activationCode;
        smdpAddress = firstEsim.smdpAddress || smdpAddress;
        
        // Construct QR code if we have components
        if (smdpAddress && activationCode && !qrCode) {
          qrCode = `LPA:1$${smdpAddress}$${activationCode}`;
        }
        
        console.log('✅ Extracted eSIM details from purchase response:', {
          hasICCID: !!iccid,
          hasActivationCode: !!activationCode,
          hasSMDP: !!smdpAddress,
          hasQRCode: !!qrCode
        });
      }
    }
    
    // Get eSIM assignment details to retrieve QR code and activation info (if not already extracted)
    // According to eSIM Go API v2.4: GET /esims/assignments/{orderReference}
    // Returns ZIP file with QR code PNG, or JSON with assignment details
    // Only fetch if we don't already have ICCID from purchase response
    if (orderReference && ESIMGO_PATHS.esimAssignments && !iccid) {
      try {
        purchaseStage = 'fetching-assignments';
        const assignmentsPath = ESIMGO_PATHS.esimAssignments.replace('{orderReference}', encodeURIComponent(orderReference));
        console.log('📥 Fetching eSIM assignments from:', assignmentsPath);
        
        const assignments = await callESIMAPI(assignmentsPath);
        
        // Handle different response formats:
        // 1. JSON array with assignment objects
        // 2. Single assignment object
        // 3. CSV string (comma-separated values)
        // 4. ZIP file (would need special handling)
        
        if (assignments) {
          let assignment = null;
          
          // Check if response is CSV format
          if (typeof assignments === 'string' && assignments.includes(',')) {
            console.log('📄 Detected CSV format, parsing...');
            const lines = assignments.trim().split('\n');
            if (lines.length >= 2) {
              const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
              const dataLine = lines[1].split(',').map(d => d.trim().replace(/"/g, ''));
              assignment = {};
              headers.forEach((header, index) => {
                if (dataLine[index]) {
                  assignment[header] = dataLine[index];
                }
              });
              console.log('✅ Parsed CSV assignment:', assignment);
            }
          } else if (Array.isArray(assignments) && assignments.length > 0) {
            assignment = assignments[0];
          } else if (typeof assignments === 'object' && assignments !== null) {
            assignment = assignments;
          }
          
          if (assignment) {
            // Extract fields - API may use different naming conventions
            qrCode = assignment['RSP URL'] || assignment.rspUrl || assignment.qrCode || assignment.qr || null;
            iccid = assignment.ICCID || assignment.iccid || iccid || null;
            activationCode = assignment['Matching ID'] || assignment.matchingId || assignment.matching_id || activationCode || null;
            smdpAddress = assignment['SMDP Address'] || assignment.smdpAddress || assignment.smdp_address || smdpAddress || null;
            
            // If we have smdpAddress and matchingId, construct QR code format: LPA:1$smdpAddress$matchingId
            if (smdpAddress && activationCode && !qrCode) {
              qrCode = `LPA:1$${smdpAddress}$${activationCode}`;
            }
            
            console.log('✅ eSIM assignment details:', {
              hasQRCode: !!qrCode,
              hasICCID: !!iccid,
              hasActivationCode: !!activationCode,
              hasSMDP: !!smdpAddress
            });
          }
        }
      } catch (assignmentError) {
        console.warn('⚠️ Could not fetch eSIM assignments:', {
          error: assignmentError.message,
          stack: assignmentError.stack
        });
        // Continue without assignment details - user can retrieve later
      }
    }
    
    // Store order in database
    // Use admin client to bypass RLS policies for server-side inserts
    purchaseStage = 'persisting-order';
    const supabaseClient = supabaseAdmin || supabase;
    
    // Normalize status from provider response
    const providerStatus = esimOrder?.status || 'processing';
    const normalizedStatus = normalizeEsimStatus(providerStatus, 'processing');
    console.log('📊 Status normalization:', {
      providerStatus,
      normalizedStatus,
      willUse: normalizedStatus
    });
    
    // Attempt to store order in database
    // IMPORTANT: Even if this fails, we still return the orderReference so user can contact support
    let order = null;
    let orderError = null;
    
    // Validate required data before insertion
    if (!req.user || !req.user.id) {
      orderError = { message: 'User ID is required', code: 'MISSING_USER_ID' };
      console.error('❌ Cannot store order: missing user ID');
    } else if (!planId) {
      orderError = { message: 'Plan ID is required', code: 'MISSING_PLAN_ID' };
      console.error('❌ Cannot store order: missing plan ID');
    } else {
      try {
        // Check if order with this orderReference already exists (handle duplicate key constraint)
        if (orderReference) {
          const existingOrderCheck = await supabaseAdmin
            .from('esim_orders')
            .select('id, esim_provider_order_id')
            .eq('esim_provider_order_id', orderReference)
            .maybeSingle();
          
          if (existingOrderCheck.data) {
            console.log('ℹ️ Order with this reference already exists, using existing order:', {
              orderId: existingOrderCheck.data.id,
              orderReference: orderReference
            });
            order = existingOrderCheck.data;
            // Fetch full order details
            const fullOrder = await supabaseAdmin
              .from('esim_orders')
              .select('*')
              .eq('id', order.id)
              .single();
            if (fullOrder.data) {
              order = fullOrder.data;
            }
          } else {
            // Prepare order data with proper validation
            const orderData = {
              user_id: req.user.id,
              plan_id: String(planId).substring(0, 255), // Ensure it fits VARCHAR(255)
              esim_provider_order_id: orderReference ? String(orderReference).substring(0, 255) : null,
              stripe_payment_intent_id: paymentIntentId ? String(paymentIntentId).substring(0, 255) : null,
              status: normalizedStatus,
              customer_info: customerInfo || null,
              plan_details: planDetails || null,
              qr_code: qrCode || null,
              activation_code: activationCode ? String(activationCode).substring(0, 255) : null,
              purchase_date: new Date().toISOString(),
              expiry_date: null, // Will be set from plan duration
              usage_data: {
                iccid: iccid || null,
                dataRemainingMb: planDetails?.dataAmount || null
              }
            };
            
            // Use admin client to bypass RLS policies
            const insertResult = await supabaseAdmin
              .from('esim_orders')
              .insert(orderData)
              .select()
              .single();
            
            order = insertResult.data;
            orderError = insertResult.error;
            
            // Handle specific database errors
            if (orderError) {
              // Check for duplicate key error (23505 is PostgreSQL unique violation)
              if (orderError.code === '23505' || orderError.message?.includes('duplicate') || orderError.message?.includes('unique')) {
                console.warn('⚠️ Duplicate order reference detected, attempting to fetch existing order:', orderReference);
                
                // Try to fetch the existing order
                const existingOrder = await supabaseAdmin
                  .from('esim_orders')
                  .select('*')
                  .eq('esim_provider_order_id', orderReference)
                  .single();
                
                if (existingOrder.data) {
                  console.log('✅ Found existing order, using it:', existingOrder.data.id);
                  order = existingOrder.data;
                  orderError = null; // Clear error since we found the order
                } else {
                  console.error('❌ Duplicate key error but could not find existing order');
                  orderError = { 
                    message: 'Order with this reference already exists but could not be retrieved',
                    code: 'DUPLICATE_ORDER_ERROR',
                    originalError: orderError
                  };
                }
              } else if (orderError.code === '23503' || orderError.message?.includes('foreign key')) {
                // Foreign key constraint violation (user doesn't exist)
                console.error('❌ Foreign key constraint violation - user may not exist:', req.user.id);
                orderError = {
                  message: 'User validation failed',
                  code: 'FOREIGN_KEY_VIOLATION',
                  hint: 'The user_id does not exist in the users table',
                  originalError: orderError
                };
              } else {
                console.error('❌ Failed to store eSIM order in database:', {
                  error: orderError,
                  orderReference: orderReference,
                  userId: req.user.id,
                  planId: planId,
                  paymentIntentId: paymentIntentId,
                  errorCode: orderError.code,
                  errorMessage: orderError.message
                });
              }
              
              // Log critical error for monitoring
              if (orderError) {
                console.error('🚨 CRITICAL: eSIM order created but database storage failed', {
                  orderReference: orderReference,
                  userId: req.user.id,
                  planId: planId,
                  stripePaymentIntentId: paymentIntentId,
                  errorMessage: orderError.message,
                  errorCode: orderError.code,
                  errorHint: orderError.hint
                });
              }
            } else {
              console.log('✅ eSIM order stored successfully in database:', {
                orderId: order.id,
                orderReference: orderReference
              });
            }
          }
        } else {
          // No orderReference - still try to insert but log warning
          console.warn('⚠️ No orderReference provided, inserting order without provider reference');
          
          const orderData = {
            user_id: req.user.id,
            plan_id: String(planId).substring(0, 255),
            esim_provider_order_id: null,
            stripe_payment_intent_id: paymentIntentId ? String(paymentIntentId).substring(0, 255) : null,
            status: normalizedStatus,
            customer_info: customerInfo || null,
            plan_details: planDetails || null,
            qr_code: qrCode || null,
            activation_code: activationCode ? String(activationCode).substring(0, 255) : null,
            purchase_date: new Date().toISOString(),
            expiry_date: null,
            usage_data: {
              iccid: iccid || null,
              dataRemainingMb: planDetails?.dataAmount || null
            }
          };
          
          const insertResult = await supabaseAdmin
            .from('esim_orders')
            .insert(orderData)
            .select()
            .single();
          
          order = insertResult.data;
          orderError = insertResult.error;
          
          if (orderError) {
            console.error('❌ Failed to store eSIM order (no orderReference):', orderError);
          }
        }
      } catch (storageException) {
        console.error('❌ Exception while storing eSIM order:', {
          error: storageException,
          orderReference: orderReference,
          userId: req.user.id,
          stack: storageException.stack
        });
        orderError = { 
          message: storageException.message || 'Unknown storage exception',
          code: 'STORAGE_EXCEPTION',
          originalError: storageException
        };
      }
    }

    // Even if database storage failed, we still return success with orderReference
    // This ensures the user always gets their reference number for support
    if (orderError) {
      // Return partial success - order was created with provider, but database storage failed
      console.warn('⚠️ Returning partial success due to storage failure, but order was created with provider');
      
      return res.status(200).json({
        success: true, // Still success because order was created with provider
        partialSuccess: true, // Flag to indicate database storage failed
        data: {
          orderId: null, // No database ID since storage failed
          orderReference: orderReference, // CRITICAL: Always return reference number
          qrCode: qrCode,
          activationCode: activationCode,
          iccid: iccid,
          smdpAddress: smdpAddress,
          planName: planDetails.name || planId,
          planDetails: planDetails,
          expiryDate: null,
          status: normalizedStatus,
          stripePaymentIntentId: paymentIntentId,
          purchaseDate: new Date().toISOString()
        },
        warning: {
          message: 'Order created successfully, but database storage encountered an issue',
          code: 'ORDER_STORAGE_WARNING',
          storageError: {
            message: orderError.message,
            code: orderError.code,
            hint: orderError.hint
          }
        },
        message: 'eSIM order created successfully',
        userPrompt: ORDER_STATUS_PROMPTS.storageFailureWithReference(orderReference),
        orderStatus: 'created',
        supportReference: orderReference // Explicitly highlight for support
      });
    }

    // Create notification (non-blocking - don't fail if this fails)
    // Use admin client to bypass RLS policies for server-side inserts
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: req.user.id,
          type: 'esim_purchased',
          title: 'eSIM Purchased Successfully',
          message: `Your eSIM plan "${planDetails.name || planId}" has been purchased successfully.`,
          metadata: {
            order_id: order?.id || null,
            order_reference: orderReference,
            plan_id: planId
          }
        });
      console.log('✅ Notification created successfully');
    } catch (notificationError) {
      // Don't fail the request if notification creation fails
      console.warn('⚠️ Failed to create notification (non-critical):', notificationError.message);
    }

    // Log successful purchase
    console.log('✅ eSIM purchase completed successfully:', {
      orderId: order.id,
      orderReference: orderReference,
      userId: req.user.id,
      planName: planDetails.name || planId,
      status: order.status,
      hasQRCode: !!qrCode
    });

    purchaseStage = 'completed-success';

    // Return order data with eSIM assignment details
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderReference: orderReference,
        qrCode: qrCode,
        activationCode: activationCode,
        iccid: iccid,
        smdpAddress: smdpAddress,
        planName: planDetails.name || planId,
        planDetails: planDetails,
        expiryDate: order.expiry_date || null,
        status: order.status,
        stripePaymentIntentId: paymentIntentId,
        purchaseDate: order.purchase_date || order.created_at
      },
      message: 'eSIM purchased successfully',
      userPrompt: ORDER_STATUS_PROMPTS.success(planDetails.name || planId),
      orderStatus: 'completed'
    });
  } catch (error) {
    console.error('❌ eSIM purchase error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      userId: req.user?.id,
      planId: req.body?.planId,
      purchaseStage
    });
    
    // Try to extract orderReference from error context or from the variable scope
    // This might happen if order was created but something failed later
    const errorOrderReference = orderReference || error.orderReference || error.context?.orderReference;
    
    // If we have an orderReference, return it so user can contact support
    if (errorOrderReference) {
      console.warn('⚠️ Error occurred but orderReference is available, returning it for support:', errorOrderReference);
      return res.status(200).json({
        success: true,
        partialSuccess: true,
        data: {
          orderId: null,
          orderReference: errorOrderReference,
          qrCode: null,
          activationCode: null,
          iccid: null,
          smdpAddress: null,
          planName: req.body?.planId || 'Unknown',
          planDetails: null,
          expiryDate: null,
          status: 'processing',
          stripePaymentIntentId: null,
          purchaseDate: new Date().toISOString()
        },
        warning: {
          message: 'Order may have been created but encountered an error during processing',
          code: 'PURCHASE_PROCESSING_ERROR',
          error: error.message
        },
        message: 'eSIM order may have been created',
        userPrompt: `⚠️ An error occurred during order processing. Your order reference is: ${errorOrderReference}. Please contact support with this reference number.`,
        orderStatus: 'error',
        supportReference: errorOrderReference
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to purchase eSIM',
      code: 'ESIM_PURCHASE_ERROR',
      details: {
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      userPrompt: ORDER_STATUS_PROMPTS.genericFailure
    });
  }
});

// Get user's eSIM orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Fetching eSIM orders for user:', {
      userId: req.user?.id,
      userEmail: req.user?.email,
      hasUser: !!req.user
    });

    // Use admin client if available to bypass RLS, or use regular client
    const supabaseClient = supabaseAdmin || supabase;
    
    const { data: orders, error } = await supabaseClient
      .from('esim_orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching orders:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId: req.user.id
      });

      // Check if table doesn't exist (PostgreSQL error code or PostgREST error code)
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        console.warn('⚠️ esim_orders table does not exist, returning empty array');
        console.warn('📝 To create the table, run the SQL schema from backend/database/schema.sql in your Supabase SQL editor');
        return res.json({
          success: true,
          data: [],
          message: 'No orders found. Table may need to be created. Please run the database schema migration.'
        });
      }

      // Check if RLS policy is blocking access
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('⚠️ RLS policy blocking access to esim_orders');
        return res.json({
          success: true,
          data: [],
          message: 'No orders accessible. Row-level security may be blocking access.'
        });
      }

      return res.status(400).json({
        error: 'Failed to fetch orders',
        code: 'ORDERS_FETCH_ERROR',
        details: error.message
      });
    }

    console.log(`✅ Successfully fetched ${orders?.length || 0} orders for user ${req.user.id}`);

    // Fetch usage data from assignments endpoint for each active order
    // According to eSIM Go API v2.4: Usage data is in /esims/assignments/{orderReference}
    const ordersWithUsage = await Promise.all(
      (orders || []).map(async (order) => {
        // Only fetch usage for active orders with order reference
        if (order.status === 'active' && order.esim_provider_order_id && ESIMGO_PATHS.esimAssignments) {
          try {
            const assignmentsPath = ESIMGO_PATHS.esimAssignments.replace(
              '{orderReference}', 
              encodeURIComponent(order.esim_provider_order_id)
            );
            
            const assignments = await callESIMAPI(assignmentsPath);
            
            // Parse assignment response to extract usage data
            let assignment = null;
            
            // Handle CSV format response
            if (typeof assignments === 'string' && assignments.includes(',')) {
              console.log('📄 Detected CSV format in assignments (GET /orders), parsing...');
              const lines = assignments.trim().split('\n');
              if (lines.length >= 2) {
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const dataLine = lines[1].split(',').map(d => d.trim().replace(/"/g, ''));
                assignment = {};
                headers.forEach((header, index) => {
                  if (dataLine[index] !== undefined && dataLine[index] !== '') {
                    assignment[header] = dataLine[index];
                  }
                });
                console.log('✅ Parsed CSV assignment:', assignment);
              }
            } else if (Array.isArray(assignments) && assignments.length > 0) {
              assignment = assignments[0];
            } else if (typeof assignments === 'object' && assignments !== null) {
              assignment = assignments;
            }
            
            if (assignment) {
              // Extract ICCID for bundle status lookup
              const assignmentIccid = assignment.ICCID || assignment.iccid || order.usage_data?.iccid || order.usage_data?.ICCID || order.iccid || null;
              
              // Try to get bundle status from bundle status endpoint if we have ICCID and bundle name
              let bundleStatusData = null;
              if (assignmentIccid && order.plan_details?.name && ESIMGO_PATHS.bundleStatus) {
                try {
                  const bundleName = order.plan_details.name;
                  const bundleStatusPath = ESIMGO_PATHS.bundleStatus
                    .replace('{iccid}', encodeURIComponent(assignmentIccid))
                    .replace('{name}', encodeURIComponent(bundleName));
                  
                  console.log('📊 Fetching bundle status for usage data:', bundleStatusPath);
                  bundleStatusData = await callESIMAPI(bundleStatusPath);
                  
                  if (bundleStatusData && bundleStatusData.assignments && Array.isArray(bundleStatusData.assignments) && bundleStatusData.assignments.length > 0) {
                    // Get the latest assignment (most recent)
                    const latestAssignment = bundleStatusData.assignments[bundleStatusData.assignments.length - 1];
                    console.log('✅ Bundle status fetched:', {
                      bundleState: latestAssignment.bundleState,
                      remainingQuantity: latestAssignment.remainingQuantity,
                      initialQuantity: latestAssignment.initialQuantity
                    });
                  }
                } catch (bundleStatusError) {
                  console.warn('⚠️ Failed to fetch bundle status for usage:', bundleStatusError.message);
                  // Continue with assignment data
                }
              }
              
              // Check if plan is unlimited
              const isUnlimited = order.plan_details?.unlimited === true || 
                                 order.plan_details?.dataAmount === 'Unlimited' ||
                                 (typeof order.plan_details?.dataAmount === 'string' && order.plan_details.dataAmount.toLowerCase().includes('unlimited')) ||
                                 (bundleStatusData?.assignments?.[0]?.unlimited === true);
              
              if (isUnlimited) {
                // For unlimited plans, set appropriate usage data
                order.usage_data = {
                  ...(order.usage_data || {}),
                  unlimited: true,
                  lastUpdated: new Date().toISOString()
                };
                order.usage = {
                  used: 0,
                  total: 0,
                  unlimited: true
                };
              } else {
                // Extract usage data - prioritize bundle status data
                let dataRemainingMb = null;
                let dataTotalMb = null;
                
                if (bundleStatusData && bundleStatusData.assignments && bundleStatusData.assignments.length > 0) {
                  const latestAssignment = bundleStatusData.assignments[bundleStatusData.assignments.length - 1];
                  if (latestAssignment.remainingQuantity !== null && latestAssignment.remainingQuantity !== undefined) {
                    // remainingQuantity is in bytes, convert to MB (bytes / (1024 * 1024))
                    dataRemainingMb = latestAssignment.remainingQuantity / (1024 * 1024);
                  }
                  if (latestAssignment.initialQuantity !== null && latestAssignment.initialQuantity !== undefined) {
                    // initialQuantity is in bytes, convert to MB
                    dataTotalMb = latestAssignment.initialQuantity / (1024 * 1024);
                  }
                }
                
                // Fallback to assignment data if bundle status not available
                if (dataRemainingMb === null) {
                  dataRemainingMb = assignment.dataRemainingMb || 
                                    assignment['Data Remaining MB'] || 
                                    assignment.dataRemaining || 
                                    assignment.remainingData || 
                                    null;
                }
                
                const dataUsedMb = assignment.dataUsedMb || 
                                   assignment['Data Used MB'] || 
                                   assignment.dataUsed || 
                                   assignment.usedData || 
                                   null;
                
                if (dataTotalMb === null) {
                  dataTotalMb = assignment.dataTotalMb || 
                                assignment['Data Total MB'] || 
                                assignment.dataTotal || 
                                assignment.totalData ||
                                (order.plan_details?.dataAmount ? 
                                  (typeof order.plan_details.dataAmount === 'number' ? 
                                    order.plan_details.dataAmount : 
                                    parseFloat(String(order.plan_details.dataAmount).replace(/[^0-9.]/g, '')) * 1024) : 
                                  null);
                }
                
                // Calculate usage if we have the data
                let usageData = order.usage_data || {};
                
                if (dataRemainingMb !== null || dataUsedMb !== null || dataTotalMb !== null) {
                  // Calculate used and total in GB
                  const totalGB = dataTotalMb ? (dataTotalMb / 1024) : 
                                 (order.plan_details?.dataAmount ? 
                                   (typeof order.plan_details.dataAmount === 'string' && order.plan_details.dataAmount.includes('GB') ?
                                     parseFloat(order.plan_details.dataAmount.replace(/[^0-9.]/g, '')) :
                                     (typeof order.plan_details.dataAmount === 'number' ? order.plan_details.dataAmount / 1024 : 0)) :
                                   0);
                  
                  let usedGB = 0;
                  if (dataUsedMb !== null) {
                    usedGB = dataUsedMb / 1024;
                  } else if (dataRemainingMb !== null && dataTotalMb !== null) {
                    usedGB = Math.max(0, (dataTotalMb - dataRemainingMb) / 1024);
                  } else if (dataRemainingMb !== null && totalGB > 0) {
                    usedGB = Math.max(0, totalGB - (dataRemainingMb / 1024));
                  }
                  
                  usageData = {
                    dataRemainingMb: dataRemainingMb || (totalGB > 0 ? (totalGB - usedGB) * 1024 : null),
                    dataUsedMb: dataUsedMb || (usedGB * 1024),
                    dataTotalMb: dataTotalMb || (totalGB * 1024),
                    usedGB: Number(usedGB.toFixed(2)),
                    totalGB: Number(totalGB.toFixed(2)),
                    bundleState: bundleStatusData?.assignments?.[0]?.bundleState || null,
                    lastUpdated: new Date().toISOString(),
                    ...usageData // Keep existing fields
                  };
                  
                  // Update order in database with latest usage
                  await supabaseClient
                    .from('esim_orders')
                    .update({
                      usage_data: usageData
                    })
                    .eq('id', order.id);
                  
                  // Add usage to order object
                  order.usage_data = usageData;
                  order.usage = {
                    used: usedGB,
                    total: totalGB
                  };
                }
              }
            }
          } catch (usageError) {
            console.warn(`⚠️ Failed to fetch usage for order ${order.id}:`, usageError.message);
            // Continue with existing usage data if available
          }
        }
        
        // Ensure usage object exists even if not fetched
        if (!order.usage) {
          const isUnlimited = order.plan_details?.unlimited === true || 
                             order.plan_details?.dataAmount === 'Unlimited' ||
                             (typeof order.plan_details?.dataAmount === 'string' && order.plan_details.dataAmount.toLowerCase().includes('unlimited'));
          
          if (isUnlimited) {
            order.usage = {
              used: 0,
              total: 0,
              unlimited: true
            };
          } else {
            const planDataAmount = order.plan_details?.dataAmount || '0GB';
            let totalGB = 0;
            
            if (typeof planDataAmount === 'string') {
              if (planDataAmount.toLowerCase().includes('gb')) {
                totalGB = parseFloat(planDataAmount.replace(/[^0-9.]/g, '')) || 0;
              } else if (planDataAmount.toLowerCase().includes('mb')) {
                totalGB = (parseFloat(planDataAmount.replace(/[^0-9.]/g, '')) || 0) / 1024;
              } else {
                const num = parseFloat(planDataAmount.replace(/[^0-9.]/g, ''));
                totalGB = num > 100 ? num / 1024 : num;
              }
            } else if (typeof planDataAmount === 'number') {
              totalGB = planDataAmount > 100 ? planDataAmount / 1024 : planDataAmount;
            }
            
            order.usage = {
              used: order.usage_data?.usedGB || 0,
              total: totalGB || 0
            };
          }
        }
        
        // Calculate expiry date from validity if not set
        if (!order.expiry_date && order.purchase_date && order.plan_details?.validity) {
          const validityStr = order.plan_details.validity;
          const daysMatch = validityStr.match(/(\d+)/);
          if (daysMatch) {
            const days = parseInt(daysMatch[1], 10);
            const created = new Date(order.purchase_date);
            if (!isNaN(created.getTime())) {
              const expiry = new Date(created);
              expiry.setDate(expiry.getDate() + days);
              order.expiry_date = expiry.toISOString();
            }
          }
        }
        
        return order;
      })
    );

    res.json({
      success: true,
      data: ordersWithUsage || []
    });
  } catch (error) {
    console.error('❌ Get eSIM orders error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to fetch orders',
      code: 'ORDERS_FETCH_ERROR',
      details: error.message
    });
  }
});

// Get specific eSIM order
router.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('esim_orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get eSIM order error:', error);
    res.status(500).json({
      error: 'Failed to fetch order',
      code: 'ORDER_FETCH_ERROR'
    });
  }
});

// Get order details from eSIM Go API by orderReference
router.get('/orders/:orderReference/details', authenticateToken, async (req, res) => {
  try {
    const { orderReference } = req.params;

    if (!orderReference) {
      return res.status(400).json({
        success: false,
        error: 'Order reference is required',
        code: 'MISSING_ORDER_REFERENCE'
      });
    }

    console.log('📋 Fetching order details from eSIM Go API for orderReference:', orderReference);

    // First verify the order belongs to the user
    const supabaseClient = supabaseAdmin || supabase;
    const { data: userOrder, error: orderError } = await supabaseClient
      .from('esim_orders')
      .select('*')
      .eq('esim_provider_order_id', orderReference)
      .eq('user_id', req.user.id)
      .single();

    if (orderError || !userOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or access denied',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Check if this is a manual assignment (starts with "manual-")
    const isManualAssignment = orderReference.startsWith('manual-');
    
    // Fetch order details from eSIM Go API (skip for manual assignments)
    // GET /v2.4/orders/{orderReference}
    let orderDetails = null;
    if (!isManualAssignment) {
      const orderDetailsPath = ESIMGO_PATHS.getOrder.replace('{orderId}', encodeURIComponent(orderReference)).replace('{orderReference}', encodeURIComponent(orderReference));
      
      try {
        orderDetails = await callESIMAPI(orderDetailsPath);
        console.log('✅ Order details fetched from eSIM Go API');
      } catch (apiError) {
        console.warn('⚠️ Failed to fetch order details from eSIM Go API:', apiError.message);
        // Continue with database order data
      }
    } else {
      console.log('ℹ️ Skipping eSIM Go API call for manual assignment');
    }

    // Extract eSIM details from order response
    let esimDetails = null;
    let qrCode = null;
    let activationCode = null;
    let smdpAddress = null;
    let iccid = null;
    let createdDate = null;
    let expiryDate = null;

    if (orderDetails) {
      // Extract createdDate - normalize to ISO string
      const rawCreatedDate = orderDetails.createdDate || orderDetails.created_date || orderDetails.created || userOrder.purchase_date || userOrder.created_at;
      if (rawCreatedDate) {
        try {
          const date = new Date(rawCreatedDate);
          if (!isNaN(date.getTime())) {
            createdDate = date.toISOString();
          }
        } catch (e) {
          console.warn('Failed to parse createdDate:', rawCreatedDate);
        }
      }

      // Extract eSIM details from order.order[0].esims[0]
      if (orderDetails.order && Array.isArray(orderDetails.order) && orderDetails.order.length > 0) {
        const firstOrder = orderDetails.order[0];
        if (firstOrder.esims && Array.isArray(firstOrder.esims) && firstOrder.esims.length > 0) {
          const firstEsim = firstOrder.esims[0];
          iccid = firstEsim.iccid || iccid;
          activationCode = firstEsim.matchingId || activationCode;
          smdpAddress = firstEsim.smdpAddress || smdpAddress;

          // Construct QR code: LPA:1$smdpAddress$matchingId
          if (smdpAddress && activationCode) {
            qrCode = `LPA:1$${smdpAddress}$${activationCode}`;
          }
        }
      }

      // Calculate expiry date from validity period and createdDate
      if (createdDate && userOrder.plan_details?.validity && !expiryDate) {
        const validityStr = userOrder.plan_details.validity;
        const daysMatch = validityStr.match(/(\d+)/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1], 10);
          const created = new Date(createdDate);
          if (!isNaN(created.getTime())) {
            const expiry = new Date(created);
            expiry.setDate(expiry.getDate() + days);
            expiryDate = expiry.toISOString();
          }
        }
      }
    }
    
    // If expiry date still not set, calculate from createdDate and validity
    if (!expiryDate && createdDate && userOrder.plan_details?.validity) {
      const validityStr = userOrder.plan_details.validity;
      const daysMatch = validityStr.match(/(\d+)/);
      if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        const created = new Date(createdDate);
        if (!isNaN(created.getTime())) {
          const expiry = new Date(created);
          expiry.setDate(expiry.getDate() + days);
          expiryDate = expiry.toISOString();
        }
      }
    }

    // Also try to get from assignments endpoint for QR code and usage (skip for manual assignments)
    if (ESIMGO_PATHS.esimAssignments && orderReference && !isManualAssignment) {
      try {
        const assignmentsPath = ESIMGO_PATHS.esimAssignments.replace('{orderReference}', encodeURIComponent(orderReference));
        const assignments = await callESIMAPI(assignmentsPath);
        
        let assignment = null;
        
        // Handle CSV format response
        if (typeof assignments === 'string' && assignments.includes(',')) {
          console.log('📄 Detected CSV format in assignments, parsing...');
          const lines = assignments.trim().split('\n');
          if (lines.length >= 2) {
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const dataLine = lines[1].split(',').map(d => d.trim().replace(/"/g, ''));
            assignment = {};
            headers.forEach((header, index) => {
              if (dataLine[index] !== undefined && dataLine[index] !== '') {
                assignment[header] = dataLine[index];
              }
            });
            console.log('✅ Parsed CSV assignment:', assignment);
          }
        } else if (Array.isArray(assignments) && assignments.length > 0) {
          assignment = assignments[0];
        } else if (typeof assignments === 'object' && assignments !== null) {
          assignment = assignments;
        }

        if (assignment) {
          // Extract ICCID
          iccid = assignment.ICCID || assignment.iccid || iccid || null;
          
          // Extract Matching ID (activation code)
          activationCode = assignment['Matching ID'] || assignment.matchingId || assignment.matching_id || activationCode || null;
          
          // Extract SMDP Address or RSP URL
          const rspUrl = assignment['RSP URL'] || assignment.rspUrl || assignment.rsp || null;
          smdpAddress = assignment['SMDP Address'] || assignment.smdpAddress || assignment.smdp_address || smdpAddress || null;
          
          // If RSP URL is provided but it's not in LPA format, use it as SMDP address
          if (rspUrl && !rspUrl.startsWith('LPA:1$')) {
            smdpAddress = rspUrl;
          }
          
          // Extract QR code - check if RSP URL is already in LPA format
          if (!qrCode) {
            if (rspUrl && rspUrl.startsWith('LPA:1$')) {
              qrCode = rspUrl;
            } else if (rspUrl) {
              // RSP URL might just be the SMDP address, construct full QR code
              if (activationCode) {
                qrCode = `LPA:1$${rspUrl}$${activationCode}`;
              }
            }
          }
          
          // Construct QR code if we have components but no QR code yet
          if (!qrCode && smdpAddress && activationCode) {
            qrCode = `LPA:1$${smdpAddress}$${activationCode}`;
          }

          // Extract usage data (CSV format may not include usage data)
          let dataRemainingMb = assignment.dataRemainingMb || assignment['Data Remaining MB'] || assignment.dataRemaining || null;
          let dataUsedMb = assignment.dataUsedMb || assignment['Data Used MB'] || assignment.dataUsed || null;
          let dataTotalMb = assignment.dataTotalMb || assignment['Data Total MB'] || assignment.dataTotal || null;
          let bundleState = assignment.bundleState || assignment.status || null;

          // Try to get bundle status from bundle status endpoint if we have ICCID and bundle name
          if (iccid && userOrder.plan_details?.name && ESIMGO_PATHS.bundleStatus) {
            try {
              const bundleName = userOrder.plan_details.name;
              const bundleStatusPath = ESIMGO_PATHS.bundleStatus
                .replace('{iccid}', encodeURIComponent(iccid))
                .replace('{name}', encodeURIComponent(bundleName));
              
              console.log('📊 Fetching bundle status from:', bundleStatusPath);
              const bundleStatus = await callESIMAPI(bundleStatusPath);
              
              if (bundleStatus && bundleStatus.assignments && Array.isArray(bundleStatus.assignments) && bundleStatus.assignments.length > 0) {
                // Get the latest assignment (most recent)
                const latestAssignment = bundleStatus.assignments[bundleStatus.assignments.length - 1];
                
                bundleState = latestAssignment.bundleState || bundleState;
                
                // Extract remaining quantity (in bytes - convert to MB)
                if (latestAssignment.remainingQuantity !== null && latestAssignment.remainingQuantity !== undefined) {
                  // remainingQuantity is in bytes, convert to MB (bytes / (1024 * 1024))
                  dataRemainingMb = latestAssignment.remainingQuantity / (1024 * 1024);
                  
                  // Calculate used and total if we have initialQuantity
                  if (latestAssignment.initialQuantity !== null && latestAssignment.initialQuantity !== undefined) {
                    // initialQuantity is in bytes, convert to MB
                    dataTotalMb = latestAssignment.initialQuantity / (1024 * 1024);
                    dataUsedMb = Math.max(0, dataTotalMb - dataRemainingMb);
                  }
                }
                
                // Use assignmentDateTime for more accurate dates
                if (latestAssignment.assignmentDateTime && !createdDate) {
                  try {
                    const assignmentDate = new Date(latestAssignment.assignmentDateTime);
                    if (!isNaN(assignmentDate.getTime())) {
                      createdDate = assignmentDate.toISOString();
                    }
                  } catch (e) {
                    console.warn('Failed to parse assignmentDateTime:', latestAssignment.assignmentDateTime);
                  }
                }
                
                console.log('✅ Bundle status fetched:', {
                  bundleState,
                  remainingQuantity: latestAssignment.remainingQuantity,
                  initialQuantity: latestAssignment.initialQuantity,
                  assignmentDateTime: latestAssignment.assignmentDateTime
                });
              }
            } catch (bundleStatusError) {
              console.warn('⚠️ Failed to fetch bundle status:', bundleStatusError.message);
              // Continue with assignment data
            }
          }

          // Calculate expiry date if not already set and we have createdDate and validity
          if (!expiryDate && createdDate && userOrder.plan_details?.validity) {
            const validityStr = userOrder.plan_details.validity;
            const daysMatch = validityStr.match(/(\d+)/);
            if (daysMatch) {
              const days = parseInt(daysMatch[1], 10);
              const created = new Date(createdDate);
              if (!isNaN(created.getTime())) {
                const expiry = new Date(created);
                expiry.setDate(expiry.getDate() + days);
                expiryDate = expiry.toISOString();
              }
            }
          }

          esimDetails = {
            iccid: iccid || null,
            qrCode: qrCode || null,
            activationCode: activationCode || null,
            smdpAddress: smdpAddress || null,
            dataRemainingMb,
            dataUsedMb,
            dataTotalMb,
            bundleState: bundleState || null,
            createdDate: createdDate || null,
            expiryDate: expiryDate || null
          };
          
          console.log('✅ Extracted eSIM details from assignments:', {
            hasICCID: !!iccid,
            hasQRCode: !!qrCode,
            hasActivationCode: !!activationCode,
            hasSMDP: !!smdpAddress,
            hasCreatedDate: !!createdDate,
            hasExpiryDate: !!expiryDate,
            hasUsageData: !!(dataRemainingMb !== null || dataUsedMb !== null || dataTotalMb !== null),
            bundleState: bundleState || 'unknown',
            qrCodeFormat: qrCode ? (qrCode.startsWith('LPA:1$') ? 'LPA format' : 'Other') : 'None'
          });
        }
      } catch (assignmentError) {
        console.warn('⚠️ Failed to fetch assignments:', assignmentError.message);
      }
    }

    // For manual assignments, use database data
    if (isManualAssignment) {
      // Normalize dates to ISO strings
      const normalizeDateString = (date) => {
        if (!date) return null;
        try {
          const d = new Date(date);
          if (isNaN(d.getTime())) return null;
          return d.toISOString();
        } catch {
          return null;
        }
      };

      const purchaseDate = normalizeDateString(userOrder.purchase_date || userOrder.created_at || userOrder.activated_at);
      if (purchaseDate && !createdDate) {
        createdDate = purchaseDate;
      }

      // Calculate expiry date from validity if not set
      if (!expiryDate && purchaseDate && userOrder.plan_details?.validity) {
        const validityStr = userOrder.plan_details.validity;
        const daysMatch = validityStr.match(/(\d+)/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1], 10);
          const created = new Date(purchaseDate);
          if (!isNaN(created.getTime())) {
            const expiry = new Date(created);
            expiry.setDate(expiry.getDate() + days);
            expiryDate = expiry.toISOString();
          }
        }
      }
      
      if (!expiryDate) {
        expiryDate = normalizeDateString(userOrder.expiry_date);
      }
      
      // Extract usage data from order if available
      const usageData = userOrder.usage_data || {};
      const dataRemainingMb = usageData.dataRemainingMb || usageData['Data Remaining MB'] || null;
      const dataUsedMb = usageData.dataUsedMb || usageData['Data Used MB'] || usageData.usedGB ? (usageData.usedGB * 1024) : null;
      const dataTotalMb = usageData.dataTotalMb || usageData['Data Total MB'] || usageData.totalGB ? (usageData.totalGB * 1024) : null;
      
      esimDetails = {
        iccid: userOrder.usage_data?.iccid || userOrder.usage_data?.ICCID || userOrder.iccid || null,
        qrCode: userOrder.qr_code || null,
        activationCode: userOrder.activation_code || null,
        smdpAddress: null,
        dataRemainingMb,
        dataUsedMb,
        dataTotalMb,
        createdDate: purchaseDate,
        expiryDate: expiryDate
      };
    }

    // Normalize dates to ISO strings for response
    const normalizeResponseDate = (date) => {
      if (!date) return null;
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString();
      } catch {
        return null;
      }
    };

    // Combine all data
    const responseData = {
      orderReference,
      orderId: userOrder.id,
      status: orderDetails?.status || userOrder.status,
      statusMessage: orderDetails?.statusMessage || orderDetails?.status_message || null,
      createdDate: normalizeResponseDate(createdDate || userOrder.purchase_date || userOrder.created_at || userOrder.activated_at),
      expiryDate: normalizeResponseDate(expiryDate || userOrder.expiry_date),
      esimDetails: esimDetails || {
        iccid: iccid || userOrder.iccid || userOrder.usage_data?.iccid || userOrder.usage_data?.ICCID || null,
        qrCode: qrCode || userOrder.qr_code || null,
        activationCode: activationCode || userOrder.activation_code || null,
        smdpAddress: smdpAddress || null
      },
      planDetails: userOrder.plan_details,
      total: orderDetails?.total || null,
      currency: orderDetails?.currency || userOrder.plan_details?.price?.currency || 'JPY'
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order details',
      code: 'ORDER_DETAILS_FETCH_ERROR',
      details: error.message
    });
  }
});

// Activate eSIM
router.post('/orders/:id/activate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get order
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

    // Activation in eSIM Go API v2.4 is typically automatic or handled via assignments
    // If separate activation endpoint exists, use it; otherwise fetch assignments
    let activationResult = null;
    if (ESIMGO_PATHS.activateOrder) {
      const activatePath = ESIMGO_PATHS.activateOrder.replace('{orderId}', encodeURIComponent(order.esim_provider_order_id));
      activationResult = await callESIMAPI(activatePath, {
        method: 'POST'
      });
    } else {
      // Fetch assignment details as activation confirmation
      const assignmentsPath = ESIMGO_PATHS.esimAssignments.replace('{orderReference}', encodeURIComponent(order.esim_provider_order_id));
      activationResult = await callESIMAPI(assignmentsPath);
    }

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
          order_id: id
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

// Get eSIM usage
router.get('/orders/:id/usage', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get order
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

    // Check if plan is unlimited
    const isUnlimited = order.plan_details?.unlimited === true || 
                       order.plan_details?.dataAmount === 'Unlimited' ||
                       (typeof order.plan_details?.dataAmount === 'string' && order.plan_details.dataAmount.toLowerCase().includes('unlimited'));

    // Get usage/assignment details from eSIMGo
    // According to eSIM Go API v2.4: Usage data is in /esims/assignments/{orderReference}
    let usage = null;
    if (ESIMGO_PATHS.esimAssignments && order.esim_provider_order_id) {
      const assignmentsPath = ESIMGO_PATHS.esimAssignments.replace('{orderReference}', encodeURIComponent(order.esim_provider_order_id));
      usage = await callESIMAPI(assignmentsPath);
    } else if (ESIMGO_PATHS.orderUsage) {
      const usagePath = ESIMGO_PATHS.orderUsage.replace('{orderId}', encodeURIComponent(order.esim_provider_order_id));
      usage = await callESIMAPI(usagePath);
    }

    // Parse assignment response to extract usage data
    let assignment = null;
    if (usage) {
      if (Array.isArray(usage) && usage.length > 0) {
        assignment = usage[0];
      } else if (typeof usage === 'object') {
        assignment = usage;
      }
    }

    // Extract and normalize usage data
    let usageData = order.usage_data || {};
    
    if (assignment && !isUnlimited) {
      // Extract usage data from assignment response
      const dataRemainingMb = assignment.dataRemainingMb || 
                              assignment['Data Remaining MB'] || 
                              assignment.dataRemaining || 
                              assignment.remainingData || 
                              null;
      
      const dataUsedMb = assignment.dataUsedMb || 
                         assignment['Data Used MB'] || 
                         assignment.dataUsed || 
                         assignment.usedData || 
                         null;
      
      const dataTotalMb = assignment.dataTotalMb || 
                          assignment['Data Total MB'] || 
                          assignment.dataTotal || 
                          assignment.totalData ||
                          (order.plan_details?.dataAmount ? 
                            (typeof order.plan_details.dataAmount === 'number' ? 
                              order.plan_details.dataAmount : 
                              parseFloat(String(order.plan_details.dataAmount).replace(/[^0-9.]/g, '')) * 1024) : 
                            null);
      
      // Calculate usage if we have the data
      if (dataRemainingMb !== null || dataUsedMb !== null || dataTotalMb !== null) {
        const totalGB = dataTotalMb ? (dataTotalMb / 1024) : 
                       (order.plan_details?.dataAmount ? 
                         (typeof order.plan_details.dataAmount === 'string' && order.plan_details.dataAmount.includes('GB') ?
                           parseFloat(order.plan_details.dataAmount.replace(/[^0-9.]/g, '')) :
                           (typeof order.plan_details.dataAmount === 'number' ? order.plan_details.dataAmount / 1024 : 0)) :
                         0);
        
        let usedGB = 0;
        if (dataUsedMb !== null) {
          usedGB = dataUsedMb / 1024;
        } else if (dataRemainingMb !== null && dataTotalMb !== null) {
          usedGB = Math.max(0, (dataTotalMb - dataRemainingMb) / 1024);
        } else if (dataRemainingMb !== null && totalGB > 0) {
          usedGB = Math.max(0, totalGB - (dataRemainingMb / 1024));
        }
        
        usageData = {
          dataRemainingMb: dataRemainingMb || (totalGB > 0 ? (totalGB - usedGB) * 1024 : null),
          dataUsedMb: dataUsedMb || (usedGB * 1024),
          dataTotalMb: dataTotalMb || (totalGB * 1024),
          usedGB: Number(usedGB.toFixed(2)),
          totalGB: Number(totalGB.toFixed(2)),
          lastUpdated: new Date().toISOString(),
          ...usageData // Keep existing fields
        };
      }
    } else if (isUnlimited) {
      // For unlimited plans, set appropriate usage data
      usageData = {
        ...usageData,
        unlimited: true,
        lastUpdated: new Date().toISOString()
      };
    }

    // Persist usage snapshot
    await supabase
      .from('esim_orders')
      .update({
        usage_data: usageData
      })
      .eq('id', id);

    // Format response
    const response = {
      success: true,
      data: {
        orderId: order.id,
        unlimited: isUnlimited,
        ...(isUnlimited ? {
          unlimited: true,
          message: 'Unlimited data plan'
        } : {
          usedGB: usageData.usedGB || 0,
          totalGB: usageData.totalGB || 0,
          dataRemainingMb: usageData.dataRemainingMb,
          dataUsedMb: usageData.dataUsedMb,
          dataTotalMb: usageData.dataTotalMb,
          percentage: usageData.totalGB > 0 ? 
            Math.round((usageData.usedGB || 0) / usageData.totalGB * 100) : 0
        }),
        lastUpdated: usageData.lastUpdated || new Date().toISOString(),
        raw: assignment || usage // Include raw API response for debugging
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get eSIM usage error:', error);
    res.status(500).json({
      error: 'Failed to fetch usage',
      code: 'USAGE_FETCH_ERROR',
      details: error.message
    });
  }
});

// Cancel eSIM order
router.post('/orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get order
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

    if (order.status === 'active') {
      return res.status(400).json({
        error: 'Active eSIM cannot be cancelled',
        code: 'ACTIVE_ESIM_CANNOT_CANCEL'
      });
    }

    // Cancel order - Check if cancel endpoint exists in API docs
    // If not available, we'll just update status in our database
    let cancelResult = null;
    try {
      // Try standard cancel endpoint (may not exist in v2.4)
      const cancelPath = `/orders/${order.esim_provider_order_id}/cancel`;
      cancelResult = await callESIMAPI(cancelPath, {
        method: 'POST'
      });
    } catch (cancelError) {
      console.warn('Cancel endpoint not available, updating status only:', cancelError);
      // API may not support cancellation, just update our database
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('esim_orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({
        error: 'Failed to update order status',
        code: 'ORDER_UPDATE_ERROR'
      });
    }

    res.json({
      success: true,
      data: cancelResult
    });
  } catch (error) {
    console.error('Cancel eSIM order error:', error);
    res.status(500).json({
      error: 'Failed to cancel order',
      code: 'ORDER_CANCEL_ERROR'
    });
  }
});

// Delete eSIM order
router.delete('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting eSIM order:', {
      orderId: id,
      userId: req.user.id,
      userEmail: req.user.email
    });

    // Use admin client to bypass RLS policies
    const supabaseClient = supabaseAdmin || supabase;

    // Get order to verify ownership
    const { data: order, error: orderError } = await supabaseClient
      .from('esim_orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (orderError || !order) {
      console.warn('⚠️ Order not found or access denied:', {
        orderId: id,
        userId: req.user.id,
        error: orderError?.message
      });
      return res.status(404).json({
        success: false,
        error: 'Order not found or access denied',
        code: 'ORDER_NOT_FOUND',
        details: orderError?.message
      });
    }

    console.log('✅ Order found, proceeding with deletion:', {
      orderId: order.id,
      planId: order.plan_id,
      status: order.status,
      providerOrderId: order.esim_provider_order_id
    });

    // Delete order from database using admin client
    const { data: deletedData, error: deleteError } = await supabaseClient
      .from('esim_orders')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select();

    if (deleteError) {
      console.error('❌ Failed to delete order:', {
        orderId: id,
        error: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint
      });
      
      // Check if it's an RLS policy issue
      if (deleteError.code === '42501' || deleteError.message?.includes('permission denied') || deleteError.message?.includes('policy')) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied. RLS policy may be blocking deletion.',
          code: 'RLS_POLICY_BLOCKED',
          details: deleteError.message,
          hint: 'Please ensure DELETE policy exists for esim_orders table'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to delete order',
        code: 'ORDER_DELETE_ERROR',
        details: deleteError.message,
        hint: deleteError.hint
      });
    }

    // Check if anything was actually deleted
    if (!deletedData || deletedData.length === 0) {
      console.warn('⚠️ No rows deleted:', {
        orderId: id,
        userId: req.user.id
      });
      return res.status(404).json({
        success: false,
        error: 'Order not found or already deleted',
        code: 'ORDER_NOT_FOUND'
      });
    }

    console.log('✅ Order deleted successfully:', {
      orderId: id,
      deletedCount: deletedData.length
    });

    res.json({
      success: true,
      message: 'eSIM order deleted successfully',
      data: {
        deletedOrderId: id
      }
    });
  } catch (error) {
    console.error('Delete eSIM order error:', {
      error: error.message,
      stack: error.stack,
      orderId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete order',
      code: 'ORDER_DELETE_ERROR',
      details: error.message
    });
  }
});

// Fetch user eSIM profiles from provider (if supported)
// Note: Profiles endpoint not found in v2.4 API documentation
// Using orders endpoint to get user's eSIM orders/assignments
router.get('/profiles', authenticateToken, async (req, res) => {
  try {
    if (ESIMGO_PATHS.profiles) {
      const profiles = await callESIMAPI(ESIMGO_PATHS.profiles);
      res.json({ success: true, data: profiles });
    } else {
      // Fallback: Get user orders from our database
      const { data: orders, error } = await supabase
        .from('esim_orders')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      res.json({ success: true, data: orders || [] });
    }
  } catch (error) {
    console.error('Get eSIM profiles error:', error);
    res.status(500).json({
      error: 'Failed to fetch profiles',
      code: 'PROFILES_FETCH_ERROR'
    });
  }
});

// Get eSIM details by ICCID
router.get('/esim/:iccid', authenticateToken, async (req, res) => {
  try {
    const { iccid } = req.params;
    
    if (!iccid || iccid.length < 15) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ICCID format',
        code: 'INVALID_ICCID'
      });
    }

    console.log('🔍 Fetching eSIM details for ICCID:', iccid);

    // First, try to find the order in our database by ICCID
    const supabaseClient = supabaseAdmin || supabase;
    const { data: orders, error: dbError } = await supabaseClient
      .from('esim_orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.warn('⚠️ Database query error:', dbError);
    }

    // Search for order with matching ICCID in usage_data
    let matchingOrder = null;
    if (orders && orders.length > 0) {
      matchingOrder = orders.find(order => {
        const orderIccid = order.usage_data?.iccid || 
                          order.usage_data?.ICCID ||
                          order.iccid;
        return orderIccid === iccid || orderIccid?.toString() === iccid.toString();
      });
    }

    // If we found an order, try to get fresh details from eSIM Go API
    if (matchingOrder && matchingOrder.esim_provider_order_id) {
      try {
        const assignmentsPath = ESIMGO_PATHS.esimAssignments.replace(
          '{orderReference}', 
          encodeURIComponent(matchingOrder.esim_provider_order_id)
        );
        console.log('📥 Fetching fresh assignment details from:', assignmentsPath);
        
        const assignments = await callESIMAPI(assignmentsPath);
        
        let assignment = null;
        if (Array.isArray(assignments) && assignments.length > 0) {
          assignment = assignments.find(a => 
            (a.ICCID || a.iccid) === iccid || 
            (a.ICCID || a.iccid)?.toString() === iccid.toString()
          ) || assignments[0];
        } else if (typeof assignments === 'object') {
          assignment = assignments;
        }

        if (assignment) {
          // Extract all available details
          const esimDetails = {
            iccid: assignment.ICCID || assignment.iccid || iccid,
            qrCode: assignment['RSP URL'] || assignment.rspUrl || assignment.qrCode || assignment.qr || null,
            activationCode: assignment['Matching ID'] || assignment.matchingId || assignment.matching_id || null,
            smdpAddress: assignment['SMDP Address'] || assignment.smdpAddress || assignment.smdp_address || null,
            dataRemainingMb: assignment.dataRemainingMb || assignment['Data Remaining MB'] || assignment.dataRemaining || null,
            dataUsedMb: assignment.dataUsedMb || assignment['Data Used MB'] || assignment.dataUsed || null,
            dataTotalMb: assignment.dataTotalMb || assignment['Data Total MB'] || assignment.dataTotal || null,
            status: assignment.status || matchingOrder.status || 'unknown',
            orderReference: matchingOrder.esim_provider_order_id,
            orderId: matchingOrder.id,
            planDetails: matchingOrder.plan_details,
            purchaseDate: matchingOrder.purchase_date || matchingOrder.created_at,
            expiryDate: matchingOrder.expiry_date,
            // Include all other fields from assignment
            rawAssignment: assignment
          };

          // Construct QR code if we have SMDP and activation code
          if (!esimDetails.qrCode && esimDetails.smdpAddress && esimDetails.activationCode) {
            esimDetails.qrCode = `LPA:1$${esimDetails.smdpAddress}$${esimDetails.activationCode}`;
          }

          console.log('✅ eSIM details retrieved:', {
            iccid: esimDetails.iccid,
            hasQRCode: !!esimDetails.qrCode,
            hasActivationCode: !!esimDetails.activationCode,
            hasSMDP: !!esimDetails.smdpAddress
          });

          return res.json({
            success: true,
            data: esimDetails
          });
        }
      } catch (apiError) {
        console.warn('⚠️ Failed to fetch from eSIM Go API, using database data:', apiError.message);
      }
    }

    // If we found an order but couldn't get fresh API data, return what we have
    if (matchingOrder) {
      const esimDetails = {
        iccid: iccid,
        qrCode: matchingOrder.qr_code || null,
        activationCode: matchingOrder.activation_code || null,
        status: matchingOrder.status,
        orderId: matchingOrder.id,
        orderReference: matchingOrder.esim_provider_order_id,
        planDetails: matchingOrder.plan_details,
        purchaseDate: matchingOrder.purchase_date || matchingOrder.created_at,
        expiryDate: matchingOrder.expiry_date,
        usageData: matchingOrder.usage_data || {}
      };

      return res.json({
        success: true,
        data: esimDetails,
        source: 'database'
      });
    }

    // Try direct API lookup by ICCID (if eSIM Go supports it)
    // Common endpoint patterns: /esims/{iccid} or /esims?iccid={iccid}
    try {
      const possibleEndpoints = [
        `/esims/${iccid}`,
        `/esims?iccid=${iccid}`,
        `/esims/iccid/${iccid}`
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          console.log('🔍 Trying endpoint:', endpoint);
          const result = await callESIMAPI(endpoint);
          if (result) {
            // Normalize the API response
            const esimDetails = {
              iccid: result.iccid || result.ICCID || iccid,
              pin: result.pin || result.PIN || null,
              puk: result.puk || result.PUK || null,
              activationCode: result.matchingId || result.matching_id || result['Matching ID'] || result['MatchingID'] || null,
              smdpAddress: result.smdpAddress || result.smdp_address || result['SMDP Address'] || result['SMDPAddress'] || null,
              profileStatus: result.profileStatus || result.profile_status || result.status || null,
              firstInstalledDateTime: result.firstInstalledDateTime || result.first_installed_date_time || null,
              customerRef: result.customerRef || result.customer_ref || null,
              qrCode: null,
              // Include raw response for reference
              rawResponse: result
            };

            // Construct QR code if we have SMDP and activation code
            if (esimDetails.smdpAddress && esimDetails.activationCode) {
              esimDetails.qrCode = `LPA:1$${esimDetails.smdpAddress}$${esimDetails.activationCode}`;
            }

            console.log('✅ eSIM details from direct API lookup:', {
              iccid: esimDetails.iccid,
              hasQRCode: !!esimDetails.qrCode,
              hasActivationCode: !!esimDetails.activationCode,
              hasSMDP: !!esimDetails.smdpAddress,
              profileStatus: esimDetails.profileStatus
            });

            return res.json({
              success: true,
              data: esimDetails,
              source: 'api'
            });
          }
        } catch (endpointError) {
          // Continue to next endpoint
          continue;
        }
      }
    } catch (apiError) {
      console.warn('⚠️ Direct API lookup failed:', apiError.message);
    }

    // Not found
    return res.status(404).json({
      success: false,
      error: 'eSIM not found',
      code: 'ESIM_NOT_FOUND',
      message: `No eSIM found with ICCID: ${iccid}`
    });

  } catch (error) {
    console.error('Get eSIM by ICCID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch eSIM details',
      code: 'ESIM_FETCH_ERROR',
      details: error.message
    });
  }
});

export default router;
