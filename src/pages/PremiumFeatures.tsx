import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Settings, Zap, Globe, Headphones, Star, Check, ArrowLeft, Sparkles } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { backendService } from '../services/BackendService';
import PlanCustomization from '../components/PlanCustomization';

const PremiumFeatures: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useSupabaseAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isAuthenticated && user) {
      checkPremiumStatus();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const checkPremiumStatus = async () => {
    try {
      setIsLoading(true);
      const result = await backendService.getSubscriptionStatus(user?.access_token);
      if (result.success) {
        setIsPremium(result.data.isPremium);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm(t('premium.cancelConfirmation') || 'Are you sure you want to cancel your premium subscription?')) {
      return;
    }

    try {
      setIsCancelling(true);
      setCancelMessage(null);

      const result = await backendService.cancelSubscription(user?.access_token);

      if (result.success) {
        setCancelMessage(t('premium.cancelSuccess') || 'Subscription cancellation scheduled successfully.');
        // Optionally refresh status or just show message
      } else {
        setCancelMessage(t('premium.cancelError') || 'Failed to cancel subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setCancelMessage(t('premium.cancelError') || 'Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const premiumFeatures = [
    {
      icon: Crown,
      title: 'プレミアムプラン',
      description: 'AI搭載の完全な旅行プランニング',
      features: [
        '完全な旅程プラン',
        'カスタマイズ機能',
        '24時間AIサポート',
        'eSIM割引',
        '優先サポート'
      ]
    },
    {
      icon: Settings,
      title: 'プランカスタマイズ',
      description: 'AIパーソナリティとプランスタイルを設定',
      features: [
        'AIパーソナリティ選択',
        'プランスタイル設定',
        'コンテンツ設定',
        'スケジュール設定',
        '言語設定'
      ]
    },
    {
      icon: Zap,
      title: '高度なAI機能',
      description: 'より詳細で個人的なプラン生成',
      features: [
        '詳細なアクティビティ情報',
        '写真とレビュー',
        '交通手段の詳細',
        '予算内訳',
        'ローカル情報'
      ]
    },
    {
      icon: Globe,
      title: '多言語サポート',
      description: '日本語と英語でのプラン生成',
      features: [
        '日本語プラン',
        '英語プラン',
        '自動翻訳',
        '現地言語情報',
        '文化的情報'
      ]
    },
    {
      icon: Headphones,
      title: '24時間サポート',
      description: 'いつでもAIアシスタントが利用可能',
      features: [
        'リアルタイムチャット',
        '緊急時サポート',
        'プラン修正',
        '質問対応',
        'トラブルシューティング'
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-6">プレミアム機能をご利用いただくにはログインしてください。</p>
          <button
            onClick={() => navigate('/supabase-auth/login')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {t('premium.title') || 'プレミアム機能'}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {t('premium.subtitle') || 'プレミアムプランにアップグレードして、すべての機能を利用しましょう'}
            </p>
            <button
              onClick={() => navigate('/checkout')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all text-lg font-medium"
            >
              プレミアムプランにアップグレード
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('premium.title') || 'プレミアム機能'}
          </h1>
          <p className="text-lg text-gray-600">
            {t('premium.subtitle') || 'プレミアムプランのすべての機能をご利用いただけます'}
          </p>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-2">
            <div className="flex space-x-2">
              {[
                { id: 'overview', label: '概要', icon: Star },
                { id: 'customization', label: 'カスタマイズ', icon: Settings },
                { id: 'features', label: '機能', icon: Zap }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    className="bg-white rounded-2xl shadow-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          )}

          {activeTab === 'customization' && <PlanCustomization />}

          {activeTab === 'features' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
                利用可能な機能
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">AI機能</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>カスタマイズされた旅程生成</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>リアルタイムチャットサポート</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>多言語対応</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">プレミアム機能</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>詳細な写真とレビュー</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>交通手段の詳細情報</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>予算内訳とコスト分析</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Cancellation Section - Only show in Customization or Features tab, or add a dedicated settings tab */}
        {activeTab === 'features' && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-8 border border-red-100">
            <h3 className="text-lg font-semibold text-red-600 mb-4">{t('premium.dangerZone') || 'Danger Zone'}</h3>
            <p className="text-gray-600 mb-6">
              {t('premium.cancelDescription') || 'If you wish to stop your premium subscription, you can cancel it here. You will lose access to premium features at the end of your current billing period.'}
            </p>

            {cancelMessage && (
              <div className={`p-4 rounded-lg mb-6 ${cancelMessage.includes('success')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                {cancelMessage}
              </div>
            )}

            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="px-6 py-3 bg-white border-2 border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
            >
              {isCancelling ? (
                <>
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('premium.processing') || 'Processing...'}</span>
                </>
              ) : (
                <span>{t('premium.cancelSubscription') || 'Cancel Subscription'}</span>
              )}
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ダッシュボードに戻る</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatures;


