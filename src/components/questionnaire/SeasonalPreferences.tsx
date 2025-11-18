import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sun, ArrowRight, ArrowLeft, Sparkles, CloudRain, Snowflake, Leaf, Cherry, Thermometer, Cloud, Umbrella, Globe, Calendar } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const SeasonalPreferences: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // 神レベルの季節・天候好みの質問定義
  const seasonalQuestions = [
    {
      id: 'preferred_season',
      question: t('questionnaire.seasonal.preferred_season.question'),
      description: t('questionnaire.seasonal.preferred_season.description'),
      type: 'single_choice',
      icon: '🌸',
      options: [
        { 
          id: 'spring', 
          label: t('questionnaire.seasonal.preferred_season.options.spring.label'), 
          icon: '🌸', 
          description: t('questionnaire.seasonal.preferred_season.options.spring.description'),
          details: t('questionnaire.seasonal.preferred_season.options.spring.details'),
          gradient: 'from-pink-400 via-rose-400 to-green-400',
          features: [t('questionnaire.seasonal.preferred_season.options.spring.features.0'), t('questionnaire.seasonal.preferred_season.options.spring.features.1'), t('questionnaire.seasonal.preferred_season.options.spring.features.2'), t('questionnaire.seasonal.preferred_season.options.spring.features.3')],
          temperature: t('questionnaire.seasonal.preferred_season.options.spring.temperature'),
          activities: [t('questionnaire.seasonal.preferred_season.options.spring.activities.0'), t('questionnaire.seasonal.preferred_season.options.spring.activities.1'), t('questionnaire.seasonal.preferred_season.options.spring.activities.2')]
        },
        { 
          id: 'summer', 
          label: t('questionnaire.seasonal.preferred_season.options.summer.label'), 
          icon: '🌞', 
          description: t('questionnaire.seasonal.preferred_season.options.summer.description'),
          details: t('questionnaire.seasonal.preferred_season.options.summer.details'),
          gradient: 'from-yellow-400 via-orange-400 to-red-400',
          features: [t('questionnaire.seasonal.preferred_season.options.summer.features.0'), t('questionnaire.seasonal.preferred_season.options.summer.features.1'), t('questionnaire.seasonal.preferred_season.options.summer.features.2'), t('questionnaire.seasonal.preferred_season.options.summer.features.3')],
          temperature: t('questionnaire.seasonal.preferred_season.options.summer.temperature'),
          activities: [t('questionnaire.seasonal.preferred_season.options.summer.activities.0'), t('questionnaire.seasonal.preferred_season.options.summer.activities.1'), t('questionnaire.seasonal.preferred_season.options.summer.activities.2')]
        },
        { 
          id: 'autumn', 
          label: t('questionnaire.seasonal.preferred_season.options.autumn.label'), 
          icon: '🍁', 
          description: t('questionnaire.seasonal.preferred_season.options.autumn.description'),
          details: t('questionnaire.seasonal.preferred_season.options.autumn.details'),
          gradient: 'from-orange-400 via-red-400 to-amber-400',
          features: [t('questionnaire.seasonal.preferred_season.options.autumn.features.0'), t('questionnaire.seasonal.preferred_season.options.autumn.features.1'), t('questionnaire.seasonal.preferred_season.options.autumn.features.2'), t('questionnaire.seasonal.preferred_season.options.autumn.features.3')],
          temperature: t('questionnaire.seasonal.preferred_season.options.autumn.temperature'),
          activities: [t('questionnaire.seasonal.preferred_season.options.autumn.activities.0'), t('questionnaire.seasonal.preferred_season.options.autumn.activities.1'), t('questionnaire.seasonal.preferred_season.options.autumn.activities.2')]
        },
        { 
          id: 'winter', 
          label: t('questionnaire.seasonal.preferred_season.options.winter.label'), 
          icon: '⛄', 
          description: t('questionnaire.seasonal.preferred_season.options.winter.description'),
          details: t('questionnaire.seasonal.preferred_season.options.winter.details'),
          gradient: 'from-blue-400 via-indigo-400 to-purple-400',
          features: [t('questionnaire.seasonal.preferred_season.options.winter.features.0'), t('questionnaire.seasonal.preferred_season.options.winter.features.1'), t('questionnaire.seasonal.preferred_season.options.winter.features.2'), t('questionnaire.seasonal.preferred_season.options.winter.features.3')],
          temperature: t('questionnaire.seasonal.preferred_season.options.winter.temperature'),
          activities: [t('questionnaire.seasonal.preferred_season.options.winter.activities.0'), t('questionnaire.seasonal.preferred_season.options.winter.activities.1'), t('questionnaire.seasonal.preferred_season.options.winter.activities.2')]
        }
      ]
    },
    {
      id: 'weather_flexibility',
      question: t('questionnaire.seasonal.weather_flexibility.question'),
      description: t('questionnaire.seasonal.weather_flexibility.description'),
      type: 'single_choice',
      icon: '☔',
      options: [
        { 
          id: 'weather_strict', 
          label: t('questionnaire.seasonal.weather_flexibility.options.weather_strict.label'), 
          icon: '🌧️', 
          description: t('questionnaire.seasonal.weather_flexibility.options.weather_strict.description'),
          details: t('questionnaire.seasonal.weather_flexibility.options.weather_strict.details'),
          gradient: 'from-gray-400 to-blue-400',
          personality: t('questionnaire.seasonal.weather_flexibility.options.weather_strict.personality')
        },
        { 
          id: 'weather_flexible', 
          label: t('questionnaire.seasonal.weather_flexibility.options.weather_flexible.label'), 
          icon: '🌤️', 
          description: t('questionnaire.seasonal.weather_flexibility.options.weather_flexible.description'),
          details: t('questionnaire.seasonal.weather_flexibility.options.weather_flexible.details'),
          gradient: 'from-blue-400 to-green-400',
          personality: t('questionnaire.seasonal.weather_flexibility.options.weather_flexible.personality')
        },
        { 
          id: 'weather_indoor', 
          label: t('questionnaire.seasonal.weather_flexibility.options.weather_indoor.label'), 
          icon: '🏢', 
          description: t('questionnaire.seasonal.weather_flexibility.options.weather_indoor.description'),
          details: t('questionnaire.seasonal.weather_flexibility.options.weather_indoor.details'),
          gradient: 'from-purple-400 to-pink-400',
          personality: t('questionnaire.seasonal.weather_flexibility.options.weather_indoor.personality')
        }
      ]
    },
    {
      id: 'temperature_comfort',
      question: t('questionnaire.seasonal.temperature_comfort.question'),
      description: t('questionnaire.seasonal.temperature_comfort.description'),
      type: 'multiple_choice',
      icon: '🌡️',
      options: [
        { id: 'very_cold', label: t('questionnaire.seasonal.temperature_comfort.options.very_cold.label'), icon: '🧊', description: t('questionnaire.seasonal.temperature_comfort.options.very_cold.description'), color: 'blue', season: t('questionnaire.seasonal.temperature_comfort.options.very_cold.season') },
        { id: 'cold', label: t('questionnaire.seasonal.temperature_comfort.options.cold.label'), icon: '❄️', description: t('questionnaire.seasonal.temperature_comfort.options.cold.description'), color: 'cyan', season: t('questionnaire.seasonal.temperature_comfort.options.cold.season') },
        { id: 'cool', label: t('questionnaire.seasonal.temperature_comfort.options.cool.label'), icon: '🍂', description: t('questionnaire.seasonal.temperature_comfort.options.cool.description'), color: 'green', season: t('questionnaire.seasonal.temperature_comfort.options.cool.season') },
        { id: 'mild', label: t('questionnaire.seasonal.temperature_comfort.options.mild.label'), icon: '🌿', description: t('questionnaire.seasonal.temperature_comfort.options.mild.description'), color: 'emerald', season: t('questionnaire.seasonal.temperature_comfort.options.mild.season') },
        { id: 'warm', label: t('questionnaire.seasonal.temperature_comfort.options.warm.label'), icon: '☀️', description: t('questionnaire.seasonal.temperature_comfort.options.warm.description'), color: 'yellow', season: t('questionnaire.seasonal.temperature_comfort.options.warm.season') },
        { id: 'hot', label: t('questionnaire.seasonal.temperature_comfort.options.hot.label'), icon: '🔥', description: t('questionnaire.seasonal.temperature_comfort.options.hot.description'), color: 'red', season: t('questionnaire.seasonal.temperature_comfort.options.hot.season') }
      ]
    },
    {
      id: 'seasonal_activities',
      question: t('questionnaire.seasonal.seasonal_activities.question'),
      description: t('questionnaire.seasonal.seasonal_activities.description'),
      type: 'multiple_choice',
      icon: '🎎',
      options: [
        { id: 'hanami', label: t('questionnaire.seasonal.seasonal_activities.options.hanami.label'), icon: '🌸', description: t('questionnaire.seasonal.seasonal_activities.options.hanami.description'), color: 'pink', season: t('questionnaire.seasonal.seasonal_activities.options.hanami.season') },
        { id: 'summer_festivals', label: t('questionnaire.seasonal.seasonal_activities.options.summer_festivals.label'), icon: '🎆', description: t('questionnaire.seasonal.seasonal_activities.options.summer_festivals.description'), color: 'orange', season: t('questionnaire.seasonal.seasonal_activities.options.summer_festivals.season') },
        { id: 'autumn_leaves', label: t('questionnaire.seasonal.seasonal_activities.options.autumn_leaves.label'), icon: '🍁', description: t('questionnaire.seasonal.seasonal_activities.options.autumn_leaves.description'), color: 'amber', season: t('questionnaire.seasonal.seasonal_activities.options.autumn_leaves.season') },
        { id: 'winter_illumination', label: t('questionnaire.seasonal.seasonal_activities.options.winter_illumination.label'), icon: '✨', description: t('questionnaire.seasonal.seasonal_activities.options.winter_illumination.description'), color: 'blue', season: t('questionnaire.seasonal.seasonal_activities.options.winter_illumination.season') },
        { id: 'hot_springs', label: t('questionnaire.seasonal.seasonal_activities.options.hot_springs.label'), icon: '♨️', description: t('questionnaire.seasonal.seasonal_activities.options.hot_springs.description'), color: 'indigo', season: t('questionnaire.seasonal.seasonal_activities.options.hot_springs.season') },
        { id: 'winter_sports', label: t('questionnaire.seasonal.seasonal_activities.options.winter_sports.label'), icon: '🎿', description: t('questionnaire.seasonal.seasonal_activities.options.winter_sports.description'), color: 'cyan', season: t('questionnaire.seasonal.seasonal_activities.options.winter_sports.season') }
      ]
    }
  ];
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const savedAnswers = localStorage.getItem('trippin-seasonal-preferences');
    return savedAnswers ? JSON.parse(savedAnswers) : {
      preferred_season: '',
      weather_flexibility: '',
      temperature_comfort: [],
      seasonal_activities: []
    };
  });

  const [seasonalAnalysis, setSeasonalAnalysis] = useState<string>('');
  const [recommendedTiming, setRecommendedTiming] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('trippin-seasonal-preferences', JSON.stringify(answers));
    analyzeSeasonalPreferences();
  }, [answers]);

  // 神レベルの季節分析システム
  const analyzeSeasonalPreferences = () => {
    const analyses: string[] = [];

    if (answers.preferred_season) {
      const season = seasonalQuestions[0].options.find(opt => opt.id === answers.preferred_season);
      if (season) {
        analyses.push(`🌟 ${season.label}を選択：${season.description}`);
        setRecommendedTiming(`${season.temperature} の快適な気候で${season.activities.join('、')}を楽しめます`);
      }
    }

    if (answers.weather_flexibility) {
      const flexibility = seasonalQuestions[1].options.find(opt => opt.id === answers.weather_flexibility);
      if (flexibility) {
        analyses.push(`☂️ ${flexibility.personality}：${flexibility.description}`);
      }
    }

    if (answers.temperature_comfort.length > 0) {
      const tempCount = answers.temperature_comfort.length;
      if (tempCount === 1) {
        analyses.push('🌡️ 温度環境にこだわりあり：特定の気温帯での最高体験を重視');
      } else if (tempCount >= 4) {
        analyses.push('🌡️ 全天候対応型：あらゆる気温での楽しみ方を知る適応マスター');
      } else {
        analyses.push('🌡️ 適温セレクター：好みの気温帯でのコンフォート体験重視');
      }
    }

    if (answers.seasonal_activities.length > 0) {
      analyses.push(`🎪 季節限定体験ハンター：${answers.seasonal_activities.length}つの特別な日本文化体験を希望`);
    }

    setSeasonalAnalysis(analyses.join('\n'));
  };

  const handleSingleChoiceChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleMultipleChoiceChange = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const currentSelection = prev[questionId] || [];
      if (currentSelection.includes(optionId)) {
        return { ...prev, [questionId]: currentSelection.filter((item: string) => item !== optionId) };
      } else {
        return { ...prev, [questionId]: [...currentSelection, optionId] };
      }
    });
  };

  const handleNext = () => {
    const seasonalData = {
      ...answers,
      analysis: seasonalAnalysis,
      recommendedTiming: recommendedTiming,
      completedAt: new Date().toISOString()
    };
    
    localStorage.setItem('trippin-seasonal-preferences', JSON.stringify(seasonalData));
    navigate('/questionnaire/confirmation');
  };

  const handleBack = () => {
    navigate('/questionnaire/personality');
  };

  const getSeasonGradient = (seasonId: string) => {
    switch (seasonId) {
      case 'spring': return 'from-pink-400 via-rose-400 to-green-400';
      case 'summer': return 'from-yellow-400 via-orange-400 to-red-400';
      case 'autumn': return 'from-orange-400 via-red-400 to-amber-400';
      case 'winter': return 'from-blue-400 via-indigo-400 to-purple-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-r from-blue-300/30 to-cyan-300/30 rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-gradient-to-r from-teal-300/20 to-green-300/20 rounded-full blur-3xl"
          animate={{
            x: [0, -90, 0],
            y: [0, 70, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Premium Header */}
          <div className="text-center mb-12 pt-8">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600 rounded-full mb-8 relative shadow-2xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                damping: 8,
                stiffness: 160,
                delay: 0.3
              }}
              whileHover={{
                scale: 1.15,
                boxShadow: "0 30px 60px rgba(59, 130, 246, 0.4)"
              }}
            >
              <Sun className="w-10 h-10 text-white" />
              
              {/* Seasonal orbit elements */}
              {['🌸', '🌞', '🍁', '❄️'].map((emoji, i) => (
                <motion.div
                  key={i}
                  className="absolute w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-lg shadow-lg"
                  animate={{
                    rotate: [0, 360],
                    scale: [0.8, 1.1, 0.8],
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    top: `${10 + Math.sin(i * Math.PI / 2) * 40}%`,
                    left: `${50 + Math.cos(i * Math.PI / 2) * 40}%`,
                  }}
                >
                  {emoji}
                </motion.div>
              ))}
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              {t('questionnaire.seasonalPreferences') || '季節・天候の好み'}
            </motion.h1>

            <motion.p
              className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              {t('questionnaire.seasonalPreferencesSubtitle') || '日本の四季それぞれの魅力と、あなたの理想的な気候条件を教えてください'}
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Questions Section */}
            <div className="lg:col-span-3">
              <motion.div
                className="bg-white/90 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border border-white/50"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
              >
                <div className="space-y-12">
                  {seasonalQuestions.map((q, index) => (
                    <motion.div 
                      key={q.id} 
                      className="p-8 bg-gradient-to-br from-white/80 to-gray-50/80 rounded-3xl border border-white/80 shadow-xl backdrop-blur-sm"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 + index * 0.2 }}
                      whileHover={{ 
                        scale: 1.01,
                        boxShadow: "0 25px 50px rgba(0,0,0,0.1)"
                      }}
                    >
                      <div className="flex items-start gap-6 mb-8">
                        <motion.div 
                          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl shadow-xl"
                          whileHover={{ 
                            scale: 1.1,
                            rotate: 10
                          }}
                          transition={{ type: "spring", damping: 15 }}
                        >
                          {q.icon}
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-800 mb-3 leading-tight">
                            {index + 1}. {q.question}
                          </h3>
                          <p className="text-gray-600 text-lg leading-relaxed">{q.description}</p>
                        </div>
                      </div>

                      {q.type === 'single_choice' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {q.options.map(option => (
                            <motion.button
                              key={option.id}
                              onClick={() => handleSingleChoiceChange(q.id, option.id)}
                              className={`p-6 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden group text-left ${
                                answers[q.id] === option.id
                                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-100 shadow-2xl'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl'
                              }`}
                              whileHover={{ 
                                scale: 1.03, 
                                y: -6,
                                boxShadow: "0 30px 60px rgba(0,0,0,0.12)" 
                              }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <motion.div
                                className={`absolute inset-0 bg-gradient-to-r ${option.gradient || getSeasonGradient(option.id)} opacity-0 group-hover:opacity-15 transition-opacity duration-500`}
                                initial={false}
                              />
                              
                              <div className="relative z-10">
                                <div className="flex items-center space-x-4 mb-4">
                                  <motion.div 
                                    className="text-5xl"
                                    animate={answers[q.id] === option.id ? { 
                                      scale: [1, 1.2, 1],
                                      rotate: [0, 10, 0]
                                    } : { scale: 1 }}
                                    transition={{ duration: 0.8 }}
                                  >
                                    {option.icon}
                                  </motion.div>
                                  <div>
                                    <div className="text-xl font-bold text-gray-800 mb-1">{option.label}</div>
                                    <div className="text-sm text-gray-600">{option.description}</div>
                                  </div>
                                </div>
                                
                                {option.features && (
                                  <div className="mb-4">
                                    <div className="text-sm font-medium text-gray-700 mb-2">{t('questionnaire.seasonal.mainFeatures')}</div>
                                    <div className="flex flex-wrap gap-2">
                                      {option.features.map((feature, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                          {feature}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="text-xs text-gray-500 italic">{option.details}</div>
                              </div>

                              {/* Premium selection indicator */}
                              <AnimatePresence>
                                {answers[q.id] === option.id && (
                                  <motion.div
                                    className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-xl"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ type: "spring", damping: 10 }}
                                  >
                                    <motion.div
                                      className="w-5 h-5 bg-white rounded-full"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {q.type === 'multiple_choice' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {q.options.map(option => (
                            <motion.button
                              key={option.id}
                              onClick={() => handleMultipleChoiceChange(q.id, option.id)}
                              className={`p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group text-left ${
                                answers[q.id]?.includes(option.id)
                                  ? `border-${option.color}-500 bg-gradient-to-br from-${option.color}-50 to-${option.color}-100 shadow-xl`
                                  : 'border-gray-200 hover:border-cyan-300 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-white bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl'
                              }`}
                              whileHover={{ 
                                scale: 1.03, 
                                y: -4,
                                boxShadow: "0 20px 40px rgba(0,0,0,0.1)" 
                              }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div className="relative z-10">
                                <div className="text-3xl mb-3 text-center">{option.icon}</div>
                                <div className="text-sm font-bold text-gray-800 mb-2 text-center">{option.label}</div>
                                <div className="text-xs text-gray-600 text-center mb-2">{option.description}</div>
                                {option.season && (
                                  <div className={`text-xs px-2 py-1 bg-${option.color}-100 text-${option.color}-700 rounded-full text-center font-medium`}>
                                    {option.season}
                                  </div>
                                )}
                              </div>

                              {/* Premium selection indicator */}
                              <AnimatePresence>
                                {answers[q.id]?.includes(option.id) && (
                                  <motion.div
                                    className={`absolute top-2 right-2 w-7 h-7 bg-gradient-to-br from-${option.color}-500 to-${option.color}-600 rounded-full flex items-center justify-center shadow-lg`}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ type: "spring", damping: 12 }}
                                  >
                                    <motion.div
                                      className="w-3 h-3 bg-white rounded-full"
                                      animate={{ scale: [1, 1.3, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Premium Navigation */}
                <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200/60">
                  <motion.button
                    onClick={handleBack}
                    className="flex items-center space-x-3 px-8 py-4 text-gray-600 hover:text-gray-800 transition-all rounded-2xl hover:bg-white/80 backdrop-blur-sm shadow-lg"
                    whileHover={{ x: -8, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeft className="w-6 h-6" />
                    <span className="text-lg font-medium">{t('common.back')}</span>
                  </motion.button>

                  <motion.button
                    onClick={handleNext}
                    className="flex items-center space-x-3 px-10 py-4 rounded-2xl font-bold text-lg transition-all relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 text-white shadow-2xl hover:shadow-3xl"
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <Sparkles className="w-6 h-6 relative z-10" />
                    <span className="relative z-10">{t('common.next')}</span>
                    <ArrowRight className="w-6 h-6 relative z-10" />
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Premium Analysis Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Seasonal Analysis */}
              {seasonalAnalysis && (
                <motion.div
                  className="bg-white/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/50"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 1.3 }}
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <Thermometer className="w-6 h-6 text-blue-600" />
                    {t('questionnaire.seasonalAnalysis')}
                  </h3>
                  
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    {seasonalAnalysis.split('\n').map((analysis, index) => (
                      <motion.div
                        key={index}
                        className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 shadow-sm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.7 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 6 }}
                      >
                        <p className="text-sm text-blue-800 font-medium leading-relaxed">{analysis}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* Selected Season Preview */}
              {answers.preferred_season && (
                <motion.div
                  className="bg-white/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/50"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 1.5 }}
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4">{t('questionnaire.selectedSeason')}</h3>
                  {(() => {
                    const selectedSeason = seasonalQuestions[0].options.find(opt => opt.id === answers.preferred_season);
                    if (selectedSeason) {
                      return (
                        <motion.div 
                          className={`p-6 rounded-2xl bg-gradient-to-br ${selectedSeason.gradient} bg-opacity-20 border border-opacity-30 shadow-lg`}
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="text-3xl">{selectedSeason.icon}</div>
                            <div className="font-bold text-gray-800 text-lg">{selectedSeason.label}</div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">{selectedSeason.details}</p>
                          <div className="text-xs text-gray-600 bg-white/50 px-3 py-2 rounded-lg">
                            🌡️ {selectedSeason.temperature}
                          </div>
                        </motion.div>
                      );
                    }
                    return null;
                  })()}
                </motion.div>
              )}

              {/* Recommended Timing */}
              {recommendedTiming && (
                <motion.div
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-yellow-200"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 1.7 }}
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    {t('questionnaire.optimalTiming')}
                  </h3>
                  <p className="text-sm text-yellow-800 leading-relaxed">{recommendedTiming}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Enhanced Progress Indicator */}
          <motion.div
            className="mt-16 flex justify-center pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
          >
            <div className="flex space-x-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <motion.div
                  key={index}
                  className={`w-4 h-4 rounded-full shadow-lg ${
                    index < 5 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-300'
                  }`}
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ 
                    delay: 2.2 + index * 0.1,
                    type: "spring",
                    damping: 15
                  }}
                  whileHover={{ scale: 1.5, y: -6 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalPreferences;