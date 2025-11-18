import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter';

interface SimplePaymentFormProps {
  amount: number;
  currency: string;
  onPaymentSuccess: (paymentMethodId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

const SimplePaymentForm: React.FC<SimplePaymentFormProps> = ({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!cardInfo.number || !cardInfo.expiry || !cardInfo.cvv || !cardInfo.name) {
      setError('すべてのフィールドを入力してください');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful payment
      const mockPaymentMethodId = `pm_mock_${Date.now()}`;
      onPaymentSuccess(mockPaymentMethodId);
    } catch (err) {
      const errorMessage = '決済処理中にエラーが発生しました';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カード番号 *
          </label>
          <input
            type="text"
            value={cardInfo.number}
            onChange={(e) => setCardInfo(prev => ({ ...prev, number: e.target.value }))}
            placeholder="1234 5678 9012 3456"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              有効期限 *
            </label>
            <input
              type="text"
              value={cardInfo.expiry}
              onChange={(e) => setCardInfo(prev => ({ ...prev, expiry: e.target.value }))}
              placeholder="MM/YY"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVV *
            </label>
            <input
              type="text"
              value={cardInfo.cvv}
              onChange={(e) => setCardInfo(prev => ({ ...prev, cvv: e.target.value }))}
              placeholder="123"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={4}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カード名義 *
          </label>
          <input
            type="text"
            value={cardInfo.name}
            onChange={(e) => setCardInfo(prev => ({ ...prev, name: e.target.value }))}
            placeholder="YAMADA TARO"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {error && (
        <motion.div 
          key="error"
          className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-center space-x-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </motion.div>
      )}

      <motion.button
        key="submit-button"
        type="submit"
        disabled={isProcessing || disabled}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>処理中...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{formatCurrency(amount, currency)} で支払う</span>
            <Lock className="w-4 h-4" />
          </>
        )}
      </motion.button>

      <div className="text-xs text-gray-500 text-center flex items-center justify-center space-x-1">
        <Lock className="w-3 h-3" />
        <span>SSL暗号化により安全に保護されています</span>
      </div>
    </motion.form>
  );
};

export default SimplePaymentForm;
