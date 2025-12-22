// Vercel API configuration for TRIPPIN
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  ENDPOINTS: {
    OPENAI_CHAT: '/openai-chat',
    OPENAI_VISION: '/openai-vision', 
    OPENAI_GENERATE: '/openai/generate',
    TRIPADVISOR: '/tripadvisor',
    GOOGLE_MAPS: '/google-maps',
    GOOGLE_PLACES: '/google-places',
    ESIM: '/esim',
    AMADEUS: '/amadeus',
    CURRENCY_CONVERT: '/currency-convert',
    CREATE_CHECKOUT: '/create-checkout-session',
    VERIFY_PAYMENT: '/verify-payment',
    HEALTH: '/health',
    PROFILE: '/profile'
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
  
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
export interface APIError extends Error {
  status?: number;
  code?: string;
  details?: any;
  endpoint?: string;
  retryable?: boolean;
}

// Create custom error
const createAPIError = (message: string, status?: number, code?: string, endpoint?: string): APIError => {
  const error = new Error(message) as APIError;
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
  maxAttempts: number = API_CONFIG.RETRY_ATTEMPTS,
  baseDelay: number = API_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: APIError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as APIError;
      
      // Don't retry if error is not retryable
      if (!lastError.retryable || attempt === maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`API call failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms...`, {
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
import { getMockDataByEndpoint } from '../utils/apiMockData';

export const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // Check network connectivity
  if (!checkNetworkStatus()) {
    throw createAPIError(
      'インターネット接続がありません。接続を確認してください。',
      0,
      'NETWORK_OFFLINE',
      endpoint
    );
  }

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  // Alternate URL for serverless fallback (Vercel function)
  const vercelBase = import.meta.env.VITE_VERCEL_API_BASE_URL
    || (typeof window !== 'undefined' && window.location && window.location.origin
      ? `${window.location.origin}/api`
      : 'http://localhost:3000/api');
  const alternateUrlForEndpoint = (ep: string): string | null => {
    // Map specific endpoints to serverless equivalents
    if (ep === API_CONFIG.ENDPOINTS.OPENAI_GENERATE) return `${vercelBase}/openai-generate`;
    if (ep === API_CONFIG.ENDPOINTS.OPENAI_CHAT) {
      // Try Supabase Edge Function first, then Vercel
      const supabaseBackendUrl = import.meta.env.VITE_BACKEND_URL || 'https://fuskrbebtyccnmaprmbe.supabase.co/functions/v1/trippin-api';
      return `${supabaseBackendUrl}/api/openai/chat`;
    }
    return null;
  };
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  const requestOptions: RequestInit = {
    ...options,
    headers: defaultHeaders,
    timeout: API_CONFIG.TIMEOUT
  };

  console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`, {
    endpoint,
    headers: defaultHeaders,
    body: options.body ? JSON.parse(options.body as string) : undefined
  });

  const makeRequest = async (): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📡 API Response: ${response.status} ${response.statusText}`, {
        endpoint,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Handle different response statuses
      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} - ${response.statusText}`;
        let errorDetails: any = null;

        try {
          const errorData = await response.json();
          errorDetails = errorData;
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          console.warn('Failed to parse error response as JSON:', parseError);
        }

        // Create specific error based on status code
        switch (response.status) {
          case 400:
            throw createAPIError(
              `リクエストが無効です: ${errorMessage}`,
              400,
              'BAD_REQUEST',
              endpoint
            );
          case 401:
            throw createAPIError(
              '認証が必要です。ログインしてください。',
              401,
              'UNAUTHORIZED',
              endpoint
            );
          case 403:
            throw createAPIError(
              'アクセスが拒否されました。権限を確認してください。',
              403,
              'FORBIDDEN',
              endpoint
            );
          case 404:
            throw createAPIError(
              'リクエストされたリソースが見つかりません。',
              404,
              'NOT_FOUND',
              endpoint
            );
          case 408:
            throw createAPIError(
              'リクエストがタイムアウトしました。もう一度お試しください。',
              408,
              'REQUEST_TIMEOUT',
              endpoint
            );
          case 429:
            throw createAPIError(
              'リクエストが多すぎます。しばらく待ってからお試しください。',
              429,
              'RATE_LIMITED',
              endpoint
            );
          case 500:
            // For chat endpoints, try alternate URL before throwing error
            const altUrl = alternateUrlForEndpoint(endpoint);
            if (altUrl && (endpoint.includes('chat') || endpoint.includes('openai'))) {
              try {
                console.warn(`[API] Primary backend returned 500. Trying serverless fallback: ${altUrl}`);
                const altController = new AbortController();
                const altTimeoutId = setTimeout(() => altController.abort(), API_CONFIG.TIMEOUT);
                const altResponse = await fetch(altUrl, {
                  ...requestOptions,
                  signal: altController.signal
                });
                clearTimeout(altTimeoutId);

                if (altResponse.ok) {
                  const altContentType = altResponse.headers.get('content-type');
                  if (altContentType && altContentType.includes('application/json')) {
                    const altData = await altResponse.json();
                    console.log(`✅ API Success via serverless fallback:`, { endpoint, altData });
                    return altData;
                  }
                  const altText = await altResponse.text();
                  console.log(`✅ API Success (text) via serverless fallback:`, { endpoint, altText });
                  return { data: altText };
                }
              } catch (altErr: any) {
                console.warn(`[API] Serverless fallback also failed:`, altErr);
              }
            }
            throw createAPIError(
              'サーバーエラーが発生しました。しばらく待ってからお試しください。',
              500,
              'INTERNAL_SERVER_ERROR',
              endpoint
            );
          case 502:
            throw createAPIError(
              'サーバーが一時的に利用できません。',
              502,
              'BAD_GATEWAY',
              endpoint
            );
          case 503:
            throw createAPIError(
              'サービスが一時的に利用できません。メンテナンス中の可能性があります。',
              503,
              'SERVICE_UNAVAILABLE',
              endpoint
            );
          case 504:
            throw createAPIError(
              'サーバーの応答がタイムアウトしました。',
              504,
              'GATEWAY_TIMEOUT',
              endpoint
            );
          default:
            throw createAPIError(
              errorMessage,
              response.status,
              'UNKNOWN_ERROR',
              endpoint
            );
        }
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ API Success:`, { endpoint, data });
        
        // Validate response structure for common endpoints
        if ((endpoint.includes('/google-maps') || endpoint.includes('/google-places')) && !endpoint.endsWith('/google-maps/details')) {
          if (data.predictions && !Array.isArray(data.predictions)) {
            console.warn(`[API] Invalid predictions format for ${endpoint}:`, data.predictions);
            data.predictions = [];
          }
          if (data.candidates && !Array.isArray(data.candidates)) {
            console.warn(`[API] Invalid candidates format for ${endpoint}:`, data.candidates);
            data.candidates = [];
          }
          if (data.data && !Array.isArray(data.data)) {
            console.warn(`[API] Invalid data format for ${endpoint}:`, data.data);
            data.data = [];
          }
        }
        
        // Validate OpenAI response structure
        if (endpoint.includes('/openai-')) {
          if (data.response && typeof data.response !== 'string') {
            console.warn(`[API] Invalid response format for ${endpoint}:`, data.response);
            data.response = '';
          }
          if (data.translation && typeof data.translation !== 'string') {
            console.warn(`[API] Invalid translation format for ${endpoint}:`, data.translation);
            data.translation = '';
          }
        }
        
        return data;
      } else {
        const text = await response.text();
        console.log(`✅ API Success (text):`, { endpoint, text });
        return { data: text };
      }

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw createAPIError(
          'リクエストがタイムアウトしました。ネットワーク接続を確認してください。',
          408,
          'TIMEOUT',
          endpoint
        );
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Connection error to primary backend; try serverless fallback for supported endpoints
        const altUrl = alternateUrlForEndpoint(endpoint);
        if (altUrl) {
          try {
            console.warn(`[API] Primary backend unreachable. Trying serverless fallback: ${altUrl}`);
            const altController = new AbortController();
            const altTimeoutId = setTimeout(() => altController.abort(), API_CONFIG.TIMEOUT);
            const altResponse = await fetch(altUrl, {
              ...requestOptions,
              signal: altController.signal
            });
            clearTimeout(altTimeoutId);

            if (!altResponse.ok) {
              const errText = await altResponse.text();
              throw createAPIError(
                `サーバーレス関数の呼び出しに失敗しました: ${altResponse.status} ${altResponse.statusText} ${errText}`,
                altResponse.status,
                'SERVERLESS_ERROR',
                endpoint
              );
            }

            const altContentType = altResponse.headers.get('content-type');
            if (altContentType && altContentType.includes('application/json')) {
              const altData = await altResponse.json();
              console.log(`✅ API Success via serverless fallback:`, { endpoint, altData });
              return altData;
            }
            const altText = await altResponse.text();
            console.log(`✅ API Success (text) via serverless fallback:`, { endpoint, altText });
            return { data: altText };
          } catch (altErr: any) {
            // If fallback also fails, throw as network error
            throw createAPIError(
              altErr?.message || 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
              altErr?.status || 0,
              altErr?.code || 'NETWORK_ERROR',
              endpoint
            );
          }
        }

        throw createAPIError(
          'ネットワークエラーが発生しました。インターネット接続を確認してください。',
          0,
          'NETWORK_ERROR',
          endpoint
        );
      }

      // Re-throw API errors as-is
      if ((error as APIError).status !== undefined) {
        // Try to provide mock data for certain endpoints
        const mockData = getMockDataByEndpoint(endpoint);
        if (mockData.success) {
          console.warn(`[API] Using mock data for ${endpoint}:`, mockData.message);
          return mockData;
        }
        throw error;
      }

      // Handle unknown errors
      // Try to provide mock data as last resort
      const mockData = getMockDataByEndpoint(endpoint);
      if (mockData.success) {
        console.warn(`[API] Using mock data for ${endpoint}:`, mockData.message);
        return mockData;
      }
      
      throw createAPIError(
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
    const apiError = error as APIError;
    
    // Try to provide mock data before throwing error
    const mockData = getMockDataByEndpoint(endpoint);
    if (mockData.success) {
      console.warn(`[API] Using mock data for ${endpoint}:`, mockData.message);
      return mockData;
    }
    
    // Log error for debugging
    console.error(`❌ API Error (${endpoint}):`, {
      message: apiError.message,
      status: apiError.status,
      code: apiError.code,
      endpoint: apiError.endpoint,
      retryable: apiError.retryable
    });

    // Add user-friendly fallback messages for Vercel environment
    if (apiError.code === 'NETWORK_OFFLINE') {
      apiError.message = 'オフラインです。インターネット接続を確認してください。';
    } else if (apiError.code === 'NETWORK_ERROR') {
      apiError.message = 'ネットワークエラーが発生しました。Vercel Functions の接続を確認してもう一度お試しください。';
    } else if (apiError.status === 504) {
      apiError.message = 'Vercel Functions の処理がタイムアウトしました。しばらく待ってからお試しください。';
    }

    throw apiError;
  }
};

// Specialized API calls for different services
export const openAICall = async (endpoint: string, data: any): Promise<any> => {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const googleMapsCall = async (params: Record<string, string>): Promise<any> => {
  return apiCall(buildApiUrl(API_CONFIG.ENDPOINTS.GOOGLE_MAPS, params));
};

export const tripAdvisorCall = async (params: Record<string, string>): Promise<any> => {
  return apiCall(buildApiUrl(API_CONFIG.ENDPOINTS.TRIPADVISOR, params));
};

export const esimCall = async (data?: any): Promise<any> => {
  if (data) {
    return apiCall(API_CONFIG.ENDPOINTS.ESIM, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  return apiCall(API_CONFIG.ENDPOINTS.ESIM);
};

export const stripeCall = async (endpoint: string, data: any): Promise<any> => {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Health check function
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
      method: 'GET',
      timeout: 5000
    } as any);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Service status checker
export const checkServiceStatus = async (): Promise<{
  api: boolean;
  openai: boolean;
  maps: boolean;
  stripe: boolean;
}> => {
  const status = {
    api: false,
    openai: false,
    maps: false,
    stripe: false
  };

  try {
    status.api = await healthCheck();
  } catch (error) {
    console.error('API health check failed:', error);
  }

  return status;
};
