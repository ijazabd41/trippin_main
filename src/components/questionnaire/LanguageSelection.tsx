import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { availableLanguages } from '../../i18n/i18nResources';

const LanguageSelection: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<'main' | 'background'>('main');

  const videos = [
    '/social_u7584567376_A_3D_cute_and_chubby_pastel-colored_cartoon_chara_db33ce0c-5457-43fb-a69c-739fe4f5de2b_3 (1).mp4',
  ];

  React.useEffect(() => {
    const mainVideo = mainVideoRef.current;
    const backgroundVideo = backgroundVideoRef.current;
    if (!mainVideo || !backgroundVideo) return;

    const handleTimeUpdate = () => {
      const currentVideo = activeVideo === 'main' ? mainVideo : backgroundVideo;
      const nextVideo = activeVideo === 'main' ? backgroundVideo : mainVideo;
      const timeRemaining = currentVideo.duration - currentVideo.currentTime;
      
      // 単一動画の場合は残り0.3秒でフェード開始してループ
      if (timeRemaining <= 0.3) {
        currentVideo.style.opacity = '0';
        nextVideo.currentTime = 0;
        nextVideo.style.opacity = '1';
        nextVideo.play().catch(error => {
          console.warn('Next video play failed:', error);
        });
      }
    };

    const handleVideoEnd = () => {
      // アクティブ動画を切り替え
      setActiveVideo(activeVideo === 'main' ? 'background' : 'main');
    };

    const currentVideo = activeVideo === 'main' ? mainVideo : backgroundVideo;
    currentVideo.addEventListener('timeupdate', handleTimeUpdate);
    currentVideo.addEventListener('ended', handleVideoEnd);
    
    return () => {
      currentVideo.removeEventListener('timeupdate', handleTimeUpdate);
      currentVideo.removeEventListener('ended', handleVideoEnd);
    };
  }, [currentVideoIndex, activeVideo]);

  React.useEffect(() => {
    const mainVideo = mainVideoRef.current;
    const backgroundVideo = backgroundVideoRef.current;
    if (!mainVideo || !backgroundVideo) return;

    // 両方の動画にトランジション設定
    mainVideo.style.transition = 'opacity 0.3s ease-in-out';
    backgroundVideo.style.transition = 'opacity 0.3s ease-in-out';
    
    // メイン動画を設定
    mainVideo.src = videos[0];
    mainVideo.style.opacity = '1';
    mainVideo.load();
    
    // バックグラウンド動画を設定（同じ動画でループ用）
    backgroundVideo.src = videos[0];
    backgroundVideo.style.opacity = '0';
    backgroundVideo.load();

    const handleCanPlay = () => {
      mainVideo.play().catch(error => {
        console.warn('Initial video play failed:', error);
      });
    };

    mainVideo.addEventListener('canplay', handleCanPlay);
    
    return () => {
      mainVideo.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    changeLanguage(langCode);
    setTimeout(() => {
      navigate('/questionnaire/basic');
    }, 300);
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background Video */}
      <div className="fixed inset-0 z-0">
        <video
          ref={mainVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: 0.3,
            transition: 'opacity 0.3s ease-in-out'
          }}
          preload="metadata"
          onError={(e) => {
            console.warn('Video load error:', e);
          }}
        >
          <source src={videos[currentVideoIndex]} type="video/mp4" />
        </video>
        
        {/* バックグラウンド動画（切り替え用） */}
        <video
          ref={backgroundVideoRef}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
          preload="metadata"
          onError={(e) => {
            console.warn('Background video load error:', e);
          }}
        >
          <source src={videos[0]} type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-white/20" />
      </div>

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
        className="max-w-4xl w-full relative z-10 max-h-screen overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#3b82f6 transparent'
        }}
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
            <Globe className="w-8 h-8 text-white" />
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
            {t('questionnaire.language')}
          </motion.h1>
          
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Choose your preferred language for the best experience
          </motion.p>
        </div>

        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Language Selection */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600" />
              言語選択
            </label>
            
            {/* Language Grid with controlled height */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#3b82f6 transparent'
              }}
            >
              {availableLanguages.map((lang) => (
                <motion.button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                    currentLanguage === lang.code
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
                    animate={currentLanguage === lang.code ? { opacity: 0.1 } : { opacity: 0 }}
                  />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={`https://flagcdn.com/w80/${lang.flag}.png`} 
                        alt={`${lang.country} flag`}
                        className="w-12 h-8 object-cover rounded-md transform group-hover:scale-110 transition-transform"
                      />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-800">{lang.name}</h3>
                        <p className="text-gray-500 text-sm">{lang.nameEn}</p>
                        <p className="text-gray-400 text-xs mt-1">{lang.country}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex justify-end">
                      <ArrowRight className={`w-6 h-6 transition-all duration-300 ${
                        currentLanguage === lang.code
                          ? 'text-blue-500 translate-x-2'
                          : 'text-gray-400 group-hover:text-blue-500 group-hover:translate-x-2'
                      }`} />
                    </div>
                  </div>

                  {/* Selected indicator */}
                  {currentLanguage === lang.code && (
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
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-end">
            <motion.button
              onClick={() => handleLanguageSelect(currentLanguage)}
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
              <span className="relative z-10">次へ</span>
              <ArrowRight className="w-5 h-5 relative z-10" />
            </motion.button>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          className="mt-8 flex justify-center pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="flex space-x-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === 0 ? 'bg-blue-500' : 'bg-gray-300'
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

export default LanguageSelection;