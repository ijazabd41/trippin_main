// TRIPPIN - Comprehensive Error Handling System
import { APIError } from '../config/api';

export interface ErrorLog {
  id: string;
  timestamp: Date;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  message: string;
  context: ErrorContext;
  stack?: string;
  apiError?: APIError;
}

export interface ErrorContext {
  page: string;
  userId?: string;
  action: string;
  userAgent: string;
  url: string;
}

export interface ValidationError {
  field: string;
  message: string;
  action: string;
}

// Vercel API Error Handling
export const handleVercelError = (error: APIError) => {
  switch (error.code) {
    case 'NETWORK_OFFLINE':
      return {
        message: 'インターネット接続がありません。Wi-Fiまたはモバイルデータを確認してください。',
        action: 'check_connection',
        severity: 'HIGH'
      };
    case 'NETWORK_ERROR':
      return {
        message: 'ネットワークエラーが発生しました。接続を確認してください。',
        action: 'retry_connection',
        severity: 'MEDIUM'
      };
    case 'TIMEOUT':
      return {
        message: 'リクエストがタイムアウトしました。もう一度お試しください。',
        action: 'retry_request',
        severity: 'MEDIUM'
      };
    case 'RATE_LIMITED':
      return {
        message: 'アクセスが集中しています。しばらく待ってからお試しください。',
        action: 'wait_and_retry',
        severity: 'LOW',
        waitTime: '30秒'
      };
    case 'UNAUTHORIZED':
      return {
        message: '認証が必要です。ログインしてください。',
        action: 'redirect_login',
        severity: 'HIGH'
      };
    case 'FORBIDDEN':
      return {
        message: 'アクセス権限がありません。プレミアムプランにアップグレードが必要な可能性があります。',
        action: 'check_permissions',
        severity: 'HIGH'
      };
    case 'NOT_FOUND':
      return {
        message: 'リクエストされたサービスが見つかりません。',
        action: 'check_endpoint',
        severity: 'MEDIUM'
      };
    case 'INTERNAL_SERVER_ERROR':
    case 'BAD_GATEWAY':
    case 'SERVICE_UNAVAILABLE':
    case 'GATEWAY_TIMEOUT':
      return {
        message: 'サーバーで問題が発生しています。しばらく待ってからお試しください。',
        action: 'retry_later',
        severity: 'HIGH',
        waitTime: '5分'
      };
    default:
      return {
        message: '予期しないエラーが発生しました。サポートにお問い合わせください。',
        action: 'contact_support',
        severity: 'HIGH'
      };
  }
};

// Auth0 Error Handling
export interface AuthError {
  code: string;
  description: string;
  statusCode: number;
}

export const handleAuthError = (error: AuthError) => {
  switch (error.code) {
    case 'access_denied':
      return {
        message: 'ログインがキャンセルされました。もう一度お試しください。',
        action: 'retry_login'
      };
    case 'invalid_request':
      return {
        message: '認証に失敗しました。ページを更新してください。',
        action: 'refresh_page'
      };
    case 'temporarily_unavailable':
      return {
        message: '認証サーバーが一時的に利用できません。しばらくしてからお試しください。',
        action: 'retry_later'
      };
    case 'network_error':
      return {
        message: 'ネットワークエラーが発生しました。接続を確認してください。',
        action: 'check_connection'
      };
    default:
      return {
        message: '認証エラーが発生しました。サポートにお問い合わせください。',
        action: 'contact_support'
      };
  }
};

// Stripe Payment Error Handling
export const handleStripeError = (error: any) => {
  switch (error.code) {
    case 'card_declined':
      return {
        message: 'カードが拒否されました。別のカードをお試しください。',
        action: 'retry_payment'
      };
    case 'insufficient_funds':
      return {
        message: '残高不足です。カードの利用可能額を確認してください。',
        action: 'change_card'
      };
    case 'expired_card':
      return {
        message: 'カードの有効期限が切れています。',
        action: 'update_card'
      };
    case 'processing_error':
      return {
        message: '決済処理中にエラーが発生しました。しばらくしてからお試しください。',
        action: 'retry_later'
      };
    case 'rate_limit':
      return {
        message: '一時的にアクセスが集中しています。しばらくお待ちください。',
        action: 'wait_retry'
      };
    default:
      return {
        message: '決済エラーが発生しました。サポートにお問い合わせください。',
        action: 'contact_support'
      };
  }
};

