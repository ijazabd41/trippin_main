import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MockDataNoticeProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  showRetry?: boolean;
}

const MockDataNotice: React.FC<MockDataNoticeProps> = ({ 
  message,
  onRetry,
  className = "",
  showRetry = true
}) => {
  const { t } = useLanguage();
  const displayMessage = message || t('mockData.notice');
  
  return (
    <motion.div
      className={`bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Wifi className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">{t('mockData.serviceNotification')}</span>
          </div>
          <p className="text-sm text-yellow-700">{displayMessage}</p>
          {onRetry && showRetry && (
            <button
              onClick={onRetry}
              className="mt-2 flex items-center space-x-1 text-xs text-yellow-600 hover:text-yellow-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('mockData.retry')}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MockDataNotice;