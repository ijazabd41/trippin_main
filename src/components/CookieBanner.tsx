import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieBanner: React.FC = () => {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    functional: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('trippin-cookie-consent');
    if (!cookieConsent) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 2000);
    } else {
      // Load saved preferences
      const savedPreferences = JSON.parse(cookieConsent);
      setPreferences(savedPreferences);
      applyCookieSettings(savedPreferences);
    }
  }, []);

  const applyCookieSettings = (prefs: CookiePreferences) => {
    // Apply Google Analytics based on analytics preference
    if (prefs.analytics && import.meta.env.VITE_GA_ID) {
      // Enable Google Analytics
      (window as any).gtag = (window as any).gtag || function() {
        ((window as any).dataLayer = (window as any).dataLayer || []).push(arguments);
      };
      (window as any).gtag('js', new Date());
      (window as any).gtag('config', import.meta.env.VITE_GA_ID, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
    }

    // Apply marketing cookies
    if (prefs.marketing) {
      // Enable marketing tracking
      localStorage.setItem('trippin-marketing-enabled', 'true');
    } else {
      localStorage.removeItem('trippin-marketing-enabled');
    }

    // Apply functional cookies
    if (prefs.functional) {
      // Enable enhanced functionality
      localStorage.setItem('trippin-functional-enabled', 'true');
    } else {
      localStorage.removeItem('trippin-functional-enabled');
    }
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('trippin-cookie-consent', JSON.stringify(allAccepted));
    applyCookieSettings(allAccepted);
    setShowBanner(false);
  };

  const acceptNecessaryOnly = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    
    setPreferences(necessaryOnly);
    localStorage.setItem('trippin-cookie-consent', JSON.stringify(necessaryOnly));
    applyCookieSettings(necessaryOnly);
    setShowBanner(false);
  };

  const saveCustomPreferences = () => {
    localStorage.setItem('trippin-cookie-consent', JSON.stringify(preferences));
    applyCookieSettings(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
              {!showSettings ? (
                // Main Banner
                <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Cookie className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {t('cookies.title') || 'クッキーの使用について'}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {t('cookies.description') || 'より良いサービス提供のためクッキーを使用しています。'}
                        <Link to="/legal/cookies" className="text-purple-600 hover:text-purple-700 ml-1">
                          {t('cookies.learnMore') || '詳細を見る'}
                        </Link>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowSettings(true)}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>{t('cookies.customize') || 'カスタマイズ'}</span>
                    </button>
                    <button
                      onClick={acceptNecessaryOnly}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {t('cookies.necessary') || '必須のみ'}
                    </button>
                    <button
                      onClick={acceptAll}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      {t('cookies.acceptAll') || 'すべて許可'}
                    </button>
                  </div>
                </div>
              ) : (
                // Settings Panel
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                      {t('cookies.preferences') || 'クッキー設定'}
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Necessary Cookies */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {t('cookies.necessary') || '必須クッキー'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t('cookies.necessaryDescription') || 'ウェブサイトの基本機能に必要です'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.necessary}
                          disabled={true}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-500">{t('cookies.alwaysActive')}</span>
                      </div>
                    </div>

                    {/* Functional Cookies */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {t('cookies.functional') || '機能性クッキー'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t('cookies.functionalDescription') || 'ユーザー設定の保存に使用'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => updatePreference('functional', e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {t('cookies.analytics') || '分析クッキー'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t('cookies.analyticsDescription') || 'サイト利用状況の分析に使用'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => updatePreference('analytics', e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {t('cookies.marketing') || 'マーケティングクッキー'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t('cookies.marketingDescription') || 'パーソナライズされた広告の表示'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => updatePreference('marketing', e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={acceptNecessaryOnly}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {t('cookies.necessary') || '必須のみ'}
                    </button>
                    <button
                      onClick={saveCustomPreferences}
                      className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>{t('cookies.save') || '保存'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;