import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Brain, Compass, TrendingUp, BarChart, Lightbulb, Target, Zap, Heart, Eye, Camera, Award, Puzzle, Clock, Users, Layers, Beaker, Rocket } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// 質問定義はi18nに依存するため、コンポーネント内で生成

const PersonalityInsights: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const personalityQuestions = useMemo(() => ([
    {
      id: 'travel_pace',
      question: t('questionnaire.personality.travel_pace.question'),
      description: t('questionnaire.personality.travel_pace.description'),
      type: 'slider',
      icon: '⚡',
      gradient: 'from-emerald-400 via-teal-400 to-blue-400',
      min: { label: t('questionnaire.personality.travel_pace.min.label'), value: 1, description: t('questionnaire.personality.travel_pace.min.description'), emoji: '🌸', detail: t('questionnaire.personality.travel_pace.min.detail') },
      max: { label: t('questionnaire.personality.travel_pace.max.label'), value: 10, description: t('questionnaire.personality.travel_pace.max.description'), emoji: '⚡', detail: t('questionnaire.personality.travel_pace.max.detail') }
    },
    {
      id: 'social_preference',
      question: t('questionnaire.personality.social_preference.question'),
      description: t('questionnaire.personality.social_preference.description'),
      type: 'multiple_choice',
      icon: '👥',
      gradient: 'from-purple-400 via-pink-400 to-red-400',
      options: [
        { id: 'solo_quiet', label: t('questionnaire.personality.social_preference.options.solo_quiet.label'), icon: '🧘‍♀️', description: t('questionnaire.personality.social_preference.options.solo_quiet.description'), color: 'indigo' },
        { id: 'small_group', label: t('questionnaire.personality.social_preference.options.small_group.label'), icon: '👨‍👩‍👧‍👦', description: t('questionnaire.personality.social_preference.options.small_group.description'), color: 'blue' },
        { id: 'local_interaction', label: t('questionnaire.personality.social_preference.options.local_interaction.label'), icon: '🤝', description: t('questionnaire.personality.social_preference.options.local_interaction.description'), color: 'green' },
        { id: 'fellow_travelers', label: t('questionnaire.personality.social_preference.options.fellow_travelers.label'), icon: '🌍', description: t('questionnaire.personality.social_preference.options.fellow_travelers.description'), color: 'yellow' }
      ]
    },
    {
      id: 'adventure_level',
      question: t('questionnaire.personality.adventure_level.question'),
      description: t('questionnaire.personality.adventure_level.description'),
      type: 'slider',
      icon: '🎯',
      gradient: 'from-orange-400 via-red-400 to-pink-400',
      min: { label: t('questionnaire.personality.adventure_level.min.label'), value: 1, description: t('questionnaire.personality.adventure_level.min.description'), emoji: '🛡️', detail: t('questionnaire.personality.adventure_level.min.detail') },
      max: { label: t('questionnaire.personality.adventure_level.max.label'), value: 10, description: t('questionnaire.personality.adventure_level.max.description'), emoji: '🗻', detail: t('questionnaire.personality.adventure_level.max.detail') }
    },
    {
      id: 'cultural_curiosity',
      question: t('questionnaire.personality.cultural_curiosity.question'),
      description: t('questionnaire.personality.cultural_curiosity.description'),
      type: 'slider',
      icon: '🏛️',
      gradient: 'from-amber-400 via-yellow-400 to-orange-400',
      min: { label: t('questionnaire.personality.cultural_curiosity.min.label'), value: 1, description: t('questionnaire.personality.cultural_curiosity.min.description'), emoji: '🎪', detail: t('questionnaire.personality.cultural_curiosity.min.detail') },
      max: { label: t('questionnaire.personality.cultural_curiosity.max.label'), value: 10, description: t('questionnaire.personality.cultural_curiosity.max.description'), emoji: '📚', detail: t('questionnaire.personality.cultural_curiosity.max.detail') }
    },
    {
      id: 'comfort_priority',
      question: t('questionnaire.personality.comfort_priority.question'),
      description: t('questionnaire.personality.comfort_priority.description'),
      type: 'slider',
      icon: '🛏️',
      gradient: 'from-cyan-400 via-blue-400 to-indigo-400',
      min: { label: t('questionnaire.personality.comfort_priority.min.label'), value: 1, description: t('questionnaire.personality.comfort_priority.min.description'), emoji: '🎒', detail: t('questionnaire.personality.comfort_priority.min.detail') },
      max: { label: t('questionnaire.personality.comfort_priority.max.label'), value: 10, description: t('questionnaire.personality.comfort_priority.max.description'), emoji: '👑', detail: t('questionnaire.personality.comfort_priority.max.detail') }
    },
    {
      id: 'spontaneity_level',
      question: t('questionnaire.personality.spontaneity_level.question'),
      description: t('questionnaire.personality.spontaneity_level.description'),
      type: 'slider',
      icon: '🎲',
      gradient: 'from-violet-400 via-purple-400 to-pink-400',
      min: { label: t('questionnaire.personality.spontaneity_level.min.label'), value: 1, description: t('questionnaire.personality.spontaneity_level.min.description'), emoji: '📅', detail: t('questionnaire.personality.spontaneity_level.min.detail') },
      max: { label: t('questionnaire.personality.spontaneity_level.max.label'), value: 10, description: t('questionnaire.personality.spontaneity_level.max.description'), emoji: '🎲', detail: t('questionnaire.personality.spontaneity_level.max.detail') }
    },
    {
      id: 'photo_preference',
      question: t('questionnaire.personality.photo_preference.question'),
      description: t('questionnaire.personality.photo_preference.description'),
      type: 'multiple_choice',
      icon: '📸',
      gradient: 'from-pink-400 via-rose-400 to-red-400',
      options: [
        { id: 'instagram_focused', label: t('questionnaire.personality.photo_preference.options.instagram_focused.label'), icon: '📱', description: t('questionnaire.personality.photo_preference.options.instagram_focused.description'), color: 'pink' },
        { id: 'memory_keeper', label: t('questionnaire.personality.photo_preference.options.memory_keeper.label'), icon: '📷', description: t('questionnaire.personality.photo_preference.options.memory_keeper.description'), color: 'blue' },
        { id: 'professional_hobby', label: t('questionnaire.personality.photo_preference.options.professional_hobby.label'), icon: '🎨', description: t('questionnaire.personality.photo_preference.options.professional_hobby.description'), color: 'purple' },
        { id: 'minimal_photos', label: t('questionnaire.personality.photo_preference.options.minimal_photos.label'), icon: '👁️', description: t('questionnaire.personality.photo_preference.options.minimal_photos.description'), color: 'gray' }
      ]
    },
    {
      id: 'learning_motivation',
      question: t('questionnaire.personality.learning_motivation.question'),
      description: t('questionnaire.personality.learning_motivation.description'),
      type: 'multiple_choice',
      icon: '🎓',
      gradient: 'from-teal-400 via-green-400 to-emerald-400',
      options: [
        { id: 'language_practice', label: t('questionnaire.personality.learning_motivation.options.language_practice.label'), icon: '🗣️', description: t('questionnaire.personality.learning_motivation.options.language_practice.description'), color: 'green' },
        { id: 'cultural_understanding', label: t('questionnaire.personality.learning_motivation.options.cultural_understanding.label'), icon: '🎭', description: t('questionnaire.personality.learning_motivation.options.cultural_understanding.description'), color: 'purple' },
        { id: 'skill_acquisition', label: t('questionnaire.personality.learning_motivation.options.skill_acquisition.label'), icon: '🥋', description: t('questionnaire.personality.learning_motivation.options.skill_acquisition.description'), color: 'orange' },
        { id: 'self_discovery', label: t('questionnaire.personality.learning_motivation.options.self_discovery.label'), icon: '🔍', description: t('questionnaire.personality.learning_motivation.options.self_discovery.description'), color: 'indigo' }
      ]
    }
  ]), [t]);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const savedAnswers = localStorage.getItem('trippin-personality-insights');
    return savedAnswers ? JSON.parse(savedAnswers) : {
      travel_pace: 5,
      social_preference: [],
      adventure_level: 5,
      cultural_curiosity: 5,
      comfort_priority: 5,
      spontaneity_level: 5,
      photo_preference: [],
      learning_motivation: []
    };
  });

  const [personalityAnalysis, setPersonalityAnalysis] = useState<string>('');
  const [recommendedActivities, setRecommendedActivities] = useState<string[]>([]);
  const [personalityType, setPersonalityType] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('trippin-personality-insights', JSON.stringify(answers));
    analyzePersonality();
  }, [answers]);

  // 神レベルの性格分析システム
  const analyzePersonality = () => {
    // 前のステップのデータを読み込み
    const travelStyleData = JSON.parse(localStorage.getItem('trippin-travel-style') || '{}');
    const userInterests = travelStyleData.interests || [];
    
    const analyses: string[] = [];
    const activities: string[] = [];
    let typeScores = {
      explorer: 0,
      cultural: 0,
      social: 0,
      comfort: 0,
      spontaneous: 0
    };

    // 興味・関心に基づくベーススコア調整
    if (userInterests.includes('history-culture') || userInterests.includes('temples-shrines')) {
      typeScores.cultural += 4;
    }
    if (userInterests.includes('hiking-trekking') || userInterests.includes('nature-scenery')) {
      typeScores.explorer += 3;
    }
    if (userInterests.includes('nightlife') || userInterests.includes('cafe-bar-hopping')) {
      typeScores.social += 3;
    }
    if (userInterests.includes('luxury-resort') || userInterests.includes('massage-spa')) {
      typeScores.comfort += 3;
    }
    if (userInterests.includes('festivals-events') || userInterests.includes('performance-live')) {
      typeScores.spontaneous += 2;
    }

    // 旅行ペース分析
    if (answers.travel_pace <= 3) {
      analyses.push(t('questionnaire.personality.analysis.relaxed'));
      activities.push(t('questionnaire.personality.activities.meditation'), t('questionnaire.personality.activities.reading'), t('questionnaire.personality.activities.gardenWalk'));
      typeScores.comfort += 3;
    } else if (answers.travel_pace >= 8) {
      analyses.push(t('questionnaire.personality.analysis.energetic'));
      activities.push(t('questionnaire.personality.activities.earlyMarket'), t('questionnaire.personality.activities.adrenaline'), t('questionnaire.personality.activities.nightPhotography'));
      typeScores.explorer += 3;
    } else {
      analyses.push(t('questionnaire.personality.analysis.balancer'));
      activities.push(t('questionnaire.personality.activities.halfDayTour'), t('questionnaire.personality.activities.foodTour'), t('questionnaire.personality.activities.cityWalk'));
      typeScores.comfort += 1; typeScores.explorer += 1;
    }

    // 冒険レベル分析
    if (answers.adventure_level <= 3) {
      analyses.push(t('questionnaire.personality.analysis.safetyFirst'));
      activities.push(t('questionnaire.personality.activities.popularSights'), t('questionnaire.personality.activities.guidedTour'), t('questionnaire.personality.activities.famousRestaurant'));
      typeScores.comfort += 2;
    } else if (answers.adventure_level >= 8) {
      analyses.push(t('questionnaire.personality.analysis.challenger'));
      activities.push(t('questionnaire.personality.activities.hiddenSpots'), t('questionnaire.personality.activities.localExperience'), t('questionnaire.personality.activities.challengingFood'));
      typeScores.explorer += 3;
    } else {
      analyses.push(t('questionnaire.personality.analysis.adventureBalancer'));
      typeScores.explorer += 1; typeScores.comfort += 1;
    }

    // 文化的好奇心分析
    if (answers.cultural_curiosity >= 7) {
      analyses.push(t('questionnaire.personality.analysis.culturalExplorer'));
      activities.push(t('questionnaire.personality.activities.teaCeremony'), t('questionnaire.personality.activities.historyMuseum'), t('questionnaire.personality.activities.craftMaster'));
      typeScores.cultural += 3;
    } else if (answers.cultural_curiosity <= 3) {
      analyses.push(t('questionnaire.personality.analysis.entertainer'));
      activities.push(t('questionnaire.personality.activities.themePark'), t('questionnaire.personality.activities.entertainment'), t('questionnaire.personality.activities.popCulture'));
      typeScores.social += 2;
    } else {
      analyses.push(t('questionnaire.personality.analysis.culturalEnjoyer'));
      typeScores.cultural += 1; typeScores.social += 1;
    }

    // 快適性重視度分析
    if (answers.comfort_priority >= 7) {
      analyses.push(t('questionnaire.personality.analysis.luxuryOriented'));
      activities.push(t('questionnaire.personality.activities.fiveStarHotel'), t('questionnaire.personality.activities.michelinRestaurant'), t('questionnaire.personality.activities.privateGuide'));
      typeScores.comfort += 3;
    } else if (answers.comfort_priority <= 3) {
      analyses.push(t('questionnaire.personality.analysis.adventurer'));
      activities.push(t('questionnaire.personality.activities.localHostel'), t('questionnaire.personality.activities.streetFood'), t('questionnaire.personality.activities.backpacker'));
      typeScores.explorer += 2;
    } else {
      analyses.push(t('questionnaire.personality.analysis.costPerformanceMaster'));
      typeScores.comfort += 1;
    }

    // 自発性レベル分析
    if (answers.spontaneity_level >= 7) {
      analyses.push(t('questionnaire.personality.analysis.freeSpirit'));
      activities.push(t('questionnaire.personality.activities.chanceEncounters'), t('questionnaire.personality.activities.unplannedDiscovery'), t('questionnaire.personality.activities.localRecommendations'));
      typeScores.spontaneous += 3;
    } else if (answers.spontaneity_level <= 3) {
      analyses.push(t('questionnaire.personality.analysis.perfectPlanner'));
      activities.push(t('questionnaire.personality.activities.detailedSchedule'), t('questionnaire.personality.activities.confirmedReservations'), t('questionnaire.personality.activities.riskAvoidance'));
      typeScores.comfort += 2;
    } else {
      analyses.push(t('questionnaire.personality.analysis.flexiblePlanner'));
      typeScores.spontaneous += 1; typeScores.comfort += 1;
    }

    // 社交性分析
    if (answers.social_preference.includes('local_interaction')) {
      analyses.push(t('questionnaire.personality.analysis.cultureBridge'));
      activities.push(t('questionnaire.personality.activities.izakayaInteraction'), t('questionnaire.personality.activities.localFestival'), t('questionnaire.personality.activities.farmStay'));
      typeScores.cultural += 2; typeScores.social += 2;
    } else if (answers.social_preference.includes('solo_quiet')) {
      analyses.push(t('questionnaire.personality.analysis.soloMindfulness'));
      activities.push(t('questionnaire.personality.activities.earlyShrineVisit'), t('questionnaire.personality.activities.meditationExperience'), t('questionnaire.personality.activities.soloDinner'));
      typeScores.comfort += 1;
    }

    // 写真撮影スタイル分析
    if (answers.photo_preference.includes('instagram_focused')) {
      analyses.push(t('questionnaire.personality.analysis.visualCreator'));
      activities.push(t('questionnaire.personality.activities.instagramSpots'), t('questionnaire.personality.activities.goldenHour'), t('questionnaire.personality.activities.photoWorkshop'));
      typeScores.social += 2;
    } else if (answers.photo_preference.includes('professional_hobby')) {
      analyses.push(t('questionnaire.personality.analysis.artistSoul'));
      activities.push(t('questionnaire.personality.activities.professionalPhotography'), t('questionnaire.personality.activities.artPhotography'), t('questionnaire.personality.activities.skillWorkshop'));
      typeScores.cultural += 2;
    }

    // 学習動機分析
    if (answers.learning_motivation.includes('cultural_understanding')) {
      analyses.push(t('questionnaire.personality.analysis.culturalLearner'));
      activities.push(t('questionnaire.personality.activities.culturalWorkshop'), t('questionnaire.personality.activities.historyLecture'), t('questionnaire.personality.activities.traditionalPerformance'));
      typeScores.cultural += 3;
    } else if (answers.learning_motivation.includes('self_discovery')) {
      analyses.push(t('questionnaire.personality.analysis.selfDiscoverer'));
      activities.push(t('questionnaire.personality.activities.zenExperience'), t('questionnaire.personality.activities.soloTravel'), t('questionnaire.personality.activities.natureDialogue'));
      typeScores.spontaneous += 2;
    }

    // 興味・関心との統合分析
    if (userInterests.includes('food-gourmet') && typeScores.cultural > 0) {
      analyses.push(t('questionnaire.personality.analysis.gourmetCulturalExplorer'));
      typeScores.cultural += 2;
    }
    if (userInterests.includes('anime-manga') && typeScores.social > 0) {
      analyses.push(t('questionnaire.personality.analysis.popCultureLover'));
      typeScores.social += 2;
    }
    if (userInterests.includes('hot-springs') && typeScores.comfort > 0) {
      analyses.push(t('questionnaire.personality.analysis.wellnessSeeker'));
      typeScores.comfort += 2;
    }
    // パーソナリティタイプ決定
    const maxScore = Math.max(...Object.values(typeScores));
    const sortedTypes = Object.entries(typeScores)
      .sort(([,a], [,b]) => b - a)
      .filter(([_, score]) => score > 0);
    
    if (sortedTypes.length > 0) {
      const [type, score] = sortedTypes[0];
      const secondType = sortedTypes[1];
      
      switch (type) {
        case 'explorer': 
          setPersonalityType(
            secondType && secondType[1] >= score * 0.8 
              ? t('questionnaire.personality.types.explorerHybrid', { secondary: getSecondaryType(secondType[0]) })
              : t('questionnaire.personality.types.explorer')
          ); 
          break;
        case 'cultural': 
          setPersonalityType(
            secondType && secondType[1] >= score * 0.8 
              ? t('questionnaire.personality.types.culturalHybrid', { secondary: getSecondaryType(secondType[0]) })
              : t('questionnaire.personality.types.cultural')
          ); 
          break;
        case 'social': 
          setPersonalityType(
            secondType && secondType[1] >= score * 0.8 
              ? t('questionnaire.personality.types.socialHybrid', { secondary: getSecondaryType(secondType[0]) })
              : t('questionnaire.personality.types.social')
          ); 
          break;
        case 'comfort': 
          setPersonalityType(
            secondType && secondType[1] >= score * 0.8 
              ? t('questionnaire.personality.types.comfortHybrid', { secondary: getSecondaryType(secondType[0]) })
              : t('questionnaire.personality.types.comfort')
          ); 
          break;
        case 'spontaneous': 
          setPersonalityType(
            secondType && secondType[1] >= score * 0.8 
              ? t('questionnaire.personality.types.spontaneousHybrid', { secondary: getSecondaryType(secondType[0]) })
              : t('questionnaire.personality.types.spontaneous')
          ); 
          break;
      }
    } else {
      setPersonalityType(t('questionnaire.personality.types.hybrid'));
    }

    setPersonalityAnalysis(analyses.join('\n'));
    setRecommendedActivities([...new Set(activities)]);
  };

  const getSecondaryType = (type: string): string => {
    switch (type) {
      case 'explorer': return t('questionnaire.personality.secondaryTypes.explorer');
      case 'cultural': return t('questionnaire.personality.secondaryTypes.cultural');
      case 'social': return t('questionnaire.personality.secondaryTypes.social');
      case 'comfort': return t('questionnaire.personality.secondaryTypes.comfort');
      case 'spontaneous': return t('questionnaire.personality.secondaryTypes.spontaneous');
      default: return t('questionnaire.personality.secondaryTypes.balance');
    }
  };
  const handleSliderChange = (id: string, value: number) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleMultipleChoiceChange = (id: string, optionId: string) => {
    setAnswers(prev => {
      const currentSelection = prev[id] || [];
      if (currentSelection.includes(optionId)) {
        return { ...prev, [id]: currentSelection.filter((item: string) => item !== optionId) };
      } else {
        return { ...prev, [id]: [...currentSelection, optionId] };
      }
    });
  };

  const getSliderColor = (value: number, questionId: string) => {
    const question = personalityQuestions.find(q => q.id === questionId);
    return question?.gradient || 'from-purple-400 to-pink-400';
  };

  const getSliderDescription = (value: number, questionId: string) => {
    const question = personalityQuestions.find(q => q.id === questionId);
    if (!question || question.type !== 'slider') return '';
    
    if (value <= 3) return `${question.min.emoji} ${question.min.detail}`;
    if (value >= 8) return `${question.max.emoji} ${question.max.detail}`;
    return t('questionnaire.personality.balanceDescription', { min: question.min.label, max: question.max.label });
  };

  const getProgressPercentage = () => {
    const totalQuestions = personalityQuestions.length;
    
    let answeredCount = 0;
    
    // スライダー質問の回答チェック（デフォルト値5以外）
    if (answers.travel_pace !== 5) answeredCount++;
    if (answers.adventure_level !== 5) answeredCount++;
    if (answers.cultural_curiosity !== 5) answeredCount++;
    if (answers.comfort_priority !== 5) answeredCount++;
    if (answers.spontaneity_level !== 5) answeredCount++;
    
    // 複数選択質問の回答チェック
    if (answers.social_preference && answers.social_preference.length > 0) answeredCount++;
    if (answers.photo_preference && answers.photo_preference.length > 0) answeredCount++;
    if (answers.learning_motivation && answers.learning_motivation.length > 0) answeredCount++;
    
    return Math.round((answeredCount / totalQuestions) * 100);
  };

  const handleNext = () => {
    const personalityData = {
      ...answers,
      analysis: personalityAnalysis,
      recommendedActivities: recommendedActivities,
      personalityType: personalityType,
      completedAt: new Date().toISOString()
    };
    
    localStorage.setItem('trippin-personality-insights', JSON.stringify(personalityData));
    navigate('/questionnaire/seasonal');
  };

  const handleBack = () => {
    navigate('/questionnaire/details');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-r from-purple-300/30 to-indigo-300/30 rounded-full blur-3xl"
          animate={{
            x: [0, 150, 0],
            y: [0, -80, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-gradient-to-r from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 80, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-r from-indigo-300/25 to-purple-300/25 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
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
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 rounded-full mb-8 relative shadow-2xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                damping: 8,
                stiffness: 180,
                delay: 0.2
              }}
              whileHover={{
                scale: 1.15,
                boxShadow: "0 25px 50px rgba(124, 58, 237, 0.4)"
              }}
            >
              <Brain className="w-10 h-10 text-white" />
              
              {/* Floating orbit elements */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                  animate={{
                    rotate: [0, 360],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    top: `${20 + i * 15}%`,
                    right: `${-15 + i * 5}%`,
                  }}
                />
              ))}
              
              <motion.div
                className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              {t('questionnaire.personalityInsights') || '旅行スタイル性格診断'}
            </motion.h1>

            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {t('questionnaire.personalityInsightsSubtitle') || 'あなたの旅行に対する深層心理と価値観を分析し、最も適した日本体験をご提案します'}
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Questions Section */}
            <div className="lg:col-span-3">
              <motion.div
                className="bg-white/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/40"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                <div className="space-y-10">
                  {personalityQuestions.map((q, index) => (
                    <motion.div 
                      key={q.id} 
                      className="p-8 bg-gradient-to-br from-white/60 to-gray-50/60 rounded-3xl border border-white/60 shadow-lg backdrop-blur-sm"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      whileHover={{ 
                        scale: 1.01,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.08)"
                      }}
                    >
                      <div className="flex items-start gap-6 mb-6">
                        <motion.div 
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${q.gradient} flex items-center justify-center text-2xl shadow-lg`}
                          whileHover={{ 
                            scale: 1.1,
                            rotate: 5
                          }}
                          transition={{ type: "spring", damping: 15 }}
                        >
                          {q.icon}
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">
                            {index + 1}. {q.question}
                          </h3>
                          <p className="text-gray-600 text-lg">{q.description}</p>
                        </div>
                      </div>

                      {q.type === 'slider' && (
                        <div className="space-y-6">
                          {/* Premium Slider */}
                          <div className="relative px-4">
                            <div className="relative h-4 bg-gray-200/80 rounded-full shadow-inner">
                              <motion.div 
                                className={`absolute top-0 left-0 h-4 bg-gradient-to-r ${getSliderColor(answers[q.id], q.id)} rounded-full shadow-lg`}
                                style={{ width: `${((answers[q.id] - q.min.value) / (q.max.value - q.min.value)) * 100}%` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${((answers[q.id] - q.min.value) / (q.max.value - q.min.value)) * 100}%` }}
                                transition={{ duration: 0.8 }}
                              />
                              <motion.div 
                                className={`absolute top-0 w-8 h-8 bg-gradient-to-br ${getSliderColor(answers[q.id], q.id)} border-4 border-white rounded-full transform -translate-y-2 shadow-xl cursor-pointer`}
                                style={{ left: `calc(${((answers[q.id] - q.min.value) / (q.max.value - q.min.value)) * 100}% - 16px)` }}
                                whileHover={{ scale: 1.2 }}
                                whileDrag={{ scale: 1.1 }}
                              />
                              <input
                                type="range"
                                min={q.min.value}
                                max={q.max.value}
                                value={answers[q.id]}
                                onChange={(e) => handleSliderChange(q.id, parseInt(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          </div>
                          
                          {/* Enhanced Labels */}
                          <div className="grid grid-cols-2 gap-6 text-sm">
                            <motion.div 
                              className="text-left p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100"
                              whileHover={{ scale: 1.02, y: -2 }}
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-2xl">{q.min.emoji}</span>
                                <div className="font-semibold text-gray-800">{q.min.label}</div>
                              </div>
                              <div className="text-gray-600">{q.min.description}</div>
                            </motion.div>
                            <motion.div 
                              className="text-right p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100"
                              whileHover={{ scale: 1.02, y: -2 }}
                            >
                              <div className="flex items-center justify-end space-x-2 mb-2">
                                <div className="font-semibold text-gray-800">{q.max.label}</div>
                                <span className="text-2xl">{q.max.emoji}</span>
                              </div>
                              <div className="text-gray-600">{q.max.description}</div>
                            </motion.div>
                          </div>
                          
                          {/* Current Value Display */}
                          <motion.div 
                            className="text-center"
                            key={answers[q.id]}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                          >
                            <div className={`inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r ${getSliderColor(answers[q.id], q.id)} text-white rounded-2xl shadow-lg`}>
                              <div className="text-3xl font-bold">{answers[q.id]}</div>
                              <div className="text-lg font-medium">{getSliderDescription(answers[q.id], q.id)}</div>
                            </div>
                          </motion.div>
                        </div>
                      )}

                      {q.type === 'multiple_choice' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map(option => (
                            <motion.button
                              key={option.id}
                              onClick={() => handleMultipleChoiceChange(q.id, option.id)}
                              className={`p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group text-left ${
                                answers[q.id]?.includes(option.id)
                                  ? `border-${option.color}-500 bg-gradient-to-br from-${option.color}-50 to-${option.color}-100 shadow-xl`
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-white bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl'
                              }`}
                              whileHover={{ 
                                scale: 1.03, 
                                y: -4,
                                boxShadow: "0 25px 50px rgba(0,0,0,0.1)" 
                              }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div className="relative z-10">
                                <div className="flex items-center space-x-4 mb-3">
                                  <motion.div 
                                    className="text-4xl"
                                    animate={answers[q.id]?.includes(option.id) ? { 
                                      scale: [1, 1.2, 1],
                                      rotate: [0, 10, 0]
                                    } : { scale: 1 }}
                                    transition={{ duration: 0.6 }}
                                  >
                                    {option.icon}
                                  </motion.div>
                                  <div>
                                    <div className="text-lg font-bold text-gray-800">{option.label}</div>
                                    <div className="text-sm text-gray-600 leading-relaxed">{option.description}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Selection indicator with premium animation */}
                              <AnimatePresence>
                                {answers[q.id]?.includes(option.id) && (
                                  <motion.div
                                    className={`absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-${option.color}-500 to-${option.color}-600 rounded-full flex items-center justify-center shadow-lg`}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ type: "spring", damping: 12 }}
                                  >
                                    <motion.div
                                      className="w-4 h-4 bg-white rounded-full"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Hover glow effect */}
                              <motion.div
                                className={`absolute inset-0 bg-gradient-to-r from-${option.color}-400/20 to-${option.color}-600/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                initial={false}
                              />
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Navigation */}
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
                    className="flex items-center space-x-3 px-10 py-4 rounded-2xl font-bold text-lg transition-all relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl"
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
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Circle */}
              <motion.div
                className="bg-white/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/50"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <div className="text-center">
                  <motion.div
                    className="relative w-32 h-32 mx-auto mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1, delay: 1.2 }}
                  >
                    <svg className="w-32 h-32 transform -rotate-90">
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="50%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#progressGradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - getProgressPercentage() / 100) }}
                        transition={{ duration: 2, delay: 1.5 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {getProgressPercentage()}%
                        </div>
                        <div className="text-sm text-gray-500 font-medium">{t('questionnaire.completedStatus')}</div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{t('questionnaire.diagnosisProgress')}</h3>
                  <p className="text-gray-600">
                    {Object.values(answers).filter(a => a !== undefined && a !== '' && (Array.isArray(a) ? a.length > 0 : true)).length} / {personalityQuestions.length} {t('questionnaire.items')}
                  </p>
                </div>
              </motion.div>

              {/* Personality Type Display */}
              {personalityType && (
                <motion.div
                  className="bg-gradient-to-br from-purple-500/90 to-blue-600/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/30 text-white"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.5 }}
                >
                  <div className="text-center mb-6">
                    <motion.div
                      className="inline-flex items-center space-x-3 mb-4"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Award className="w-8 h-8 text-yellow-300" />
                      <h3 className="text-2xl font-bold">{t('questionnaire.yourType')}</h3>
                    </motion.div>
                    <div className="text-3xl font-black mb-3">{personalityType}</div>
                  </div>
                </motion.div>
              )}

              {/* Real-time Analysis */}
              {personalityAnalysis && (
                <motion.div
                  className="bg-white/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/50"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 1.8 }}
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <BarChart className="w-6 h-6 text-purple-600" />
                    {t('questionnaire.personalityAnalysis')}
                  </h3>
                  
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                  >
                    {personalityAnalysis.split('\n').map((analysis, index) => (
                      <motion.div
                        key={index}
                        className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200 shadow-sm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 2.2 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                      >
                        <p className="text-sm text-purple-800 font-medium leading-relaxed">{analysis}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* Recommended Activities */}
              {recommendedActivities.length > 0 && (
                <motion.div
                  className="bg-white/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/50"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 2 }}
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-yellow-600" />
                    {t('questionnaire.recommendedExperiences')}
                  </h3>
                  <div className="space-y-3">
                    {recommendedActivities.map((activity, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 shadow-sm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 2.2 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                      >
                        <Compass className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm text-gray-700 font-medium">{activity}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Enhanced Progress Indicator */}
          <motion.div
            className="mt-16 flex justify-center pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.5 }}
          >
            <div className="flex space-x-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <motion.div
                  key={index}
                  className={`w-4 h-4 rounded-full shadow-lg ${
                    index < 4 ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gray-300'
                  }`}
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ 
                    delay: 2.7 + index * 0.1,
                    type: "spring",
                    damping: 15
                  }}
                  whileHover={{ scale: 1.4, y: -4 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PersonalityInsights;