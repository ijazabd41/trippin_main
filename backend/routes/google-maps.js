import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAI2Vx2ujOde-6B8udZdHl-AD4xkserang';
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const GOOGLE_PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

// Check if Google Maps API key is configured
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️  GOOGLE_MAPS_API_KEY environment variable is not set');
  console.warn('   Google Maps features will not work. Please configure your Google Maps API key.');
}

// Google Places API endpoint
router.post('/', async (req, res) => {
  try {
    const { location, radius = '5000', types = [], type, keyword } = req.body;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    // Check if Google Maps API key is configured
    if (!GOOGLE_MAPS_API_KEY) {
      console.log('🔄 Google Maps API key not configured, using fallback data');
      
      const fallbackPlaces = [
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
          image: 'https://images.pexels.com/photos/161251/senso-ji-temple-asakusa-tokyo-japan-161251.jpeg'
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
          image: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg'
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
          image: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg'
        }
      ];
      
      return res.json({
        success: true,
        data: fallbackPlaces,
        isMockData: true,
        message: 'Google Maps API not configured, showing sample data'
      });
    }

    // Build Google Places API request
    const params = new URLSearchParams({
      location: location,
      radius: radius,
      key: GOOGLE_MAPS_API_KEY
    });

    // Google Nearby Search supports only ONE type per request.
    // If multiple types are provided, prefer the first; otherwise default to a broad category.
    const resolvedType = type || (Array.isArray(types) && types.length > 0 ? types[0] : 'point_of_interest');
    if (resolvedType) {
      params.append('type', resolvedType);
    }

    if (keyword) {
      params.append('keyword', keyword);
    }

    const url = `${GOOGLE_PLACES_API_URL}?${params}`;
    console.log('🔍 Google Places API Request:', url);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API Error Details:', {
        status: data.status,
        error_message: data.error_message,
        url: url.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN')
      });
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    // Transform Google Places data to our format
    const places = data.results.map((place, index) => ({
      id: place.place_id || `place-${index}`,
      name: place.name,
      nameEn: place.name, // Google Places doesn't provide separate English names
      category: mapGooglePlaceTypeToCategory(place.types),
      rating: place.rating || 0,
      distance: 'Unknown', // Google Places doesn't provide distance in this API
      address: place.vicinity || 'Address not available',
      phone: 'Not available', // Would need Place Details API for phone
      hours: 'Not available', // Would need Place Details API for hours
      description: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      image: place.photos && place.photos.length > 0 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
        : 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg'
    }));

    res.json({
      success: true,
      data: places,
      isMockData: false
    });

  } catch (error) {
    console.error('Google Places API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch places from Google Places API',
      error: error.message
    });
  }
});

// Map Google Places types to our questionnaire categories
function mapGooglePlaceTypeToCategory(googleTypes) {
  const typeMapping = {
    // Culture & History
    'museum': 'museums-galleries',
    'art_gallery': 'museums-galleries',
    'library': 'history-culture',
    'cultural_center': 'traditional-experience',
    'place_of_worship': 'temples-shrines',
    'hindu_temple': 'temples-shrines',
    'church': 'temples-shrines',
    'mosque': 'temples-shrines',
    'tourist_attraction': 'history-culture',
    'historical_site': 'castles-historic-sites',
    
    // Nature & Scenery
    'park': 'nature-scenery',
    'natural_feature': 'nature-scenery',
    'beach': 'beach-swimming',
    'campground': 'forest-mountain-camping',
    'bicycle_store': 'cycling',
    
    // Entertainment
    'store': 'shopping',
    'shopping_mall': 'shopping',
    'clothing_store': 'fashion',
    'electronics_store': 'shopping',
    'bar': 'nightlife',
    'night_club': 'nightlife',
    'restaurant': 'food-gourmet',
    'cafe': 'sweets-cafe',
    'point_of_interest': 'urban-architecture',
    
    // Food
    'food': 'food-gourmet',
    'meal_takeaway': 'local-street-food',
    'bakery': 'sweets-cafe',
    
    // Events & Performance
    'event_venue': 'festivals-events',
    'entertainment': 'performance-live',
    
    // Wellness
    'spa': 'hot-springs',
    'beauty_salon': 'massage-spa',
    'gym': 'fitness-activities',
    'sports_complex': 'fitness-activities',
    
    // Technology
    'electronics_store': 'technology',
    
    // Fashion
    'clothing_store': 'fashion',
    'shopping_mall': 'brand-outlet'
  };

  // Find the first matching type
  for (const googleType of googleTypes) {
    if (typeMapping[googleType]) {
      return typeMapping[googleType];
    }
  }

  // Default fallback
  return 'history-culture';
}

export default router;
 
// Place Details endpoint
router.post('/details', async (req, res) => {
  try {
    const { placeId, language } = req.body;
    if (!placeId) {
      return res.status(400).json({ success: false, message: 'placeId is required' });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.json({ success: true, isMockData: true, data: null, message: 'Google Maps API not configured' });
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      fields: [
        'place_id,name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,website,url,geometry/location,rating,user_ratings_total,photos'
      ].join(',')
    });
    if (language) params.append('language', language);

    const url = `${GOOGLE_PLACE_DETAILS_URL}?${params}`;
    console.log('🔎 Google Place Details Request:', url.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK') {
      console.error('Google Place Details Error:', { status: data.status, error_message: data.error_message });
      throw new Error(`Google Place Details error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    const r = data.result;
    const details = {
      id: r.place_id,
      name: r.name,
      address: r.formatted_address,
      phone: r.formatted_phone_number || r.international_phone_number || null,
      website: r.website || null,
      url: r.url || null,
      rating: r.rating || null,
      userRatingsTotal: r.user_ratings_total || 0,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
      openingHours: r.opening_hours?.weekday_text || null,
      photos: Array.isArray(r.photos) ? r.photos.slice(0, 5).map(p => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${p.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`) : []
    };

    return res.json({ success: true, data: details, isMockData: false });
  } catch (error) {
    console.error('Place Details API Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch place details', error: error.message });
  }
});
