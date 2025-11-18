import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Heart, 
  Target, 
  TrendingUp, 
  Clock,
  Sun,
  Brain,
  Edit,
  AlertTriangle,
  Info,
  Star,
  BarChart3,
  Zap,
  Award,
  Crown,
  Gem,
  Rocket,
  Compass,
  Globe,
  Gift
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { planGenerationService, PlanGenerationRequest } from '../../services/PlanGenerationService';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

interface CompletionData {
  basicInfo: any;
  travelStyle: any;
  detailedPreferences: any;
  personalityInsights: any;
  seasonalPreferences: any;
  budgetBreakdown: any;
}

const Confirmation: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useSupabaseAuth();
  const [allData, setAllData] = useState<CompletionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    try {
      const basicInfo = JSON.parse(localStorage.getItem('trippin-basic-info') || '{}');
      const travelStyle = JSON.parse(localStorage.getItem('trippin-travel-style') || '{}');
      const detailedPreferences = JSON.parse(localStorage.getItem('trippin-detailed-preferences') || '{}');
      const personalityInsights = JSON.parse(localStorage.getItem('trippin-personality-insights') || '{}');
      const seasonalPreferences = JSON.parse(localStorage.getItem('trippin-seasonal-preferences') || '{}');
      const budgetBreakdown = JSON.parse(localStorage.getItem('trippin-budget-breakdown') || '{}');

      const data: CompletionData = {
        basicInfo,
        travelStyle,
        detailedPreferences,
        personalityInsights,
        seasonalPreferences,
        budgetBreakdown
      };

      setAllData(data);
    } catch (error) {
      console.error('Failed to load questionnaire data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDuration = () => {
    if (!allData?.basicInfo.startDate || !allData?.basicInfo.endDate) return '未設定';
    const start = new Date(allData.basicInfo.startDate);
    const end = new Date(allData.basicInfo.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days}日間`;
  };

  const handleGenerate = async () => {
    if (!allData) return;

    setIsGenerating(true);

    try {
      // Prepare the plan generation request
      const planRequest: PlanGenerationRequest = {
        destination: allData.basicInfo.destination || 'Tokyo',
        startDate: allData.basicInfo.startDate || new Date().toISOString().split('T')[0],
        endDate: allData.basicInfo.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        travelers: allData.basicInfo.travelers || 1,
        budget: allData.travelStyle.budget || 100000,
        currency: 'JPY',
        interests: allData.travelStyle.interests || [],
        accommodationType: allData.detailedPreferences.accommodationType || 'mid-range',
        transportationType: allData.detailedPreferences.transportationType || 'public',
        dietaryRestrictions: allData.travelStyle.dietaryRestrictions || [],
        specialRequirements: allData.detailedPreferences.specialRequirements || '',
        language: 'ja'
      };

      console.log('🚀 Starting plan generation with request:', planRequest);
      console.log('📊 All questionnaire data:', allData);
      console.log('🔍 Basic info from localStorage:', allData.basicInfo);
      console.log('🔍 Travel style from localStorage:', allData.travelStyle);
      console.log('🔍 Detailed preferences from localStorage:', allData.detailedPreferences);

      // Generate the plan using OpenAI
      const generatedPlan = await planGenerationService.generatePlan(planRequest);
      
      console.log('✅ Plan generated successfully:', generatedPlan);

      // Save the plan to backend
      const planId = await planGenerationService.savePlan(generatedPlan, user?.id);

      // Store the complete data and generated plan
      const completeData = {
        ...allData,
        generatedPlan,
        planId,
        metadata: {
          language: 'ja',
          generatedAt: new Date().toISOString()
        }
      };

      localStorage.setItem('trippin-complete-data', JSON.stringify(completeData));
      localStorage.setItem('trippin-generated-plan', JSON.stringify(generatedPlan));
      localStorage.setItem('trippin-plan-id', planId);

      // Navigate to plan generation page
      navigate('/plan-generation');

    } catch (error) {
      console.error('❌ Plan generation failed:', error);
      
      // Show error message to user
      alert('プラン生成に失敗しました。もう一度お試しください。');
      
      // Still navigate to plan generation page with fallback data
      const completeData = {
        ...allData,
        metadata: {
          language: 'ja',
          generatedAt: new Date().toISOString(),
          error: 'Plan generation failed, using fallback data'
        }
      };

      localStorage.setItem('trippin-complete-data', JSON.stringify(completeData));
      navigate('/plan-generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    navigate('/questionnaire/seasonal');
  };

  const handleEdit = (step: string) => {
    navigate(`/questionnaire/${step}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <motion.div
          className="text-center bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"
            whileRotate={{ rotate: 360 }}
          />
          <p className="text-xl text-gray-600 font-medium">データを統合分析中...</p>
          <p className="text-sm text-gray-500 mt-2">あなただけの完璧なプランを準備しています</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-[400px] h-[400px] bg-gradient-to-r from-emerald-300/25 to-blue-300/25 rounded-full blur-3xl"
          animate={{
            x: [0, 150, 0],
            y: [0, -80, 0],
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 90, 0],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 35,
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
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-full mb-8 relative shadow-2xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                damping: 8,
                stiffness: 150,
                delay: 0.3
              }}
              whileHover={{
                scale: 1.15,
                boxShadow: "0 30px 60px rgba(16, 185, 129, 0.4)"
              }}
            >
              <CheckCircle className="w-12 h-12 text-white" />
              
              {/* Premium floating elements */}
              {[Gift, Star, Gem, Crown].map((Icon, i) => (
                <motion.div
                  key={i}
                  className="absolute w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                  animate={{
                    rotate: [0, 360],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2
                  }}
                  style={{
                    top: `${15 + Math.sin(i * Math.PI / 2) * 50}%`,
                    left: `${50 + Math.cos(i * Math.PI / 2) * 50}%`,
                  }}
                >
                  <Icon className="w-3 h-3 text-purple-600" />
                </motion.div>
              ))}
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5 }}
            >
              {t('questionnaire.confirmationTitle')}
            </motion.h1>

            <motion.p
              className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              {t('questionnaire.confirmationSubtitle') || 'あなただけの完璧な日本旅行体験を生成する準備が整いました'}
            </motion.p>
          </div>

          {/* Premium Data Summary Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Basic Information Card */}
            <motion.div
              className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/60"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  {t('questionnaire.basicInfo') || '基本情報'}
                </h3>
                <motion.button 
                  onClick={() => handleEdit('basic')}
                  className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit className="w-5 h-5" />
                </motion.button>
              </div>
              
              <div className="space-y-5">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">✈️ {t('questionnaire.tripTitle') || '旅行タイトル'}</div>
                  <div className="text-lg font-bold text-gray-800 truncate">
                    {allData?.basicInfo.tripTitle || t('questionnaire.notSet') || '未設定'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">🗾 {t('questionnaire.destination') || '目的地'}</div>
                    <div className="font-bold text-gray-800 text-sm">
                      {allData?.basicInfo.destination || t('questionnaire.notSet') || '未設定'}
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">📅 {t('questionnaire.duration') || '期間'}</div>
                    <div className="font-bold text-gray-800 text-sm">{getDuration()}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">👥 {t('questionnaire.travelers') || '旅行者数'}</div>
                    <div className="font-bold text-gray-800">{allData?.basicInfo.travelers || 1}{t('questionnaire.travelersCount') || '名'}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">💰 {t('questionnaire.totalBudget') || '総予算'}</div>
                    <div className="font-bold text-gray-800">
                      ¥{(allData?.travelStyle.budget || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Seasonal Preferences */}
            <motion.div
              className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/60"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.3 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Sun className="w-5 h-5 text-white" />
                  </div>
                  {t('questionnaire.seasonalWeather') || '季節・天候'}
                </h3>
                <motion.button 
                  onClick={() => handleEdit('seasonal')}
                  className="p-3 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all shadow-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit className="w-5 h-5" />
                </motion.button>
              </div>

              {allData?.seasonalPreferences?.preferred_season && (
                <div className="mb-6">
                  {(() => {
                    const seasonIcons = { spring: '🌸', summer: '🌞', autumn: '🍁', winter: '⛄' };
                    const seasonNames = { 
                      spring: t('questionnaire.seasons.spring') || '春', 
                      summer: t('questionnaire.seasons.summer') || '夏', 
                      autumn: t('questionnaire.seasons.autumn') || '秋', 
                      winter: t('questionnaire.seasons.winter') || '冬' 
                    };
                    const seasonGradients = { 
                      spring: 'from-pink-100 to-green-100', 
                      summer: 'from-yellow-100 to-red-100', 
                      autumn: 'from-orange-100 to-amber-100', 
                      winter: 'from-blue-100 to-purple-100' 
                    };
                    const selectedSeason = allData.seasonalPreferences.preferred_season;
                    return (
                      <motion.div 
                        className={`p-6 rounded-2xl bg-gradient-to-r ${seasonGradients[selectedSeason as keyof typeof seasonGradients] || 'from-gray-100 to-gray-200'} shadow-lg border border-white/60`}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="text-4xl">{seasonIcons[selectedSeason as keyof typeof seasonIcons] || '🌸'}</div>
                          <div className="text-xl font-bold text-gray-800">
                            {seasonNames[selectedSeason as keyof typeof seasonNames] || selectedSeason}{t('questionnaire.seasonTravel') || 'の旅行'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>
              )}

              {/* Temperature preferences */}
              {allData?.seasonalPreferences?.temperature_comfort?.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-3 font-medium">🌡️ {t('questionnaire.comfortableTemperature') || '快適温度帯'}:</div>
                  <div className="flex flex-wrap gap-2">
                    {allData.seasonalPreferences.temperature_comfort.map((temp: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                        {temp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasonal activities */}
              {allData?.seasonalPreferences?.seasonal_activities?.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-3 font-medium">🎪 {t('questionnaire.desiredSeasonalExperiences') || '希望する季節体験'}:</div>
                  <div className="space-y-2">
                    {allData.seasonalPreferences.seasonal_activities.map((activity: string, index: number) => (
                      <div key={index} className="text-sm text-orange-700 bg-gradient-to-r from-orange-50 to-yellow-50 px-3 py-2 rounded-xl shadow-sm">
                        ✨ {activity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Interests Display */}
          <div className="grid lg:grid-cols-1 gap-8 mb-12">
            {/* Interests */}
            <motion.div
              className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/60"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 1.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  {t('questionnaire.interests') || '興味・関心'}
                </h3>
                <motion.button 
                  onClick={() => handleEdit('style')}
                  className="p-3 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all shadow-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit className="w-5 h-5" />
                </motion.button>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {allData?.travelStyle.interests?.slice(0, 15).map((interest: string, index: number) => (
                  <motion.span 
                    key={index} 
                    className="px-3 py-2 bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 rounded-xl text-xs font-medium text-center shadow-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.7 + index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    {t(`questionnaire.${interest}`) || interest}
                  </motion.span>
                ))}
                {(allData?.travelStyle.interests?.length || 0) > 15 && (
                  <span className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium text-center">
                    +{(allData?.travelStyle.interests?.length || 0) - 15}
                  </span>
                )}
              </div>
              
              {allData?.travelStyle.detectedPatterns?.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-3 font-medium">🎯 {t('questionnaire.detectedPatterns') || '検出されたパターン'}:</div>
                  <div className="space-y-2">
                    {allData.travelStyle.detectedPatterns.map((pattern: string, index: number) => (
                      <motion.div 
                        key={index} 
                        className="text-sm text-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-2 rounded-xl shadow-sm border border-purple-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.0 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                      >
                        ✨ {pattern}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Premium AI Generation Preview */}
          <motion.div
            className="bg-gradient-to-br from-purple-500/90 via-blue-600/90 to-emerald-600/90 backdrop-blur-2xl rounded-3xl p-12 shadow-2xl border border-white/30 text-white mb-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.9 }}
          >
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center space-x-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.1 }}
              >
                <Rocket className="w-10 h-10 text-yellow-300" />
                <h3 className="text-3xl font-bold">{t('questionnaire.aiDataSummary') || 'AI生成用データサマリー'}</h3>
                <Zap className="w-10 h-10 text-yellow-300" />
              </motion.div>
              
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05, y: -4 }}
                >
                  <div className="text-5xl font-black text-yellow-300 mb-2">{(allData?.travelStyle.interests?.length || 0) + (allData?.travelStyle.dietaryRestrictions?.length || 0)}</div>
                  <div className="text-lg font-medium">{t('questionnaire.selectedInterests') || '選択された興味・関心'}</div>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05, y: -4 }}
                >
                  <div className="text-5xl font-black text-yellow-300 mb-2">
                    {Object.values(allData?.personalityInsights || {}).filter(v => v !== undefined).length}
                  </div>
                  <div className="text-lg font-medium">{t('questionnaire.personalityData') || '性格特性データ'}</div>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05, y: -4 }}
                >
                  <div className="text-5xl font-black text-yellow-300 mb-2">
                    {Object.keys(allData?.seasonalPreferences || {}).filter(key => 
                      allData?.seasonalPreferences[key] !== undefined && 
                      allData?.seasonalPreferences[key] !== '' &&
                      (!Array.isArray(allData?.seasonalPreferences[key]) || allData?.seasonalPreferences[key].length > 0)
                    ).length}
                  </div>
                  <div className="text-lg font-medium">{t('questionnaire.seasonalData') || '季節データ'}</div>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05, y: -4 }}
                >
                  <div className="text-5xl font-black text-yellow-300 mb-2">
                    {Math.min(6, Object.keys(allData || {}).filter(section => 
                      allData[section] && Object.keys(allData[section]).length > 0
                    ).length)}
                  </div>
                  <div className="text-lg font-medium">{t('questionnaire.completedSections') || '完成セクション'}</div>
                </motion.div>
              </div>
            </div>

            <div className="bg-white/20 rounded-3xl p-8 backdrop-blur-sm mb-8">
              <h4 className="font-bold text-white mb-6 flex items-center gap-3 text-xl">
                <Target className="w-6 h-6 text-yellow-300" />
                {t('questionnaire.generatedContent') || '生成される超個別化コンテンツ'}
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {[
                    t('questionnaire.generatedFeature1') || '📅 分刻みの最適化スケジュール',
                    t('questionnaire.generatedFeature2') || '🗺️ あなた専用の移動ルート',
                    t('questionnaire.generatedFeature3') || '🎯 性格に基づく体験選択',
                    t('questionnaire.generatedFeature4') || '💰 予算内での最高選択肢',
                    t('questionnaire.generatedFeature5') || '🌡️ 季節・天候に適応した計画'
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center space-x-3 text-white/90"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.3 + index * 0.1 }}
                    >
                      <CheckCircle className="w-5 h-5 text-yellow-300" />
                      <span className="font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    t('questionnaire.generatedFeature6') || '🚇 詳細な交通アクセス情報',
                    t('questionnaire.generatedFeature7') || '👘 季節に適した服装提案',
                    t('questionnaire.generatedFeature8') || '📞 現地サポート・緊急連絡先',
                    t('questionnaire.generatedFeature9') || '💡 隠れた名所とローカル情報',
                    t('questionnaire.generatedFeature10') || '🎁 パーソナライズされた体験'
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center space-x-3 text-white/90"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.6 + index * 0.1 }}
                    >
                      <CheckCircle className="w-5 h-5 text-yellow-300" />
                      <span className="font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Premium Navigation */}
          <div className="flex justify-between items-center">
            <motion.button
              onClick={handleBack}
              className="flex items-center space-x-4 px-10 py-5 text-gray-600 hover:text-gray-800 transition-all rounded-3xl hover:bg-white/80 backdrop-blur-sm shadow-xl border border-white/40"
              whileHover={{ x: -10, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.3 }}
            >
              <ArrowLeft className="w-7 h-7" />
              <span className="text-xl font-bold">{t('common.back') || '戻る'}</span>
            </motion.button>

            <motion.button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex items-center space-x-4 px-12 py-5 rounded-3xl font-black text-xl transition-all relative overflow-hidden shadow-2xl ${
                isGenerating 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700 hover:shadow-3xl'
              } text-white`}
              whileHover={!isGenerating ? { scale: 1.08, y: -5 } : {}}
              whileTap={!isGenerating ? { scale: 0.95 } : {}}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.5 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Floating sparkles */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut"
                  }}
                  style={{
                    left: `${20 + i * 15}%`,
                    top: '20%',
                  }}
                />
              ))}
              {isGenerating ? (
                <>
                  <motion.div
                    className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="relative z-10">{t('questionnaire.generating') || '生成中...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-8 h-8 relative z-10" />
                  <span className="relative z-10">{t('questionnaire.generatePlan') || '旅行プラン生成'}</span>
                  <ArrowRight className="w-8 h-8 relative z-10" />
                </>
              )}
            </motion.button>
          </div>

          {/* Premium Progress Indicator */}
          <motion.div
            className="mt-16 flex justify-center pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.8 }}
          >
            <div className="flex space-x-4">
              {[0, 1, 2, 3, 4].map((index) => (
                <motion.div
                  key={index}
                  className={`w-5 h-5 rounded-full shadow-xl ${
                    index < 5 ? 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500' : 'bg-gray-300'
                  }`}
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ 
                    delay: 3.0 + index * 0.15,
                    type: "spring",
                    damping: 12
                  }}
                  whileHover={{ scale: 1.5, y: -8 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;