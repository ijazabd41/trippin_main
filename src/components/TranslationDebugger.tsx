import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { availableLanguages } from '../i18n/i18nResources';

const TranslationDebugger: React.FC = () => {
  const { currentLanguage, t } = useLanguage();
  const [testKeys, setTestKeys] = useState<string[]>([]);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  // Test keys to check
  const commonTestKeys = [
    'menu.home',
    'menu.dashboard',
    'menu.login',
    'menu.register',
    'landing.hero.title',
    'landing.hero.subtitle',
    'auth.welcome',
    'auth.login',
    'questionnaire.language',
    'checkout.title',
    'dashboard.title',
    'esim.title',
    'planGeneration.title',
    'templates.title',
    'reviews.title',
    'help.title',
    'translation.title',
    'offline.title',
    'legal.title'
  ];

  useEffect(() => {
    const missing: string[] = [];
    const testResults: string[] = [];

    commonTestKeys.forEach(key => {
      const translation = t(key);
      if (translation === key || translation.includes('[MISSING:')) {
        missing.push(key);
      }
      testResults.push(`${key}: ${translation}`);
    });

    setTestKeys(testResults);
    setMissingKeys(missing);
  }, [currentLanguage, t]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto z-50">
      <h3 className="font-bold text-sm mb-2">🌐 Translation Debugger</h3>
      <div className="text-xs space-y-1">
        <div className="font-semibold">Current Language: {currentLanguage}</div>
        <div className="font-semibold text-red-600">Missing Keys: {missingKeys.length}</div>
        
        {missingKeys.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold text-red-600">Missing:</div>
            {missingKeys.map(key => (
              <div key={key} className="text-red-500">• {key}</div>
            ))}
          </div>
        )}
        
        <div className="mt-2">
          <div className="font-semibold">Test Results:</div>
          {testKeys.slice(0, 5).map((result, index) => (
            <div key={index} className="text-gray-600 truncate">{result}</div>
          ))}
          {testKeys.length > 5 && (
            <div className="text-gray-500">... and {testKeys.length - 5} more</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationDebugger;
