import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/currencyFormatter';

// Stripe configuration - use Vite env variable
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here';

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  onPaymentSuccess: (paymentMethodId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

const PaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
  disabled = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Prevent multiple submissions
    if (isProcessing || disabled) {
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError(t('esim.payment.cardNotFound'));
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setError(error.message || t('esim.payment.paymentError'));
        onPaymentError(error.message || t('esim.payment.paymentError'));
      } else if (paymentMethod) {
        onPaymentSuccess(paymentMethod.id);
      }
    } catch (err) {
      const errorMessage = t('esim.payment.paymentError');
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing || disabled}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? t('esim.payment.processing') : `${formatCurrency(amount, currency)} ${t('esim.payment.payWith')}`}
      </button>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const { t } = useLanguage();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY !== 'pk_test_your_publishable_key_here') {
      setStripePromise(loadStripe(STRIPE_PUBLISHABLE_KEY));
    }
  }, []);

  if (!stripePromise) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-600 mb-4">{t('esim.payment.loadingPaymentSystem')}</div>
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
