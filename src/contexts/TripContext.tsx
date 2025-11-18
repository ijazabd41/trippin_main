import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall, API_CONFIG } from '../config/api';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'upcoming' | 'ongoing' | 'completed';
  itinerary: any[];
  budget: number;
  currency: string;
  travelers: number;
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

interface TripContextType {
  trips: Trip[];
  currentTrip: Trip | null;
  createTrip: (tripData: Partial<Trip>) => Promise<Trip>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  setCurrentTrip: (trip: Trip | null) => void;
  generateItinerary: (tripData: any) => Promise<any>;
  shareTrip: (tripId: string, shareData: any) => Promise<string>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  const createTrip = async (tripData: Partial<Trip>): Promise<Trip> => {
    const newTrip: Trip = {
      id: `trip_${Date.now()}`,
      title: tripData.title || '新しい旅行',
      destination: tripData.destination || '',
      startDate: tripData.startDate || '',
      endDate: tripData.endDate || '',
      status: 'planning',
      itinerary: tripData.itinerary || [],
      budget: tripData.budget || 0,
      currency: tripData.currency || 'JPY',
      travelers: tripData.travelers || 1,
      interests: tripData.interests || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      image: tripData.image || 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg'
    };

    setTrips(prev => [...prev, newTrip]);
    localStorage.setItem('trippin-trips', JSON.stringify([...trips, newTrip]));
    
    return newTrip;
  };

  const updateTrip = async (tripId: string, updates: Partial<Trip>): Promise<void> => {
    const updatedTrips = trips.map(trip => 
      trip.id === tripId 
        ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
        : trip
    );
    
    setTrips(updatedTrips);
    localStorage.setItem('trippin-trips', JSON.stringify(updatedTrips));
    
    if (currentTrip?.id === tripId) {
      setCurrentTrip({ ...currentTrip, ...updates, updatedAt: new Date().toISOString() });
    }
  };

  const deleteTrip = async (tripId: string): Promise<void> => {
    const filteredTrips = trips.filter(trip => trip.id !== tripId);
    setTrips(filteredTrips);
    localStorage.setItem('trippin-trips', JSON.stringify(filteredTrips));
    
    if (currentTrip?.id === tripId) {
      setCurrentTrip(null);
    }
  };

  const generateItinerary = async (tripData: any): Promise<any> => {
    try {
      const result = await apiCall(API_CONFIG.ENDPOINTS.OPENAI_GENERATE, {
        method: 'POST',
        body: JSON.stringify({ tripData })
      });


      return result.data;
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw error;
    }
  };

  const shareTrip = async (tripId: string, shareData: any): Promise<string> => {
    // Generate shareable link
    const shareId = `share_${Date.now()}`;
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    
    // Store share data
    localStorage.setItem(`trippin-share-${shareId}`, JSON.stringify({
      tripId,
      ...shareData,
      createdAt: new Date().toISOString()
    }));
    
    return shareUrl;
  };

  useEffect(() => {
    const savedTrips = localStorage.getItem('trippin-trips');
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips));
    }
  }, []);

  return (
    <TripContext.Provider value={{
      trips,
      currentTrip,
      createTrip,
      updateTrip,
      deleteTrip,
      setCurrentTrip,
      generateItinerary,
      shareTrip
    }}>
      {children}
    </TripContext.Provider>
  );
};
