import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, availableLanguages } from './i18nResources';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ja', // Default language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Key separator configuration
    keySeparator: '.',
    nsSeparator: ':',
    
    // React specific options
    react: {
      useSuspense: false,
    },
    
    // Detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'trippin-language',
    }
  });

// Enhanced validation function for translations
export const validateTranslations = (): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get all keys from the most complete language (Japanese)
  const japaneseKeys = getAllKeys(resources.ja.translation);
  
  // Check each language for missing keys
  availableLanguages.forEach(lang => {
    const langResources = resources[lang.code as keyof typeof resources]?.translation;
    if (!langResources) {
      errors.push(`Missing translation resources for language: ${lang.code}`);
      return;
    }

    // Check for missing keys
    japaneseKeys.forEach(key => {
      const value = getNestedValue(langResources, key);
      if (!value || typeof value !== 'string' || value.trim() === '') {
        if (lang.code === 'ja') {
          // Japanese should have all keys
          errors.push(`Missing translation for key "${key}" in language "${lang.code}"`);
        } else {
          // Other languages missing keys are warnings
          warnings.push(`Missing translation for key "${key}" in language "${lang.code}"`);
        }
      }
    });

    // Check for extra keys that shouldn't exist
    const langKeys = getAllKeys(langResources);
    const extraKeys = langKeys.filter(key => !japaneseKeys.includes(key));
    if (extraKeys.length > 0) {
      warnings.push(`Extra keys found in language "${lang.code}": ${extraKeys.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Helper function to get all keys from a nested object
const getAllKeys = (obj: any, prefix = ''): string[] => {
  const keys: string[] = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
};

// Helper function to get nested object values
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Development validation
if (process.env.NODE_ENV === 'development') {
  const validation = validateTranslations();
  if (!validation.isValid || validation.warnings.length > 0) {
    if (validation.errors.length > 0) {
      console.error('🌐 Translation validation errors:');
      validation.errors.forEach(error => console.error(`  ❌ ${error}`));
    }
    if (validation.warnings.length > 0) {
      console.warn('🌐 Translation validation warnings:');
      validation.warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`));
    }
  } else {
    console.log('✅ All translations validated successfully');
  }
}

export default i18n;