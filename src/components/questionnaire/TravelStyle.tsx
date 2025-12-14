import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, ArrowLeft, DollarSign, Sparkles, Plus, Minus, Target, Lightbulb } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const TravelStyle: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('jpy');
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [showAllDietary, setShowAllDietary] = useState(false);
  const [detectedPatterns, setDetectedPatterns] = useState<string[]>([]);

  const allInterests = [
    // 歴史・文化
    { id: 'history-culture', icon: '🏯', category: 'culture' },
    { id: 'temples-shrines', icon: '⛩️', category: 'culture' },
    { id: 'traditional-experience', icon: '🎎', category: 'culture' },
    { id: 'castles-historic-sites', icon: '🏰', category: 'culture' },
    { id: 'museums-galleries', icon: '📚', category: 'culture' },
    
    // 自然・景色
    { id: 'nature-scenery', icon: '🌸', category: 'nature' },
    { id: 'hiking-trekking', icon: '🥾', category: 'nature' },
    { id: 'beach-swimming', icon: '🏖️', category: 'nature' },
    { id: 'forest-mountain-camping', icon: '🌲', category: 'nature' },
    { id: 'national-parks', icon: '🏞️', category: 'nature' },
    { id: 'cycling', icon: '🚴', category: 'nature' },
    
    // エンターテイメント
    { id: 'anime-manga', icon: '🎌', category: 'entertainment' },
    { id: 'nightlife', icon: '🌃', category: 'entertainment' },
    { id: 'shopping', icon: '🛍️', category: 'entertainment' },
    { id: 'urban-architecture', icon: '🏙️', category: 'entertainment' },
    { id: 'cafe-bar-hopping', icon: '🍹', category: 'entertainment' },
    
    // グルメ
    { id: 'food-gourmet', icon: '🍜', category: 'food' },
    { id: 'local-street-food', icon: '🍣', category: 'food' },
    { id: 'wine-sake-tasting', icon: '🍷', category: 'food' },
    { id: 'sweets-cafe', icon: '🍫', category: 'food' },
    
    // イベント・パフォーマンス
    { id: 'festivals-events', icon: '🎆', category: 'events' },
    { id: 'gaming-esports', icon: '🎮', category: 'events' },
    { id: 'performance-live', icon: '🤹‍♂️', category: 'events' },
    { id: 'theater-musical', icon: '🎭', category: 'events' },
    
    // ウェルネス
    { id: 'hot-springs', icon: '♨️', category: 'wellness' },
    { id: 'massage-spa', icon: '💆‍♂️', category: 'wellness' },
    { id: 'fitness-activities', icon: '🏋️‍♂️', category: 'wellness' },
    { id: 'yoga-meditation', icon: '🧘‍♀️', category: 'wellness' },
    
    // テクノロジー
    { id: 'technology', icon: '🤖', category: 'tech' },
    { id: 'vr-ar-experience', icon: '🛸', category: 'tech' },
    { id: 'science-tech-facilities', icon: '🚀', category: 'tech' },
    
    // ファッション
    { id: 'fashion', icon: '👘', category: 'fashion' },
    { id: 'brand-outlet', icon: '👜', category: 'fashion' },
    { id: 'online-shopping', icon: '🛒', category: 'fashion' }
  ];
  
  const dietaryRestrictions = [
    { id: 'halal', icon: '🕋' },
    { id: 'vegetarian', icon: '🌱' },
    { id: 'vegan', icon: '🥬' },
    { id: 'dairy-free', icon: '🥛' },
    { id: 'egg-free', icon: '🍳' },
    { id: 'gluten-free', icon: '🌾' },
    { id: 'no-seafood', icon: '🐟' },
    { id: 'meat-restrictions', icon: '🥩' },
    { id: 'mild-spice', icon: '🌶️' },
    { id: 'allergy-friendly', icon: '🍫' },
    { id: 'organic-preference', icon: '🍃' }
  ];

  const displayedInterests = showAllInterests ? allInterests : allInterests.slice(0, 9);
  const displayedDietary = showAllDietary ? dietaryRestrictions : dietaryRestrictions.slice(0, 9);
  
  // Calculate remaining counts
  const remainingInterests = allInterests.length - 9;
  const remainingDietary = dietaryRestrictions.length - 9;

  const currencies = [
    { code: 'jpy', symbol: '¥', name: t('currencies.jpy') },
    { code: 'usd', symbol: '$', name: t('currencies.usd') },
    { code: 'eur', symbol: '€', name: t('currencies.eur') },
    { code: 'gbp', symbol: '£', name: t('currencies.gbp') },
    { code: 'cny', symbol: '¥', name: t('currencies.cny') },
    { code: 'krw', symbol: '₩', name: t('currencies.krw') },
    { code: 'aud', symbol: 'A$', name: 'オーストラリアドル' },
    { code: 'cad', symbol: 'C$', name: 'カナダドル' },
    { code: 'chf', symbol: 'CHF', name: 'スイスフラン' },
    { code: 'hkd', symbol: 'HK$', name: '香港ドル' },
    { code: 'sgd', symbol: 'S$', name: 'シンガポールドル' },
    { code: 'nzd', symbol: 'NZ$', name: 'ニュージーランドドル' },
    { code: 'sek', symbol: 'kr', name: 'スウェーデンクローナ' },
    { code: 'nok', symbol: 'kr', name: 'ノルウェークローネ' },
    { code: 'dkk', symbol: 'kr', name: 'デンマーククローネ' },
    { code: 'pln', symbol: 'zł', name: 'ポーランドズウォティ' },
    { code: 'czk', symbol: 'Kč', name: 'チェココルナ' },
    { code: 'huf', symbol: 'Ft', name: 'ハンガリーフォリント' },
    { code: 'rub', symbol: '₽', name: 'ロシアルーブル' },
    { code: 'try', symbol: '₺', name: 'トルコリラ' },
    { code: 'zar', symbol: 'R', name: '南アフリカランド' },
    { code: 'brl', symbol: 'R$', name: 'ブラジルレアル' },
    { code: 'mxn', symbol: '$', name: 'メキシコペソ' },
    { code: 'ars', symbol: '$', name: 'アルゼンチンペソ' },
    { code: 'cop', symbol: '$', name: 'コロンビアペソ' },
    { code: 'pen', symbol: 'S/', name: 'ペルーソル' },
    { code: 'clp', symbol: '$', name: 'チリペソ' },
    { code: 'twd', symbol: 'NT$', name: '台湾ドル' },
    { code: 'php', symbol: '₱', name: 'フィリピンペソ' },
    { code: 'idr', symbol: 'Rp', name: 'インドネシアルピア' },
    { code: 'myr', symbol: 'RM', name: 'マレーシアリンギット' },
    { code: 'thb', symbol: '฿', name: 'タイバーツ' },
    { code: 'vnd', symbol: '₫', name: 'ベトナムドン' },
    { code: 'inr', symbol: '₹', name: 'インドルピー' },
    { code: 'pkr', symbol: 'Rs', name: 'パキスタンルピー' },
    { code: 'lkr', symbol: 'Rs', name: 'スリランカルピー' },
    { code: 'npr', symbol: 'Rs', name: 'ネパールルピー' },
    { code: 'bdt', symbol: '৳', name: 'バングラデシュタカ' },
    { code: 'mmk', symbol: 'K', name: 'ミャンマーチャット' },
    { code: 'khr', symbol: '៛', name: 'カンボジアリエル' },
    { code: 'lak', symbol: '₭', name: 'ラオスキープ' },
    { code: 'uzs', symbol: 'лв', name: 'ウズベキスタンソム' },
    { code: 'kzt', symbol: '₸', name: 'カザフスタンテンゲ' },
    { code: 'aed', symbol: 'د.إ', name: 'UAEディルハム' },
    { code: 'sar', symbol: '﷼', name: 'サウジアラビアリヤル' },
    { code: 'qar', symbol: '﷼', name: 'カタールリヤル' },
    { code: 'kwd', symbol: 'د.ك', name: 'クウェートディナール' },
    { code: 'bhd', symbol: '.د.ب', name: 'バーレーンディナール' },
    { code: 'omr', symbol: '﷼', name: 'オマーンリヤル' },
    { code: 'jod', symbol: 'د.ا', name: 'ヨルダンディナール' },
    { code: 'ils', symbol: '₪', name: 'イスラエルシェケル' },
    { code: 'egp', symbol: '£', name: 'エジプトポンド' }
  ];

  useEffect(() => {
    // Load existing data from localStorage
    const savedData = localStorage.getItem('trippin-travel-style');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setSelectedInterests(parsed.interests || []);
      setBudget(parsed.budget || '');
      setCurrency(parsed.currency || 'jpy');
      setDetectedPatterns(parsed.detectedPatterns || []);
    }
  }, []);

  // 興味の組み合わせパターン分析関数
  const analyzeInterestCombinations = (selectedInterests: string[]) => {
    const patterns = {
      'cultural_foodie': {
        interests: ['temples-shrines', 'food-gourmet', 'traditional-experience'],
        name: t('travelStyle.patterns.cultural_foodie.name') || 'Culture × Food Lover',
        description: t('travelStyle.patterns.cultural_foodie.description') || 'Travelers who want to deeply experience traditional culture and gourmet food'
      },
      'nature_adventure': {
        interests: ['hiking-trekking', 'national-parks', 'cycling'],
        name: t('travelStyle.patterns.nature_adventure.name') || 'Nature Adventure Lover',
        description: t('travelStyle.patterns.nature_adventure.description') || 'Travelers who want to actively enjoy nature'
      },
      'urban_modern': {
        interests: ['shopping', 'nightlife', 'technology'],
        name: t('travelStyle.patterns.urban_modern.name') || 'Urban Modern',
        description: t('travelStyle.patterns.urban_modern.description') || 'Travelers who want to enjoy the latest trends and urban culture'
      },
      'wellness_seeker': {
        interests: ['hot-springs', 'massage-spa', 'yoga-meditation'],
        name: t('travelStyle.patterns.wellness_seeker.name') || 'Wellness Seeker',
        description: t('travelStyle.patterns.wellness_seeker.description') || 'Travelers who prioritize physical and mental healing and relaxation'
      },
      'festival_enthusiast': {
        interests: ['festivals-events', 'performance-live', 'theater-musical'],
        name: t('travelStyle.patterns.festival_enthusiast.name') || 'Festival Enthusiast',
        description: t('travelStyle.patterns.festival_enthusiast.description') || 'Travelers who want to enjoy Japan\'s entertainment and festivals'
      },
      'tech_explorer': {
        interests: ['technology', 'vr-ar-experience', 'gaming-esports'],
        name: t('travelStyle.patterns.tech_explorer.name') || 'Tech Explorer',
        description: t('travelStyle.patterns.tech_explorer.description') || 'Travelers interested in cutting-edge technology and digital culture'
      },
      'fashion_lover': {
        interests: ['fashion', 'brand-outlet', 'shopping'],
        name: t('travelStyle.patterns.fashion_lover.name') || 'Fashion Lover',
        description: t('travelStyle.patterns.fashion_lover.description') || 'Travelers interested in Japanese fashion and brands'
      },
      'history_buff': {
        interests: ['history-culture', 'castles-historic-sites', 'museums-galleries'],
        name: t('travelStyle.patterns.history_buff.name') || 'History Buff',
        description: t('travelStyle.patterns.history_buff.description') || 'Travelers who want to deeply learn about Japan\'s history and cultural heritage'
      }
    };

    let detectedPatterns: { name: string; description: string; matchedInterests: string[] }[] = [];
    for (const patternKey in patterns) {
      const pattern = patterns[patternKey as keyof typeof patterns];
      const matchedInterests = pattern.interests.filter(interest => selectedInterests.includes(interest));
      
      // パターンの興味のうち、少なくとも2つが選択されていればパターンとして検出
      if (matchedInterests.length >= 2) {
        detectedPatterns.push({
          name: pattern.name,
          description: pattern.description,
          matchedInterests
        });
      }
    }
    return detectedPatterns;
  };

  useEffect(() => {
    if (selectedInterests.length > 0) {
      const patterns = analyzeInterestCombinations(selectedInterests);
      setDetectedPatterns(patterns.map(p => p.name));
    } else {
      setDetectedPatterns([]);
    }
  }, [selectedInterests]);
  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleNext = () => {
    console.log('🔍 handleNext function called');
    console.log('📊 Selected interests:', selectedInterests);
    console.log('💰 Budget:', budget, currency);
    
    const analysisResults = analyzeInterestCombinations(selectedInterests);
    console.log('🎯 Detected interest patterns:', analysisResults);
    
    const styleData = {
      interests: selectedInterests,
      budget,
      currency,
      detectedPatterns: analysisResults.map(p => p.name),
      patternAnalysis: analysisResults
    };
    localStorage.setItem('trippin-travel-style', JSON.stringify(styleData));
    
    console.log('💾 Enhanced data saved to localStorage:', styleData);
    console.log('🚀 About to navigate to: /questionnaire/details');
    
    navigate('/questionnaire/details');
    
    console.log('✅ Navigation function executed');
  };
  
  const handleBack = () => {
    navigate('/questionnaire/basic');
  };

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full opacity-20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 right-10 w-96 h-96 bg-gradient-to-r from-blue-300 to-teal-300 rounded-full opacity-15 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-10 left-1/3 w-64 h-64 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full opacity-10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <div className="relative z-10 min-h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-red-600 rounded-full mb-6 relative shadow-xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                damping: 10,
                stiffness: 200,
                delay: 0.2 
              }}
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)"
              }}
            >
              <Heart className="w-8 h-8 text-white" />
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>
            
            <motion.h1
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {t('questionnaire.style')}
            </motion.h1>
          </div>

          <motion.div
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
          {/* Interests Selection */}
          <div className="mb-8">
            <motion.h3 
              className="text-xl font-semibold text-gray-800 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              {t('questionnaire.transportationMethods')}
            </motion.h3>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {displayedInterests.map((interest, index) => (
                <motion.button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                    selectedInterests.includes(interest.id)
                      ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100 text-pink-700 shadow-lg'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-50 hover:to-white bg-white/50 backdrop-blur-sm'
                  }`}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Animated background effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    initial={false}
                    animate={selectedInterests.includes(interest.id) ? { opacity: 0.1 } : { opacity: 0 }}
                  />
                  
                  <motion.div 
                    className="text-3xl mb-2 relative z-10"
                    animate={selectedInterests.includes(interest.id) ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {interest.icon}
                  </motion.div>
                  <div className="text-sm font-medium relative z-10">
                    {t(`questionnaire.${interest.id}`) || interest.id}
                  </div>
                  
                  {/* Selected indicator */}
                  {selectedInterests.includes(interest.id) && (
                    <motion.div
                      className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      <motion.div
                        className="w-3 h-3 bg-white rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </motion.div>
            
            {remainingInterests > 0 && (
              <div className="text-center">
                <motion.button
                  onClick={() => setShowAllInterests(!showAllInterests)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showAllInterests ? (
                    <>
                      <Minus className="w-4 h-4" />
                      {t('common.showLess')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t('common.showMore').replace('{count}', remainingInterests.toString())}
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* Dietary Restrictions */}
          <div className="mb-8">
            <motion.h3 
              className="text-xl font-semibold text-gray-800 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              {t('questionnaire.accommodationTypes')}
            </motion.h3>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {displayedDietary.map((dietary, index) => (
                <motion.button
                  key={dietary.id}
                  onClick={() => toggleInterest(dietary.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                    selectedInterests.includes(dietary.id)
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-lg'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gradient-to-br hover:from-green-50 hover:to-white bg-white/50 backdrop-blur-sm'
                  }`}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Animated background effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    initial={false}
                    animate={selectedInterests.includes(dietary.id) ? { opacity: 0.1 } : { opacity: 0 }}
                  />
                  
                  <motion.div 
                    className="text-3xl mb-2 relative z-10"
                    animate={selectedInterests.includes(dietary.id) ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {dietary.icon}
                  </motion.div>
                  <div className="text-sm font-medium relative z-10">
                    {t(`questionnaire.${dietary.id}`) || dietary.id}
                  </div>
                  
                  {/* Selected indicator */}
                  {selectedInterests.includes(dietary.id) && (
                    <motion.div
                      className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      <motion.div
                        className="w-3 h-3 bg-white rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </motion.div>
            
            {remainingDietary > 0 && (
              <div className="text-center">
                <motion.button
                  onClick={() => setShowAllDietary(!showAllDietary)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showAllDietary ? (
                    <>
                      <Minus className="w-4 h-4" />
                      {t('common.showLess')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t('common.showMore').replace('{count}', remainingDietary.toString())}
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* Detected Patterns Display */}
          {detectedPatterns.length > 0 && (
            <motion.div
              className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{t('questionnaire.yourTravelStyle')}</h3>
              </div>
              <div className="space-y-3">
                {analyzeInterestCombinations(selectedInterests).map((pattern, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-white rounded-xl shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                  >
                    <Lightbulb className="w-5 h-5 text-indigo-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-800">{pattern.name}</h4>
                      <p className="text-sm text-gray-600">{pattern.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pattern.matchedInterests.map((interest, i) => (
                          <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            {t(`questionnaire.${interest}`) || interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-indigo-100 rounded-lg">
                <p className="text-sm text-indigo-700">
                  💡 {t('questionnaire.aiPatternAnalysis')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div 
            className="mb-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex justify-between items-center">
              <motion.button
                onClick={() => setSelectedInterests([...allInterests.map(i => i.id), ...dietaryRestrictions.map(d => d.id)])}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-full transition-all duration-300 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                {t('questionnaire.selectAll')}
              </motion.button>
              
              <div className="text-sm text-gray-600 font-medium bg-white px-4 py-2 rounded-full shadow-sm">
                {selectedInterests.length} / {allInterests.length + dietaryRestrictions.length}
              </div>
              
              <motion.button
                onClick={() => setSelectedInterests([])}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all duration-300 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Minus className="w-4 h-4" />
                {t('questionnaire.deselectAll')}
              </motion.button>
            </div>
          </motion.div>

          {/* Budget */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('questionnaire.budget')}</h3>
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <motion.div
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                    animate={{ rotate: budget ? 360 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <DollarSign className="w-5 h-5" />
                  </motion.div>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder={t('questionnaire.budgetPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>
              <motion.select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all duration-300 bg-white/50 backdrop-blur-sm max-h-48 overflow-y-auto"
                whileFocus={{ scale: 1.02 }}
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name}
                  </option>
                ))}
              </motion.select>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between">
            <motion.button
              onClick={handleBack}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors rounded-xl hover:bg-gray-100"
              whileHover={{ x: -5, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('common.back')}</span>
            </motion.button>
            
            <motion.button
              onClick={handleNext}
              disabled={selectedInterests.length === 0}
              className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all relative overflow-hidden ${
                selectedInterests.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
              }`}
              whileHover={selectedInterests.length > 0 ? { scale: 1.05, y: -2 } : {}}
              whileTap={selectedInterests.length > 0 ? { scale: 0.98 } : {}}
            >
              {selectedInterests.length > 0 && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-400 to-red-400 opacity-20"
                  animate={{ 
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              <span className="relative z-10">{t('common.next')}</span>
              <ArrowRight className="w-5 h-5 relative z-10" />
            </motion.button>
          </div>

        {/* Progress Indicator */}
        <motion.div
          className="mt-8 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="flex space-x-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index < 2 ? 'bg-pink-500' : 'bg-gray-300'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TravelStyle;