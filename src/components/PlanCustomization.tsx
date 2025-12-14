import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Wand2, Save, RefreshCw, Star, Zap, Globe, Headphones } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { backendService } from '../services/BackendService';

interface CustomizationSettings {
  aiPersonality: 'friendly' | 'professional' | 'casual' | 'detailed';
  planStyle: 'minimal' | 'detailed' | 'comprehensive';
  language: 'ja' | 'en' | 'auto';
  includePhotos: boolean;
  includeReviews: boolean;
  includeTransportDetails: boolean;
  includeBudgetBreakdown: boolean;
  includeLocalTips: boolean;
  includeEmergencyInfo: boolean;
  maxActivitiesPerDay: number;
  preferredStartTime: string;
  preferredEndTime: string;
}

const PlanCustomization: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useSupabaseAuth();
  const [settings, setSettings] = useState<CustomizationSettings>({
    aiPersonality: 'friendly',
    planStyle: 'detailed',
    language: 'ja',
    includePhotos: true,
    includeReviews: true,
    includeTransportDetails: true,
    includeBudgetBreakdown: true,
    includeLocalTips: true,
    includeEmergencyInfo: true,
    maxActivitiesPerDay: 5,
    preferredStartTime: '09:00',
    preferredEndTime: '21:00'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSettings();
    }
  }, [isAuthenticated, user]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Load user's customization settings from backend
      const result = await backendService.getUserPreferences(user?.access_token);
      if (result.success && result.data?.customization) {
        setSettings({ ...settings, ...result.data.customization });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!isAuthenticated) return;

    try {
      setIsSaving(true);
      setMessage(null);

      const result = await backendService.updateUserPreferences({
        customization: settings
      }, user?.access_token);

      if (result.success) {
        setMessage('設定が保存されました！');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage('設定の保存に失敗しました');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      aiPersonality: 'friendly',
      planStyle: 'detailed',
      language: 'ja',
      includePhotos: true,
      includeReviews: true,
      includeTransportDetails: true,
      includeBudgetBreakdown: true,
      includeLocalTips: true,
      includeEmergencyInfo: true,
      maxActivitiesPerDay: 5,
      preferredStartTime: '09:00',
      preferredEndTime: '21:00'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">ログインしてカスタマイズ機能をご利用ください</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">{t('common.loadingSettings')}</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('customization.title') || 'プランカスタマイズ'}
          </h1>
          <p className="text-gray-600">
            {t('customization.subtitle') || 'AI旅行プランをあなたの好みに合わせてカスタマイズしましょう'}
          </p>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            className={`mb-6 p-4 rounded-xl ${
              message.includes('保存されました') 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* AI Personality */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Wand2 className="w-5 h-5 mr-2 text-purple-600" />
              AIパーソナリティ
            </h3>
            <div className="space-y-3">
              {[
                { value: 'friendly', label: 'フレンドリー', desc: '親しみやすい、カジュアルなトーン' },
                { value: 'professional', label: 'プロフェッショナル', desc: 'ビジネス向け、フォーマルなトーン' },
                { value: 'casual', label: 'カジュアル', desc: 'リラックスした、日常的なトーン' },
                { value: 'detailed', label: '詳細重視', desc: '詳しい情報を提供するトーン' }
              ].map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="aiPersonality"
                    value={option.value}
                    checked={settings.aiPersonality === option.value}
                    onChange={(e) => setSettings({ ...settings, aiPersonality: e.target.value as any })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Plan Style */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-purple-600" />
              プランスタイル
            </h3>
            <div className="space-y-3">
              {[
                { value: 'minimal', label: 'ミニマル', desc: 'シンプルで要点のみ' },
                { value: 'detailed', label: '詳細', desc: 'バランスの取れた詳細情報' },
                { value: 'comprehensive', label: '包括的', desc: 'すべての情報を含む' }
              ].map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="planStyle"
                    value={option.value}
                    checked={settings.planStyle === option.value}
                    onChange={(e) => setSettings({ ...settings, planStyle: e.target.value as any })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Content Options */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-purple-600" />
              コンテンツ設定
            </h3>
            <div className="space-y-4">
              {[
                { key: 'includePhotos', label: '写真を含める', desc: '場所の写真を表示' },
                { key: 'includeReviews', label: 'レビューを含める', desc: 'ユーザーレビューを表示' },
                { key: 'includeTransportDetails', label: '交通詳細', desc: '交通手段の詳細情報' },
                { key: 'includeBudgetBreakdown', label: '予算内訳', desc: '費用の詳細内訳' },
                { key: 'includeLocalTips', label: 'ローカル情報', desc: '現地のコツや情報' },
                { key: 'includeEmergencyInfo', label: '緊急情報', desc: '緊急時の連絡先など' }
              ].map((option) => (
                <label key={option.key} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[option.key as keyof CustomizationSettings] as boolean}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      [option.key]: e.target.checked 
                    })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-600" />
              スケジュール設定
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1日の最大アクティビティ数
                </label>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={settings.maxActivitiesPerDay}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    maxActivitiesPerDay: parseInt(e.target.value) 
                  })}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 mt-1">
                  {settings.maxActivitiesPerDay} アクティビティ
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始時間
                  </label>
                  <input
                    type="time"
                    value={settings.preferredStartTime}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      preferredStartTime: e.target.value 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    終了時間
                  </label>
                  <input
                    type="time"
                    value={settings.preferredEndTime}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      preferredEndTime: e.target.value 
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={resetToDefaults}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            デフォルトに戻す
          </button>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? '保存中...' : '設定を保存'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PlanCustomization;


