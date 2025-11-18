// Dashboard configuration constants
export const DASHBOARD_CONFIG = {
  // Default statistics when no real data is available
  DEFAULT_STATS: {
    totalTrips: 0,
    visitedCities: 0,
    totalDays: 0
  },
  
  // eSIM configuration
  ESIM: {
    DEFAULT_DATA_LIMIT: 5, // GB
    DEFAULT_DATA_USED: 0, // GB
    FREE_PLAN_MESSAGE: '✨ 無料プランでは1日目と2日目午前中（12:00まで）の詳細をご覧いただけます'
  },
  
  // Supported languages for translation
  LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'pt', name: 'Português' },
    { code: 'th', name: 'ไทย' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'it', name: 'Italiano' }
  ],
  
  // Default trip image fallback
  DEFAULT_TRIP_IMAGE: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg',
  
  // Status colors and text
  STATUS_CONFIG: {
    upcoming: { 
      color: 'bg-blue-100 text-blue-700',
      textKey: 'dashboard.upcoming'
    },
    ongoing: { 
      color: 'bg-green-100 text-green-700',
      textKey: 'dashboard.ongoing'
    },
    completed: { 
      color: 'bg-gray-100 text-gray-700',
      textKey: 'dashboard.completed'
    },
    default: { 
      color: 'bg-gray-100 text-gray-700',
      textKey: 'dashboard.unknown'
    }
  }
};

// Helper functions
export const getStatusConfig = (status: string) => {
  return DASHBOARD_CONFIG.STATUS_CONFIG[status as keyof typeof DASHBOARD_CONFIG.STATUS_CONFIG] || DASHBOARD_CONFIG.STATUS_CONFIG.default;
};

export const calculateStats = (trips: any[]) => {
  if (!Array.isArray(trips) || trips.length === 0) {
    return DASHBOARD_CONFIG.DEFAULT_STATS;
  }
  
  const visitedCities = new Set(trips.map(trip => trip.destination)).size;
  const totalDays = trips.reduce((total, trip) => {
    if (trip.startDate && trip.endDate) {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return total + diffDays;
    }
    return total;
  }, 0);
  
  return {
    totalTrips: trips.length,
    visitedCities,
    totalDays
  };
};