// ESIMGO API Error Handling
export const handleESIMError = (error: any) => {
  switch (error.code) {
    case 'insufficient_inventory':
      return {
        message: '選択されたプランは現在在庫切れです。他のプランをお試しください。',
        action: 'show_alternatives'
      };
    case 'unsupported_device':
      return {
        message: 'お使いのデバイスはeSIMに対応していません。',
        action: 'show_device_compatibility'
      };
    case 'activation_failed':
      return {
        message: 'eSIMの有効化に失敗しました。設定手順を確認してください。',
        action: 'show_setup_guide'
      };
    case 'network_not_available':
      return {
        message: '選択された地域でネットワークが利用できません。',
        action: 'show_coverage_map'
      };
    default:
      return {
        message: 'eSIMサービスでエラーが発生しました。',
        action: 'contact_support'
      };
  }
};

// Amadeus API Error Handling
export const handleAmadeusError = (error: any) => {
  switch (error.code) {
    case 'SOLD_OUT':
      return {
        message: '選択されたフライト/ホテルは満席/満室です。',
        action: 'show_alternatives'
      };
    case 'PRICE_CHANGED':
      return {
        message: '料金が変更されました。最新の料金を確認してください。',
        action: 'refresh_prices'
      };
    case 'BOOKING_TIMEOUT':
      return {
        message: '予約がタイムアウトしました。もう一度お試しください。',
        action: 'restart_booking'
      };
    case 'INVALID_PASSENGER_INFO':
      return {
        message: '乗客情報に不備があります。入力内容を確認してください。',
        action: 'validate_passenger_info'
      };
    default:
      return {
        message: '予約サービスでエラーが発生しました。',
        action: 'contact_support'
      };
  }
};

// OpenAI API Error Handling
export const handleOpenAIError = (error: any) => {
  // Handle AWS Lambda timeout
  if (error.code === 'TIMEOUT' || error.status === 504) {
    return {
      message: 'AI処理に時間がかかっています。しばらく待ってからお試しください。',
      action: 'retry_with_delay',
      estimatedWait: '1-2分'
    };
  }
  
  // Handle AWS Lambda cold start
  if (error.status === 502) {
    return {
      message: 'AI機能を初期化中です。もう一度お試しください。',
      action: 'retry_immediately'
    };
  }

  switch (error.code) {
    case 'rate_limit_exceeded':
      return {
        message: 'AI処理が混雑しています。しばらくお待ちください。',
        action: 'queue_request',
        estimatedWait: '2-3分'
      };
    case 'insufficient_quota':
      return {
        message: 'AI機能が一時的に利用できません。',
        action: 'use_fallback_plan'
      };
    case 'invalid_request':
      return {
        message: 'プラン生成に必要な情報が不足しています。',
        action: 'complete_form'
      };
    case 'model_overloaded':
      return {
        message: 'AI機能が高負荷のため、簡易プランを提供します。',
        action: 'provide_basic_plan'
      };
    default:
      return {
        message: 'AI機能でエラーが発生しました。手動でプランを作成しますか？',
        action: 'offer_manual_planning'
      };
  }
};

// Vercel Functions specific error handling
export const handleVercelFunctionError = (error: APIError) => {
  if (error.status === 502) {
    return {
      message: 'サービスを初期化中です。もう一度お試しください。',
      action: 'retry_cold_start'
    };
  }
  
  if (error.status === 504) {
    return {
      message: '処理に時間がかかっています。しばらく待ってからお試しください。',
      action: 'retry_with_longer_wait'
    };
  }
  
  return handleVercelError(error);
};

// Network Error Handling
export const handleNetworkError = (error: any) => {
  if (!navigator.onLine) {
    return {
      message: 'インターネット接続が切断されています。',
      action: 'offline_mode',
      offlineFeatures: ['保存済みプラン確認', 'オフライン地図', '緊急連絡先']
    };
  }
  
  switch (error.status) {
    case 408:
    case 504:
      return {
        message: 'サーバーへの接続がタイムアウトしました。',
        action: 'retry_with_backoff'
      };
    case 429:
      return {
        message: 'アクセスが集中しています。しばらくお待ちください。',
        action: 'exponential_backoff'
      };
    case 502:
    case 503:
      return {
        message: 'サービスが一時的に利用できません。',
        action: 'show_status_page'
      };
    default:
      return {
        message: 'ネットワークエラーが発生しました。',
        action: 'retry_connection'
      };
  }
};

