import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, Globe, CheckCircle, AlertCircle } from 'lucide-react';

interface RealESIMPlan {
  id: string;
  provider: string;
  name: string;
  description: string;
  dataAmount: string;
  validity: string;
  price: {
    amount: number;
    currency: string;
  };
  coverage: string[];
  features: string[];
  isAvailable: boolean;
}

interface RealESIMPlansProps {
  country?: string;
  onPlanSelect?: (plan: RealESIMPlan) => void;
}

const RealESIMPlans: React.FC<RealESIMPlansProps> = ({ 
  country = 'JP', 
  onPlanSelect 
}) => {
  const [plans, setPlans] = useState<RealESIMPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  useEffect(() => {
    loadPlans();
  }, [country]);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/esim-provider/plans?country=${country}`);
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.data);
        console.log(`📡 Loaded ${data.data.length} plans from ${data.providers?.join(', ')}`);
      } else {
        throw new Error(data.error || 'Failed to load plans');
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      'AIRALO': 'bg-blue-100 text-blue-800',
      'NOMAD': 'bg-green-100 text-green-800',
      'HOLAFLY': 'bg-purple-100 text-purple-800',
      'FALLBACK': 'bg-gray-100 text-gray-800'
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getProviderIcon = (provider: string) => {
    const icons = {
      'AIRALO': '🌍',
      'NOMAD': '📱',
      'HOLAFLY': '🚀',
      'FALLBACK': '📦'
    };
    return icons[provider as keyof typeof icons] || '📱';
  };

  const filteredPlans = selectedProvider === 'all' 
    ? plans 
    : plans.filter(plan => plan.provider === selectedProvider);

  const uniqueProviders = [...new Set(plans.map(plan => plan.provider))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading eSIM plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Plans</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadPlans}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Filter */}
      {uniqueProviders.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedProvider('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedProvider === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Providers ({plans.length})
          </button>
          {uniqueProviders.map(provider => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedProvider === provider
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getProviderIcon(provider)} {provider} ({plans.filter(p => p.provider === provider).length})
            </button>
          ))}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            {/* Provider Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProviderColor(plan.provider)}`}>
                {getProviderIcon(plan.provider)} {plan.provider}
              </div>
              {plan.isAvailable ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
            </div>

            {/* Plan Info */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-purple-500" />
                  <span>{plan.dataAmount}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-500" />
                  <span>{plan.validity}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-purple-500" />
                  <span>{plan.coverage.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            {plan.features.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  {plan.features.length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                      +{plan.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-purple-600">
                {plan.price.currency} {plan.price.amount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                One-time payment
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => onPlanSelect?.(plan)}
              disabled={!plan.isAvailable}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                plan.isAvailable
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {plan.isAvailable ? 'Select Plan' : 'Unavailable'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* No Plans Message */}
      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Plans Available</h3>
          <p className="text-gray-500">
            {selectedProvider === 'all' 
              ? 'No eSIM plans found for this country.'
              : `No plans available from ${selectedProvider}.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default RealESIMPlans;
