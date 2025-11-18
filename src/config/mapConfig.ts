// Map Configuration
export const MAP_CONFIG = {
  // Default map center (Islamabad, Pakistan)
  DEFAULT_CENTER: {
    lat: 33.6844,
    lng: 73.0479
  },
  
  // Default zoom level
  DEFAULT_ZOOM: 13,
  
  // Zoom level when user location is detected
  USER_LOCATION_ZOOM: 15,
  
  // Search radius for places (in meters)
  SEARCH_RADIUS: 5000,
  
  // Map styles
  MAP_STYLES: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }]
    }
  ],
  
  // Directions configuration
  DIRECTIONS: {
    travelMode: 'DRIVING',
    unitSystem: 'METRIC',
    avoidHighways: false,
    avoidTolls: false,
    polylineOptions: {
      strokeColor: '#3B82F6',
      strokeWeight: 4,
      strokeOpacity: 0.8
    }
  },
  
  // Marker configuration
  MARKERS: {
    size: 32,
    defaultIcon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
  }
};

// Category to Google Places API types mapping
export const CATEGORY_TO_PLACES_TYPES = {
  // Culture & History
  'history-culture': ['museum', 'art_gallery', 'library', 'cultural_center'],
  'temples-shrines': ['place_of_worship', 'hindu_temple', 'church', 'mosque'],
  'traditional-experience': ['tourist_attraction', 'cultural_center'],
  'castles-historic-sites': ['tourist_attraction', 'museum', 'historical_site'],
  'museums-galleries': ['museum', 'art_gallery'],
  
  // Nature & Scenery
  'nature-scenery': ['park', 'tourist_attraction', 'natural_feature'],
  'hiking-trekking': ['park', 'natural_feature', 'tourist_attraction'],
  'beach-swimming': ['beach', 'tourist_attraction'],
  'forest-mountain-camping': ['park', 'natural_feature', 'campground'],
  'national-parks': ['park', 'natural_feature'],
  'cycling': ['park', 'bicycle_store', 'tourist_attraction'],
  
  // Entertainment
  'anime-manga': ['tourist_attraction', 'store', 'shopping_mall'],
  'nightlife': ['bar', 'night_club', 'restaurant'],
  'shopping': ['shopping_mall', 'store', 'clothing_store', 'electronics_store'],
  'urban-architecture': ['tourist_attraction', 'point_of_interest'],
  'cafe-bar-hopping': ['cafe', 'bar', 'restaurant'],
  
  // Food
  'food-gourmet': ['restaurant', 'food', 'meal_takeaway'],
  'local-street-food': ['restaurant', 'food', 'meal_takeaway'],
  'wine-sake-tasting': ['bar', 'restaurant', 'store'],
  'sweets-cafe': ['cafe', 'bakery', 'store'],
  
  // Events & Performance
  'festivals-events': ['tourist_attraction', 'event_venue'],
  'gaming-esports': ['tourist_attraction', 'store', 'entertainment'],
  'performance-live': ['tourist_attraction', 'event_venue', 'entertainment'],
  'theater-musical': ['tourist_attraction', 'event_venue', 'entertainment'],
  
  // Wellness
  'hot-springs': ['spa', 'tourist_attraction', 'lodging'],
  'massage-spa': ['spa', 'beauty_salon'],
  'fitness-activities': ['gym', 'sports_complex', 'park'],
  'yoga-meditation': ['spa', 'tourist_attraction', 'place_of_worship'],
  
  // Technology
  'technology': ['tourist_attraction', 'store', 'electronics_store'],
  'vr-ar-experience': ['tourist_attraction', 'entertainment'],
  'science-tech-facilities': ['tourist_attraction', 'museum'],
  
  // Fashion
  'fashion': ['clothing_store', 'shopping_mall', 'store'],
  'brand-outlet': ['shopping_mall', 'store', 'clothing_store'],
  'online-shopping': ['shopping_mall', 'store']
};

// Category icons mapping
export const CATEGORY_ICONS = {
  // Culture & History
  'temples-shrines': '⛩️',
  'history-culture': '🏯',
  'traditional-experience': '🎎',
  'castles-historic-sites': '🏰',
  'museums-galleries': '📚',
  
  // Nature & Scenery
  'nature-scenery': '🌸',
  'hiking-trekking': '🥾',
  'beach-swimming': '🏖️',
  'forest-mountain-camping': '🌲',
  'national-parks': '🏞️',
  'cycling': '🚴',
  
  // Entertainment
  'anime-manga': '🎌',
  'nightlife': '🌃',
  'shopping': '🛍️',
  'urban-architecture': '🏙️',
  'cafe-bar-hopping': '🍹',
  
  // Food
  'food-gourmet': '🍜',
  'local-street-food': '🍣',
  'wine-sake-tasting': '🍷',
  'sweets-cafe': '🍫',
  
  // Events & Performance
  'festivals-events': '🎆',
  'gaming-esports': '🎮',
  'performance-live': '🤹‍♂️',
  'theater-musical': '🎭',
  
  // Wellness
  'hot-springs': '♨️',
  'massage-spa': '💆‍♂️',
  'fitness-activities': '🏋️‍♂️',
  'yoga-meditation': '🧘‍♀️',
  
  // Technology
  'technology': '🤖',
  'vr-ar-experience': '🛸',
  'science-tech-facilities': '🚀',
  
  // Fashion
  'fashion': '👘',
  'brand-outlet': '👜',
  'online-shopping': '🛒',
  
  // Default
  'default': '📍'
};

// Category colors mapping
export const CATEGORY_COLORS = {
  // Culture & History
  'temples-shrines': 'text-red-600 bg-red-100',
  'history-culture': 'text-amber-600 bg-amber-100',
  'traditional-experience': 'text-orange-600 bg-orange-100',
  'castles-historic-sites': 'text-stone-600 bg-stone-100',
  'museums-galleries': 'text-indigo-600 bg-indigo-100',
  
  // Nature & Scenery
  'nature-scenery': 'text-green-600 bg-green-100',
  'hiking-trekking': 'text-emerald-600 bg-emerald-100',
  'beach-swimming': 'text-cyan-600 bg-cyan-100',
  'forest-mountain-camping': 'text-lime-600 bg-lime-100',
  'national-parks': 'text-teal-600 bg-teal-100',
  'cycling': 'text-sky-600 bg-sky-100',
  
  // Entertainment
  'anime-manga': 'text-pink-600 bg-pink-100',
  'nightlife': 'text-purple-600 bg-purple-100',
  'shopping': 'text-violet-600 bg-violet-100',
  'urban-architecture': 'text-slate-600 bg-slate-100',
  'cafe-bar-hopping': 'text-rose-600 bg-rose-100',
  
  // Food
  'food-gourmet': 'text-orange-600 bg-orange-100',
  'local-street-food': 'text-yellow-600 bg-yellow-100',
  'wine-sake-tasting': 'text-red-600 bg-red-100',
  'sweets-cafe': 'text-pink-600 bg-pink-100',
  
  // Events & Performance
  'festivals-events': 'text-yellow-600 bg-yellow-100',
  'gaming-esports': 'text-blue-600 bg-blue-100',
  'performance-live': 'text-purple-600 bg-purple-100',
  'theater-musical': 'text-indigo-600 bg-indigo-100',
  
  // Wellness
  'hot-springs': 'text-cyan-600 bg-cyan-100',
  'massage-spa': 'text-emerald-600 bg-emerald-100',
  'fitness-activities': 'text-green-600 bg-green-100',
  'yoga-meditation': 'text-teal-600 bg-teal-100',
  
  // Technology
  'technology': 'text-blue-600 bg-blue-100',
  'vr-ar-experience': 'text-indigo-600 bg-indigo-100',
  'science-tech-facilities': 'text-sky-600 bg-sky-100',
  
  // Fashion
  'fashion': 'text-pink-600 bg-pink-100',
  'brand-outlet': 'text-purple-600 bg-purple-100',
  'online-shopping': 'text-violet-600 bg-violet-100',
  
  // Default
  'default': 'text-gray-600 bg-gray-100'
};

// Mock places data - this should eventually come from an API
export const MOCK_PLACES = [
  {
    id: '1',
    name: '浅草寺',
    nameEn: 'Senso-ji Temple',
    category: 'temples-shrines',
    rating: 4.8,
    distance: '0.5km',
    address: '東京都台東区浅草2-3-1',
    phone: '03-3842-0181',
    hours: '6:00-17:00',
    description: '東京最古の寺院',
    lat: 35.7148,
    lng: 139.7967,
    image: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Senso-ji+Temple'
  },
  {
    id: '2',
    name: '東京スカイツリー',
    nameEn: 'Tokyo Skytree',
    category: 'urban-architecture',
    rating: 4.7,
    distance: '1.2km',
    address: '東京都墨田区押上1-1-2',
    phone: '0570-55-0634',
    hours: '8:00-22:00',
    description: '世界一高い電波塔',
    lat: 35.7101,
    lng: 139.8107,
    image: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Tokyo+Skytree'
  },
  {
    id: '3',
    name: '築地場外市場',
    nameEn: 'Tsukiji Outer Market',
    category: 'food-gourmet',
    rating: 4.6,
    distance: '2.1km',
    address: '東京都中央区築地4-16-2',
    phone: '03-3541-9444',
    hours: '5:00-14:00',
    description: '新鮮な海鮮とグルメの市場',
    lat: 35.6654,
    lng: 139.7706,
    image: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Tsukiji+Market'
  },
  {
    id: '4',
    name: '銀座',
    nameEn: 'Ginza',
    category: 'shopping',
    rating: 4.4,
    distance: '3.2km',
    address: '東京都中央区銀座',
    phone: '03-3562-2111',
    hours: '10:00-20:00',
    description: '高級ショッピング街',
    lat: 35.6718,
    lng: 139.7650,
    image: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Ginza+Shopping'
  },
  {
    id: '5',
    name: '新宿御苑',
    nameEn: 'Shinjuku Gyoen',
    category: 'nature-scenery',
    rating: 4.1,
    distance: '4.5km',
    address: '東京都新宿区内藤町11',
    phone: '03-3350-0151',
    hours: '9:00-16:30',
    description: '美しい庭園と桜の名所',
    lat: 35.6852,
    lng: 139.7108,
    image: 'https://via.placeholder.com/400x300/059669/FFFFFF?text=Shinjuku+Gyoen'
  },
  {
    id: '6',
    name: '歌舞伎座',
    nameEn: 'Kabukiza Theater',
    category: 'performance-live',
    rating: 4.3,
    distance: '2.8km',
    address: '東京都中央区銀座4-12-15',
    phone: '03-3545-6800',
    hours: '10:00-18:00',
    description: '伝統的な歌舞伎劇場',
    lat: 35.6718,
    lng: 139.7650,
    image: 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Kabukiza+Theater'
  }
];

// Error messages
export const ERROR_MESSAGES = {
  GOOGLE_MAPS_NOT_CONFIGURED: 'Google Maps API key not configured, showing sample data',
  MAP_API_UNAVAILABLE: 'マップAPIが利用できないため、基本的な観光地情報を表示しています。',
  LOCATION_ACCESS_DENIED: '位置情報へのアクセスが拒否されました。',
  LOCATION_NOT_SUPPORTED: 'このブラウザは位置情報をサポートしていません。',
  FAILED_TO_LOAD_PLACES: '周辺情報の取得に失敗しました。基本的な観光地情報を表示しています。',
  SEARCH_ERROR: '検索機能でエラーが発生しました。'
};

// Success messages
export const SUCCESS_MESSAGES = {
  DIRECTIONS_LOADED: 'Directions loaded successfully',
  DIRECTIONS_CLEARED: 'Directions cleared from map',
  LOCATION_RECEIVED: 'Valid location received',
  PLACES_LOADED: 'Places loaded successfully'
};
