// Backend API configuration for Trippin with Supabase
// Helper to get backend URL from multiple sources (called dynamically)
const getBackendUrl = (): string => {
  // Development mode - use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // Production - prioritize environment variable first
  const envBackendUrl = import.meta.env.VITE_BACKEND_URL;
  const configBackendUrl = typeof window !== 'undefined' && (window as any).__APP_CONFIG__?.backendUrl;
  const defaultBackendUrl = 'https://fuskrbebtyccnmaprmbe.supabase.co/functions/v1/trippin-api';
  
  // Priority: 1. Environment variable, 2. app-config.json, 3. Default
  let backendUrl = envBackendUrl || configBackendUrl || defaultBackendUrl;
  
  // Validate and fix URL
  if (!backendUrl) {
    console.error('❌ No backend URL found, using default');
    backendUrl = defaultBackendUrl;
  }
  
  // Ensure URL is absolute (not relative)
  if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
    console.warn('⚠️ Backend URL is relative, converting to absolute:', backendUrl);
    // If it starts with /, it's a relative path - prepend current origin
    if (backendUrl.startsWith('/')) {
      backendUrl = `${window.location.origin}${backendUrl}`;
    } else {
      backendUrl = `https://${backendUrl}`;
    }
  }
  
  // Remove trailing slash if present
  if (backendUrl.endsWith('/')) {
    backendUrl = backendUrl.slice(0, -1);
  }
  
  // Final validation
  if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
    console.error('❌ CRITICAL: Backend URL is still not absolute!', backendUrl);
    backendUrl = defaultBackendUrl; // Force use default
  }
  
  console.log('🔗 Backend URL Resolution:', {
    finalUrl: backendUrl,
    fromEnv: !!envBackendUrl,
    envValue: envBackendUrl || 'NOT SET',
    fromConfig: !!configBackendUrl,
    configValue: configBackendUrl || 'NOT SET',
    usingDefault: !envBackendUrl && !configBackendUrl,
    allEnvVars: Object.keys(import.meta.env).filter(k => k.includes('BACKEND') || k.includes('SUPABASE') || k.includes('VITE_')).slice(0, 10),
    windowConfig: typeof window !== 'undefined' ? (window as any).__APP_CONFIG__ : 'no window'
  });
  
  return backendUrl;
};

