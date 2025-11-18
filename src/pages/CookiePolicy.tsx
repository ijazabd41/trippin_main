import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const CookiePolicy: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-24">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center space-x-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('common.back')}</span>
          </button>
          <div className="flex items-center space-x-3">
            <Cookie className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">{t('legal.cookies.title')}</h1>
          </div>
        </motion.div>

        {/* Cookie Policy Content */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">{t('legal.lastUpdated')}: {t('legal.lastUpdatedDate')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.cookies.article1.title')}</h2>
            <p className="mb-4">{t('legal.cookies.article1.content')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.cookies.article2.title')}</h2>
            <p className="mb-4">{t('legal.cookies.article2.content')}</p>
            <ul className="list-disc pl-6 mb-4">
              <li>{t('legal.cookies.article2.purposes.essential')}</li>
              <li>{t('legal.cookies.article2.purposes.functional')}</li>
              <li>{t('legal.cookies.article2.purposes.analytics')}</li>
              <li>{t('legal.cookies.article2.purposes.marketing')}</li>
              <li>{t('legal.cookies.article2.purposes.performance')}</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.cookies.article3.title')}</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('legal.cookies.article3.essential.title')}</h3>
            <p className="mb-4">{t('legal.cookies.article3.essential.description')}</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <ul className="text-sm space-y-1">
                <li><strong>trippin-session</strong>: {t('legal.cookies.article3.essential.cookies.trippin-session')}</li>
                <li><strong>trippin-auth</strong>: {t('legal.cookies.article3.essential.cookies.trippin-auth')}</li>
                <li><strong>trippin-language</strong>: {t('legal.cookies.article3.essential.cookies.trippin-language')}</li>
                <li><strong>trippin-csrf</strong>: {t('legal.cookies.article3.essential.cookies.trippin-csrf')}</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('legal.cookies.article3.functional.title')}</h3>
            <p className="mb-4">{t('legal.cookies.article3.functional.description')}</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <ul className="text-sm space-y-1">
                <li><strong>trippin-preferences</strong>: {t('legal.cookies.article3.functional.cookies.trippin-preferences')}</li>
                <li><strong>trippin-theme</strong>: {t('legal.cookies.article3.functional.cookies.trippin-theme')}</li>
                <li><strong>trippin-locale</strong>: {t('legal.cookies.article3.functional.cookies.trippin-locale')}</li>
                <li><strong>trippin-notifications</strong>: {t('legal.cookies.article3.functional.cookies.trippin-notifications')}</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('legal.cookies.article3.analytics.title')}</h3>
            <p className="mb-4">{t('legal.cookies.article3.analytics.description')}</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <ul className="text-sm space-y-1">
                <li><strong>_ga</strong>: {t('legal.cookies.article3.analytics.cookies._ga')}</li>
                <li><strong>_ga_*</strong>: {t('legal.cookies.article3.analytics.cookies._ga_*')}</li>
                <li><strong>trippin-analytics</strong>: {t('legal.cookies.article3.analytics.cookies.trippin-analytics')}</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('legal.cookies.article3.marketing.title')}</h3>
            <p className="mb-4">{t('legal.cookies.article3.marketing.description')}</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <ul className="text-sm space-y-1">
                <li><strong>trippin-marketing</strong>: {t('legal.cookies.article3.marketing.cookies.trippin-marketing')}</li>
                <li><strong>trippin-ads</strong>: {t('legal.cookies.article3.marketing.cookies.trippin-ads')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.cookies.article4.title')}</h2>
            <p className="mb-4">{t('legal.cookies.article4.content')}</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Google Analytics</strong>: {t('legal.cookies.article4.services.googleAnalytics')}</li>
              <li><strong>Google Maps</strong>: {t('legal.cookies.article4.services.googleMaps')}</li>
              <li><strong>Stripe</strong>: {t('legal.cookies.article4.services.stripe')}</li>
              <li><strong>Auth0</strong>: {t('legal.cookies.article4.services.auth0')}</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.cookies.article5.title')}</h2>
            <p className="mb-4">{t('legal.cookies.article5.content')}</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('legal.cookies.article5.browserSettings.title')}</h3>
            <div className="space-y-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Google Chrome</h4>
                <p className="text-sm text-gray-700">{t('legal.cookies.article5.browserSettings.chrome')}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Mozilla Firefox</h4>
                <p className="text-sm text-gray-700">{t('legal.cookies.article5.browserSettings.firefox')}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Safari</h4>
                <p className="text-sm text-gray-700">{t('legal.cookies.article5.browserSettings.safari')}</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.cookies.article6.title')}</h2>
            <p className="mb-4">{t('legal.cookies.article6.content')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.cookies.article7.title')}</h2>
            <p className="mb-4">{t('legal.cookies.article7.content')}</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">{t('legal.companyName')}</p>
              <p>{t('legal.contact.address')}</p>
              <p>{t('legal.contact.representative')}</p>
              <p>{t('legal.contact.departmentPrivacy')}</p>
              <p>{t('legal.contact.email')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CookiePolicy;