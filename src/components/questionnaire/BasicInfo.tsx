import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, ArrowLeft, Calendar, MapPin, Users, Type, Sparkles, Plus, Minus, Search, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import VideoBackground from '../VideoBackground';
import GooglePlacesAutocomplete from '../GooglePlacesAutocomplete';

const BasicInfo: React.FC = () => {

  const navigate = useNavigate();

  const { t } = useLanguage();

  const [formData, setFormData] = useState({

    tripTitle: '',

    destination: '',
    coordinates: null as { lat: number; lng: number } | null,
    placeId: '',

    startDate: '',

    endDate: '',

    travelers: 1

  });

  const [errors, setErrors] = useState<any>({});

  const [showAllDestinations, setShowAllDestinations] = useState(false);

  const [predictions, setPredictions] = useState<any[]>([]);

  const [showPredictions, setShowPredictions] = useState(false);
  const [durationSuggestion, setDurationSuggestion] = useState<string | null>(null);

  // Popular destinations in Japan (30 destinations)

  const popularDestinations = [

    { id: 'tokyo', name: '東京', icon: '🏙️', nameEn: 'Tokyo' },

    { id: 'osaka', name: '大阪', icon: '🏯', nameEn: 'Osaka' },

    { id: 'kyoto', name: '京都', icon: '⛩️', nameEn: 'Kyoto' },

    { id: 'hiroshima', name: '広島', icon: '🕊️', nameEn: 'Hiroshima' },

    { id: 'fukuoka', name: '福岡', icon: '🍜', nameEn: 'Fukuoka' },

    { id: 'sapporo', name: '札幌', icon: '❄️', nameEn: 'Sapporo' },

    { id: 'nara', name: '奈良', icon: '🦌', nameEn: 'Nara' },

    { id: 'kanazawa', name: '金沢', icon: '🏛️', nameEn: 'Kanazawa' },

    { id: 'nikko', name: '日光', icon: '🌲', nameEn: 'Nikko' },

    { id: 'okinawa', name: '沖縄', icon: '🏖️', nameEn: 'Okinawa' },

    { id: 'mount-fuji', name: '富士山', icon: '🗻', nameEn: 'Mount Fuji' },

    { id: 'hakone', name: '箱根', icon: '♨️', nameEn: 'Hakone' },

    { id: 'yokohama', name: '横浜', icon: '🌉', nameEn: 'Yokohama' },

    { id: 'kobe', name: '神戸', icon: '⚓', nameEn: 'Kobe' },

    { id: 'sendai', name: '仙台', icon: '🌾', nameEn: 'Sendai' },

    { id: 'nagoya', name: '名古屋', icon: '🏰', nameEn: 'Nagoya' },

    { id: 'matsumoto', name: '松本', icon: '🏔️', nameEn: 'Matsumoto' },

    { id: 'takayama', name: '高山', icon: '🏘️', nameEn: 'Takayama' },

    { id: 'shirakawa-go', name: '白川郷', icon: '🏠', nameEn: 'Shirakawa-go' },

    { id: 'atami', name: '熱海', icon: '🌊', nameEn: 'Atami' },

    { id: 'kamakura', name: '鎌倉', icon: '🗿', nameEn: 'Kamakura' },

    { id: 'izu', name: '伊豆', icon: '🏝️', nameEn: 'Izu' },

    { id: 'miyajima', name: '宮島', icon: '⛩️', nameEn: 'Miyajima' },

    { id: 'kumamoto', name: '熊本', icon: '🐻', nameEn: 'Kumamoto' },

    { id: 'kagoshima', name: '鹿児島', icon: '🌋', nameEn: 'Kagoshima' },

    { id: 'nagasaki', name: '長崎', icon: '🔔', nameEn: 'Nagasaki' },

    { id: 'yamagata', name: '山形', icon: '🍒', nameEn: 'Yamagata' },

    { id: 'aomori', name: '青森', icon: '🍎', nameEn: 'Aomori' },

    { id: 'iwaki', name: 'いわき', icon: '🌸', nameEn: 'Iwaki' },

    { id: 'shizuoka', name: '静岡', icon: '🍵', nameEn: 'Shizuoka' }

  ];

  const displayedDestinations = showAllDestinations ? popularDestinations : popularDestinations.slice(0, 9);

  const remainingDestinations = popularDestinations.length - 9;

  useEffect(() => {

    console.log('🎯 BasicInfo component mounted!');

    console.log('📍 Current URL:', window.location.pathname);

    

    // Load existing data from localStorage

    const savedData = localStorage.getItem('trippin-basic-info');

    if (savedData) {

      const parsed = JSON.parse(savedData);

      console.log('📊 Loaded BasicInfo data:', parsed);

      setFormData(parsed);

    } else {

      console.log('📊 No existing BasicInfo data found');

    }

  }, []);

  // 旅行期間の最適化提案ロジック
  const getTripDurationSuggestion = (destination: string, interests: string[]) => {
    const suggestions: { [key: string]: { min: number; recommended: number; max: number } } = {
      '東京': { min: 3, recommended: 5, max: 10 },
      '京都': { min: 2, recommended: 3, max: 5 },
      '大阪': { min: 2, recommended: 3, max: 4 },
      '広島': { min: 1, recommended: 2, max: 3 },
      '札幌': { min: 3, recommended: 4, max: 7 },
      '沖縄': { min: 3, recommended: 5, max: 7 }
    };

    const destinationKey = Object.keys(suggestions).find(key => destination.includes(key));
    if (destinationKey) {
      const suggestion = suggestions[destinationKey];
      return t('questionnaire.durationSuggestionSpecific', { 
        destination: destinationKey, 
        recommended: suggestion.recommended, 
        min: suggestion.min, 
        max: suggestion.max 
      });
    }
    return t('questionnaire.durationSuggestionGeneral');
  };

  useEffect(() => {
    if (formData.destination) {
      const suggestion = getTripDurationSuggestion(formData.destination, []);
      setDurationSuggestion(suggestion);
    } else {
      setDurationSuggestion(null);
    }
  }, [formData.destination]);
  const validateForm = () => {

    const newErrors: any = {};

    

    if (!formData.tripTitle.trim()) {

      newErrors.tripTitle = '旅行タイトルを入力してください';

    }

    

    if (!formData.destination.trim()) {

      newErrors.destination = '目的地を選択または入力してください';

    }

    

    if (!formData.startDate) {

      newErrors.startDate = '出発日を選択してください';

    }

    

    if (!formData.endDate) {

      newErrors.endDate = '帰国日を選択してください';

    }

    

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {

      newErrors.endDate = '帰国日は出発日より後の日付を選択してください';

    }

    

    if (formData.travelers < 1 || formData.travelers > 20) {

      newErrors.travelers = '旅行者数は1人から20人までです';

    }

    

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };

  const handleNext = () => {

    if (validateForm()) {

      console.log('🔍 BasicInfo handleNext called');

      console.log('📊 Form data:', formData);

      

      localStorage.setItem('trippin-basic-info', JSON.stringify(formData));

      console.log('💾 BasicInfo saved to localStorage');

      console.log('🚀 About to navigate to: /questionnaire/style');

      

      navigate('/questionnaire/style');

      console.log('✅ Navigation executed');

    }

  };

  const handleBack = () => {

    navigate('/questionnaire/language');

  };

  const handleDestinationSelect = (destination: string) => {

    setShowPredictions(false);

    setPredictions([]);

    if (errors.destination) {
      setErrors(prev => ({ ...prev, destination: '' }));
    }

    setFormData(prev => ({ ...prev, destination }));
  };

  // GooglePlacesAutocompleteから選択された場所を受け取る関数
  const handlePlaceSelect = (place: any) => {
    setFormData(prev => ({
      ...prev,
      destination: place.name,
      coordinates: place.geometry?.location || null,
      placeId: place.place_id || ''
    }));
    if (errors.destination) {
      setErrors(prev => ({ ...prev, destination: '' }));
    }
  };

  const handleDestinationInputChange = (value: string) => {

    setFormData(prev => ({ ...prev, destination: value }));

    if (errors.destination) {

      setErrors(prev => ({ ...prev, destination: '' }));

    }

    

    if (value.length > 2) {

      // Here you would typically call Google Places API

      // For now, we'll just simulate it

      const service = new google.maps.places.AutocompleteService();

      service.getPlacePredictions(

        {

          input: value,

          componentRestrictions: { country: 'jp' },

          types: ['(cities)']

        },

        (predictions, status) => {

          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {

            setPredictions(predictions);

            setShowPredictions(true);

          } else {

            setPredictions([]);

            setShowPredictions(false);

          }

        }

      );

    } else {

      setPredictions([]);

      setShowPredictions(false);

    }

  };

  const handlePredictionSelect = (prediction: any) => {

    setFormData(prev => ({ ...prev, destination: prediction.description }));

    setShowPredictions(false);

    setPredictions([]);

    if (errors.destination) {

      setErrors(prev => ({ ...prev, destination: '' }));

    }

  };

  const handleTravelersChange = (change: number) => {

    const newCount = Math.max(1, Math.min(20, formData.travelers + change));

    setFormData(prev => ({ ...prev, travelers: newCount }));

    if (errors.travelers) {

      setErrors(prev => ({ ...prev, travelers: '' }));

    }

  };

  const handleInputChange = (field: string, value: string | number) => {

    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {

      setErrors(prev => ({ ...prev, [field]: '' }));

    }

  };

  // Animation variants

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

  // Get today's date for min date restriction

  const today = new Date().toISOString().split('T')[0];

  return (

    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Tokyo background video */}
      <VideoBackground 
        videos={['/social_u7584567376_Then_the_character_is_inside_a_vibrant_Tokyo_arca_0692cbcb-0286-41b3-81f4-c281fe171d72_3 (3).mp4']} 
        className="fixed inset-0 w-full h-full object-cover"
      />
      
      {/* Overlay for better text readability */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/40" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">

        <motion.div

          className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full opacity-20 blur-3xl"

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

          className="absolute top-1/2 right-10 w-96 h-96 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-15 blur-3xl"

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

          className="absolute bottom-10 left-1/3 w-64 h-64 bg-gradient-to-r from-indigo-300 to-blue-300 rounded-full opacity-10 blur-3xl"

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

      <motion.div

        className="max-w-4xl w-full relative z-10"

        initial={{ opacity: 0, y: 20 }}

        animate={{ opacity: 1, y: 0 }}

        transition={{ duration: 0.8 }}

      >

        {/* Header */}

        <div className="text-center mb-8">

          <motion.div

            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6 relative shadow-xl"

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

              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"

            }}

          >

            <User className="w-8 h-8 text-white" />

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

            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4"

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.8, delay: 0.3 }}

          >

            {t('questionnaire.basic')}

          </motion.h1>

          

          <motion.p

            className="text-lg text-gray-600"

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.8, delay: 0.4 }}

          >

            {t('questionnaire.basicSubtitle') || 'あなたの旅行の基本的な情報を教えてください'}

          </motion.p>

        </div>

        <motion.div

          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"

          initial={{ opacity: 0, y: 30 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.8, delay: 0.5 }}

        >

          {/* Trip Title */}

          <motion.div 

            className="mb-8"

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: 0.6 }}

          >

            <label className="block text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">

              <Type className="w-6 h-6 text-blue-600" />

              {t('questionnaire.tripTitle')}

            </label>

            <div className="relative">

              <input

                type="text"

                value={formData.tripTitle}

                onChange={(e) => handleInputChange('tripTitle', e.target.value)}

                placeholder={t('questionnaire.tripTitlePlaceholder')}

                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 transition-all duration-300 bg-white/50 backdrop-blur-sm ${

                  errors.tripTitle ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'

                }`}

              />

              {errors.tripTitle && (

                <motion.p 

                  className="text-red-500 text-sm mt-2"

                  initial={{ opacity: 0, y: -10 }}

                  animate={{ opacity: 1, y: 0 }}

                >

                  {errors.tripTitle}

                </motion.p>

              )}

            </div>

          </motion.div>

          {/* Destination Selection */}

          <motion.div 

            className="mb-8"

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: 0.7 }}

          >

            <label className="block text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">

              <MapPin className="w-6 h-6 text-blue-600" />

              {t('questionnaire.destination')}

            </label>

            

            {/* Popular Destinations */}

            <motion.div 

              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6"

              variants={containerVariants}

              initial="hidden"

              animate="visible"

            >

              {displayedDestinations.map((destination) => (

                <motion.button

                  key={destination.id}

                  onClick={() => handleDestinationSelect(t(`destinations.${destination.id}`) || destination.nameEn || destination.name)}

                  className={`p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${

                    formData.destination === (t(`destinations.${destination.id}`) || destination.nameEn || destination.name)

                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 shadow-lg'

                      : 'border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white bg-white/50 backdrop-blur-sm'

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

                    className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"

                    initial={false}

                    animate={formData.destination === (t(`destinations.${destination.id}`) || destination.nameEn || destination.name) ? { opacity: 0.1 } : { opacity: 0 }}

                  />

                  

                  <motion.div 

                    className="text-3xl mb-2 relative z-10"

                    animate={formData.destination === (t(`destinations.${destination.id}`) || destination.nameEn || destination.name) ? { scale: [1, 1.2, 1] } : { scale: 1 }}

                    transition={{ duration: 0.3 }}

                  >

                    {destination.icon}

                  </motion.div>

                  <div className="text-sm font-medium relative z-10">
                    {t(`destinations.${destination.id}`) || destination.nameEn || destination.name}
                  </div>

                  

                  {/* Selected indicator */}

                  {formData.destination === (t(`destinations.${destination.id}`) || destination.nameEn || destination.name) && (

                    <motion.div

                      className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"

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

            {/* Show More/Less Button */}

            {remainingDestinations > 0 && (

              <div className="text-center mb-6">

                <motion.button

                  onClick={() => setShowAllDestinations(!showAllDestinations)}

                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl"

                  whileHover={{ scale: 1.05, y: -2 }}

                  whileTap={{ scale: 0.95 }}

                >

                  {showAllDestinations ? (

                    <>

                      <Minus className="w-4 h-4" />

                      {t('questionnaireBasic.showLess')}

                    </>

                  ) : (

                    <>

                      <Plus className="w-4 h-4" />

                      {t('questionnaireBasic.showMoreCount', { count: remainingDestinations })}

                    </>

                  )}

                </motion.button>

              </div>

            )}

            {/* Custom Destination Input */}

            <div className="relative">

              <GooglePlacesAutocomplete

                value={formData.destination}

                onChange={(value) => handleInputChange('destination', value)}

                onPlaceSelect={handlePlaceSelect}

                placeholder={t('questionnaireBasic.customDestinationPlaceholder')}

                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 transition-all duration-300 bg-white/50 backdrop-blur-sm ${

                  errors.destination ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'

                }`}

              />

              {errors.destination && (

                <motion.p 

                  className="text-red-500 text-sm mt-2"

                  initial={{ opacity: 0, y: -10 }}

                  animate={{ opacity: 1, y: 0 }}

                >

                  {errors.destination}

                </motion.p>

              )}
              {durationSuggestion && (
                <motion.div
                  className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">{durationSuggestion}</p>
                  </div>
                </motion.div>
              )}

            </div>

          </motion.div>

          {/* Date Selection */}

          <motion.div 

            className="mb-8 grid md:grid-cols-2 gap-6"

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: 0.8 }}

          >

            {/* Start Date */}

            <div>

              <label className="block text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">

                <Calendar className="w-6 h-6 text-blue-600" />

                {t('questionnaire.departureDate')}

              </label>

              <div className="relative">

                <input

                  type="date"

                  value={formData.startDate}

                  min={today}

                  onChange={(e) => handleInputChange('startDate', e.target.value)}

                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 transition-all duration-300 bg-white/50 backdrop-blur-sm ${

                    errors.startDate ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'

                  }`}

                />

                {errors.startDate && (

                  <motion.p 

                    className="text-red-500 text-sm mt-2"

                    initial={{ opacity: 0, y: -10 }}

                    animate={{ opacity: 1, y: 0 }}

                  >

                    {errors.startDate}

                  </motion.p>

                )}

              </div>

            </div>

            {/* End Date */}

            <div>

              <label className="block text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">

                <Calendar className="w-6 h-6 text-blue-600" />

                {t('questionnaire.returnDate')}

              </label>

              <div className="relative">

                <input

                  type="date"

                  value={formData.endDate}

                  min={formData.startDate || today}

                  onChange={(e) => handleInputChange('endDate', e.target.value)}

                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 transition-all duration-300 bg-white/50 backdrop-blur-sm ${

                    errors.endDate ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'

                  }`}

                />

                {errors.endDate && (

                  <motion.p 

                    className="text-red-500 text-sm mt-2"

                    initial={{ opacity: 0, y: -10 }}

                    animate={{ opacity: 1, y: 0 }}

                  >

                    {errors.endDate}

                  </motion.p>

                )}

              </div>

            </div>

          </motion.div>

          {/* Number of Travelers */}

          <motion.div 

            className="mb-8"

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: 0.9 }}

          >

            <label className="block text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">

              <Users className="w-6 h-6 text-blue-600" />

              {t('questionnaire.travelers')}

            </label>

            <div className="flex items-center justify-center space-x-6 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200">

              <motion.button

                onClick={() => handleTravelersChange(-1)}

                disabled={formData.travelers <= 1}

                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${

                  formData.travelers <= 1

                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'

                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'

                }`}

                whileHover={formData.travelers > 1 ? { scale: 1.1 } : {}}

                whileTap={formData.travelers > 1 ? { scale: 0.9 } : {}}

              >

                <Minus className="w-6 h-6" />

              </motion.button>

              

              <motion.div 

                className="text-center"

                key={formData.travelers}

                initial={{ scale: 0.8, opacity: 0 }}

                animate={{ scale: 1, opacity: 1 }}

                transition={{ type: "spring", damping: 15 }}

              >

                <div className="text-4xl font-bold text-blue-600 mb-1">{formData.travelers}</div>

                <div className="text-sm text-gray-600">

                  {t('questionnaire.travelersCount')}

                </div>

              </motion.div>

              

              <motion.button

                onClick={() => handleTravelersChange(1)}

                disabled={formData.travelers >= 20}

                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${

                  formData.travelers >= 20

                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'

                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'

                }`}

                whileHover={formData.travelers < 20 ? { scale: 1.1 } : {}}

                whileTap={formData.travelers < 20 ? { scale: 0.9 } : {}}

              >

                <Plus className="w-6 h-6" />

              </motion.button>

            </div>

            {errors.travelers && (

              <motion.p 

                className="text-red-500 text-sm mt-2 text-center"

                initial={{ opacity: 0, y: -10 }}

                animate={{ opacity: 1, y: 0 }}

              >

                {errors.travelers}

              </motion.p>

            )}

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

              className="flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"

              whileHover={{ scale: 1.05, y: -2 }}

              whileTap={{ scale: 0.98 }}

            >

              <motion.div

                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-20"

                animate={{ 

                  x: ['-100%', '100%'],

                }}

                transition={{

                  duration: 2,

                  repeat: Infinity,

                  ease: "easeInOut"

                }}

              />

              <span className="relative z-10">{t('common.next')}</span>

              <ArrowRight className="w-5 h-5 relative z-10" />

            </motion.button>

          </div>

        </motion.div>

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

                  index < 1 ? 'bg-blue-500' : 'bg-gray-300'

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

  );

};

export default BasicInfo;