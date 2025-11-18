import React, { createContext, useContext, useState, useEffect } from 'react';
import { backendService } from '../services/BackendService';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  itinerary?: any[];
  budget: number;
  currency: string;
  travelers: number;
  interests: string[];
  image_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface BackendTripContextType {
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  createTrip: (tripData: Partial<Trip>) => Promise<Trip>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  setCurrentTrip: (trip: Trip | null) => void;
  generateItinerary: (tripData: any) => Promise<any>;
  shareTrip: (tripId: string, shareData: any) => Promise<string>;
  fetchTrips: () => Promise<void>;
  fetchTrip: (tripId: string) => Promise<Trip>;
  addToFavorites: (tripId: string) => Promise<void>;
  removeFromFavorites: (tripId: string) => Promise<void>;
}

const BackendTripContext = createContext<BackendTripContextType | undefined>(undefined);

export const useBackendTrip = () => {
  const context = useContext(BackendTripContext);
  if (!context) {
    throw new Error('useBackendTrip must be used within a BackendTripProvider');
  }
  return context;
};

export const BackendTripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get session from auth context - hook now returns safe default if context not available
  const { session } = useSupabaseAuth();

  // Get auth token
  const getAuthToken = () => {
    console.log('Getting auth token, session:', session ? 'session exists' : 'no session');
    console.log('Access token:', session?.access_token ? 'token exists' : 'no token');
    return session?.access_token;
  };

  // Fetch all trips for the user
  const fetchTrips = async () => {
    console.log('fetchTrips called, session:', session ? 'session exists' : 'no session');
    if (!session) {
      console.log('No session, returning early');
      return;
    }

    try {
      setIsLoading(true);
      const token = getAuthToken();
      console.log('Calling backendService.getTrips with token:', token ? 'token exists' : 'no token');
      console.log('🔍 Backend service status:', backendService.getServiceStatus());
      const response = await backendService.getTrips(token);

      if (response.success) {
        console.log('✅ Trips fetched successfully:', response.data);
        console.log('📊 Number of trips:', Array.isArray(response.data) ? response.data.length : 'not an array');
        setTrips(response.data);
      } else {
        console.error('❌ Failed to fetch trips:', response);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch single trip
  const fetchTrip = async (tripId: string): Promise<Trip> => {
    try {
      const response = await backendService.getTrip(tripId, getAuthToken());

      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to fetch trip');
    } catch (error) {
      console.error('Error fetching trip:', error);
      throw error;
    }
  };

  // Create new trip
  const createTrip = async (tripData: Partial<Trip>): Promise<Trip> => {
    try {
      const response = await backendService.createTrip(tripData, getAuthToken());

      if (response.success) {
        const newTrip = response.data;
        setTrips(prev => [newTrip, ...prev]);
        return newTrip;
      }
      throw new Error('Failed to create trip');
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  };

  // Update trip
  const updateTrip = async (tripId: string, updates: Partial<Trip>): Promise<void> => {
    try {
      const response = await backendService.updateTrip(tripId, updates, getAuthToken());

      if (response.success) {
        const updatedTrip = response.data;
        setTrips(prev => prev.map(trip => 
          trip.id === tripId ? updatedTrip : trip
        ));
        
        if (currentTrip?.id === tripId) {
          setCurrentTrip(updatedTrip);
        }
      } else {
        throw new Error('Failed to update trip');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      throw error;
    }
  };

  // Delete trip
  const deleteTrip = async (tripId: string): Promise<void> => {
    try {
      const response = await backendService.deleteTrip(tripId, getAuthToken());

      if (response.success) {
        setTrips(prev => prev.filter(trip => trip.id !== tripId));
        
        if (currentTrip?.id === tripId) {
          setCurrentTrip(null);
        }
      } else {
        throw new Error('Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  };

  // Generate itinerary (placeholder - you'll need to implement this)
  const generateItinerary = async (tripData: any): Promise<any> => {
    try {
      // This would call your AI service to generate itinerary
      // For now, return mock data
      return {
        success: true,
        data: {
          itinerary: [
            {
              day: 1,
              activities: [
                { time: '09:00', activity: 'Breakfast at local cafe', location: 'Downtown' },
                { time: '11:00', activity: 'City tour', location: 'Historic center' },
                { time: '14:00', activity: 'Lunch at restaurant', location: 'Old town' },
                { time: '16:00', activity: 'Museum visit', location: 'Art district' }
              ]
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw error;
    }
  };

  // Share trip
  const shareTrip = async (tripId: string, shareData: any): Promise<string> => {
    try {
      const response = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.TRIPS.SHARE.replace(':id', tripId),
        {
          method: 'POST',
          body: JSON.stringify(shareData)
        },
        getAuthToken()
      );

      if (response.success) {
        return response.data.share_url;
      }
      throw new Error('Failed to create share link');
    } catch (error) {
      console.error('Error sharing trip:', error);
      throw error;
    }
  };

  // Add to favorites
  const addToFavorites = async (tripId: string): Promise<void> => {
    try {
      const response = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.TRIPS.FAVORITE.replace(':id', tripId),
        { method: 'POST' },
        getAuthToken()
      );

      if (!response.success) {
        throw new Error('Failed to add to favorites');
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (tripId: string): Promise<void> => {
    try {
      const response = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.TRIPS.UNFAVORITE.replace(':id', tripId),
        { method: 'DELETE' },
        getAuthToken()
      );

      if (!response.success) {
        throw new Error('Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  };

  // Load trips when user is authenticated
  useEffect(() => {
    console.log('BackendTripContext useEffect triggered, session:', session ? 'session exists' : 'no session');
    if (session) {
      console.log('Session exists, calling fetchTrips');
      fetchTrips();
    } else {
      console.log('No session, clearing trips');
      setTrips([]);
      setCurrentTrip(null);
    }
  }, [session]);

  const value: BackendTripContextType = {
    trips,
    currentTrip,
    isLoading,
    createTrip,
    updateTrip,
    deleteTrip,
    setCurrentTrip,
    generateItinerary,
    shareTrip,
    fetchTrips,
    fetchTrip,
    addToFavorites,
    removeFromFavorites
  };

  return (
    <BackendTripContext.Provider value={value}>
      {children}
    </BackendTripContext.Provider>
  );
};
