import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { availableLanguages } from '../i18n/i18nResources';

interface LanguageSelectorProps {
  variant?: 'header' | 'menu';
  onLanguageChange?: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'header',
  onLanguageChange 
}) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setIsOpen(false);
    onLanguageChange?.();
  };

  if (variant === 'menu') {
    return (
      <div className="space-y-2">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              currentLanguage === lang.code
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              <img 
                src={`https://flagcdn.com/w40/${lang.flag}.png`} 
                alt={`${lang.country} flag`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">{lang.name}</div>
              <div className="text-xs text-gray-500">{lang.nameEn}</div>
            </div>
            {currentLanguage === lang.code && (
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/90 backdrop-blur-md hover:bg-white text-gray-800 rounded-full transition-all border border-gray-200 shadow-sm"
      >
        <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200">
          <img 
            src={`https://flagcdn.com/w40/${currentLang?.flag || 'jp'}.png`} 
            alt={`${currentLang?.country || 'Japan'} flag`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium">{currentLang?.name || '日本語'}</div>
          <div className="text-xs text-gray-500">{currentLang?.nameEn || 'Japanese'}</div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      currentLanguage === lang.code
                        ? 'bg-purple-50 text-purple-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                      <img 
                        src={`https://flagcdn.com/w40/${lang.flag}.png`} 
                        alt={`${lang.country} flag`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{lang.name}</div>
                      <div className="text-xs text-gray-500">{lang.nameEn}</div>
                    </div>
                    {currentLanguage === lang.code && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;