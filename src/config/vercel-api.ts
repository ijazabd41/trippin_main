// Vercel用のAPI設定
export const vercelConfig = {
  // Vercel Functions用のエンドポイント
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-app.vercel.app/api'
    : 'http://localhost:3000/api',
  
  // 環境変数から取得
  auth0: {
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    callbackUrl: import.meta.env.VITE_AUTH0_CALLBACK_URL,
  },
  
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  },
  
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Trippin',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  }
};

// API呼び出し用のヘルパー関数
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${vercelConfig.apiBaseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// 認証付きAPI呼び出し
export const authenticatedApiCall = async (
  endpoint: string, 
  token: string, 
  options: RequestInit = {}
) => {
  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};
