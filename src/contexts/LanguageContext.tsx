import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/config';
import { validateTranslations } from '../i18n/config';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  t: (key: string) => string;
  validateTranslation: (key: string) => boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('ja');

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('trippin-language', lang);
  };

  const t = (key: string, options?: any) => {
    // Handle both old fallback parameter and new options parameter
    const fallback = typeof options === 'string' ? options : undefined;
    const translationOptions = typeof options === 'object' ? options : undefined;
    
    const translation = i18n.t(key, translationOptions);
    
    // Check if translation is missing or same as key
    if (translation === key || !translation || translation.includes('[MISSING:')) {
      // In development, show error for missing translations
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Translation missing: "${key}" for language "${currentLanguage}"`);
      }
      
      // Try fallback to English if not already English
      if (currentLanguage !== 'en') {
        const englishTranslation = i18n.t(key, { lng: 'en', ...translationOptions });
        if (englishTranslation !== key && englishTranslation) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Using English fallback for: "${key}" in language "${currentLanguage}"`);
          }
          return englishTranslation;
        }
      }
      
      // Use provided fallback or show missing indicator
      return fallback || `[MISSING: ${key}]`;
    }
    
    return translation;
  };

  const validateTranslation = (key: string): boolean => {
    const translation = i18n.t(key);
    return translation !== key && translation && !translation.includes('[MISSING:');
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('trippin-language') || 'ja';
    changeLanguage(savedLanguage);
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t, validateTranslation }}>
      {children}
    </LanguageContext.Provider>
  );
};