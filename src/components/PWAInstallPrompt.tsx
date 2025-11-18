import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Wifi, Zap } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { useLanguage } from '../contexts/LanguageContext';

const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, installApp, isOnline } = usePWA();
  const { t } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember user dismissed the prompt
    localStorage.setItem('trippin-install-dismissed', Date.now().toString());
  };

  // Don't show if not installable or user dismissed recently
  if (!isInstallable || !showPrompt) {
    return null;
  }

  // Check if user dismissed recently (within 7 days)
  const dismissedTime = localStorage.getItem('trippin-install-dismissed');
  if (dismissedTime) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      return null;
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <img 
                  src="/trippin-logo.png" 
                  alt="TRIPPIN" 
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{t('pwa.installTitle')}</h3>
                <p className="text-sm text-gray-600">{t('pwa.installSubtitle')}</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-gray-700">{t('pwa.fastAccess')}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <Wifi className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-gray-700">{t('pwa.offlineSupport')}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-3 h-3 text-purple-600" />
              </div>
              <span className="text-gray-700">{t('pwa.pushNotifications')}</span>
            </div>
          </div>

          {/* Install Button */}
          <div className="flex space-x-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              {t('pwa.later')}
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {isInstalling ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="text-sm">{t('pwa.install')}</span>
            </button>
          </div>

          {/* Offline indicator */}
          {!isOnline && (
            <div className="mt-3 flex items-center space-x-2 text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>{t('pwa.offlineMessage')}</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;