import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const PrivacyPolicy: React.FC = () => {
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
            <FileText className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">{t('legal.privacy.title')}</h1>
          </div>
        </motion.div>

        {/* Privacy Policy Content */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">{t('legal.lastUpdated')}: {t('legal.lastUpdatedDate')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article1.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article1.content')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article2.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article2.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article3.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article3.p1')}</p>
            <ul className="list-disc pl-6 mb-4">
              <li>{t('legal.privacy.article3.list.0')}</li>
              <li>{t('legal.privacy.article3.list.1')}</li>
              <li>{t('legal.privacy.article3.list.2')}</li>
              <li>{t('legal.privacy.article3.list.3')}</li>
              <li>{t('legal.privacy.article3.list.4')}</li>
              <li>{t('legal.privacy.article3.list.5')}</li>
              <li>{t('legal.privacy.article3.list.6')}</li>
              <li>{t('legal.privacy.article3.list.7')}</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article4.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article4.p1')}</p>
            <p className="mb-4">{t('legal.privacy.article4.p2')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article5.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article5.p1')}</p>
            <ul className="list-disc pl-6 mb-4">
              <li>{t('legal.privacy.article5.list.0')}</li>
              <li>{t('legal.privacy.article5.list.1')}</li>
              <li>{t('legal.privacy.article5.list.2')}</li>
              <li>{t('legal.privacy.article5.list.3')}</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article6.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article6.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article7.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article7.p1')}</p>
            <p className="mb-4">{t('legal.privacy.article7.p2')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article8.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article8.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article9.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article9.p1')}</p>
            <p className="mb-4">{t('legal.privacy.article9.p2')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.privacy.article10.title')}</h2>
            <p className="mb-4">{t('legal.privacy.article10.p1')}</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">{t('legal.companyName')}</p>
              <p>{t('legal.contact.address')}</p>
              <p>{t('legal.contact.representative')}</p>
              <p>{t('legal.contact.department')}</p>
              <p>{t('legal.contact.email')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;