export const BACKEND_API_CONFIG = {
  get BASE_URL() {
    return getBackendUrl();
  },
  ENDPOINTS: {
    // Authentication
    AUTH: {
      PROFILE: '/api/auth/profile',
      UPDATE_PROFILE: '/api/auth/profile',
      PREFERENCES: '/api/auth/preferences',
      NOTIFICATIONS: '/api/auth/notifications',
      MARK_NOTIFICATION_READ: '/api/auth/notifications/:id/read',
      MARK_ALL_READ: '/api/auth/notifications/read-all',
      DELETE_ACCOUNT: '/api/auth/account'
    },
    SUPABASE_AUTH: {
      SIGNUP: '/api/supabase-auth/signup',
      SIGNIN: '/api/supabase-auth/signin',
      GOOGLE_SIGNIN: '/api/supabase-auth/signin/google',
      SIGNOUT: '/api/supabase-auth/signout',
      REFRESH: '/api/supabase-auth/refresh',
      USER: '/api/supabase-auth/user',
      RESET_PASSWORD: '/api/supabase-auth/reset-password',
      UPDATE_PASSWORD: '/api/supabase-auth/update-password',
      DELETE_USER: '/api/supabase-auth/user',
      VERIFY_EMAIL: '/api/supabase-auth/verify-email'
    },
    // Trips
    TRIPS: {
      LIST: '/api/trips',
      PUBLIC: '/api/trips/public',
      DETAIL: '/api/trips/:id',
      CREATE: '/api/trips',
      UPDATE: '/api/trips/:id',
      DELETE: '/api/trips/:id',
      FAVORITE: '/api/trips/:id/favorite',
      UNFAVORITE: '/api/trips/:id/favorite',
      SHARE: '/api/trips/:id/share',
      SHARED: '/api/trips/shared/:token'
    },
    // Itineraries
    ITINERARIES: {
      BY_TRIP: '/api/itineraries/trip/:tripId',
      DETAIL: '/api/itineraries/:id',
      CREATE: '/api/itineraries',
      UPDATE: '/api/itineraries/:id',
      DELETE: '/api/itineraries/:id',
      BULK_UPDATE: '/api/itineraries/trip/:tripId/bulk'
    },
    // Payments
    PAYMENTS: {
      CREATE_INTENT: '/api/payments/create-intent',
      CONFIRM: '/api/payments/confirm',
      LIST: '/api/payments',
      DETAIL: '/api/payments/:id',
      REFUND: '/api/payments/:id/refund',
      WEBHOOK: '/api/payments/webhook'
    },
    // Subscriptions
    SUBSCRIPTIONS: {
      STATUS: '/api/subscriptions/status',
      INVOICES: '/api/subscriptions/invoices',
      PAYMENT_METHODS: '/api/subscriptions/payment-methods',
      CANCEL: '/api/subscriptions/cancel',
      CREATE_CHECKOUT: '/api/subscriptions/create-checkout-session',
      VERIFY_PAYMENT: '/api/subscriptions/verify-payment',
      WEBHOOK: '/api/subscriptions/webhook'
    },
    // OpenAI
    OPENAI: {
      GENERATE: '/api/openai/generate',
      CHAT: '/api/openai/chat'
    },
    // ESIM
    ESIM: {
      PLANS: '/api/esim/plans',
      PURCHASE: '/api/esim/purchase',
      ORDERS: '/api/esim/orders',
      ORDER_DETAIL: '/api/esim/orders/:id',
      ORDER_DETAILS: '/api/esim/orders/:orderReference/details',
      ACTIVATE: '/api/esim/orders/:id/activate',
      USAGE: '/api/esim/orders/:id/usage',
      CANCEL: '/api/esim/orders/:id/cancel'
    },
    // Google Maps
    GOOGLE_MAPS: {
      SEARCH: '/api/google-maps',
      DETAILS: '/api/google-maps/details'
    },
    // Google Translate
    GOOGLE_TRANSLATE: {
      TRANSLATE: '/api/google-translate/translate',
      DETECT: '/api/google-translate/detect',
      LANGUAGES: '/api/google-translate/languages'
    }
  },
  TIMEOUT: 30000, // 30 seconds (default)
  OPENAI_TIMEOUT: 60000, // 60 seconds for OpenAI endpoints
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// Helper function to build API URLs
export const buildBackendApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const url = new URL(`${BACKEND_API_CONFIG.BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }
  
  return url.toString();
};

// Enhanced error types
export interface BackendAPIError extends Error {
  status?: number;
  code?: string;
  details?: any;
  endpoint?: string;
  retryable?: boolean;
}

// Create custom error
const createBackendAPIError = (message: string, status?: number, code?: string, endpoint?: string): BackendAPIError => {
  const error = new Error(message) as BackendAPIError;
  error.status = status;
  error.code = code;
  error.endpoint = endpoint;
  error.retryable = status ? [408, 429, 500, 502, 503, 504].includes(status) : false;
  return error;
};

// Sleep function for retry delays
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced retry logic with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = BACKEND_API_CONFIG.RETRY_ATTEMPTS,
  baseDelay: number = BACKEND_API_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: BackendAPIError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as BackendAPIError;
      
      // Don't retry if error is not retryable
      if (!lastError.retryable || attempt === maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Backend API call failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms...`, {
        error: lastError.message,
        endpoint: lastError.endpoint,
        status: lastError.status
      });
      
      await sleep(delay);
    }
  }
  
  throw lastError!;
};

// Network status checker
export const checkNetworkStatus = (): boolean => {
  return navigator.onLine;
};

// Enhanced API call function with comprehensive error handling
export const backendApiCall = async (endpoint: string, options: RequestInit = {}, token?: string): Promise<any> => {
  // Check network connectivity
  if (!checkNetworkStatus()) {
    throw createBackendAPIError(
      'インターネット接続がありません。接続を確認してください。',
      0,
      'NETWORK_OFFLINE',
      endpoint
    );
  }

  // Get BASE_URL fresh each time (it's a getter)
  const baseUrl = BACKEND_API_CONFIG.BASE_URL;
  const url = `${baseUrl}${endpoint}`;
  
  console.log('🌐 Constructing API URL:', {
    baseUrl,
    endpoint,
    finalUrl: url,
    isAbsolute: url.startsWith('http://') || url.startsWith('https://'),
    isRelative: url.startsWith('/')
  });
  
  // Validate URL is absolute
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error('❌ ERROR: Backend URL is not absolute!', {
      baseUrl,
      endpoint,
      constructedUrl: url,
      envVar: import.meta.env.VITE_BACKEND_URL,
      config: typeof window !== 'undefined' ? (window as any).__APP_CONFIG__ : 'no window'
    });
  }
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add Supabase apikey header (required for edge functions)
  // Try multiple sources for the anon key (same as SupabaseAuthContext)
  const supabaseAnonKey = 
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    (typeof window !== 'undefined' && (window as any).__APP_CONFIG__?.supabaseAnonKey) ||
    (typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY);
  
  if (supabaseAnonKey && supabaseAnonKey !== 'your-anon-key') {
    defaultHeaders['apikey'] = supabaseAnonKey;
    // For public endpoints, also add Authorization header with anon key
    // (Supabase edge functions gateway requires both apikey and Authorization for some requests)
    if (!token) {
      defaultHeaders['Authorization'] = `Bearer ${supabaseAnonKey}`;
    }
  } else {
    console.error('❌ VITE_SUPABASE_ANON_KEY not found - edge function requests will fail');
    console.error('Available sources:', {
      env: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      envValue: import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined',
      appConfig: !!(typeof window !== 'undefined' && (window as any).__APP_CONFIG__?.supabaseAnonKey),
      window: !!(typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY)
    });
    console.error('Please set VITE_SUPABASE_ANON_KEY in your environment variables and rebuild');
  }

  // Add authorization header if token is provided (overrides the anon key Authorization)
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  console.log(`🚀 Backend API Request: ${options.method || 'GET'} ${url}`, {
    endpoint,
    headers: defaultHeaders,
    body: options.body ? JSON.parse(options.body as string) : undefined
  });

  const makeRequest = async (): Promise<any> => {
    const controller = new AbortController();
    // Use longer timeout for OpenAI endpoints
    const timeout = endpoint.includes('/openai/') ? BACKEND_API_CONFIG.OPENAI_TIMEOUT : BACKEND_API_CONFIG.TIMEOUT;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📡 Backend API Response: ${response.status} ${response.statusText}`, {
        endpoint,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Handle different response statuses
      if (!response.ok) {
        let errorMessage = `Backend API Error: ${response.status} - ${response.statusText}`;
        let errorDetails: any = null;
        let userPrompt: string | null = null;

        try {
          const errorData = await response.json();
          errorDetails = errorData;
          // Prioritize userPrompt if available, then error/message
          userPrompt = errorData.userPrompt || null;
          errorMessage = userPrompt || errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          console.warn('Failed to parse error response as JSON:', parseError);
        }

        // Create error with userPrompt preserved in details
        const error = createBackendAPIError(
          errorMessage,
          response.status,
          errorDetails?.code || 'UNKNOWN_ERROR',
          endpoint
        );
        // Preserve userPrompt and other error details
        error.details = {
          ...errorDetails,
          userPrompt: userPrompt || errorDetails?.userPrompt
        };

        // Create specific error based on status code
        switch (response.status) {
          case 400:
            throw error;
          case 401:
            // For signin endpoint, show more specific error message
            if (endpoint.includes('/signin')) {
              // Use the actual error message from the backend if available
              const signinErrorMessage = errorMessage || 'Invalid email or password. Please check your credentials and try again.';
              const signinError = createBackendAPIError(
                signinErrorMessage,
                401,
                'INVALID_CREDENTIALS',
                endpoint
              );
              signinError.details = error.details;
              throw signinError;
            } else {
              // Use backend message if available, otherwise use default
              const authErrorMessage = errorDetails?.message || errorMessage || '認証が必要です。ログインしてください。';
              const authError = createBackendAPIError(
                authErrorMessage,
                401,
                errorDetails?.code || 'UNAUTHORIZED',
                endpoint
              );
              authError.details = error.details;
              throw authError;
            }
          case 403:
            // For signin endpoint, show email verification error
            if (endpoint.includes('/signin')) {
              const verifyError = createBackendAPIError(
                errorMessage || 'Please verify your email before signing in.',
                403,
                'EMAIL_NOT_VERIFIED',
                endpoint
              );
              verifyError.details = error.details;
              throw verifyError;
            } else {
              const forbiddenError = createBackendAPIError(
                'アクセスが拒否されました。権限を確認してください。',
                403,
                'FORBIDDEN',
                endpoint
              );
              forbiddenError.details = error.details;
              throw forbiddenError;
            }
          case 404:
            const notFoundError = createBackendAPIError(
              'リクエストされたリソースが見つかりません。',
              404,
              'NOT_FOUND',
              endpoint
            );
            notFoundError.details = error.details;
            throw notFoundError;
          case 408:
            const timeoutError = createBackendAPIError(
              'リクエストがタイムアウトしました。もう一度お試しください。',
              408,
              'REQUEST_TIMEOUT',
              endpoint
            );
            timeoutError.details = error.details;
            throw timeoutError;
          case 429:
            const rateLimitError = createBackendAPIError(
              'リクエストが多すぎます。しばらく待ってからお試しください。',
              429,
              'RATE_LIMITED',
              endpoint
            );
            rateLimitError.details = error.details;
            throw rateLimitError;
          case 500:
            const serverError = createBackendAPIError(
              'サーバーエラーが発生しました。しばらく待ってからお試しください。',
              500,
              'INTERNAL_SERVER_ERROR',
              endpoint
            );
            serverError.details = error.details;
            // Don't retry purchase endpoint errors - they should be idempotent
            if (endpoint.includes('/purchase') || errorDetails?.code === 'NO_ORDER_REFERENCE') {
              serverError.retryable = false;
            }
            throw serverError;
          case 502:
            const gatewayError = createBackendAPIError(
              'サーバーが一時的に利用できません。',
              502,
              'BAD_GATEWAY',
              endpoint
            );
            gatewayError.details = error.details;
            throw gatewayError;
          case 503:
            const unavailableError = createBackendAPIError(
              'サービスが一時的に利用できません。メンテナンス中の可能性があります。',
              503,
              'SERVICE_UNAVAILABLE',
              endpoint
            );
            unavailableError.details = error.details;
            throw unavailableError;
          case 504:
            const gatewayTimeoutError = createBackendAPIError(
              'サーバーの応答がタイムアウトしました。',
              504,
              'GATEWAY_TIMEOUT',
              endpoint
            );
            gatewayTimeoutError.details = error.details;
            throw gatewayTimeoutError;
          default:
            throw error;
        }
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ Backend API Success:`, { endpoint, data });
        return data;
      } else {
        const text = await response.text();
        console.log(`✅ Backend API Success (text):`, { endpoint, text });
        return { data: text };
      }

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw createBackendAPIError(
          'リクエストがタイムアウトしました。ネットワーク接続を確認してください。',
          408,
          'TIMEOUT',
          endpoint
        );
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw createBackendAPIError(
          'ネットワークエラーが発生しました。インターネット接続を確認してください。',
          0,
          'NETWORK_ERROR',
          endpoint
        );
      }

      // Re-throw API errors as-is
      if ((error as BackendAPIError).status !== undefined) {
        throw error;
      }

      // Handle unknown errors
      throw createBackendAPIError(
        `予期しないエラーが発生しました: ${error.message}`,
        0,
        'UNKNOWN_ERROR',
        endpoint
      );
    }
  };

  // Execute with retry logic
  try {
    return await retryWithBackoff(makeRequest);
  } catch (error) {
    const apiError = error as BackendAPIError;
    
    // Log error for debugging
    console.error(`❌ Backend API Error (${endpoint}):`, {
      message: apiError.message,
      status: apiError.status,
      code: apiError.code,
      endpoint: apiError.endpoint,
      retryable: apiError.retryable
    });

    throw apiError;
  }
};

// Specialized API calls for different services
export const authApiCall = async (endpoint: string, data: any, token?: string): Promise<any> => {
  return backendApiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);
};

export const tripApiCall = async (endpoint: string, data?: any, token?: string): Promise<any> => {
  return backendApiCall(endpoint, {
    method: data ? 'POST' : 'GET',
    body: data ? JSON.stringify(data) : undefined
  }, token);
};


export const paymentApiCall = async (endpoint: string, data: any, token?: string): Promise<any> => {
  return backendApiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);
};

// Helper function to load app-config.json if not already loaded
const ensureAppConfigLoaded = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  // If already loaded, return immediately
  if ((window as any).__APP_CONFIG__) {
    return;
  }
  
  // Try to load app-config.json
  try {
    const resp = await fetch('/app-config.json', { cache: 'no-store' });
    if (resp.ok) {
      (window as any).__APP_CONFIG__ = await resp.json();
      console.log('✅ Loaded app-config.json:', (window as any).__APP_CONFIG__);
    }
  } catch (error) {
    console.warn('⚠️ Failed to load app-config.json:', error);
  }
};

// Health check function
export const backendHealthCheck = async (): Promise<boolean> => {
  try {
    // Ensure app-config.json is loaded before health check
    await ensureAppConfigLoaded();
    
    // Use the API test endpoint instead of the main health endpoint
    const baseUrl = BACKEND_API_CONFIG.BASE_URL;
    const testUrl = `${baseUrl}/api/test`;
    console.log('🔍 Checking backend health at:', testUrl, {
      baseUrl,
      endpoint: '/api/test',
      isAbsolute: testUrl.startsWith('http://') || testUrl.startsWith('https://')
    });
    
    // Get Supabase anon key for apikey header (required for edge functions)
    // Wait a bit for config to be available
    let supabaseAnonKey = 
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      (typeof window !== 'undefined' && (window as any).__APP_CONFIG__?.supabaseAnonKey) ||
      (typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY);
    
    // If still not found, wait a bit more and try again
    if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
      await new Promise(resolve => setTimeout(resolve, 100));
      supabaseAnonKey = 
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        (typeof window !== 'undefined' && (window as any).__APP_CONFIG__?.supabaseAnonKey) ||
        (typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY);
    }
    
    console.log('🔑 Health check - Anon key available:', !!supabaseAnonKey, supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT FOUND');
    console.log('🔑 Health check - Sources:', {
      env: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      appConfig: !!(typeof window !== 'undefined' && (window as any).__APP_CONFIG__?.supabaseAnonKey),
      appConfigValue: typeof window !== 'undefined' && (window as any).__APP_CONFIG__ ? JSON.stringify((window as any).__APP_CONFIG__) : 'no window',
      window: !!(typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY)
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add apikey header if available (required for Supabase edge functions)
    if (supabaseAnonKey && supabaseAnonKey !== 'your-anon-key') {
      headers['apikey'] = supabaseAnonKey;
      // Also add Authorization header with Bearer token (some Supabase setups require both)
      headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
      console.log('✅ Health check - Adding apikey and Authorization headers');
      console.log('🔑 Header values:', {
        apikey: supabaseAnonKey.substring(0, 20) + '...',
        authorization: `Bearer ${supabaseAnonKey.substring(0, 20)}...`
      });
    } else {
      console.error('❌ Health check - No apikey header will be sent!');
      console.error('This will cause 401 errors. Please ensure app-config.json is deployed correctly.');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increase timeout to 15 seconds
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Backend health response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health check successful:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    return false;
  }
};
