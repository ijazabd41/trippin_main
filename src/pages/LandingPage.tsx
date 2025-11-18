import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Smartphone, Calendar, MapPin, Users, DollarSign, Star, Globe, Wifi, Shield, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import MagicBox from '../components/MagicBox';
import SEOHead from '../components/SEOHead';
import VideoBackground from '../components/VideoBackground';

const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useSupabaseAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videos = [
     '/social_u7584567376_httpss.mj.runXW_vNrFVKRk_A_cute_3D_pastel-colored_d67ad13c-f7ec-42c2-b372-81f8881225b6_0.mp4',
     '/social_u7584567376_httpss.mj.runXW_vNrFVKRk_A_cute_3D_pastel-colored_2b224916-338b-4e85-a791-d19a77dac0ae_0.mp4',
     '/social_u7584567376__--ar_11_--motion_high_--video_1_--end_httpss.mj._a47ee305-7dc3-4dc3-a338-594840c61672_3.mp4'
  ];

  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    const playVideoAt = (index: number) => {
      const clamped = ((index % videos.length) + videos.length) % videos.length;
      video.style.opacity = '0';
      setTimeout(() => {
        video.src = videos[clamped];
        video.load();
        video.play().catch(() => {/* ignored */});
        setCurrentVideoIndex(clamped);
        video.style.opacity = '1';
      }, 300);
    };

    const handleVideoEnd = () => {
      playVideoAt(currentVideoIndex + 1);
    };

    const handleVideoError = () => {
      // Skip to next video on error
      playVideoAt(currentVideoIndex + 1);
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleVideoError);

    // Initial video loading
    playVideoAt(currentVideoIndex);
    
    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleVideoError);
    };
  }, [currentVideoIndex, videos]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/questionnaire/language');
    }
  };

  return (
    <>
      <SEOHead
        title={t('landing.seo.title')}
        description={t('landing.seo.description')}
      />
      
      <div className="min-h-screen relative overflow-hidden" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>
        {/* 黒背景で白画面フラッシュを防ぐ */}
        <div className="fixed inset-0 bg-black z-0"></div>
        
        {/* Main video */}
        <video
          ref={mainVideoRef}
          className="fixed inset-0 w-full h-full object-cover opacity-5"
          autoPlay
          muted
          playsInline
          style={{
            opacity: 1,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }}
          preload="auto"
        >
          {/* Source is set by useEffect */}
        </video>

        {/* No need for a second video element */}
        
        {/* Gradient overlay */}
        <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 z-0" />

        {/* Hero Section */}
        <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <motion.div
            className="text-center max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {/* Main headline with advanced typography */}
            <motion.h1
             className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200 mb-8 leading-tight tracking-tight drop-shadow-2xl"
              style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.3 }}
            >
              {t('landing.hero.title')}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-relaxed drop-shadow-lg" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>
                {t('landing.hero.subtitle')}
                <br />
                <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>
                  {t('landing.hero.subtitleHighlight')}
                </span>
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-4xl mx-auto drop-shadow-lg" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>
                {t('landing.hero.description')}
                <br />
                {t('landing.hero.descriptionContinued')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="flex justify-center"
            >
              <MagicBox onOpen={handleGetStarted} />
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-8 h-8 text-white/60" />
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section with advanced cards */}
        <section className="relative z-10 py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>
                {t('landing.features.title')}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <Sparkles className="w-12 h-12" />,
                  titleKey: 'landing.features.aiPlanning.title',
                  descriptionKey: 'landing.features.aiPlanning.description',
                  gradient: 'from-purple-500 to-pink-500'
                },
                {
                  icon: <Zap className="w-12 h-12" />,
                  titleKey: 'landing.features.crowdAvoidance.title',
                  descriptionKey: 'landing.features.crowdAvoidance.description',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                {
                  icon: <Smartphone className="w-12 h-12" />,
                  titleKey: 'landing.features.esimSupport.title',
                  descriptionKey: 'landing.features.esimSupport.description',
                  gradient: 'from-green-500 to-emerald-500'
                },
                {
                  icon: <Calendar className="w-12 h-12" />,
                  titleKey: 'landing.features.bookingSupport.title',
                  descriptionKey: 'landing.features.bookingSupport.description',
                  gradient: 'from-orange-500 to-red-500'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="group relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Glowing background */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-5 rounded-3xl blur-xl group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  {/* Card content - 5%不透過 */}
                  <div className="relative backdrop-blur-sm bg-white/5 rounded-3xl p-8 border border-white/10 shadow-lg hover:bg-white/8 transition-all duration-500">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} text-white mb-6 shadow-lg`}>
                      {feature.icon}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>{t(feature.titleKey)}</h3>
                    <p className="text-white/80 text-lg leading-relaxed" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>{t(feature.descriptionKey)}</p>
                    
                    {/* Hover effect line */}
                    <motion.div
                      className={`h-1 bg-gradient-to-r ${feature.gradient} rounded-full mt-6 origin-left`}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                      viewport={{ once: true }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Interests Section with floating cards */}
        <section className="relative z-10 py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>
                {t('landing.interests.title')}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { id: 'culture', icon: '🏯', titleKey: 'landing.interests.culture' },
                { id: 'shopping', icon: '🛍️', titleKey: 'landing.interests.shopping' },
                { id: 'gourmet', icon: '🍜', titleKey: 'landing.interests.gourmet' },
                { id: 'nature', icon: '🌸', titleKey: 'landing.interests.nature' },
                { id: 'wellness', icon: '💆‍♀️', titleKey: 'landing.interests.wellness' },
                { id: 'events', icon: '🎆', titleKey: 'landing.interests.events' }
              ].map((interest, index) => (
                <motion.div
                  key={interest.id}
                  className="group relative"
                  initial={{ opacity: 0, y: 50, rotateY: -15 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    z: 50
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Floating glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                  />
                  
                  {/* カード背景を5%不透過 */}
                  <div className="relative backdrop-blur-sm bg-white/5 rounded-3xl p-8 text-center border border-white/10 shadow-lg hover:bg-white/8 transition-all duration-500">
                    <motion.div 
                      className="text-6xl mb-4"
                      animate={{
                        rotateY: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: index * 0.3
                      }}
                    >
                      {interest.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>{t(interest.titleKey)}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Section */}
        <section className="relative z-10 py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 rounded-3xl blur-3xl animate-pulse" />
              
              {/* メインボックスを5%不透過 */}
              <div className="relative backdrop-blur-sm bg-white/5 rounded-3xl p-12 border border-white/10 shadow-lg">
                <div className="text-center mb-16">
                  <motion.h2
                    className="text-5xl md:text-6xl font-black text-white mb-6"
                    style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    {t('landing.premium.title')}
                  </motion.h2>
                  
                  <motion.div
                    className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 mb-8"
                    style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    {t('landing.premium.price')}
                  </motion.div>
                  
                  <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>
                    {t('landing.premium.subtitle')}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {[
                    {
                      icon: <MapPin className="w-8 h-8" />,
                      title: t('landing.premium.features.planning') || '詳細プランニング',
                      description: t('landing.premium.features.planningDesc') || '完全カスタマイズ可能な旅程作成'
                    },
                    {
                      icon: <Users className="w-8 h-8" />,
                      title: t('landing.premium.features.crowdAvoidance') || '混雑回避ルート',
                      description: t('landing.premium.features.crowdAvoidanceDesc') || 'AIが最適な時間とルートを提案'
                    },
                    {
                      icon: <DollarSign className="w-8 h-8" />,
                      title: t('landing.premium.features.budgetOptimization') || '予算最適化',
                      description: t('landing.premium.features.budgetOptimizationDesc') || 'コストパフォーマンス最大化'
                    },
                    {
                      icon: <Star className="w-8 h-8" />,
                      title: t('landing.premium.features.premiumSupport') || 'プレミアムサポート',
                      description: t('landing.premium.features.premiumSupportDesc') || '24時間専用サポート'
                    },
                    {
                      icon: <Globe className="w-8 h-8" />,
                      title: t('landing.premium.features.globalAccess') || 'グローバルアクセス',
                      description: t('landing.premium.features.globalAccessDesc') || '世界中どこからでもアクセス'
                    },
                    {
                      icon: <Wifi className="w-8 h-8" />,
                      title: t('landing.premium.features.connectivity') || '接続性',
                      description: t('landing.premium.features.connectivityDesc') || '高速データ通信保証'
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/8 transition-all duration-300"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-white mb-4">{feature.icon}</div>
                      <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>{feature.title}</h3>
                      <p className="text-white/80 text-sm" style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}>{feature.description}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <MagicBox onOpen={() => navigate('/checkout')} />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative z-10 py-32 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              {/* Revolutionary text effect */}
              <motion.h2
                className="text-4xl md:text-6xl font-black text-white mb-12 leading-tight"
                style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                viewport={{ once: true }}
              >
                <motion.span
                  className="inline-block"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    background: 'linear-gradient(90deg, #fff, #fbbf24, #ec4899, #8b5cf6, #fff)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif'
                  }}
                >
                  {t('landing.closing.line1')}
                </motion.span>
                <br />
                <motion.span
                  className="text-white/90"
                  style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  {t('landing.closing.line2')}
                </motion.span>
                <br />
                <motion.span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300"
                  style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                  viewport={{ once: true }}
                >
                  {t('landing.closing.line3')}
                </motion.span>
              </motion.h2>
              
              {/* Final MagicBox */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Surrounding energy rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 border-2 border-white/20 rounded-full"
                    style={{
                      width: `${120 + i * 40}px`,
                      height: `${120 + i * 40}px`,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                  />
                ))}
                
                <MagicBox onOpen={handleGetStarted} />
                
                {/* Call to action text */}
                <motion.p
                  className="text-white/80 text-lg mt-8 font-medium"
                  style={{ fontFamily: 'serif, "Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS PMincho", serif' }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  viewport={{ once: true }}
                >
                  {t('landing.cta.startNow')}
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LandingPage;