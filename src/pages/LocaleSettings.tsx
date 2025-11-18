import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, DollarSign, Clock, MapPin, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LocaleSettings: React.FC = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const [settings, setSettings] = useState({
    language: currentLanguage,
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    region: 'JP',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    numberFormat: 'comma'
  });

  const languages = [
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  const currencies = [
    { code: 'JPY', name: '日本円', symbol: '¥' },
    { code: 'USD', name: '米ドル', symbol: '$' },
    { code: 'EUR', name: 'ユーロ', symbol: '€' },
    { code: 'GBP', name: '英ポンド', symbol: '£' },
    { code: 'CNY', name: '中国元', symbol: '¥' },
    { code: 'KRW', name: '韓国ウォン', symbol: '₩' },
    { code: 'THB', name: 'タイバーツ', symbol: '฿' },
    { code: 'SGD', name: 'シンガポールドル', symbol: 'S$' }
  ];

  const timezones = [
    { code: 'Asia/Tokyo', name: '日本標準時 (JST)', offset: '+09:00' },
    { code: 'America/New_York', name: '東部標準時 (EST)', offset: '-05:00' },
    { code: 'America/Los_Angeles', name: '太平洋標準時 (PST)', offset: '-08:00' },
    { code: 'Europe/London', name: 'グリニッジ標準時 (GMT)', offset: '+00:00' },
    { code: 'Asia/Shanghai', name: '中国標準時 (CST)', offset: '+08:00' },
    { code: 'Asia/Seoul', name: '韓国標準時 (KST)', offset: '+09:00' },
    { code: 'Asia/Bangkok', name: 'インドシナ時間 (ICT)', offset: '+07:00' },
    { code: 'Asia/Singapore', name: 'シンガポール標準時 (SGT)', offset: '+08:00' }
  ];

  const regions = [
    { code: 'JP', name: '日本', flag: '🇯🇵' },
    { code: 'US', name: 'アメリカ', flag: '🇺🇸' },
    { code: 'CN', name: '中国', flag: '🇨🇳' },
    { code: 'KR', name: '韓国', flag: '🇰🇷' },
    { code: 'GB', name: 'イギリス', flag: '🇬🇧' },
    { code: 'FR', name: 'フランス', flag: '🇫🇷' },
    { code: 'DE', name: 'ドイツ', flag: '🇩🇪' },
    { code: 'TH', name: 'タイ', flag: '🇹🇭' }
  ];

  const handleSave = () => {
    changeLanguage(settings.language);
    // Save other settings to localStorage or API
    localStorage.setItem('trippin-locale-settings', JSON.stringify(settings));
  };

  const updateSetting = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const getPreviewText = () => {
    const now = new Date();
    const price = 25000;
    
    return {
      date: settings.dateFormat === 'YYYY/MM/DD' 
        ? now.toLocaleDateString('ja-JP') 
        : now.toLocaleDateString('en-US'),
      time: settings.timeFormat === '24h' 
        ? now.toLocaleTimeString('ja-JP', { hour12: false })
        : now.toLocaleTimeString('en-US', { hour12: true }),
      price: settings.numberFormat === 'comma' 
        ? `${currencies.find(c => c.code === settings.currency)?.symbol}${price.toLocaleString()}`
        : `${currencies.find(c => c.code === settings.currency)?.symbol}${price}`
    };
  };

  const preview = getPreviewText();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('settings.locale.title')}</h1>
          <p className="text-lg text-gray-600">{t('settings.locale.subtitle')}</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Language Settings */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t('settings.locale.language.title')}</h2>
                  <p className="text-gray-600">{t('settings.locale.language.description')}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {languages.map((lang) => (
                  <label
                    key={lang.code}
                    className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${
                      settings.language === lang.code
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="language"
                      value={lang.code}
                      checked={settings.language === lang.code}
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="text-purple-600"
                    />
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </label>
                ))}
              </div>
            </motion.div>

              {/* Currency Settings */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t('settings.locale.currency.title')}</h2>
                  <p className="text-gray-600">{t('settings.locale.currency.description')}</p>
                </div>
              </div>

              <select
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </motion.div>

              {/* Time Settings */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t('settings.locale.time.title')}</h2>
                  <p className="text-gray-600">{t('settings.locale.time.description')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.locale.time.timezone')}</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.code} value={tz.code}>
                        {tz.name} ({tz.offset})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.locale.time.timeFormat')}</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="24h"
                        checked={settings.timeFormat === '24h'}
                        onChange={(e) => updateSetting('timeFormat', e.target.value)}
                        className="text-purple-600"
                      />
                      <span>{t('settings.locale.time.format24h')}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="12h"
                        checked={settings.timeFormat === '12h'}
                        onChange={(e) => updateSetting('timeFormat', e.target.value)}
                        className="text-purple-600"
                      />
                      <span>{t('settings.locale.time.format12h')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>

              {/* Region Settings */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t('settings.locale.region.title')}</h2>
                  <p className="text-gray-600">{t('settings.locale.region.description')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.locale.region.region')}</label>
                  <select
                    value={settings.region}
                    onChange={(e) => updateSetting('region', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {regions.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.flag} {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.locale.region.dateFormat')}</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="YYYY/MM/DD"
                        checked={settings.dateFormat === 'YYYY/MM/DD'}
                        onChange={(e) => updateSetting('dateFormat', e.target.value)}
                        className="text-purple-600"
                      />
                      <span>YYYY/MM/DD</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="MM/DD/YYYY"
                        checked={settings.dateFormat === 'MM/DD/YYYY'}
                        onChange={(e) => updateSetting('dateFormat', e.target.value)}
                        className="text-purple-600"
                      />
                      <span>MM/DD/YYYY</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.locale.region.numberFormat')}</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="numberFormat"
                        value="comma"
                        checked={settings.numberFormat === 'comma'}
                        onChange={(e) => updateSetting('numberFormat', e.target.value)}
                        className="text-purple-600"
                      />
                      <span>{t('settings.locale.region.formatComma')}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="numberFormat"
                        value="space"
                        checked={settings.numberFormat === 'space'}
                        onChange={(e) => updateSetting('numberFormat', e.target.value)}
                        className="text-purple-600"
                      />
                      <span>{t('settings.locale.region.formatSpace')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t('settings.locale.preview.title')}</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{t('settings.locale.preview.language')}</span>
                  <br />
                  <span className="text-gray-600">
                    {languages.find(l => l.code === settings.language)?.name}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">{t('settings.locale.preview.date')}</span>
                  <br />
                  <span className="text-gray-600">{preview.date}</span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">{t('settings.locale.preview.time')}</span>
                  <br />
                  <span className="text-gray-600">{preview.time}</span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">{t('settings.locale.preview.price')}</span>
                  <br />
                  <span className="text-gray-600">{preview.price}</span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">{t('settings.locale.preview.timezone')}</span>
                  <br />
                  <span className="text-gray-600">
                    {timezones.find(tz => tz.code === settings.timezone)?.name}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.button
              onClick={handleSave}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Save className="w-5 h-5" />
              <span>{t('settings.locale.actions.save')}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocaleSettings;