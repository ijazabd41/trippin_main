import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Calendar, MapPin, Clock, Star, Smartphone, MessageCircle, HelpCircle, Languages, Camera, Upload, X, Loader, ArrowLeft, Eye } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBackendTrip } from '../contexts/BackendTripContext';
import { isUserPremium } from '../utils/premiumUtils';
import { apiCall, API_CONFIG } from '../config/api';
import { DASHBOARD_CONFIG, getStatusConfig, calculateStats } from '../config/dashboardConfig';
import SEOHead from '../components/SEOHead';

// Mock Data Notice Component
const MockDataNotice: React.FC<{ message: string; onRetry: () => void; className?: string; t: (key: string) => string }> = ({ 
  message, 
  onRetry, 
  className = '',
  t
}) => (
  <motion.div
    className={`bg-yellow-50 border border-yellow-200 rounded-xl p-4 ${className}`}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <HelpCircle className="w-5 h-5 text-yellow-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-yellow-800">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex-shrink-0 text-yellow-600 hover:text-yellow-700 text-sm font-medium"
      >
        {t('mockData.dismiss')}
      </button>
    </div>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, clearAuthData, refreshUserProfileFromBackend } = useSupabaseAuth();
  const { t } = useLanguage();
  const { trips, isLoading, fetchTrips } = useBackendTrip();
  const [showTranslator, setShowTranslator] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMockNotice, setShowMockNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const lastRefreshedUserIdRef = useRef<string | null>(null);

  const languages = DASHBOARD_CONFIG.LANGUAGES;

  useEffect(() => {
    // Check if we're in demo mode
    const isDemoMode = localStorage.getItem('trippin-demo-mode');
    if (isDemoMode) {
      setShowMockNotice(true);
      setNoticeMessage(t('mockData.demoModeActive'));
    }
  }, [t]);

  // Normalize trips from backend to UI shape
  const displayTrips = React.useMemo(() => {
    console.log('[Dashboard] Computing display trips. Context trips:', Array.isArray(trips) ? trips.length : 0);
    
    if (Array.isArray(trips) && trips.length > 0) {
      console.log('[Dashboard] Using trips from context:', trips);
      return trips.map((trip: any) => ({
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate || trip.start_date,
        endDate: trip.endDate || trip.end_date,
        status: trip.status,
            image: trip.image || trip.image_url || DASHBOARD_CONFIG.DEFAULT_TRIP_IMAGE
      }));
    }
    
    // Check for any stored trip data as fallback
    const storedTrips = localStorage.getItem('trippin-trips');
    if (storedTrips) {
      try {
        const parsedTrips = JSON.parse(storedTrips);
        console.log('[Dashboard] Using stored trips:', parsedTrips);
        if (Array.isArray(parsedTrips) && parsedTrips.length > 0) {
          return parsedTrips.map((trip: any) => ({
            ...trip,
            image: trip.image || DASHBOARD_CONFIG.DEFAULT_TRIP_IMAGE
          }));
        }
      } catch (error) {
        console.error('[Dashboard] Error parsing stored trips:', error);
      }
    }
    
    // Check for recent trip data as final fallback
    const recentTripData = localStorage.getItem('trippin-recent-trip');
    if (recentTripData) {
      try {
        const recentTrip = JSON.parse(recentTripData);
        console.log('[Dashboard] Using recent trip data:', recentTrip);
        return [{
          id: recentTrip.id,
          title: recentTrip.title,
          destination: recentTrip.destination,
          startDate: recentTrip.startDate || recentTrip.start_date,
          endDate: recentTrip.endDate || recentTrip.end_date,
          status: recentTrip.status || 'planning',
          image: recentTrip.image || DASHBOARD_CONFIG.DEFAULT_TRIP_IMAGE
        }];
      } catch (error) {
        console.error('[Dashboard] Error parsing recent trip:', error);
      }
    }
    
    // No trips available - return empty array instead of mock data
    console.log('[Dashboard] No trips available');
    return [];
  }, [trips, t]);

  const getStatusColor = (status: string) => {
    return getStatusConfig(status).color;
  };

  const getStatusText = (status: string) => {
    return t(getStatusConfig(status).textKey);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleTranslate = async () => {
    if (!imageFile) return;
    
    setIsTranslating(true);
    setShowMockNotice(false);
    setNoticeMessage(null);
    
    try {
      // Convert file to base64
      const base64Image = await fileToBase64(imageFile);
      
      const result = await apiCall(API_CONFIG.ENDPOINTS.OPENAI_VISION, {
        method: 'POST',
        body: JSON.stringify({
          image: base64Image,
          targetLanguage: targetLanguage
        })
      });
      
      if (result.isMockData) {
        setShowMockNotice(true);
        setNoticeMessage(result.message || t('mockData.imageApiUnavailable'));
      }
      
      setTranslatedText(result.translation || 'Translation failed');
    } catch (error) {
      console.error('Image processing error:', error);
      setShowMockNotice(true);
      setNoticeMessage(t('mockData.imageProcessingError'));
      setTranslatedText(t('mockData.imageProcessingFailed'));
    } finally {
      setIsTranslating(false);
    }
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Refresh user profile on dashboard load to ensure premium status is up to date
  useEffect(() => {
    // Only refresh if user ID changed and we haven't refreshed for this user yet
    if (!user?.id || !refreshUserProfileFromBackend || lastRefreshedUserIdRef.current === user.id) {
      return;
    }
    
    let isMounted = true;
    lastRefreshedUserIdRef.current = user.id;
    
    console.log('🔄 Dashboard: Refreshing user profile to check premium status...');
    
    refreshUserProfileFromBackend()
      .then(() => {
        if (!isMounted) return;
        console.log('✅ Dashboard: User profile refreshed successfully');
      })
      .catch(error => {
        if (!isMounted) return;
        console.warn('⚠️ Dashboard: Failed to refresh user profile:', error);
      });
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, refreshUserProfileFromBackend]); // Include refreshUserProfileFromBackend to satisfy ESLint, but use ref to prevent duplicate calls

  // Calculate dynamic statistics
  const stats = calculateStats(displayTrips);
  
  // Debug logging
  console.log('Dashboard render - isLoading:', isLoading, 'trips:', trips, 'user:', user, 'stats:', stats);

  // Show loading spinner while trips are loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <SEOHead
        title="ダッシュボード"
        description="あなたの日本旅行プランと予約を一元管理。AIアシスタント、eSIM、翻訳ツールも利用可能。"
        keywords={['旅行管理', 'ダッシュボード', '日本旅行', 'AI旅行プラン']}
      />
      
      {/* Premium Status Banner */}
      {isUserPremium(userProfile, user) && (
        <motion.div
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 mx-6 rounded-xl shadow-lg mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center space-x-2">
            <Star className="w-5 h-5" />
            <span className="font-semibold">{t('premium.success.title')}</span>
            <span className="text-purple-100">{t('premium.success.subtitle')}</span>
          </div>
        </motion.div>
      )}
      
      {/* Debug Premium Status (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          className="bg-gray-100 border border-gray-300 rounded-lg p-4 mx-6 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-2">🔧 Premium Status Debug (Dev Only)</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>User ID: {user?.id || 'Not logged in'}</div>
            <div>User Profile Premium: {userProfile?.is_premium ? '✅ True' : '❌ False'}</div>
            <div>User Premium: {user?.isPremium ? '✅ True' : '❌ False'}</div>
            <div>Is Premium (Combined): {isUserPremium(userProfile, user) ? '✅ True' : '❌ False'}</div>
            <button
              onClick={() => {
                console.log('🔄 Manual premium status refresh...');
                refreshUserProfileFromBackend().then(result => {
                  console.log('✅ Manual refresh result:', result);
                }).catch(error => {
                  console.error('❌ Manual refresh error:', error);
                });
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              🔄 Refresh Premium Status
            </button>
          </div>
        </motion.div>
      )}
      
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Mock Data Notice */}
        {showMockNotice && noticeMessage && (
          <MockDataNotice 
            message={noticeMessage}
            onRetry={() => {
              setShowMockNotice(false);
              setNoticeMessage(null);
            }}
            className="mb-4"
            t={t}
          />
        )}

        
        {/* Welcome Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {t('dashboard.title')}
          </h2>
          <p className="text-gray-600">
            {t('dashboard.subtitle')}
          </p>
        </motion.div>


        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.quickActions')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <motion.button
                  onClick={() => navigate('/questionnaire/language')}
                  className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-6 h-6" />
                  <span className="font-medium">{t('dashboard.newTripPlan')}</span>
                </motion.button>
                
                <motion.button
                  onClick={() => navigate('/esim')}
                  className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="font-medium">{t('dashboard.purchaseEsim')}</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Recent Trips */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">{t('dashboard.yourTrips')}</h3>
                <button className="text-purple-600 hover:text-purple-700 font-medium">
                  {t('dashboard.viewAll')}
                </button>
              </div>

              <div className="space-y-4">
                {displayTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-600 mb-2">
                      {t('dashboard.noTrips') || 'No trips yet'}
                    </h4>
                    <p className="text-gray-500 mb-4">
                      {t('dashboard.createFirstTrip') || 'Create your first trip plan to get started!'}
                    </p>
                    <button
                      onClick={() => navigate('/questionnaire/language')}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{t('dashboard.createTrip') || 'Create Trip'}</span>
                    </button>
                  </div>
                ) : (
                  displayTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all"
                    whileHover={{ scale: 1.01 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <div
                      className="w-16 h-16 bg-cover bg-center rounded-xl"
                      style={{ backgroundImage: `url(${trip.image})` }}
                    />
                    
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/trip/${trip.id}`)}>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{trip.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                          {getStatusText(trip.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{trip.destination}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{trip.startDate ? new Date(trip.startDate).toLocaleDateString('ja-JP') : '-'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/trip/${trip.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="詳細を見る"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.statistics')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('dashboard.totalTrips')}</span>
                  <span className="text-2xl font-bold text-purple-600">{stats.totalTrips}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('dashboard.visitedCities')}</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.visitedCities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('dashboard.totalDays')}</span>
                  <span className="text-2xl font-bold text-green-600">{stats.totalDays}</span>
                </div>
              </div>
            </motion.div>

            {/* Support */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.support')}</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/translate')}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Languages className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">{t('dashboard.translation')}</span>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/chat')}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{t('dashboard.aiChat')}</span>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/translate?mode=camera')}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Upload className="w-5 h-5 text-indigo-600" />
                    <span className="text-gray-700">{t('dashboard.photoUploadTranslation') || 'Upload & Translate Photo'}</span>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/translate?mode=camera')}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Camera className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{t('dashboard.photoTranslation')}</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowTranslator(true)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-gray-700">{t('dashboard.helpCenter')}</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Photo Translation Modal */}
      <AnimatePresence>
        {showTranslator && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('translation.photoTitle') || 'Photo Translation'}</h2>
                <button
                  onClick={() => {
                    setShowTranslator(false);
                    setImageFile(null);
                    setImagePreview(null);
                    setTranslatedText('');
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('translation.targetLanguage') || 'Translate to:'}
                  </label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Image Upload */}
                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-300 transition-colors"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">{t('translation.dragAndDrop') || 'Drag & drop an image'}</p>
                    <p className="text-sm text-gray-500">{t('translation.orClickToUpload') || 'or click to upload'}</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Uploaded"
                        className="w-full h-auto rounded-xl border border-gray-300"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    
                    <button
                      onClick={handleTranslate}
                      disabled={isTranslating}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-70"
                    >
                      {isTranslating ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>{t('translation.translating') || 'Translating...'}</span>
                        </>
                      ) : (
                        <>
                          <Languages className="w-5 h-5" />
                          <span>{t('translation.translate') || 'Translate'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Translation Result */}
                {translatedText && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('translation.result') || 'Translation Result'}</h3>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="whitespace-pre-wrap">{translatedText}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;