import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings, ArrowRight, ArrowLeft, Plane, Hotel, Smartphone, Car, Check, Plus, Minus, Sparkles, Crown, Gift } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Premium Plan Button Component
const PremiumPlanButton: React.FC = () => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsCharging(true);
    setIsClicked(true);
    setTimeout(() => {
      setIsCharging(false);
      // Handle premium plan contract logic here
      alert(t('questionnaire.premiumContractMessage'));
    }, 2000);
  };

  return (
    <div className="relative">
      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none" style={{ width: '300px', height: '120px', left: '-50px', top: '-30px' }}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${15 + (i * 10)}%`,
              top: `${20 + (i * 8)}%`,
            }}
            animate={{
              y: [-10, -20, -10],
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.2, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2 + (i * 0.2),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className={`w-3 h-3 ${i % 3 === 0 ? 'text-yellow-400' : i % 3 === 1 ? 'text-pink-400' : 'text-purple-400'}`} />
          </motion.div>
        ))}
      </div>

      {/* Energy rings */}
      {isCharging && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border-2 border-gradient-to-r from-yellow-400 to-pink-400 rounded-full"
              style={{
                width: `${80 + i * 20}px`,
                height: `${80 + i * 20}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                borderImage: 'linear-gradient(45deg, #fbbf24, #ec4899) 1',
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.5],
                opacity: [1, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Premium Plan Button */}
      <motion.button
        className="relative cursor-pointer group px-8 py-4 rounded-2xl overflow-hidden"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isCharging}
        style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #ec4899 70%, #be185d 100%)',
          boxShadow: isHovered 
            ? '0 20px 40px -12px rgba(251, 191, 36, 0.4), 0 10px 20px -8px rgba(236, 72, 153, 0.3)'
            : '0 10px 25px -12px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Enhanced Button Shadow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-yellow-400/40 to-pink-600/40 rounded-2xl blur-xl"
          animate={{
            scale: isHovered ? 1.2 : 0.8,
            opacity: isHovered ? 0.8 : 0.4,
          }}
          transition={{ duration: 0.4 }}
        />
        
        {/* Magical Glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 via-pink-300/20 to-purple-300/30 rounded-2xl"
          animate={{
            opacity: isHovered ? 1 : 0.6,
            rotate: [0, 5, -5, 0],
          }}
          transition={{ 
            opacity: { duration: 0.3 },
            rotate: { duration: 3, repeat: Infinity }
          }}
        />

        {/* Button Content */}
        <div className="flex items-center space-x-3 relative z-10">
          {/* Crown Icon with energy effect */}
          <motion.div
            className="relative"
            animate={{
              scale: isHovered ? 1.2 : 1,
              rotate: isCharging ? 360 : 0,
            }}
            transition={{ 
              scale: { duration: 0.3 },
              rotate: { duration: isCharging ? 2 : 0.3, repeat: isCharging ? Infinity : 0 }
            }}
          >
            {/* Energy glow behind crown */}
            <motion.div
              className="absolute inset-0 bg-white/40 rounded-full blur-md"
              animate={{
                scale: isCharging ? [1, 1.5, 1] : 1,
                opacity: isCharging ? [0.4, 0.8, 0.4] : 0.4,
              }}
              transition={{
                duration: 1,
                repeat: isCharging ? Infinity : 0
              }}
            />
            
            <Crown className="w-6 h-6 text-white relative z-10" />
            
            {/* Electric sparks for crown */}
            {isCharging && (
              <>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-200 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    animate={{
                      x: Math.cos((i * 90) * Math.PI / 180) * 25,
                      y: Math.sin((i * 90) * Math.PI / 180) * 25,
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Button Text */}
          <motion.div 
            className="flex flex-col"
            animate={{
              scale: isCharging ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isCharging ? Infinity : 0
            }}
          >
            <span className="text-white font-bold text-lg tracking-wide">
              {t('questionnaire.premiumPlanButton')}
            </span>
            <motion.span 
              className="text-yellow-100 text-xs font-medium"
              animate={{
                opacity: isHovered ? 1 : 0.8,
              }}
            >
              {t('questionnaire.premiumPlanSubtext')}
            </motion.span>
          </motion.div>

          {/* Gift Icon */}
          <motion.div
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotate: isCharging ? [0, 10, -10, 0] : 0,
            }}
            transition={{
              scale: { duration: 0.3 },
              rotate: { duration: 1, repeat: isCharging ? Infinity : 0 }
            }}
          >
            <Gift className="w-5 h-5 text-yellow-200" />
          </motion.div>
        </div>

        {/* Loading state */}
        {isCharging && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Inner highlight */}
        <motion.div
          className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-xl"
          animate={{
            opacity: isHovered ? 0.8 : 0.4,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Opening Effect */}
        {isClicked && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Explosion particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full ${
                  i % 3 === 0 ? 'bg-yellow-300' :
                  i % 3 === 1 ? 'bg-pink-300' : 'bg-purple-300'
                }`}
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: Math.cos((i * 30) * Math.PI / 180) * (80 + Math.random() * 40),
                  y: Math.sin((i * 30) * Math.PI / 180) * (80 + Math.random() * 40),
                  opacity: [1, 0],
                  scale: [0, 1.2, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeOut",
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

const DetailedPreferences: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [preferences, setPreferences] = useState({
    transportation: [] as string[],
    accommodation: [] as string[],
    esim: false,
    activities: [] as string[],
    support: [] as string[]
  });
  const [showAllTransportation, setShowAllTransportation] = useState(false);
  const [showAllAccommodation, setShowAllAccommodation] = useState(false);

  const transportationOptions = [
    { id: 'shinkansen', name: '新幹線', icon: '🚄', nameEn: 'Shinkansen' },
    { id: 'local-train', name: '在来線', icon: '🚃', nameEn: 'Local Train' },
    { id: 'bus', name: 'バス', icon: '🚌', nameEn: 'Bus' },
    { id: 'rental-car', name: 'レンタカー', icon: '🚗', nameEn: 'Rental Car' },
    { id: 'taxi', name: 'タクシー', icon: '🚕', nameEn: 'Taxi' },
    { id: 'bicycle', name: '自転車', icon: '🚲', nameEn: 'Bicycle' },
    { id: 'ferry', name: 'フェリー', icon: '⛴️', nameEn: 'Ferry' },
    { id: 'airplane', name: '飛行機', icon: '✈️', nameEn: 'Airplane' }
  ];

  const accommodationOptions = [
    { id: 'hotel', name: 'ホテル', icon: '🏨', nameEn: 'Hotel' },
    { id: 'ryokan', name: '旅館', icon: '🏯', nameEn: 'Ryokan' },
    { id: 'hostel', name: 'ホステル', icon: '🏠', nameEn: 'Hostel' },
    { id: 'airbnb', name: 'Airbnb', icon: '🏡', nameEn: 'Airbnb' },
    { id: 'capsule', name: 'カプセルホテル', icon: '🛏️', nameEn: 'Capsule Hotel' },
    { id: 'minshuku', name: '民宿', icon: '🏘️', nameEn: 'Minshuku' },
    { id: 'luxury-resort', name: '高級リゾート', icon: '🏖️', nameEn: 'Luxury Resort' },
    { id: 'camping', name: 'キャンプ', icon: '⛺', nameEn: 'Camping' },
    { id: 'unnecessary', name: '必要ないオプション', icon: '❌', nameEn: 'Not Needed' }
  ];

  const displayedTransportation = showAllTransportation ? transportationOptions : transportationOptions.slice(0, 6);
  const displayedAccommodation = showAllAccommodation ? accommodationOptions : accommodationOptions.slice(0, 6);
  
  const remainingTransportation = transportationOptions.length - 6;
  const remainingAccommodation = accommodationOptions.length - 6;

  const toggleOption = (category: keyof typeof preferences, optionId: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: prev[category].includes(optionId)
        ? prev[category].filter(id => id !== optionId)
        : [...prev[category], optionId]
    }));
  };

  const handleNext = () => {
    console.log('🔍 DetailedPreferences handleNext called');
    console.log('🚗 Transportation:', preferences.transportation);
    console.log('🏨 Accommodation:', preferences.accommodation);
    console.log('📱 eSIM:', preferences.esim);
    
    localStorage.setItem('trippin-detailed-preferences', JSON.stringify(preferences));
    console.log('💾 DetailedPreferences saved to localStorage');
    console.log('🚀 About to navigate to: /questionnaire/personality');
    
    navigate('/questionnaire/personality');
    console.log('✅ Navigation executed');
  };

  const handleBack = () => {
    navigate('/questionnaire/style');
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-purple-300 to-indigo-300 rounded-full opacity-20 blur-3xl"
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
          className="absolute top-1/2 right-10 w-96 h-96 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-full opacity-15 blur-3xl"
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
          className="absolute bottom-10 left-1/3 w-64 h-64 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full opacity-10 blur-3xl"
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
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6 relative shadow-xl"
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
              boxShadow: "0 20px 40px rgba(124, 58, 237, 0.3)"
            }}
          >
            <Settings className="w-8 h-8 text-white" />
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center"
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
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {t('questionnaire.details')}
          </motion.h1>
        </div>

        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Transportation */}
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
              {displayedTransportation.map((option, index) => (
                <motion.button
                  key={option.id}
                  onClick={() => toggleOption('transportation', option.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                    preferences.transportation.includes(option.id)
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-white bg-white/50 backdrop-blur-sm'
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
                    className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    initial={false}
                    animate={preferences.transportation.includes(option.id) ? { opacity: 0.1 } : { opacity: 0 }}
                  />
                  
                  <motion.div 
                    className="text-3xl mb-2 relative z-10"
                    animate={preferences.transportation.includes(option.id) ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {option.icon}
                  </motion.div>
                  <div className="text-sm font-medium relative z-10">
                    {t(`questionnaire.${option.id}`) || option.nameEn || option.name}
                  </div>
                  
                  {/* Selected indicator */}
                  {preferences.transportation.includes(option.id) && (
                    <motion.div
                      className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
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
            
            {remainingTransportation > 0 && (
              <div className="text-center">
                <motion.button
                  onClick={() => setShowAllTransportation(!showAllTransportation)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showAllTransportation ? (
                    <>
                      <Minus className="w-4 h-4" />
                      {t('common.showLess')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t('common.showMore').replace('{count}', remainingTransportation.toString())}
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* Accommodation */}
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
              {displayedAccommodation.map((option, index) => (
                <motion.button
                  key={option.id}
                  onClick={() => toggleOption('accommodation', option.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                    preferences.accommodation.includes(option.id)
                      ? option.id === 'unnecessary' 
                        ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-lg'
                        : 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 shadow-lg'
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
                    className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
                      option.id === 'unnecessary' 
                        ? 'bg-gradient-to-r from-red-400 to-pink-400'
                        : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                    }`}
                    initial={false}
                    animate={preferences.accommodation.includes(option.id) ? { opacity: 0.1 } : { opacity: 0 }}
                  />
                  
                  <motion.div 
                    className="text-3xl mb-2 relative z-10"
                    animate={preferences.accommodation.includes(option.id) ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {option.icon}
                  </motion.div>
                  <div className="text-sm font-medium relative z-10">
                    {t(`questionnaire.${option.id}`) || option.nameEn || option.name}
                  </div>
                  
                  {/* Selected indicator */}
                  {preferences.accommodation.includes(option.id) && (
                    <motion.div
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                        option.id === 'unnecessary' ? 'bg-red-500' : 'bg-blue-500'
                      }`}
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
            
            {remainingAccommodation > 0 && (
              <div className="text-center">
                <motion.button
                  onClick={() => setShowAllAccommodation(!showAllAccommodation)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showAllAccommodation ? (
                    <>
                      <Minus className="w-4 h-4" />
                      {t('common.showLess')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t('common.showMore').replace('{count}', remainingAccommodation.toString())}
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <motion.div 
            className="mb-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex justify-between items-center">
              <motion.button
                onClick={() => setPreferences(prev => ({
                  ...prev,
                  transportation: transportationOptions.map(t => t.id),
                  accommodation: accommodationOptions.map(a => a.id)
                }))}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition-all duration-300 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                {t('common.selectAll')}
              </motion.button>
              
              <div className="text-sm text-gray-600 font-medium bg-white px-4 py-2 rounded-full shadow-sm">
                {preferences.transportation.length + preferences.accommodation.length} / {transportationOptions.length + accommodationOptions.length}
              </div>
              
              <motion.button
                onClick={() => setPreferences(prev => ({
                  ...prev,
                  transportation: [],
                  accommodation: []
                }))}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all duration-300 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Minus className="w-4 h-4" />
                {t('common.deselectAll')}
              </motion.button>
            </div>
          </motion.div>

          {/* eSIM */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {t('questionnaire.esimDataPlan')}
            </h3>
            <motion.button
              onClick={() => setPreferences(prev => ({ ...prev, esim: !prev.esim }))}
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                preferences.esim
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-white bg-white/50 backdrop-blur-sm'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Animated background effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                initial={false}
                animate={preferences.esim ? { opacity: 0.1 } : { opacity: 0 }}
              />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={preferences.esim ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Smartphone className="w-8 h-8 text-purple-600" />
                  </motion.div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">{t('questionnaire.esimDataPlan')}</div>
                    <div className="text-sm text-gray-600">
                      <p>{t('esim.planPrice')}</p>
                      <p className="text-purple-600 font-medium">{t('questionnaire.esimPlanDescription')}</p>
                    </div>
                  </div>
                </div>
                <motion.div 
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                    preferences.esim
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}
                  animate={preferences.esim ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {preferences.esim && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.button>

            {/* Premium Plan Contract Button */}
            <motion.div
              className="mt-6 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <PremiumPlanButton />
            </motion.div>
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
              className="flex items-center space-x-2 px-8 py-3 rounded-xl font-medium transition-all relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-20"
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
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index < 4 ? 'bg-purple-500' : 'bg-gray-300'
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

export default DetailedPreferences;