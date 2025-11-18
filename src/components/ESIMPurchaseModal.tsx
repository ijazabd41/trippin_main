import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Wifi, CheckCircle } from 'lucide-react';
import { ESIMPlan } from '../services/ESIMService';
import StripePaymentForm from './StripePaymentForm';
import { backendService } from '../services/BackendService';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/currencyFormatter';

interface ESIMPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ESIMPlan | null;
  onPurchaseSuccess: (orderData: any) => void;
}

const ESIMPurchaseModal: React.FC<ESIMPurchaseModalProps> = ({
  isOpen,
  onClose,
  plan,
  onPurchaseSuccess
}) => {
  const { session, isAuthenticated } = useSupabaseAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const purchaseInProgressRef = useRef(false);

  // Check authentication before proceeding to payment
  const handleProceedToPayment = () => {
    if (!isAuthenticated || !session?.access_token) {
      setError(t('esim.purchaseModal.authRequired'));
      return;
    }
    
    if (!customerInfo.name || !customerInfo.email) {
      setError(t('esim.purchaseModal.nameEmailRequired'));
      return;
    }
    
    setError(null);
    setStep('payment');
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    // Prevent multiple simultaneous calls using both state and ref
    if (isProcessing || purchaseInProgressRef.current) {
      console.warn('⚠️ Purchase already in progress, ignoring duplicate call');
      return;
    }
    
    purchaseInProgressRef.current = true;
    setIsProcessing(true);
    setError(null);
    
    try {
      // Get authentication token from Supabase session
      const token = session?.access_token;
      
      if (!token) {
        throw new Error(t('esim.purchaseModal.authRequired'));
      }
      
      // Double-check token is still valid
      if (!isAuthenticated || !session) {
        throw new Error(t('esim.purchaseModal.sessionExpired'));
      }
      
      console.log('🛒 Processing eSIM purchase:', {
        planId: plan.id,
        hasToken: !!token,
        customerInfo: customerInfo
      });
      
      // Use BackendService to handle API call properly
      const purchaseData = {
        planId: plan.id,
        customerInfo: customerInfo,
        paymentMethodId: paymentMethodId
      };
      
      const result = await backendService.purchaseESIM(purchaseData, token);

      if (result.success && result.data) {
        console.log('✅ Purchase successful:', result.data);
        
        // Always show orderReference prominently, especially if there was a storage issue
        if (result.data.orderReference) {
          console.log('📋 Order Reference:', result.data.orderReference);
        }
        
        if (result.partialSuccess || result.warning) {
          console.warn('⚠️ Purchase completed with warnings:', {
            partialSuccess: result.partialSuccess,
            warning: result.warning,
            orderReference: result.data.orderReference
          });
        }
        
        setOrderData({
          ...result.data,
          partialSuccess: result.partialSuccess || false
        });
        setStep('success');
        onPurchaseSuccess(result.data);
      } else {
        // Even on error, try to extract orderReference if available
        const orderReference = result.data?.orderReference || result.supportReference || result.orderReference;
        const errorMessage = result.userPrompt || result.error || result.message || t('esim.purchaseModal.purchaseFailed');
        
        if (orderReference) {
          // If we have an orderReference, show it in the error
          setOrderData({
            orderReference: orderReference,
            partialSuccess: true,
            error: errorMessage
          });
          setStep('success'); // Show success screen with reference number
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      // Extract userPrompt from error details if available
      const userPrompt = error.details?.userPrompt || error.userPrompt;
      const errorMessage = userPrompt || error.message || t('esim.payment.paymentError');
      setError(errorMessage);
      handlePaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
      purchaseInProgressRef.current = false;
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Error is already set in state, user will see it
  };

  const resetModal = () => {
    setStep('details');
    setCustomerInfo({ name: '', email: '', phone: '' });
    setOrderData(null);
    setError(null);
    setIsProcessing(false);
    purchaseInProgressRef.current = false;
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!plan) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{t('esim.purchaseModal.title')}</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Plan Details */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{t('esim.purchaseModal.dataCapacity')}:</span>
                        <span className="font-medium ml-2">{plan.dataAmount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('esim.purchaseModal.validityPeriod')}:</span>
                        <span className="font-medium ml-2">{plan.validity}</span>
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold text-purple-600 mt-3">
                      {formatCurrency(plan.price.amount, plan.price.currency)}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">{t('esim.purchaseModal.customerInfo')}</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('esim.purchaseModal.name')} *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('esim.purchaseModal.namePlaceholder')}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('esim.purchaseModal.email')} *
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('esim.purchaseModal.emailPlaceholder')}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('esim.purchaseModal.phone')}
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={t('esim.purchaseModal.phonePlaceholder')}
                      />
                    </div>
                  </div>

                  {!isAuthenticated && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium">⚠️ {t('esim.purchaseModal.loginRequired')}</p>
                      <p className="text-xs mt-1">{t('esim.purchaseModal.loginRequiredDescription')}</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleProceedToPayment}
                    disabled={!customerInfo.name || !customerInfo.email || !isAuthenticated}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!isAuthenticated ? t('esim.purchaseModal.loginRequired') : t('esim.purchaseModal.proceedToPayment')}
                  </button>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('esim.purchaseModal.paymentInfo')}</h3>
                    <p className="text-sm text-gray-600">{t('esim.purchaseModal.enterCardInfo')}</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <p className="font-medium">{t('esim.purchaseModal.error')}</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <StripePaymentForm
                    amount={plan.price.amount}
                    currency={plan.price.currency}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    disabled={isProcessing}
                  />
                  
                  {isProcessing && (
                    <div className="text-center text-sm text-gray-600">
                      {t('esim.purchaseModal.processing')}
                    </div>
                  )}

                  <button
                    onClick={() => setStep('details')}
                    className="w-full text-gray-600 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {t('esim.purchaseModal.back')}
                  </button>
                </motion.div>
              )}

              {step === 'success' && orderData && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{t('esim.purchaseModal.purchaseComplete')}</h3>
                    <p className="text-gray-600">{t('esim.purchaseModal.setupInfoSent')}</p>
                  </div>

                  {/* Order Reference - Always Display Prominently */}
                  {orderData.orderReference && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <span className="text-sm font-bold text-yellow-800">{t('esim.purchaseModal.orderReferenceLabel')}:</span>
                      </div>
                      <div className="font-mono text-lg font-bold bg-white p-3 rounded border-2 border-yellow-400 break-all text-yellow-900">
                        {orderData.orderReference}
                      </div>
                      <p className="text-xs text-yellow-700 mt-2">
                        {orderData.partialSuccess 
                          ? t('esim.purchaseModal.orderReferencePartialSuccess')
                          : t('esim.purchaseModal.saveOrderReference')}
                      </p>
                    </div>
                  )}

                  {/* Warning if partial success (database storage failed) */}
                  {orderData.partialSuccess && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl space-y-2">
                      <p className="text-sm font-medium text-orange-800">{t('esim.purchaseModal.partialSuccessWarning')}</p>
                      <p className="text-xs text-orange-700">
                        {t('esim.purchaseModal.partialSuccessMessage')}
                      </p>
                    </div>
                  )}

                  {/* QR Code Display */}
                  {orderData.qrCode && (
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Wifi className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">{t('esim.qrCode')}:</span>
                      </div>
                      <div className="flex justify-center">
                        <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderData.qrCode)}`}
                            alt="eSIM QR Code"
                            className="w-48 h-48"
                            onError={(e) => {
                              console.error('Failed to load QR code image');
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {t('esim.purchaseModal.scanQRCodeToSetup')}
                      </p>
                    </div>
                  )}

                  {/* Activation Code Display */}
                  {orderData.activationCode && (
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">{t('esim.purchaseModal.activationCode')}:</span>
                      </div>
                      <div className="font-mono text-lg bg-white p-2 rounded border break-all">
                        {orderData.activationCode}
                      </div>
                    </div>
                  )}

                  {/* Manual Setup Instructions if QR code is not available */}
                  {!orderData.qrCode && orderData.smdpAddress && orderData.activationCode && (
                    <div className="bg-blue-50 p-4 rounded-xl space-y-2 text-left">
                      <p className="text-sm font-medium text-blue-800">{t('esim.purchaseModal.manualSetupInfo')}:</p>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p><strong>{t('esim.purchaseModal.smdpAddress')}:</strong> {orderData.smdpAddress}</p>
                        <p><strong>{t('esim.purchaseModal.matchingId')}:</strong> {orderData.activationCode}</p>
                      </div>
                    </div>
                  )}

                  {orderData.expiryDate && (
                    <div className="text-sm text-gray-600">
                      <p>{t('esim.purchaseModal.expiryDateLabel')}: {new Date(orderData.expiryDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    {t('esim.purchaseModal.complete')}
                  </button>
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ESIMPurchaseModal;