// Retry with Exponential Backoff
export const retryWithExponentialBackoff = async (
  apiCall: () => Promise<any>,
  maxRetries: number = 3
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1秒, 2秒, 4秒...
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Data Validation
export const validateTripData = (tripData: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Date validation
  if (!tripData.startDate || !tripData.endDate) {
    errors.push({
      field: 'dates',
      message: '出発日と帰着日を選択してください。',
      action: 'highlight_date_picker'
    });
  }
  
  if (new Date(tripData.startDate) < new Date()) {
    errors.push({
      field: 'startDate',
      message: '出発日は今日以降を選択してください。',
      action: 'reset_date_picker'
    });
  }
  
  // Budget validation
  if (tripData.budget && tripData.budget < 1000) {
    errors.push({
      field: 'budget',
      message: '予算は1,000円以上で設定してください。',
      action: 'suggest_minimum_budget'
    });
  }
  
  // Region validation
  if (!tripData.regions || tripData.regions.length === 0) {
    errors.push({
      field: 'regions',
      message: '少なくとも1つの地域を選択してください。',
      action: 'highlight_region_selector'
    });
  }
  
  return errors;
};

// Google Maps API Error Handling
export const handleGoogleMapsError = (error: any) => {
  switch (error.code) {
    case 'ZERO_RESULTS':
      return {
        message: '指定された場所が見つかりません。',
        action: 'suggest_similar_locations'
      };
    case 'OVER_QUERY_LIMIT':
      return {
        message: '地図サービスが一時的に利用できません。',
        action: 'use_static_map'
      };
    case 'REQUEST_DENIED':
      return {
        message: '地図の読み込みに失敗しました。',
        action: 'fallback_to_text_directions'
      };
    default:
      return {
        message: '地図機能でエラーが発生しました。',
        action: 'provide_text_alternative'
      };
  }
};

// TripAdvisor API Error Handling
export const handleTripAdvisorError = (error: any) => {
  switch (error.code) {
    case 'NO_REVIEWS_FOUND':
      return {
        message: 'レビューが見つかりません。',
        action: 'show_basic_info'
      };
    case 'LOCATION_NOT_FOUND':
      return {
        message: '観光地情報が見つかりません。',
        action: 'use_generic_recommendations'
      };
    default:
      return {
        message: 'レビュー情報の取得に失敗しました。',
        action: 'skip_reviews'
      };
  }
};

// Integrated Error Management System
export class ErrorHandler {
  private errorQueue: ErrorLog[] = [];
  private maxQueueSize = 50;
  
  handleError(error: APIError | any, context: ErrorContext) {
    const errorLog = this.createErrorLog(error, context);
    
    // Add to queue with size limit
    this.errorQueue.push(errorLog);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
    
    // Handle based on severity
    switch (errorLog.severity) {
      case 'CRITICAL':
        this.handleCriticalError(errorLog);
        break;
      case 'HIGH':
        this.handleHighPriorityError(errorLog);
        break;
      case 'MEDIUM':
        this.handleMediumPriorityError(errorLog);
        break;
      case 'LOW':
        this.logError(errorLog);
        break;
    }
  }
  
  private createErrorLog(error: APIError | any, context: ErrorContext): ErrorLog {
    return {
      id: this.generateErrorId(),
      timestamp: new Date(),
      severity: this.determineSeverity(error),
      type: error.code || error.type || 'UNKNOWN',
      message: error.message || 'Unknown error occurred',
      context,
      stack: error.stack,
      apiError: error.status !== undefined ? error as APIError : undefined
    };
  }
  
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private determineSeverity(error: APIError | any): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // AWS/API specific severity
    if (error.status) {
      if ([401, 403, 500, 502, 503].includes(error.status)) {
        return 'HIGH';
      }
      if ([404, 408, 429, 504].includes(error.status)) {
        return 'MEDIUM';
      }
      if ([400].includes(error.status)) {
        return 'LOW';
      }
    }
    
    // Legacy error type handling
    if (error.type === 'PAYMENT_FAILED' || error.type === 'SECURITY_BREACH') {
      return 'CRITICAL';
    }
    if (error.type === 'API_FAILURE' || error.type === 'AUTH_FAILED') {
      return 'HIGH';
    }
    if (error.type === 'VALIDATION_ERROR' || error.type === 'NETWORK_ERROR') {
      return 'MEDIUM';
    }
    return 'LOW';
  }
  
  private handleCriticalError(error: ErrorLog) {
    // Critical errors: payment failures, security issues, auth failures
    this.showErrorModal(error);
    this.sendErrorReport(error);
    this.fallbackToSafeMode();
  }
  
  private handleHighPriorityError(error: ErrorLog) {
    // High priority: server errors, auth issues, service unavailable
    this.showErrorNotification(error);
    this.sendErrorReport(error);
    this.enableFallbackFeatures();
  }
  
  private handleMediumPriorityError(error: ErrorLog) {
    // Medium priority: timeouts, rate limits, not found
    this.showErrorToast(error);
    this.logError(error);
  }
  
  private showErrorModal(error: ErrorLog) {
    // Show modal for critical errors
    console.error('🚨 Critical Error:', JSON.stringify(error, null, 2));
    // In a real app, this would show a modal component
  }
  
  private showErrorNotification(error: ErrorLog) {
    // Show notification for high priority errors
    console.warn('⚠️ High Priority Error:', JSON.stringify(error, null, 2));
    // In a real app, this would show a notification component
  }
  
  private showErrorToast(error: ErrorLog) {
    // Show toast for medium priority errors
    console.info('ℹ️ Medium Priority Error:', JSON.stringify(error, null, 2));
    // In a real app, this would show a toast component
  }
  
  private logError(error: ErrorLog) {
    // Log error for monitoring and debugging
    console.log('📝 Error logged:', JSON.stringify(error, null, 2));
  }
  
  private sendErrorReport(error: ErrorLog) {
    // Send to external monitoring service (CloudWatch, Sentry, etc.)
    try {
      // In production, send to monitoring service
      console.log('📊 Sending error report:', JSON.stringify(error, null, 2));
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  }
  
  private fallbackToSafeMode() {
    // Enable safe mode with limited functionality
    console.log('🛡️ Entering safe mode');
    localStorage.setItem('trippin-safe-mode', 'true');
  }
  
  private enableFallbackFeatures() {
    // Enable fallback features when main services fail
    console.log('🔄 Enabling fallback features');
    localStorage.setItem('trippin-fallback-mode', 'true');
  }
  
  // Get error statistics
  getErrorStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentErrors = this.errorQueue.filter(
      error => now - error.timestamp.getTime() < oneHour
    );
    
    return {
      total: this.errorQueue.length,
      recent: recentErrors.length,
      critical: recentErrors.filter(e => e.severity === 'CRITICAL').length,
      high: recentErrors.filter(e => e.severity === 'HIGH').length,
      medium: recentErrors.filter(e => e.severity === 'MEDIUM').length,
      low: recentErrors.filter(e => e.severity === 'LOW').length
    };
  }
  
  // Clear old errors
  clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = Date.now() - maxAge;
    this.errorQueue = this.errorQueue.filter(
      error => error.timestamp.getTime() > cutoff
    );
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler();

// Auto-cleanup old errors every hour
setInterval(() => {
  globalErrorHandler.clearOldErrors();
}, 60 * 60 * 1000);

// Auto Recovery Functions
export const autoRecovery = {
  async handleServiceFailure(service: string) {
    switch (service) {
      case 'openai':
        return this.loadTemplatePlan();
      case 'amadeus':
        return this.getExternalBookingLinks();
      case 'googlemaps':
        return this.getStaticMapImage();
      case 'tripadvisor':
        return this.getBasicAttractionInfo();
      default:
        return this.getBasicFallback();
    }
  },
  
  loadTemplatePlan() {
    // Return template plan when AI is unavailable
    return {
      type: 'template',
      message: 'AIが利用できないため、テンプレートプランを提供します。',
      data: {
        destination: '東京',
        duration: '3日間',
        itinerary: [
          {
            day: 1,
            title: '東京到着・浅草探索',
            activities: [
              { time: '10:00', name: '浅草寺参拝', location: '浅草', type: 'culture' },
              { time: '14:00', name: '仲見世通り散策', location: '浅草', type: 'shopping' }
            ]
          }
        ]
      }
    };
  },
  
  getExternalBookingLinks() {
    // Return external booking links when Amadeus is unavailable
    return {
      type: 'external_links',
      message: '予約サービスが利用できないため、外部サイトをご利用ください。',
      links: [
        { name: 'Booking.com', url: 'https://booking.com' },
        { name: 'Expedia', url: 'https://expedia.co.jp' },
        { name: 'じゃらん', url: 'https://jalan.net' }
      ]
    };
  },
  
  getStaticMapImage() {
    // Return static map when Google Maps is unavailable
    return {
      type: 'static_map',
      message: '地図が利用できないため、静的画像を表示します。',
      mapUrl: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg'
    };
  },
  
  getBasicAttractionInfo() {
    return {
      type: 'basic_attraction',
      message: '観光地情報が利用できないため、基本情報を表示します。',
      data: [
        {
          name: '浅草寺',
          description: '東京最古の寺院',
          rating: '4.5',
          photo: { images: { original: { url: 'https://images.pexels.com/photos/161251/senso-ji-temple-asakusa-tokyo-japan-161251.jpeg' } } }
        }
      ]
    };
  },
  
  getBasicFallback() {
    return {
      type: 'basic',
      message: 'サービスが一時的に利用できません。基本機能をご利用ください。',
      availableFeatures: ['保存済みプラン確認', 'オフライン地図', '緊急連絡先']
    };
  }
};

// Data Recovery Functions
export const dataRecovery = {
  async recoverUserProgress() {
    // Try localStorage first
    const savedData = localStorage.getItem('trippin_progress');
    if (savedData) {
      return JSON.parse(savedData);
    }
    
    // Try sessionStorage
    const sessionData = sessionStorage.getItem('trippin_session');
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    
    // Try server recovery if authenticated
    const user = JSON.parse(localStorage.getItem('trippin-user') || '{}');
    if (user.id) {
      try {
        // Implement server-side recovery
        return await this.fetchUserProgress(user.id);
      } catch (error) {
        console.error('Server recovery failed:', error);
      }
    }
    
    return null;
  },
  
  async fetchUserProgress(userId: string) {
    // Implement server-side progress recovery
    // This would call your backend API
    return null;
  }
};

// Error Monitoring
export const errorMonitoring = {
  trackError(error: any, context: any) {
    // Track error frequency
    this.incrementErrorCount(error.type);
    
    // Check thresholds
    if (this.isErrorThresholdExceeded(error.type)) {
      this.triggerAlert(error.type);
    }
    
    // Send to monitoring service
    this.sendToMonitoring(error, context);
  },
  
  incrementErrorCount(errorType: string) {
    const counts = JSON.parse(localStorage.getItem('error_counts') || '{}');
    counts[errorType] = (counts[errorType] || 0) + 1;
    localStorage.setItem('error_counts', JSON.stringify(counts));
  },
  
  isErrorThresholdExceeded(errorType: string): boolean {
    const counts = JSON.parse(localStorage.getItem('error_counts') || '{}');
    const threshold = this.getThreshold(errorType);
    return (counts[errorType] || 0) > threshold;
  },
  
  getThreshold(errorType: string): number {
    const thresholds: { [key: string]: number } = {
      'NETWORK_ERROR': 5,
      'API_FAILURE': 3,
      'VALIDATION_ERROR': 10
    };
    return thresholds[errorType] || 5;
  },
  
  triggerAlert(errorType: string) {
    console.warn(`Error threshold exceeded for ${errorType}`);
    // Implement alerting mechanism
  },
  
  sendToMonitoring(error: any, context: any) {
    // Send to external monitoring service
    // Implementation depends on your monitoring setup
    console.log('Sending to monitoring:', JSON.stringify({ error, context }, null, 2));
  }
};

// Multi-language Error Messages
export const errorMessages = {
  ja: {
    'network_error': 'ネットワークエラーが発生しました。',
    'payment_failed': '決済に失敗しました。',
    'ai_unavailable': 'AI機能が一時的に利用できません。',
    'validation_error': '入力内容に問題があります。',
    'auth_failed': '認証に失敗しました。'
  },
  en: {
    'network_error': 'A network error occurred.',
    'payment_failed': 'Payment failed.',
    'ai_unavailable': 'AI features are temporarily unavailable.',
    'validation_error': 'There is an issue with the input.',
    'auth_failed': 'Authentication failed.'
  },
  zh: {
    'network_error': '发生网络错误。',
    'payment_failed': '支付失败。',
    'ai_unavailable': 'AI功能暂时不可用。',
    'validation_error': '输入内容有问题。',
    'auth_failed': '认证失败。'
  }
};

export const getLocalizedErrorMessage = (errorKey: string, language: string): string => {
  return errorMessages[language as keyof typeof errorMessages]?.[errorKey] || 
         errorMessages.en[errorKey] || 
         'An error occurred.';
};
