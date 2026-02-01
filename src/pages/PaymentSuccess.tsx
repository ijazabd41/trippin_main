import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Crown, Star, Zap } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateProfile, userProfile, session, refreshUserProfileFromBackend, restoreSessionFromStorage } = useSupabaseAuth();
  const { addNotification } = useNotification();
  const { t } = useLanguage();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);


  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const userId = searchParams.get('user_id');

        // Debug logging
        console.log('PaymentSuccess: Full URL:', window.location.href);
        console.log('PaymentSuccess: URL search params:', window.location.search);
        console.log('PaymentSuccess: URL hash:', window.location.hash);
        console.log('PaymentSuccess: Session ID from params:', sessionId);
        console.log('PaymentSuccess: User ID from params:', userId);
        console.log('PaymentSuccess: All search params:', Object.fromEntries(searchParams.entries()));

        // Try to get session_id from different sources
        let actualSessionId = sessionId;
        if (!actualSessionId) {
          // Try to get from hash parameters
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          actualSessionId = hashParams.get('session_id');
          console.log('PaymentSuccess: Session ID from hash:', actualSessionId);
        }

        if (!actualSessionId) {
          console.error('PaymentSuccess: No session_id found in URL parameters or hash');

          // For testing purposes, check if we're in development mode and show a test message
          if (process.env.NODE_ENV === 'development') {
            console.log('PaymentSuccess: Development mode - showing test message');
            setError('セッションIDが見つかりません。開発モードでは、Stripeの設定を確認してください。');
          } else {
            setError('セッションIDが見つかりません。URLを確認してください。');
          }
          setIsVerifying(false);
          return;
        }

        // Check if we have a valid session, if not try to restore it
        let authToken = session?.access_token;
        if (!authToken) {
          console.log('PaymentSuccess: No auth token, attempting to restore session...');
          const restoredSession = await restoreSessionFromStorage();
          if (restoredSession) {
            authToken = restoredSession.session.access_token;
            console.log('PaymentSuccess: Restored session successfully');
          }
        }

        if (!authToken) {
          console.error('PaymentSuccess: No auth token available for payment verification');
          setError('認証セッションが見つかりません。ログインし直してください。');
          setIsVerifying(false);
          return;
        }

        const data = await backendApiCall(BACKEND_API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.VERIFY_PAYMENT, {
          method: 'POST',
          body: JSON.stringify({
            sessionId: actualSessionId,
            userId: userId || userProfile?.id
          })
        }, authToken);

        console.log('🔍 Payment verification response:', data);
        console.log('🔍 Response structure:', {
          hasSuccess: 'success' in data,
          successValue: data.success,
          hasData: 'data' in data,
          dataValue: data.data,
          keys: Object.keys(data)
        });

        if (data.success) {
          console.log('✅ Payment verified successfully');

          // The backend has already updated the user's premium status in the database
          console.log('🔄 Backend has already updated user premium status');
          console.log('✅ Payment verification successful - user is now premium');

          // Refresh user profile from backend to get the latest premium status
          console.log('🔄 Refreshing user profile from backend...');
          try {
            // Add timeout to prevent hanging
            const refreshPromise = refreshUserProfileFromBackend();
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile refresh timeout')), 15000)
            );

            const refreshedProfile = await Promise.race([refreshPromise, timeoutPromise]);

            if (refreshedProfile && refreshedProfile.isPremium) {
              console.log('✅ User profile refreshed with premium status');
              // The profile is already updated in the context, no need to manually update
            } else {
              console.warn('⚠️ Profile refresh did not show premium status, but payment was successful');
              // Force refresh the profile again
              await refreshUserProfileFromBackend();
            }
          } catch (profileError) {
            console.warn('⚠️ Profile refresh failed, but payment was successful:', profileError);
            // Try one more time
            try {
              await refreshUserProfileFromBackend();
            } catch (retryError) {
              console.warn('⚠️ Retry profile refresh also failed:', retryError);
            }
          }

          // Always show success message since payment was verified
          console.log('✅ Payment verification successful - proceeding with success flow');

          // Set premium status for UI
          setIsPremium(true);

          console.log('🔄 Setting state: isPremium=true, isVerifying=false');
          setIsVerifying(false);

          // Add premium upgrade notification
          addNotification({
            type: 'success',
            title: t('premium.success.title'),
            message: t('premium.success.message'),
            actions: [
              {
                label: t('premium.success.viewDashboard'),
                action: () => navigate('/dashboard')
              }
            ]
          });
        } else {
          console.log('❌ Payment verification failed:', data);
          throw new Error(data.message || '支払い検証に失敗しました');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setError(error instanceof Error ? error.message : '支払い検証に失敗しました');
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, updateProfile, addNotification, navigate, session, refreshUserProfileFromBackend, restoreSessionFromStorage]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <motion.div
        className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isVerifying ? (
          <>
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('premium.success.verifying')}</h2>
            <p className="text-gray-600">{t('premium.success.pleaseWait')}</p>
          </>
        ) : error ? (
          <>
            <div className="text-red-500 text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('premium.success.error')}</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/checkout')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              {t('premium.success.retry')}
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('premium.success.title')}</h2>
            <p className="text-gray-600 mb-6">
              {t('premium.success.message')}
            </p>

            {/* Premium Status Badge */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-purple-800">{t('premium.success.premiumMember')}</span>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-sm text-purple-700">
                {t('premium.success.activeMessage')}
              </p>
            </div>

            {/* Premium Features List */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center space-x-3 text-sm">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700">{t('premium.success.features.ai')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Crown className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700">{t('premium.success.features.support')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700">{t('premium.success.features.esim')}</span>
              </div>
            </div>

            <motion.button
              onClick={handleContinue}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl mx-auto hover:from-purple-700 hover:to-pink-700 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{t('premium.success.continue')}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;