import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Search, Star, Clock, Phone, Globe, Locate } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiCall, API_CONFIG, buildApiUrl, APIError } from '../config/api';
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';
import { handleAWSError, globalErrorHandler } from '../utils/errorHandler';
import MockDataNotice from '../components/MockDataNotice';
import GoogleMap from '../components/GoogleMap';
import { 
  MAP_CONFIG, 
  CATEGORY_TO_PLACES_TYPES, 
  CATEGORY_ICONS, 
  CATEGORY_COLORS, 
  MOCK_PLACES, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} from '../config/mapConfig';

const MapNavigation: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMockNotice, setShowMockNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(MAP_CONFIG.DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(MAP_CONFIG.DEFAULT_ZOOM);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsTo, setDirectionsTo] = useState<{ lat: number; lng: number; name: string } | null>(null);

  // Ensure mapCenter is always valid
  const safeMapCenter = (() => {
    if (typeof mapCenter.lat === 'number' && typeof mapCenter.lng === 'number' && 
        !isNaN(mapCenter.lat) && !isNaN(mapCenter.lng) &&
        mapCenter.lat >= -90 && mapCenter.lat <= 90 && 
        mapCenter.lng >= -180 && mapCenter.lng <= 180) {
      return mapCenter;
    }
    console.warn('Invalid mapCenter detected, using default:', mapCenter);
    return MAP_CONFIG.DEFAULT_CENTER;
  })();


  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Validate coordinates
          if (typeof lat === 'number' && typeof lng === 'number' && 
              !isNaN(lat) && !isNaN(lng) &&
              lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            console.log(SUCCESS_MESSAGES.LOCATION_RECEIVED, { lat, lng });
            setCurrentLocation({ lat, lng });
            setMapCenter({ lat, lng });
            setMapZoom(MAP_CONFIG.USER_LOCATION_ZOOM);
          } else {
            console.error('Invalid coordinates received:', { lat, lng });
            setMapCenter(MAP_CONFIG.DEFAULT_CENTER);
          }
        },
        (error) => {
          console.error(ERROR_MESSAGES.LOCATION_ACCESS_DENIED, error);
          // Fallback to default center if location access fails
          setMapCenter(MAP_CONFIG.DEFAULT_CENTER);
        }
      );
    } else {
      console.log(ERROR_MESSAGES.LOCATION_NOT_SUPPORTED);
      setMapCenter(MAP_CONFIG.DEFAULT_CENTER);
    }
  };

  // Multilingual content
  const getLocalizedContent = () => {
    switch (currentLanguage) {
      case 'en':
        return {
          title: 'Map & Navigation',
          subtitle: 'Explore tourist spots around your location',
          searchPlaceholder: 'Search for places...',
          searchButton: 'Search',
          nearbySpots: 'Nearby Spots',
          loading: 'Loading...',
          startNavigation: 'Start Navigation',
          detailInfo: 'Detail Info',
          interactiveMap: 'Interactive Map',
          mapDescription: 'Google Maps API will be integrated',
          currentLocation: 'Current Location'
        };
      case 'zh':
        return {
          title: '地图导航',
          subtitle: '探索您周围的旅游景点',
          searchPlaceholder: '搜索地点...',
          searchButton: '搜索',
          nearbySpots: '附近景点',
          loading: '加载中...',
          startNavigation: '开始导航',
          detailInfo: '详细信息',
          interactiveMap: '交互式地图',
          mapDescription: '将集成Google Maps API',
          currentLocation: '当前位置'
        };
      case 'ko':
        return {
          title: '지도 내비게이션',
          subtitle: '현재 위치 주변의 관광 명소 탐색',
          searchPlaceholder: '장소 검색...',
          searchButton: '검색',
          nearbySpots: '주변 명소',
          loading: '로딩 중...',
          startNavigation: '내비게이션 시작',
          detailInfo: '상세 정보',
          interactiveMap: '인터랙티브 지도',
          mapDescription: 'Google Maps API가 통합됩니다',
          currentLocation: '현재 위치'
        };
      case 'es':
        return {
          title: 'Mapa y Navegación',
          subtitle: 'Explora lugares turísticos alrededor de tu ubicación',
          searchPlaceholder: 'Buscar lugares...',
          searchButton: 'Buscar',
          nearbySpots: 'Lugares Cercanos',
          loading: 'Cargando...',
          startNavigation: 'Iniciar Navegación',
          detailInfo: 'Información Detallada',
          interactiveMap: 'Mapa Interactivo',
          mapDescription: 'Se integrará la API de Google Maps',
          currentLocation: 'Ubicación Actual'
        };
      case 'fr':
        return {
          title: 'Carte et Navigation',
          subtitle: 'Explorez les sites touristiques autour de votre position',
          searchPlaceholder: 'Rechercher des lieux...',
          searchButton: 'Rechercher',
          nearbySpots: 'Lieux Proches',
          loading: 'Chargement...',
          startNavigation: 'Démarrer la Navigation',
          detailInfo: 'Informations Détaillées',
          interactiveMap: 'Carte Interactive',
          mapDescription: 'L\'API Google Maps sera intégrée',
          currentLocation: 'Position Actuelle'
        };
      case 'hi':
        return {
          title: 'मैप और नेवीगेशन',
          subtitle: 'अपने स्थान के आसपास पर्यटन स्थलों का अन्वेषण करें',
          searchPlaceholder: 'स्थान खोजें...',
          searchButton: 'खोजें',
          nearbySpots: 'आसपास के स्थान',
          loading: 'लोड हो रहा है...',
          startNavigation: 'नेवीगेशन शुरू करें',
          detailInfo: 'विस्तृत जानकारी',
          interactiveMap: 'इंटरैक्टिव मैप',
          mapDescription: 'Google Maps API एकीकृत किया जाएगा',
          currentLocation: 'वर्तमान स्थान'
        };
      case 'ru':
        return {
          title: 'Карта и Навигация',
          subtitle: 'Исследуйте туристические места вокруг вашего местоположения',
          searchPlaceholder: 'Поиск мест...',
          searchButton: 'Поиск',
          nearbySpots: 'Ближайшие Места',
          loading: 'Загрузка...',
          startNavigation: 'Начать Навигацию',
          detailInfo: 'Подробная Информация',
          interactiveMap: 'Интерактивная Карта',
          mapDescription: 'Будет интегрирован Google Maps API',
          currentLocation: 'Текущее Местоположение'
        };
      case 'ar':
        return {
          title: 'الخريطة والملاحة',
          subtitle: 'استكشف المعالم السياحية حول موقعك',
          searchPlaceholder: 'البحث عن الأماكن...',
          searchButton: 'بحث',
          nearbySpots: 'الأماكن القريبة',
          loading: 'جاري التحميل...',
          startNavigation: 'بدء الملاحة',
          detailInfo: 'معلومات مفصلة',
          interactiveMap: 'خريطة تفاعلية',
          mapDescription: 'سيتم دمج Google Maps API',
          currentLocation: 'الموقع الحالي'
        };
      case 'id':
        return {
          title: 'Peta dan Navigasi',
          subtitle: 'Jelajahi tempat wisata di sekitar lokasi Anda',
          searchPlaceholder: 'Cari tempat...',
          searchButton: 'Cari',
          nearbySpots: 'Tempat Terdekat',
          loading: 'Memuat...',
          startNavigation: 'Mulai Navigasi',
          detailInfo: 'Info Detail',
          interactiveMap: 'Peta Interaktif',
          mapDescription: 'Google Maps API akan diintegrasikan',
          currentLocation: 'Lokasi Saat Ini'
        };
      case 'pt':
        return {
          title: 'Mapa e Navegação',
          subtitle: 'Explore pontos turísticos ao redor da sua localização',
          searchPlaceholder: 'Buscar lugares...',
          searchButton: 'Buscar',
          nearbySpots: 'Locais Próximos',
          loading: 'Carregando...',
          startNavigation: 'Iniciar Navegação',
          detailInfo: 'Informações Detalhadas',
          interactiveMap: 'Mapa Interativo',
          mapDescription: 'A API do Google Maps será integrada',
          currentLocation: 'Localização Atual'
        };
      case 'th':
        return {
          title: 'แผนที่และการนำทาง',
          subtitle: 'สำรวจสถานที่ท่องเที่ยวรอบตำแหน่งของคุณ',
          searchPlaceholder: 'ค้นหาสถานที่...',
          searchButton: 'ค้นหา',
          nearbySpots: 'สถานที่ใกล้เคียง',
          loading: 'กำลังโหลด...',
          startNavigation: 'เริ่มการนำทาง',
          detailInfo: 'ข้อมูลรายละเอียด',
          interactiveMap: 'แผนที่แบบโต้ตอบ',
          mapDescription: 'จะรวม Google Maps API',
          currentLocation: 'ตำแหน่งปัจจุบัน'
        };
      case 'vi':
        return {
          title: 'Bản Đồ và Điều Hướng',
          subtitle: 'Khám phá các điểm du lịch xung quanh vị trí của bạn',
          searchPlaceholder: 'Tìm kiếm địa điểm...',
          searchButton: 'Tìm kiếm',
          nearbySpots: 'Địa Điểm Gần Đây',
          loading: 'Đang tải...',
          startNavigation: 'Bắt Đầu Điều Hướng',
          detailInfo: 'Thông Tin Chi Tiết',
          interactiveMap: 'Bản Đồ Tương Tác',
          mapDescription: 'Google Maps API sẽ được tích hợp',
          currentLocation: 'Vị Trí Hiện Tại'
        };
      case 'it':
        return {
          title: 'Mappa e Navigazione',
          subtitle: 'Esplora i luoghi turistici intorno alla tua posizione',
          searchPlaceholder: 'Cerca luoghi...',
          searchButton: 'Cerca',
          nearbySpots: 'Luoghi Vicini',
          loading: 'Caricamento...',
          startNavigation: 'Inizia Navigazione',
          detailInfo: 'Informazioni Dettagliate',
          interactiveMap: 'Mappa Interattiva',
          mapDescription: 'L\'API di Google Maps sarà integrata',
          currentLocation: 'Posizione Attuale'
        };
      default: // Japanese
        return {
          title: '地図・ナビゲーション',
          subtitle: '現在地周辺の観光スポットを探索',
          searchPlaceholder: '場所を検索...',
          searchButton: '検索',
          nearbySpots: '周辺スポット',
          loading: '読み込み中...',
          startNavigation: 'ナビゲーション開始',
          detailInfo: '詳細情報',
          interactiveMap: 'インタラクティブマップ',
          mapDescription: 'Google Maps APIが統合されます',
          currentLocation: '現在地'
        };
    }
  };

  const content = getLocalizedContent();

  useEffect(() => {
    console.log('MapNavigation useEffect - initial load');
    console.log('Initial mapCenter:', mapCenter);
    getCurrentLocation();
    loadNearbyPlaces();
  }, []);

  // For now, ignore questionnaire categories
  useEffect(() => {
    // no-op while showing all nearby places regardless of categories
  }, [selectedCategories]);

  // Fetch place details
  const fetchPlaceDetails = async (placeId: string) => {
    try {
      setIsLoadingDetails(true);
      setPlaceDetails(null);
      const res = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.GOOGLE_MAPS.DETAILS,
        {
          method: 'POST',
          body: JSON.stringify({ placeId })
        }
      );
      if (res.success && res.data) {
        setPlaceDetails(res.data);
      }
    } catch (e) {
      console.warn('Failed to load place details', e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle place selection
  const handleSelectPlace = (place: any) => {
    setSelectedPlace(place);
    if (place?.id) fetchPlaceDetails(place.id);
  };

  // Handle directions request
  const handleDirectionsRequest = (place: any) => {
    console.log('Directions requested for:', place);
    setDirectionsInfo(place);
    setShowDirections(true);
    setDirectionsTo(place);
  };

  // Clear directions
  const clearDirections = () => {
    setShowDirections(false);
    setDirectionsInfo(null);
    setDirectionsTo(null);
    // Note: The directions will be cleared from the map when new directions are requested
  };

  const loadNearbyPlaces = async () => {
    setIsLoading(true);
    setShowMockNotice(false);
    setNoticeMessage(null);
    
    try {
      // Try to fetch broadly from Google Places API (no questionnaire filter)
      const result = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.GOOGLE_MAPS.SEARCH,
        {
          method: 'POST',
          body: JSON.stringify({
            location: currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : `${MAP_CONFIG.DEFAULT_CENTER.lat},${MAP_CONFIG.DEFAULT_CENTER.lng}`,
            radius: MAP_CONFIG.SEARCH_RADIUS.toString(),
            // Ask backend to use a broad default type for Nearby Search
            type: 'point_of_interest',
            keyword: searchQuery || undefined
          })
        }
      );
      
      if (result.success && result.data) {
        // Check if this is mock data
        if (result.isMockData) {
          setShowMockNotice(true);
          setNoticeMessage(result.message || ERROR_MESSAGES.GOOGLE_MAPS_NOT_CONFIGURED);
        } else {
          console.log('✅ Real Google Places data loaded:', result.data.length, 'places');
        }
        setNearbyPlaces(result.data);
        return;
      }
      
      // Only use mock data if API call completely fails
      console.log('⚠️ API call failed, using fallback mock data');
      setShowMockNotice(true);
      setNoticeMessage(ERROR_MESSAGES.MAP_API_UNAVAILABLE);
      setNearbyPlaces(MOCK_PLACES);
    } catch (error) {
      console.error(ERROR_MESSAGES.FAILED_TO_LOAD_PLACES, error);
      setShowMockNotice(true);
      setNoticeMessage(ERROR_MESSAGES.FAILED_TO_LOAD_PLACES);
      setNearbyPlaces(MOCK_PLACES);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPlaces = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setShowMockNotice(false);
    setNoticeMessage(null);
    
    try {
      // Try to search using Google Places API
      const result = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.GOOGLE_MAPS.SEARCH,
        {
          method: 'POST',
          body: JSON.stringify({
            query: searchQuery,
            location: currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : `${MAP_CONFIG.DEFAULT_CENTER.lat},${MAP_CONFIG.DEFAULT_CENTER.lng}`
          })
        }
      );
      
      if (result.success && result.data) {
        // Check if this is mock data
        if (result.isMockData) {
          setShowMockNotice(true);
          setNoticeMessage(result.message || ERROR_MESSAGES.GOOGLE_MAPS_NOT_CONFIGURED);
        } else {
          console.log('✅ Real Google Places search results loaded:', result.data.length, 'places');
        }
        setNearbyPlaces(result.data);
        return;
      }
      
      // Only use mock search if API call completely fails
      console.log('⚠️ Search API call failed, using fallback mock search');
      setShowMockNotice(true);
      setNoticeMessage(ERROR_MESSAGES.MAP_API_UNAVAILABLE);
      const searchResults = nearbyPlaces.filter(place => 
        place.name.includes(searchQuery) || 
        place.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setNearbyPlaces(searchResults);
    } catch (error) {
      console.error(ERROR_MESSAGES.SEARCH_ERROR, error);
      setShowMockNotice(true);
      setNoticeMessage(ERROR_MESSAGES.SEARCH_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.default;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{content.title}</h1>
          <p className="text-lg text-gray-600">{content.subtitle}</p>
        </motion.div>
        
        {/* Mock Data Notice */}
        {showMockNotice && noticeMessage && (
          <MockDataNotice 
            message={noticeMessage}
            onRetry={() => setShowMockNotice(false)}
            className="max-w-6xl mx-auto mb-4"
          />
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Area */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <motion.div
              className="bg-white rounded-2xl shadow-lg p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
                    placeholder={content.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={searchPlaces}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  {content.searchButton}
                </button>
              </div>
            </motion.div>

            {/* Category Filter temporarily hidden (show all nearby locations) */}

            {/* Google Map */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="h-96 relative">
                <GoogleMap
                  center={safeMapCenter}
                  zoom={mapZoom}
                  places={nearbyPlaces
                    .filter(place => 
                      place && 
                      typeof place.lat === 'number' && 
                      typeof place.lng === 'number' && 
                      !isNaN(place.lat) && 
                      !isNaN(place.lng)
                    )
                    .map(place => ({
                      id: place.id || place.name,
                      name: place.name,
                      lat: place.lat,
                      lng: place.lng,
                      type: place.category
                    }))}
                  onPlaceSelect={handleSelectPlace}
                  onDirectionsRequest={handleDirectionsRequest}
                  clearDirections={!showDirections}
                  directionsTo={directionsTo}
                  className="w-full h-full"
                />
                
                {/* Current Location Button */}
                <button
                  onClick={getCurrentLocation}
                  className="absolute top-4 right-4 bg-white rounded-lg p-3 shadow-lg hover:bg-gray-50 transition-colors"
                  title={content.currentLocation}
                >
                  <Locate className="w-5 h-5 text-blue-600" />
                </button>
                
                {/* Clear Directions Button */}
                {showDirections && (
                  <button
                    onClick={clearDirections}
                    className="absolute top-4 right-16 bg-white rounded-lg p-3 shadow-lg hover:bg-gray-50 transition-colors"
                    title="Clear directions"
                  >
                    <Navigation className="w-5 h-5 text-red-600" />
                  </button>
                )}
                
                {/* Current Location Indicator */}
                {currentLocation && (
                  <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">{content.currentLocation}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Places List */}
          <div className="space-y-6">
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">{content.nearbySpots}</h2>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">{content.loading}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nearbyPlaces.map((place, index) => (
                    <motion.div
                      key={place.id}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedPlace?.id === place.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                      onClick={() => handleSelectPlace(place)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{getCategoryIcon(place.category)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{place.name}</h3>
                          <p className="text-sm text-gray-600">{place.nameEn}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{place.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{place.distance}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Selected Place Details */}
            {selectedPlace && (
              <motion.div
                className="bg-white rounded-3xl shadow-lg p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4">
                  <div
                    className="h-32 bg-cover bg-center rounded-xl mb-4"
                    style={{ backgroundImage: `url(${(placeDetails?.photos && placeDetails.photos[0]) || selectedPlace.image})` }}
                  />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{placeDetails?.name || selectedPlace.name}</h3>
                  {isLoadingDetails ? (
                    <p className="text-gray-500">Loading details...</p>
                  ) : (
                    <p className="text-gray-600 mb-4">{selectedPlace.description}</p>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{placeDetails?.address || selectedPlace.address || 'Address not available'}</span>
                  </div>
                  {placeDetails?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{placeDetails.phone}</span>
                    </div>
                  )}
                  {placeDetails?.openingHours && (
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        {placeDetails.openingHours.map((h: string, i: number) => (
                          <div key={i}>{h}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {(placeDetails?.lat && placeDetails?.lng) || (selectedPlace?.lat && selectedPlace?.lng) ? (
                    <button
                      onClick={() => handleDirectionsRequest({
                        id: placeDetails?.id || selectedPlace.id,
                        name: placeDetails?.name || selectedPlace.name,
                        lat: placeDetails?.lat || selectedPlace.lat,
                        lng: placeDetails?.lng || selectedPlace.lng
                      })}
                      className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      {content.startNavigation}
                    </button>
                  ) : null}
                  {placeDetails?.website && (
                    <a href={placeDetails.website} target="_blank" rel="noreferrer" className="block w-full text-center bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors">
                      {content.detailInfo}
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Directions Panel */}
            {showDirections && directionsInfo && (
              <motion.div
                className="bg-white rounded-3xl shadow-lg p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Directions to {directionsInfo.name}</h3>
                  <button
                    onClick={() => setShowDirections(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800">Route to {directionsInfo.name}</p>
                      <p className="text-sm text-gray-600">Click on the map to see the route</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Your current location</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">{directionsInfo.name}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      The route has been displayed on the map. You can click on other places to get directions to them as well.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapNavigation;