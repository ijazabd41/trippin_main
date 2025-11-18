import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  places?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type?: string;
  }>;
  onPlaceSelect?: (place: any) => void;
  onDirectionsRequest?: (place: any) => void;
  clearDirections?: boolean;
  directionsTo?: { lat: number; lng: number; name: string } | null;
  className?: string;
}

const MapComponent: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
  places?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type?: string;
  }>;
  onPlaceSelect?: (place: any) => void;
  onDirectionsRequest?: (place: any) => void;
  clearDirections?: boolean;
  directionsTo?: { lat: number; lng: number; name: string } | null;
}> = ({ center, zoom, places = [], onPlaceSelect, onDirectionsRequest, clearDirections = false, directionsTo }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Validate center coordinates
  const isValidCoordinate = (coord: any): coord is { lat: number; lng: number } => {
    return coord && 
           typeof coord.lat === 'number' && 
           typeof coord.lng === 'number' && 
           !isNaN(coord.lat) && 
           !isNaN(coord.lng) &&
           coord.lat >= -90 && coord.lat <= 90 &&
           coord.lng >= -180 && coord.lng <= 180;
  };

  // Default center (Tokyo) if invalid coordinates
  const validCenter = isValidCoordinate(center) ? center : { lat: 35.6762, lng: 139.6503 };

  // Function to get directions to a place
  const getDirections = async (destination: { lat: number; lng: number; name: string }) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) {
      console.error('Directions service not initialized');
      return;
    }

    try {
      const request: google.maps.DirectionsRequest = {
        origin: validCenter,
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      };

      console.log('Getting directions to:', destination.name, 'from:', validCenter);

      const result = await directionsServiceRef.current.route(request);
      
      if (result.status === google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result);
        console.log('Directions loaded successfully');
        
        // Call the callback if provided
        if (onDirectionsRequest) {
          onDirectionsRequest(destination);
        }
      } else {
        console.error('Directions request failed:', result.status);
      }
    } catch (error) {
      console.error('Error getting directions:', error);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    console.log('Initializing map with center:', validCenter, 'zoom:', zoom);

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      center: validCenter,
      zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Initialize directions service and renderer
    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      draggable: false,
      suppressMarkers: true, // We'll use our custom markers
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });
    directionsRendererRef.current.setMap(map);

    // Add click listener for map
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log('Map clicked:', { lat, lng });
      }
    });

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      // Cleanup directions renderer
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Filter and add valid markers only
    const validPlaces = places.filter(place => 
      place && 
      typeof place.lat === 'number' && 
      typeof place.lng === 'number' && 
      !isNaN(place.lat) && 
      !isNaN(place.lng) &&
      place.lat >= -90 && place.lat <= 90 &&
      place.lng >= -180 && place.lng <= 180
    );

    console.log('Adding markers for places:', validPlaces.length, 'out of', places.length);

    // Add new markers
    validPlaces.forEach(place => {
      try {
        const marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map: mapInstanceRef.current,
          title: place.name,
          icon: {
            url: getMarkerIcon(place.type),
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        // Add click listener to marker
        marker.addListener('click', () => {
          console.log('Marker clicked for place:', place.name);
          
          // Show directions to this place
          getDirections({
            lat: place.lat,
            lng: place.lng,
            name: place.name
          });
          
          // Also call the place select callback
          if (onPlaceSelect) {
            onPlaceSelect(place);
          }
        });

        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error creating marker for place:', place, error);
      }
    });
  }, [places, onPlaceSelect]);


  // Handle external directions request
  useEffect(() => {
    if (directionsTo && directionsServiceRef.current && directionsRendererRef.current) {
      getDirections(directionsTo);
    }
  }, [directionsTo]);

  // Clear directions when clearDirections prop is true
  useEffect(() => {
    if (clearDirections && directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
      console.log('Directions cleared from map');
    }
  }, [clearDirections]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};

const getMarkerIcon = (type?: string): string => {
  const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
  switch (type) {
    case 'restaurant':
      return `${baseUrl}restaurant.png`;
    case 'hotel':
      return `${baseUrl}lodging.png`;
    case 'attraction':
      return `${baseUrl}tourist.png`;
    case 'shopping':
      return `${baseUrl}shopping.png`;
    default:
      return `${baseUrl}red-dot.png`;
  }
};

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-96 bg-red-100 rounded-lg">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-red-600">Failed to load map</p>
            <p className="text-sm text-red-500 mt-1">Please check your API key</p>
          </div>
        </div>
      );
    default:
      return null;
  }
};

const GoogleMap: React.FC<GoogleMapProps> = ({
  center,
  zoom,
  places,
  onPlaceSelect,
  onDirectionsRequest,
  clearDirections,
  directionsTo,
  className = "w-full h-96"
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center bg-yellow-100 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-yellow-500 text-4xl mb-2">🔑</div>
          <p className="text-yellow-600">Google Maps API key not configured</p>
          <p className="text-sm text-yellow-500 mt-1">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Wrapper apiKey={apiKey} render={render}>
        <MapComponent
          center={center}
          zoom={zoom}
          places={places}
          onPlaceSelect={onPlaceSelect}
          onDirectionsRequest={onDirectionsRequest}
          clearDirections={clearDirections}
          directionsTo={directionsTo}
        />
      </Wrapper>
    </div>
  );
};

export default GoogleMap;
