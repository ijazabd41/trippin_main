import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader } from 'lucide-react';
import { apiCall, API_CONFIG, buildApiUrl, APIError } from '../config/api';
import { handleVercelError, globalErrorHandler } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';

interface PlaceData {
  name: string;
  formatted_address: string;
  place_id?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    }
  };
  rating?: number;
  types?: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceData) => void;
  placeholder?: string;
  className?: string;
  types?: string[];
  country?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search for a place',
  className = '',
  types = ['establishment', 'geocode'],
  country = 'jp'
}) => {
  const { t } = useLanguage();
  const [predictions, setPredictions] = useState<PlaceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        predictionsRef.current && 
        !predictionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const fetchPredictions = async (query: string) => {
    console.log(`[GooglePlacesAutocomplete] fetchPredictions called with query: "${query}"`);
    
    console.log(`[GooglePlacesAutocomplete] fetchPredictions called with query: "${query}"`);
    
    if (!query.trim() || query.length < 2) {
      console.log(`[GooglePlacesAutocomplete] Query too short, clearing predictions`);
      console.log(`[GooglePlacesAutocomplete] Query too short, clearing predictions`);
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(`[GooglePlacesAutocomplete] Starting API call to /google-maps`);
    console.log(`[GooglePlacesAutocomplete] Starting API call to /google-maps`);
    
    try {
      const result = await apiCall('/google-maps', {
        method: 'POST',
        body: JSON.stringify({
          input: query,
          types: types.join('|'),
          components: `country:${country}`,
          language: 'ja'
        })
      });
      
      console.log(`[GooglePlacesAutocomplete] API result for Google Maps:`, result);
      
      console.log(`[GooglePlacesAutocomplete] API result for Google Maps:`, result);
      
      if (result.success && result.predictions && Array.isArray(result.predictions)) {
        console.log(`[GooglePlacesAutocomplete] Found ${result.predictions.length} predictions`);
        console.log(`[GooglePlacesAutocomplete] Found ${result.predictions.length} predictions`);
        const formattedPredictions: PlaceData[] = result.predictions.map((prediction: any) => ({
          name: prediction.structured_formatting?.main_text || prediction.description,
          formatted_address: prediction.description,
          place_id: prediction.place_id,
          types: prediction.types
        }));
        
        console.log(`[GooglePlacesAutocomplete] Formatted predictions:`, formattedPredictions);
        console.log(`[GooglePlacesAutocomplete] Formatted predictions:`, formattedPredictions);
        setPredictions(formattedPredictions);
        setShowPredictions(true);
      } else if (result.candidates && Array.isArray(result.candidates)) {
        console.log(`[GooglePlacesAutocomplete] Found ${result.candidates.length} candidates`);
        console.log(`[GooglePlacesAutocomplete] Found ${result.candidates.length} candidates`);
        // Handle text search results
        const formattedCandidates: PlaceData[] = result.candidates.map((candidate: any) => ({
          name: candidate.name,
          formatted_address: candidate.formatted_address,
          place_id: candidate.place_id,
          geometry: candidate.geometry,
          rating: candidate.rating,
          types: candidate.types
        }));
        
        console.log(`[GooglePlacesAutocomplete] Formatted candidates:`, formattedCandidates);
        console.log(`[GooglePlacesAutocomplete] Formatted candidates:`, formattedCandidates);
        setPredictions(formattedCandidates);
        setShowPredictions(true);
      } else {
        console.warn('[GooglePlacesAutocomplete] Invalid API response format:', result);
        console.log(`[GooglePlacesAutocomplete] No predictions or candidates found in result`);
        console.log(`[GooglePlacesAutocomplete] No predictions or candidates found in result`);
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      const apiError = error as APIError;
      
      globalErrorHandler.handleError(apiError, {
        page: 'GooglePlacesAutocomplete',
        action: 'fetchPredictions',
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      console.error('[GooglePlacesAutocomplete] Places API error:', apiError);
      
      // Provide fallback suggestions for common Japan destinations
      if (query.length >= 2) {
        const fallbackPlaces = getFallbackPlaces(query);
        console.log(`[GooglePlacesAutocomplete] Using fallback places:`, fallbackPlaces);
        console.log(`[GooglePlacesAutocomplete] Using fallback places:`, fallbackPlaces);
        setPredictions(fallbackPlaces);
        setShowPredictions(fallbackPlaces.length > 0);
        
        if (apiError.status === 403) {
          setError(t('googlePlaces.placesApiLimit'));
        } else if (apiError.code === 'NETWORK_OFFLINE') {
          setError(t('googlePlaces.offlineMode'));
        }
      } else {
        console.log(`[GooglePlacesAutocomplete] Query too short for fallback, clearing predictions`);
        console.log(`[GooglePlacesAutocomplete] Query too short for fallback, clearing predictions`);
        setPredictions([]);
        setShowPredictions(false);
      }
    } finally {
      setIsLoading(false);
      console.log(`[GooglePlacesAutocomplete] Final state - predictions:`, predictions.length, 'showPredictions:', showPredictions);
      console.log(`[GooglePlacesAutocomplete] Final state - predictions:`, predictions.length, 'showPredictions:', showPredictions);
    }
  };

  const getFallbackPlaces = (query: string): PlaceData[] => {
    const commonPlaces = [
      { name: t('destinations.tokyo') || 'Tokyo', formatted_address: t('destinations.tokyo') || 'Tokyo, Japan', place_id: 'tokyo_fallback' },
      { name: t('destinations.osaka') || 'Osaka', formatted_address: t('destinations.osaka') || 'Osaka, Japan', place_id: 'osaka_fallback' },
      { name: t('destinations.kyoto') || 'Kyoto', formatted_address: t('destinations.kyoto') || 'Kyoto, Japan', place_id: 'kyoto_fallback' },
      { name: t('destinations.hiroshima') || 'Hiroshima', formatted_address: t('destinations.hiroshima') || 'Hiroshima, Japan', place_id: 'hiroshima_fallback' },
      { name: t('destinations.fukuoka') || 'Fukuoka', formatted_address: t('destinations.fukuoka') || 'Fukuoka, Japan', place_id: 'fukuoka_fallback' },
      { name: t('destinations.sapporo') || 'Sapporo', formatted_address: t('destinations.sapporo') || 'Sapporo, Japan', place_id: 'sapporo_fallback' },
      { name: t('destinations.nara') || 'Nara', formatted_address: t('destinations.nara') || 'Nara, Japan', place_id: 'nara_fallback' },
      { name: t('destinations.kanazawa') || 'Kanazawa', formatted_address: t('destinations.kanazawa') || 'Kanazawa, Japan', place_id: 'kanazawa_fallback' },
      { name: t('destinations.nikko') || 'Nikko', formatted_address: t('destinations.nikko') || 'Nikko, Japan', place_id: 'nikko_fallback' },
      { name: t('destinations.okinawa') || 'Okinawa', formatted_address: t('destinations.okinawa') || 'Okinawa, Japan', place_id: 'okinawa_fallback' },
      { name: t('destinations.mount-fuji') || 'Mount Fuji', formatted_address: t('destinations.mount-fuji') || 'Mount Fuji, Japan', place_id: 'mount-fuji_fallback' },
      { name: t('destinations.hakone') || 'Hakone', formatted_address: t('destinations.hakone') || 'Hakone, Japan', place_id: 'hakone_fallback' }
    ];

    return commonPlaces.filter(place => 
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.formatted_address.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log(`[GooglePlacesAutocomplete] Input changed to: "${newValue}"`);
    console.log(`[GooglePlacesAutocomplete] Input changed to: "${newValue}"`);
    onChange(newValue);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce API calls
    debounceRef.current = setTimeout(() => {
      console.log(`[GooglePlacesAutocomplete] Debounce timeout triggered, calling fetchPredictions`);
      console.log(`[GooglePlacesAutocomplete] Debounce timeout triggered, calling fetchPredictions`);
      fetchPredictions(newValue);
    }, 300);
  };

  const handlePredictionClick = async (place: PlaceData) => {
    console.log(`[GooglePlacesAutocomplete] Prediction clicked:`, place);
    console.log(`[GooglePlacesAutocomplete] Prediction clicked:`, place);
    onChange(place.name);
    setShowPredictions(false);
    
    // If we have a place_id, fetch detailed information
    if (place.place_id && !place.place_id.includes('fallback')) {
      try {
        const detailResult = await apiCall('/google-maps', {
          method: 'POST',
          body: JSON.stringify({
            place_id: place.place_id,
            fields: 'name,formatted_address,geometry,rating,photos,types'
          })
        });
        
        if (detailResult.success && detailResult.result) {
          onPlaceSelect({
            ...place,
            ...detailResult.result
          });
        } else {
          onPlaceSelect(place);
        }
      } catch (error) {
        console.error('Failed to fetch place details:', error);
        onPlaceSelect(place);
      }
    } else {
      onPlaceSelect(place);
    }
  };

  const handleFocus = () => {
    console.log(`[GooglePlacesAutocomplete] Input focused with value: "${value}"`);
    console.log(`[GooglePlacesAutocomplete] Input focused with value: "${value}"`);
    if (value && value.length >= 2) {
      console.log(`[GooglePlacesAutocomplete] Value length >= 2, calling fetchPredictions`);
      console.log(`[GooglePlacesAutocomplete] Value length >= 2, calling fetchPredictions`);
      fetchPredictions(value);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${className}`}
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-3">
            <Loader className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
          {error}
        </div>
      )}
      
      {showPredictions && predictions.length > 0 && (
        <div 
          ref={predictionsRef}
          className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
        >
          {predictions.map((place, index) => (
            <div
              key={place.place_id || index}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              onClick={() => handlePredictionClick(place)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{place.name}</div>
                  <div className="text-sm text-gray-500 truncate">{place.formatted_address}</div>
                  {place.rating && (
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < Math.floor(place.rating!) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{place.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;