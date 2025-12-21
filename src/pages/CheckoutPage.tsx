import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Check, ArrowLeft, Loader, Zap, Globe, Headphones, Crown, X, AlertCircle } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { backendService } from '../services/BackendService';
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';
import { formatCurrency } from '../utils/currencyFormatter';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, session, isAuthenticated, userProfile } = useSupabaseAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const lastLoadedRef = useRef<string | null>(null);

  const plans = [
    {
      id: 'premium',
      name: t('checkout.planName'),
      price: 2500,
      currency: 'JPY',
      period: t('checkout.monthly'),
      features: [
        t('checkout.features.completeItinerary'),
        t('checkout.features.customization'),
        t('checkout.features.aiSupport'),
        t('checkout.features.esimDiscount'),
        t('checkout.features.prioritySupport')
      ],
      icon: Crown,
      popular: true
    }
  ];

  // Load subscription status for premium users
  useEffect(() => {
    // Create a unique key for this combination of dependencies
    const loadKey = `${userProfile?.is_premium}-${session?.access_token?.substring(0, 20)}`;
    
    // Only load if we haven't loaded for this exact combination
    if (!userProfile?.is_premium || !session?.access_token || lastLoadedRef.current === loadKey) {
      return;
    }
    
    let isMounted = true;
    lastLoadedRef.current = loadKey;
    
    const loadSubscriptionStatus = async () => {
      console.log('🔄 Loading subscription status for premium user...');
      try {
        const result = await backendApiCall(BACKEND_API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.STATUS, {
          method: 'GET'
        }, session.access_token);
        
        if (!isMounted) return;
        
        console.log('📊 Subscription status result:', result);
        if (result.success && result.data) {
          setSubscriptionStatus(result.data);
          console.log('✅ Subscription status loaded:', result.data);
        }
      } catch (error) {
        if (!isMounted) return;
        console.warn('⚠️ Failed to load subscription status:', error);
        // Set a fallback status for premium users
        setSubscriptionStatus({
          isActive: true,
          planName: t('checkout.planName'),
          amount: 2500,
          status: 'active'
        });
      }
    };

    loadSubscriptionStatus();
    
    return () => {
      isMounted = false;
    };
  }, [userProfile?.is_premium, session?.access_token, t]);

  const cancelSubscription = async () => {
    if (!session?.access_token) {
      setError(t('checkout.authTokenMissing'));
      return;
    }

    if (!confirm(t('checkout.cancelConfirm'))) {
      return;
    }

    try {
      setIsCancelling(true);
      setError(null);

      console.log('🔄 Cancelling subscription with token:', {
        hasToken: !!session.access_token,
        tokenLength: session.access_token?.length || 0,
        tokenPreview: session.access_token?.substring(0, 20) + '...' || 'none'
      });

      const result = await backendApiCall(BACKEND_API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.CANCEL, {
        method: 'POST'
      }, session.access_token);

      if (result.success) {
        console.log('✅ Subscription cancelled successfully:', result);
        // Show success message
        setError(null);
        // Refresh user profile instead of full page reload
        if (window.location.reload) {
          // Small delay to ensure backend updates are processed
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // Fallback: navigate to dashboard
          navigate('/dashboard');
        }
      } else {
        throw new Error(result.error || result.message || t('checkout.cancelFailed'));
      }
    } catch (error: any) {
      console.error('❌ Failed to cancel subscription:', error);
      setError(error.message || t('checkout.cancelFailed'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePayment = async () => {
    console.log('🚀 Payment button clicked!');
    console.log('🔍 Authentication status:', { isAuthenticated, hasSession: !!session, hasToken: !!session?.access_token });
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      navigate('/supabase-auth/login');
      return;
    }

    // Check if user has access token
    if (!session?.access_token) {
      console.error('❌ No access token found for user');
      setError(t('checkout.authTokenMissing'));
      return;
    }

    console.log('✅ Authentication checks passed, proceeding with payment');
    setIsProcessing(true);
    setError(null);

    try {
      // Check backend service status first
      const serviceStatus = backendService.getServiceStatus();
      console.log('🔍 Backend service status:', serviceStatus);

      // Create checkout session using backend service
      const checkoutData = {
        planId: selectedPlan,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/checkout`
      };
      
      console.log('🔄 Creating checkout session with data:', {
        ...checkoutData,
        hasToken: !!session?.access_token,
        tokenPreview: session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'no token'
      });

      const result = await backendService.createCheckoutSession(checkoutData, session?.access_token);

      console.log('📊 Checkout session result:', result);

      if (result.success && result.data?.sessionUrl) {
        console.log('✅ Checkout session created successfully, redirecting to Stripe...');
        console.log('🔗 Session URL:', result.data.sessionUrl);
        
        // Check if it's a mock session URL
        if (result.data.sessionUrl.includes('mock-session')) {
          console.warn('⚠️ Mock session URL detected! Backend is using mock data.');
          // For development/testing, allow mock sessions but show a warning
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 Development mode - allowing mock session for testing');
            // Continue with mock session in development
          } else {
            throw new Error(t('errors.checkout.backendMockInUse'));
          }
        }
        
        console.log('🚀 Redirecting to Stripe checkout page...');
        window.location.href = result.data.sessionUrl;
      } else {
        console.error('❌ Checkout session creation failed:', result);
        throw new Error(result.message || t('errors.checkout.sessionCreationFailed'));
      }
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      
      // Provide more specific error messages
      let errorMessage = t('errors.checkout.generic');
      
      if (error.message?.includes('バックエンドサービス')) {
        errorMessage = t('errors.checkout.backendConnection');
      } else if (error.message?.includes('モックデータ')) {
        errorMessage = t('errors.checkout.mockDataInstructions');
      } else if (error.message?.includes('認証')) {
        errorMessage = t('errors.checkout.auth');
      } else if (error.message?.includes('ネットワーク')) {
        errorMessage = t('errors.checkout.network');
      } else if (error.message?.includes('タイムアウト')) {
        errorMessage = t('errors.checkout.timeout');
      } else if (error.message?.includes('多すぎます') || error.message?.includes('RATE_LIMITED')) {
        errorMessage = t('errors.checkout.rateLimited');
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan) || plans[0];

  // Check if user is already premium
  if (userProfile?.is_premium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Crown className="w-12 h-12 text-purple-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {t('checkout.alreadyPremium')}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8" dangerouslySetInnerHTML={{ __html: t('checkout.alreadyPremiumDescription') }}>
            </p>

            {/* Premium Features List */}
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-6">{t('checkout.premiumFeatures')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('checkout.features.completeItinerary')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('checkout.features.customization')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('checkout.features.aiSupport')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('checkout.features.esimDiscount')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('checkout.features.prioritySupport')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('checkout.unlimitedItinerary')}</span>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            {subscriptionStatus && (
              <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 max-w-2xl mx-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t('checkout.subscriptionDetails')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('checkout.plan')}</span>
                    <span className="font-medium">{subscriptionStatus.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('checkout.status')}</span>
                    <span className={`font-medium ${subscriptionStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {subscriptionStatus.isActive ? t('checkout.active') : t('checkout.inactive')}
                    </span>
                  </div>
                  {subscriptionStatus.nextBillingDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('checkout.nextBillingDate')}</span>
                      <span className="font-medium">
                        {new Date(subscriptionStatus.nextBillingDate).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('checkout.price')}</span>
                    <span className="font-medium">{formatCurrency(subscriptionStatus.amount || 0, 'JPY')}/月</span>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Info for Premium Users */}
            {process.env.NODE_ENV === 'development' && userProfile?.is_premium && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 max-w-2xl mx-auto">
                <h4 className="font-medium text-yellow-800 mb-2">Debug Info (Development Only)</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>User Premium: {userProfile?.is_premium ? '✅ Yes' : '❌ No'}</div>
                  <div>Subscription Status: {subscriptionStatus ? '✅ Loaded' : '❌ Not loaded'}</div>
                  <div>Session Token: {session?.access_token ? '✅ Present' : '❌ Missing'}</div>
                  <div>Cancel Button Should Show: {userProfile?.is_premium ? '✅ Yes' : '❌ No'}</div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{t('checkout.backToDashboard')}</span>
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              
              {userProfile?.is_premium && (
                <motion.button
                  onClick={cancelSubscription}
                  disabled={isCancelling}
                  className="flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-8 py-3 rounded-xl hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isCancelling ? 1 : 1.02 }}
                  whileTap={{ scale: isCancelling ? 1 : 0.98 }}
                >
                  {isCancelling ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>{t('checkout.cancelling')}</span>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5" />
                      <span>{t('checkout.cancelSubscription')}</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-2xl mx-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-red-700 font-medium">{t('checkout.errorOccurred')}</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('checkout.title') || 'プレミアムプランにアップグレード'}
          </h1>
          <p className="text-lg text-gray-600">
            {t('checkout.subtitle') || 'AI搭載の旅行プランニングで、完璧な旅を実現しましょう'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-full max-w-md">
              {plans.map((plan) => {
                const IconComponent = plan.icon;
                return (
                  <motion.div
                    key={plan.id}
                    className={`relative bg-white rounded-3xl shadow-lg p-8 cursor-pointer transition-all ${
                      selectedPlan === plan.id 
                        ? 'ring-2 ring-purple-500 shadow-xl' 
                        : 'hover:shadow-xl'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium">
{t('checkout.popular')}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        {formatCurrency(plan.price, plan.currency || 'JPY')}
                      </div>
                      <div className="text-gray-600">{plan.period}</div>
                    </div>

                    <div className="space-y-4">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {t('checkout.paymentInfo') || 'お支払い情報'}
            </h3>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 mb-3">{error}</p>
                {error.includes('多すぎます') && (
                  <button
                    onClick={() => {
                      setError(null);
                      setTimeout(() => handlePayment(), 2000);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
{t('checkout.retryLater')}
                  </button>
                )}
              </div>
            )}

            {/* Selected Plan Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-800 mb-2">{t('checkout.selectedPlan')}</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{selectedPlanData.name}</span>
                <span className="font-bold text-purple-600">
                  {formatCurrency(selectedPlanData.price, selectedPlanData.currency || 'JPY')}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Security Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-800">
                      {t('checkout.securePayment') || '安全なお支払い'}
                    </h4>
                    <p className="text-sm text-blue-600">
                      {t('checkout.stripeSecure') || 'Stripeによる安全な決済処理'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Premium Features Highlight */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
{t('checkout.premiumFeaturesHighlight')}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-purple-700">
                    <Globe className="w-4 h-4 mr-2" />
{t('checkout.aiItineraryGeneration')}
                  </div>
                  <div className="flex items-center text-purple-700">
                    <Headphones className="w-4 h-4 mr-2" />
{t('checkout.features.aiSupport')}
                  </div>
                  <div className="flex items-center text-purple-700">
                    <Crown className="w-4 h-4 mr-2" />
{t('checkout.features.prioritySupport')}
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>{t('checkout.processing') || '処理中...'}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>{t('checkout.proceedToPayment') || 'お支払いに進む'}</span>
                  </>
                )}
              </button>

              {/* Back Button */}
              <div className="text-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('checkout.payLater') || '後で支払う'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Debug Panel */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            className="mt-8 bg-gray-100 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-800">Debug Information</h4>
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showDebugInfo ? 'Hide' : 'Show'} Debug Info
              </button>
            </div>
            
            {showDebugInfo && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Backend Status:</strong> {backendService.getServiceStatus().isBackendAvailable ? '✅ Connected' : '❌ Disconnected'}
                </div>
                <div>
                  <strong>Using Mock Data:</strong> {backendService.getServiceStatus().useMockData ? '⚠️ Yes' : '✅ No'}
                </div>
                <div>
                  <strong>Backend URL:</strong> {backendService.getServiceStatus().backendUrl}
                </div>
                <div>
                  <strong>User Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
                </div>
                <div>
                  <strong>Access Token:</strong> {session?.access_token ? '✅ Present' : '❌ Missing'}
                </div>
                <div>
                  <strong>User ID:</strong> {user?.id || 'Not available'}
                </div>
                <div>
                  <strong>Selected Plan:</strong> {selectedPlan}
                </div>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={async () => {
                      console.log('🔄 Forcing backend health check...');
                      const isHealthy = await backendService.forceHealthCheck();
                      console.log('Health check result:', isHealthy);
                      alert(`Backend health check: ${isHealthy ? 'Success' : 'Failed'}`);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    Test Backend Connection
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔄 Forcing use of real backend...');
                      backendService.forceUseBackend();
                      alert('Forced to use real backend. Try payment again.');
                    }}
                    className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                  >
                    Force Real Backend
                  </button>
                  <button
                    onClick={async () => {
                      console.log('🧪 Testing backend connection...');
                      const isConnected = await backendService.testBackendConnection();
                      alert(`Backend connection test: ${isConnected ? 'Success' : 'Failed'}`);
                    }}
                    className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Additional Info */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-gray-600 mb-4">
{t('checkout.cancelAnytime')}
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>{t('checkout.securePaymentBadge')}</span>
            <span>{t('checkout.creditCardSupport')}</span>
            <span>{t('checkout.cancelAnytimeBadge')}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;
