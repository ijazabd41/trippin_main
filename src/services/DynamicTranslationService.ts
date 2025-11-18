import { apiCall } from '../utils/api';

export interface LanguageInfo {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
  country: string;
  isStatic?: boolean; // Whether this language has static translations
}

export interface TranslationCache {
  [key: string]: {
    [languageCode: string]: string;
  };
}

class DynamicTranslationService {
  private cache: TranslationCache = {};
  private staticLanguages = new Set([
    'ja', 'en', 'zh', 'ko', 'es', 'fr', 'hi', 'ru', 'ar', 
    'id', 'pt', 'th', 'vi', 'it', 'de', 'tr', 'pl', 'nl', 'sv', 'ur'
  ]);

  // Google Translate API supported languages (subset of most common ones)
  private googleSupportedLanguages: LanguageInfo[] = [
    // Existing static languages
    { code: 'ja', name: '日本語', nameEn: 'Japanese', flag: 'jp', country: 'Japan', isStatic: true },
    { code: 'en', name: 'English', nameEn: 'English', flag: 'us', country: 'United States', isStatic: true },
    { code: 'zh', name: '中文', nameEn: 'Chinese', flag: 'cn', country: 'China', isStatic: true },
    { code: 'ko', name: '한국어', nameEn: 'Korean', flag: 'kr', country: 'South Korea', isStatic: true },
    { code: 'es', name: 'Español', nameEn: 'Spanish', flag: 'es', country: 'Spain', isStatic: true },
    { code: 'fr', name: 'Français', nameEn: 'French', flag: 'fr', country: 'France', isStatic: true },
    { code: 'hi', name: 'हिन्दी', nameEn: 'Hindi', flag: 'in', country: 'India', isStatic: true },
    { code: 'ru', name: 'Русский', nameEn: 'Russian', flag: 'ru', country: 'Russia', isStatic: true },
    { code: 'ar', name: 'العربية', nameEn: 'Arabic', flag: 'sa', country: 'Saudi Arabia', isStatic: true },
    { code: 'id', name: 'Bahasa Indonesia', nameEn: 'Indonesian', flag: 'id', country: 'Indonesia', isStatic: true },
    { code: 'pt', name: 'Português', nameEn: 'Portuguese', flag: 'pt', country: 'Portugal', isStatic: true },
    { code: 'th', name: 'ไทย', nameEn: 'Thai', flag: 'th', country: 'Thailand', isStatic: true },
    { code: 'vi', name: 'Tiếng Việt', nameEn: 'Vietnamese', flag: 'vn', country: 'Vietnam', isStatic: true },
    { code: 'it', name: 'Italiano', nameEn: 'Italian', flag: 'it', country: 'Italy', isStatic: true },
    { code: 'de', name: 'Deutsch', nameEn: 'German', flag: 'de', country: 'Germany', isStatic: true },
    { code: 'tr', name: 'Türkçe', nameEn: 'Turkish', flag: 'tr', country: 'Turkey', isStatic: true },
    { code: 'pl', name: 'Polski', nameEn: 'Polish', flag: 'pl', country: 'Poland', isStatic: true },
    { code: 'nl', name: 'Nederlands', nameEn: 'Dutch', flag: 'nl', country: 'Netherlands', isStatic: true },
    { code: 'sv', name: 'Svenska', nameEn: 'Swedish', flag: 'se', country: 'Sweden', isStatic: true },
    { code: 'ur', name: 'اردو', nameEn: 'Urdu', flag: 'pk', country: 'Pakistan', isStatic: true },
    
    // Additional Google Translate supported languages
    { code: 'af', name: 'Afrikaans', nameEn: 'Afrikaans', flag: 'za', country: 'South Africa' },
    { code: 'sq', name: 'Shqip', nameEn: 'Albanian', flag: 'al', country: 'Albania' },
    { code: 'am', name: 'አማርኛ', nameEn: 'Amharic', flag: 'et', country: 'Ethiopia' },
    { code: 'az', name: 'Azərbaycan', nameEn: 'Azerbaijani', flag: 'az', country: 'Azerbaijan' },
    { code: 'eu', name: 'Euskera', nameEn: 'Basque', flag: 'es', country: 'Spain' },
    { code: 'be', name: 'Беларуская', nameEn: 'Belarusian', flag: 'by', country: 'Belarus' },
    { code: 'bn', name: 'বাংলা', nameEn: 'Bengali', flag: 'bd', country: 'Bangladesh' },
    { code: 'bs', name: 'Bosanski', nameEn: 'Bosnian', flag: 'ba', country: 'Bosnia' },
    { code: 'bg', name: 'Български', nameEn: 'Bulgarian', flag: 'bg', country: 'Bulgaria' },
    { code: 'ca', name: 'Català', nameEn: 'Catalan', flag: 'es', country: 'Spain' },
    { code: 'ceb', name: 'Cebuano', nameEn: 'Cebuano', flag: 'ph', country: 'Philippines' },
    { code: 'ny', name: 'Chichewa', nameEn: 'Chichewa', flag: 'mw', country: 'Malawi' },
    { code: 'co', name: 'Corsu', nameEn: 'Corsican', flag: 'fr', country: 'France' },
    { code: 'hr', name: 'Hrvatski', nameEn: 'Croatian', flag: 'hr', country: 'Croatia' },
    { code: 'cs', name: 'Čeština', nameEn: 'Czech', flag: 'cz', country: 'Czech Republic' },
    { code: 'da', name: 'Dansk', nameEn: 'Danish', flag: 'dk', country: 'Denmark' },
    { code: 'eo', name: 'Esperanto', nameEn: 'Esperanto', flag: 'eo', country: 'International' },
    { code: 'et', name: 'Eesti', nameEn: 'Estonian', flag: 'ee', country: 'Estonia' },
    { code: 'tl', name: 'Filipino', nameEn: 'Filipino', flag: 'ph', country: 'Philippines' },
    { code: 'fi', name: 'Suomi', nameEn: 'Finnish', flag: 'fi', country: 'Finland' },
    { code: 'gl', name: 'Galego', nameEn: 'Galician', flag: 'es', country: 'Spain' },
    { code: 'ka', name: 'ქართული', nameEn: 'Georgian', flag: 'ge', country: 'Georgia' },
    { code: 'el', name: 'Ελληνικά', nameEn: 'Greek', flag: 'gr', country: 'Greece' },
    { code: 'gu', name: 'ગુજરાતી', nameEn: 'Gujarati', flag: 'in', country: 'India' },
    { code: 'ht', name: 'Kreyòl Ayisyen', nameEn: 'Haitian Creole', flag: 'ht', country: 'Haiti' },
    { code: 'ha', name: 'Hausa', nameEn: 'Hausa', flag: 'ng', country: 'Nigeria' },
    { code: 'haw', name: 'ʻŌlelo Hawaiʻi', nameEn: 'Hawaiian', flag: 'us', country: 'United States' },
    { code: 'iw', name: 'עברית', nameEn: 'Hebrew', flag: 'il', country: 'Israel' },
    { code: 'hmn', name: 'Hmong', nameEn: 'Hmong', flag: 'cn', country: 'China' },
    { code: 'hu', name: 'Magyar', nameEn: 'Hungarian', flag: 'hu', country: 'Hungary' },
    { code: 'is', name: 'Íslenska', nameEn: 'Icelandic', flag: 'is', country: 'Iceland' },
    { code: 'ig', name: 'Igbo', nameEn: 'Igbo', flag: 'ng', country: 'Nigeria' },
    { code: 'ga', name: 'Gaeilge', nameEn: 'Irish', flag: 'ie', country: 'Ireland' },
    { code: 'jw', name: 'Jawa', nameEn: 'Javanese', flag: 'id', country: 'Indonesia' },
    { code: 'kn', name: 'ಕನ್ನಡ', nameEn: 'Kannada', flag: 'in', country: 'India' },
    { code: 'kk', name: 'Қазақ', nameEn: 'Kazakh', flag: 'kz', country: 'Kazakhstan' },
    { code: 'km', name: 'ខ្មែរ', nameEn: 'Khmer', flag: 'kh', country: 'Cambodia' },
    { code: 'ku', name: 'Kurdî', nameEn: 'Kurdish', flag: 'iq', country: 'Iraq' },
    { code: 'ky', name: 'Кыргызча', nameEn: 'Kyrgyz', flag: 'kg', country: 'Kyrgyzstan' },
    { code: 'lo', name: 'ລາວ', nameEn: 'Lao', flag: 'la', country: 'Laos' },
    { code: 'la', name: 'Latina', nameEn: 'Latin', flag: 'va', country: 'Vatican' },
    { code: 'lv', name: 'Latviešu', nameEn: 'Latvian', flag: 'lv', country: 'Latvia' },
    { code: 'lt', name: 'Lietuvių', nameEn: 'Lithuanian', flag: 'lt', country: 'Lithuania' },
    { code: 'lb', name: 'Lëtzebuergesch', nameEn: 'Luxembourgish', flag: 'lu', country: 'Luxembourg' },
    { code: 'mk', name: 'Македонски', nameEn: 'Macedonian', flag: 'mk', country: 'North Macedonia' },
    { code: 'mg', name: 'Malagasy', nameEn: 'Malagasy', flag: 'mg', country: 'Madagascar' },
    { code: 'ms', name: 'Bahasa Melayu', nameEn: 'Malay', flag: 'my', country: 'Malaysia' },
    { code: 'ml', name: 'മലയാളം', nameEn: 'Malayalam', flag: 'in', country: 'India' },
    { code: 'mt', name: 'Malti', nameEn: 'Maltese', flag: 'mt', country: 'Malta' },
    { code: 'mi', name: 'Te Reo Māori', nameEn: 'Maori', flag: 'nz', country: 'New Zealand' },
    { code: 'mr', name: 'मराठी', nameEn: 'Marathi', flag: 'in', country: 'India' },
    { code: 'mn', name: 'Монгол', nameEn: 'Mongolian', flag: 'mn', country: 'Mongolia' },
    { code: 'my', name: 'မြန်မာ', nameEn: 'Myanmar', flag: 'mm', country: 'Myanmar' },
    { code: 'ne', name: 'नेपाली', nameEn: 'Nepali', flag: 'np', country: 'Nepal' },
    { code: 'no', name: 'Norsk', nameEn: 'Norwegian', flag: 'no', country: 'Norway' },
    { code: 'ps', name: 'پښتو', nameEn: 'Pashto', flag: 'af', country: 'Afghanistan' },
    { code: 'fa', name: 'فارسی', nameEn: 'Persian', flag: 'ir', country: 'Iran' },
    { code: 'ro', name: 'Română', nameEn: 'Romanian', flag: 'ro', country: 'Romania' },
    { code: 'sm', name: 'Samoa', nameEn: 'Samoan', flag: 'ws', country: 'Samoa' },
    { code: 'gd', name: 'Gàidhlig', nameEn: 'Scots Gaelic', flag: 'gb', country: 'United Kingdom' },
    { code: 'sr', name: 'Српски', nameEn: 'Serbian', flag: 'rs', country: 'Serbia' },
    { code: 'st', name: 'Sesotho', nameEn: 'Sesotho', flag: 'ls', country: 'Lesotho' },
    { code: 'sn', name: 'Shona', nameEn: 'Shona', flag: 'zw', country: 'Zimbabwe' },
    { code: 'sd', name: 'سنڌي', nameEn: 'Sindhi', flag: 'pk', country: 'Pakistan' },
    { code: 'si', name: 'සිංහල', nameEn: 'Sinhala', flag: 'lk', country: 'Sri Lanka' },
    { code: 'sk', name: 'Slovenčina', nameEn: 'Slovak', flag: 'sk', country: 'Slovakia' },
    { code: 'sl', name: 'Slovenščina', nameEn: 'Slovenian', flag: 'si', country: 'Slovenia' },
    { code: 'so', name: 'Soomaali', nameEn: 'Somali', flag: 'so', country: 'Somalia' },
    { code: 'su', name: 'Basa Sunda', nameEn: 'Sundanese', flag: 'id', country: 'Indonesia' },
    { code: 'sw', name: 'Kiswahili', nameEn: 'Swahili', flag: 'tz', country: 'Tanzania' },
    { code: 'tg', name: 'Тоҷикӣ', nameEn: 'Tajik', flag: 'tj', country: 'Tajikistan' },
    { code: 'ta', name: 'தமிழ்', nameEn: 'Tamil', flag: 'in', country: 'India' },
    { code: 'te', name: 'తెలుగు', nameEn: 'Telugu', flag: 'in', country: 'India' },
    { code: 'uk', name: 'Українська', nameEn: 'Ukrainian', flag: 'ua', country: 'Ukraine' },
    { code: 'uz', name: 'Oʻzbek', nameEn: 'Uzbek', flag: 'uz', country: 'Uzbekistan' },
    { code: 'cy', name: 'Cymraeg', nameEn: 'Welsh', flag: 'gb', country: 'United Kingdom' },
    { code: 'xh', name: 'IsiXhosa', nameEn: 'Xhosa', flag: 'za', country: 'South Africa' },
    { code: 'yi', name: 'ייִדיש', nameEn: 'Yiddish', flag: 'il', country: 'Israel' },
    { code: 'yo', name: 'Yorùbá', nameEn: 'Yoruba', flag: 'ng', country: 'Nigeria' },
    { code: 'zu', name: 'IsiZulu', nameEn: 'Zulu', flag: 'za', country: 'South Africa' }
  ];

  /**
   * Get all available languages
   */
  getAllLanguages(): LanguageInfo[] {
    return this.googleSupportedLanguages;
  }

  /**
   * Get only static languages (for performance-critical UI)
   */
  getStaticLanguages(): LanguageInfo[] {
    return this.googleSupportedLanguages.filter(lang => lang.isStatic);
  }

  /**
   * Get only dynamic languages (Google Translate only)
   */
  getDynamicLanguages(): LanguageInfo[] {
    return this.googleSupportedLanguages.filter(lang => !lang.isStatic);
  }

  /**
   * Check if a language has static translations
   */
  isStaticLanguage(languageCode: string): boolean {
    return this.staticLanguages.has(languageCode);
  }

  /**
   * Translate text using Google Translate API
   */
  async translateText(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    try {
      const result = await apiCall('/google-translate/translate', {
        method: 'POST',
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage
        })
      });

      if (result.success && result.data) {
        return result.data.translatedText;
      } else {
        throw new Error(result.message || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text as fallback
    }
  }

  /**
   * Translate a translation key dynamically
   */
  async translateKey(key: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    // Check cache first
    const cacheKey = `${sourceLanguage}-${targetLanguage}`;
    if (this.cache[key] && this.cache[key][cacheKey]) {
      return this.cache[key][cacheKey];
    }

    // Get the source text (from English or current language)
    const sourceText = this.getSourceText(key, sourceLanguage);
    
    if (!sourceText) {
      return `[MISSING: ${key}]`;
    }

    // Translate using Google Translate API
    const translatedText = await this.translateText(sourceText, targetLanguage, sourceLanguage);

    // Cache the result
    if (!this.cache[key]) {
      this.cache[key] = {};
    }
    this.cache[key][cacheKey] = translatedText;

    return translatedText;
  }

  /**
   * Get source text for translation
   */
  private getSourceText(key: string, sourceLanguage: string): string {
    // This would need to be implemented based on your i18n setup
    // For now, return the key as placeholder
    return key;
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalKeys: number; totalTranslations: number } {
    const totalKeys = Object.keys(this.cache).length;
    const totalTranslations = Object.values(this.cache).reduce(
      (sum, translations) => sum + Object.keys(translations).length, 
      0
    );
    return { totalKeys, totalTranslations };
  }
}

export const dynamicTranslationService = new DynamicTranslationService();
