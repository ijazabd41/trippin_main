import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, MessageCircle, Mail, Phone, Book } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext'; 

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const HelpFAQ: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const categories = [
    { key: 'all', label: t('help.allCategories') },
    { key: 'account', label: t('help.account') },
    { key: 'booking', label: t('help.booking') },
    { key: 'payment', label: t('help.payment') },
    { key: 'esim', label: t('help.esim') },
    { key: 'travel', label: t('help.travel') },
    { key: 'technical', label: t('help.technical') }
  ];

  const faqItems: FAQItem[] = [
    {
      id: 'faq_1',
      question: t('help.faq1.question') || 'アカウントを作成するにはどうすればよいですか？',
      answer: t('help.faq1.answer') || 'ホームページの「新規登録」ボタンをクリックし、メールアドレスとパスワードを入力してください。GoogleやAppleアカウントでも登録できます。',
      category: 'account'
    },
    {
      id: 'faq_2',
      question: t('help.faq2.question') || 'パスワードを忘れた場合はどうすればよいですか？',
      answer: t('help.faq2.answer') || 'ログインページの「パスワードを忘れた方」をクリックし、登録したメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。',
      category: 'account'
    },
    {
      id: 'faq_3',
      question: t('help.faq3.question') || 'ホテルの予約をキャンセルできますか？',
      answer: t('help.faq3.answer') || 'はい、予約管理ページからキャンセルできます。ただし、キャンセル料金や期限はホテルによって異なりますので、予約詳細をご確認ください。',
      category: 'booking'
    },
    {
      id: 'faq_4',
      question: t('help.faq4.question') || '支払い方法は何が利用できますか？',
      answer: t('help.faq4.answer') || 'クレジットカード（Visa、Mastercard、JCB、American Express）、PayPal、Apple Pay、Google Payがご利用いただけます。',
      category: 'payment'
    },
    {
      id: 'faq_5',
      question: t('help.faq5.question') || 'eSIMはどのデバイスで使用できますか？',
      answer: t('help.faq5.answer') || 'iPhone XS以降、Google Pixel 3以降、Samsung Galaxy S20以降など、eSIM対応デバイスでご利用いただけます。詳細な対応機種リストはeSIM管理ページでご確認ください。',
      category: 'esim'
    },
    {
      id: 'faq_6',
      question: t('help.faq6.question') || 'eSIMの設定方法を教えてください',
      answer: t('help.faq6.answer') || '購入後にQRコードが発行されます。設定→モバイル通信→モバイル通信プランを追加→QRコードをスキャンの順で設定してください。詳細な手順書もお送りします。',
      category: 'esim'
    },
    {
      id: 'faq_7',
      question: t('help.faq7.question') || 'AIが生成した旅程を変更できますか？',
      answer: t('help.faq7.answer') || 'はい、有料プランでは旅程の編集・カスタマイズが可能です。アクティビティの追加・削除、時間の変更、新しいスポットの提案などができます。',
      category: 'travel'
    },
    {
      id: 'faq_8',
      question: t('help.faq8.question') || 'アプリが正常に動作しない場合はどうすればよいですか？',
      answer: t('help.faq8.answer') || 'まずアプリを再起動してください。それでも解決しない場合は、アプリを最新版に更新するか、デバイスを再起動してください。問題が続く場合はサポートにお問い合わせください。',
      category: 'technical'
    },
    {
      id: 'faq_9',
      question: t('help.faq9.question') || '返金はできますか？',
      answer: t('help.faq9.answer') || 'サービス開始から7日以内であれば、未使用分について返金が可能です。詳細は利用規約をご確認いただくか、サポートまでお問い合わせください。',
      category: 'payment'
    },
    {
      id: 'faq_10',
      question: t('help.faq10.question') || '旅行中にサポートを受けることはできますか？',
      answer: t('help.faq10.answer') || 'はい、24時間AIコンシェルジュがご利用いただけます。緊急時には専用サポートラインもご利用ください。チャット機能で即座にサポートを受けることができます。',
      category: 'travel'
    }
  ];

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('help.title')}</h1>
          <p className="text-lg text-gray-600">{t('help.subtitle')}</p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('help.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.key === 'all' ? t('help.allCategories') : 
                   category.key === 'account' ? t('help.account') :
                   category.key === 'booking' ? t('help.booking') :
                   category.key === 'payment' ? t('help.payment') :
                   category.key === 'esim' ? t('help.esim') :
                   category.key === 'travel' ? t('help.travel') :
                   category.key === 'technical' ? t('help.technical') : category.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-8">
          {filteredFAQs.map((item, index) => (
            <motion.div
              key={item.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <button
                onClick={() => toggleExpanded(item.id)}
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 pr-4">
                    {item.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedItems.includes(item.id) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              
              <AnimatePresence>
                {expandedItems.includes(item.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6">
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('help.noResults')}</h3>
            <p className="text-gray-600">{t('help.noResultsDescription')}</p>
          </motion.div>
        )}

        {/* Contact Support */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {t('help.contactSupport')}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              className="text-center p-6 border border-gray-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open('/chat', '_blank')}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('help.chatSupport')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('help.chatSupportDescription')}</p>
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                {t('help.startChat')}
              </span>
            </motion.div>

            <motion.div
              className="text-center p-6 border border-gray-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = 'mailto:support@trippin.com'}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('help.emailSupport')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('help.emailSupportDescription')}</p>
              <span className="text-green-600 hover:text-green-700 font-medium">
                {t('help.sendEmail')}
              </span>
            </motion.div>

            <motion.div
              className="text-center p-6 border border-gray-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = 'tel:+81-3-1234-5678'}
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{t('help.phoneSupport')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('help.phoneSupportDescription')}</p>
              <span className="text-purple-600 hover:text-purple-700 font-medium">
                {t('help.makeCall')}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* User Guide */}
        <motion.div
          className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{t('help.userGuide')}</h3>
              <p className="text-gray-600">{t('help.userGuideDescription')}</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <button className="text-left p-4 bg-white rounded-xl hover:bg-purple-50 transition-colors">
              <h4 className="font-medium text-gray-800 mb-1">{t('help.gettingStarted')}</h4>
              <p className="text-sm text-gray-600">{t('help.gettingStartedDescription')}</p>
            </button>
            <button className="text-left p-4 bg-white rounded-xl hover:bg-purple-50 transition-colors">
              <h4 className="font-medium text-gray-800 mb-1">{t('help.esimSetupGuide')}</h4>
              <p className="text-sm text-gray-600">{t('help.esimSetupDescription')}</p>
            </button>
            <button className="text-left p-4 bg-white rounded-xl hover:bg-purple-50 transition-colors">
              <h4 className="font-medium text-gray-800 mb-1">{t('help.customizeItinerary')}</h4>
              <p className="text-sm text-gray-600">{t('help.customizeDescription')}</p>
            </button>
            <button className="text-left p-4 bg-white rounded-xl hover:bg-purple-50 transition-colors">
              <h4 className="font-medium text-gray-800 mb-1">{t('help.troubleshooting')}</h4>
              <p className="text-sm text-gray-600">{t('help.troubleshootingDescription')}</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpFAQ;