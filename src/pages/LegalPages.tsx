import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Shield, Cookie, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const LegalPages: React.FC = () => {
  const { t } = useTranslation();

  const legalSections = [
    {
      id: 'terms',
      title: t('legal.terms.title', '利用規約'),
      description: t('legal.terms.description', 'サービスの利用条件について'),
      icon: FileText,
      path: '/legal/terms'
    },
    {
      id: 'privacy',
      title: t('legal.privacy.title', 'プライバシーポリシー'),
      description: t('legal.privacy.description', '個人情報の取り扱いについて'),
      icon: Shield,
      path: '/legal/privacy'
    },
    {
      id: 'cookies',
      title: t('legal.cookies.title', 'クッキーポリシー'),
      description: t('legal.cookies.description', 'クッキーの使用について'),
      icon: Cookie,
      path: '/legal/cookies'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('legal.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('legal.subtitle')}
          </p>
        </motion.div>

        {/* Legal Sections */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {legalSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center mb-4">
                <section.icon className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  {section.title}
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                {section.description}
              </p>
              <Link
                to={section.path}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('legal.readMore')}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.backToHome')}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default LegalPages;