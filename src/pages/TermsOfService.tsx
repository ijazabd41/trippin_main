import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
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
            <h1 className="text-3xl font-bold text-gray-800">{t('legal.terms.title')}</h1>
          </div>
        </motion.div>

        {/* Terms Content */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">{t('legal.lastUpdated')}: {t('legal.lastUpdatedDate')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article1.title')}</h2>
            <p className="mb-4">{t('legal.terms.article1.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article2.title')}</h2>
            <p className="mb-4">{t('legal.terms.article2.p1')}</p>
            <p className="mb-4">{t('legal.terms.article2.p2')}</p>
            <ul className="list-disc pl-6 mb-4">
              <li>{t('legal.terms.article2.list.0')}</li>
              <li>{t('legal.terms.article2.list.1')}</li>
              <li>{t('legal.terms.article2.list.2')}</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article3.title')}</h2>
            <p className="mb-4">{t('legal.terms.article3.p1')}</p>
            <p className="mb-4">{t('legal.terms.article3.p2')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article4.title')}</h2>
            <p className="mb-4">{t('legal.terms.article4.p1')}</p>
            <p className="mb-4">{t('legal.terms.article4.p2')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article5.title')}</h2>
            <p className="mb-4">{t('legal.terms.article5.p1')}</p>
            <ul className="list-disc pl-6 mb-4">
              <li>{t('legal.terms.article5.list.0')}</li>
              <li>{t('legal.terms.article5.list.1')}</li>
              <li>{t('legal.terms.article5.list.2')}</li>
              <li>{t('legal.terms.article5.list.3')}</li>
              <li>{t('legal.terms.article5.list.4')}</li>
              <li>{t('legal.terms.article5.list.5')}</li>
              <li>{t('legal.terms.article5.list.6')}</li>
              <li>{t('legal.terms.article5.list.7')}</li>
              <li>{t('legal.terms.article5.list.8')}</li>
              <li>{t('legal.terms.article5.list.9')}</li>
              <li>{t('legal.terms.article5.list.10')}</li>
              <li>{t('legal.terms.article5.list.11')}</li>
              <li>{t('legal.terms.article5.list.12')}</li>
              <li>{t('legal.terms.article5.list.13')}</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article6.title')}</h2>
            <p className="mb-4">{t('legal.terms.article6.p1')}</p>
            <ul className="list-disc pl-6 mb-4">
              <li>{t('legal.terms.article6.list.0')}</li>
              <li>{t('legal.terms.article6.list.1')}</li>
              <li>{t('legal.terms.article6.list.2')}</li>
              <li>{t('legal.terms.article6.list.3')}</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article7.title')}</h2>
            <p className="mb-4">{t('legal.terms.article7.p1')}</p>
            <ul className="list-disc pl-6 mb-4">
              <li>{t('legal.terms.article7.list.0')}</li>
              <li>{t('legal.terms.article7.list.1')}</li>
              <li>{t('legal.terms.article7.list.2')}</li>
              <li>{t('legal.terms.article7.list.3')}</li>
              <li>{t('legal.terms.article7.list.4')}</li>
              <li>{t('legal.terms.article7.list.5')}</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article8.title')}</h2>
            <p className="mb-4">{t('legal.terms.article8.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article9.title')}</h2>
            <p className="mb-4">{t('legal.terms.article9.p1')}</p>
            <p className="mb-4">{t('legal.terms.article9.p2')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article10.title')}</h2>
            <p className="mb-4">{t('legal.terms.article10.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article11.title')}</h2>
            <p className="mb-4">{t('legal.terms.article11.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article12.title')}</h2>
            <p className="mb-4">{t('legal.terms.article12.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article13.title')}</h2>
            <p className="mb-4">{t('legal.terms.article13.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article14.title')}</h2>
            <p className="mb-4">{t('legal.terms.article14.p1')}</p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('legal.terms.article15.title')}</h2>
            <p className="mb-4">{t('legal.terms.article15.p1')}</p>
            <p className="mb-4">{t('legal.terms.article15.p2')}</p>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{t('legal.terms.footer.note')}</p>
              <p className="text-sm text-gray-600 mt-2">
                {t('legal.companyName')}<br />
                {t('legal.terms.footer.established')}: {t('legal.lastUpdatedDate')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;