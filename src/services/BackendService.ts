// Comprehensive Backend Service for Trippin App
import { backendApiCall, BACKEND_API_CONFIG, backendHealthCheck } from '../config/backend-api';

export interface BackendServiceConfig {
  useMockData: boolean;
  backendUrl: string;
  timeout: number;
}

class BackendService {
  private config: BackendServiceConfig;
  private isBackendAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor() {
    this.config = {
      useMockData: false,
      backendUrl: BACKEND_API_CONFIG.BASE_URL,
      timeout: BACKEND_API_CONFIG.TIMEOUT
    };

    this.initializeService();
  }

  private async initializeService() {
    try {
      console.log('🔍 Initializing backend service...');
      const isHealthy = await this.checkBackendHealth();
      console.log('✅ Backend health check result:', isHealthy);

      // Don't immediately switch to mock data - let individual calls decide
      if (!isHealthy) {
        console.warn('⚠️ Backend health check failed, but will still attempt real calls');
        // Don't set useMockData = true here - let the actual API calls decide
      } else {
        console.log('✅ Backend is healthy, will use real backend');
        this.config.useMockData = false;
      }
    } catch (error) {
      console.warn('❌ Backend health check failed, but will still attempt real calls:', error);
      // Don't set useMockData = true here - let the actual API calls decide
    }
  }

  private async checkBackendHealth(): Promise<boolean> {
    const now = Date.now();

    // Only check if enough time has passed since last check
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      console.log('⏰ Using cached backend health status:', this.isBackendAvailable);
      return this.isBackendAvailable;
    }

    try {
      console.log('🔍 Performing fresh backend health check...');
      this.isBackendAvailable = await backendHealthCheck();
      this.lastHealthCheck = now;

      console.log('📊 Backend health check result:', {
        isBackendAvailable: this.isBackendAvailable,
        useMockData: this.config.useMockData
      });

      if (!this.isBackendAvailable) {
        console.warn('⚠️ Backend not available, switching to mock data');
        this.config.useMockData = true;
      } else {
        console.log('✅ Backend is available, using real backend');
        this.config.useMockData = false;
      }

      return this.isBackendAvailable;
    } catch (error) {
      console.warn('❌ Backend health check failed:', error);
      this.isBackendAvailable = false;
      this.config.useMockData = true;
      return false;
    }
  }

  // Mock data generators
  private generateMockTrip(id: string = '1') {
    return {
      id,
      title: `Sample Trip ${id}`,
      destination: 'Tokyo, Japan',
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'planning' as const,
      budget: 2000,
      currency: 'USD',
      travelers: 2,
      interests: ['culture', 'food', 'sightseeing'],
      image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'mock-user-id'
    };
  }

  private generateMockItinerary(tripId: string) {
    return {
      id: `itinerary-${tripId}`,
      trip_id: tripId,
      days: [
        {
          day: 1,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          activities: [
            {
              id: '1',
              time: '09:00',
              title: 'Arrival at Narita Airport',
              description: 'Arrive and take the train to Tokyo',
              location: 'Narita Airport',
              type: 'transport',
              duration: 120,
              cost: 50
            },
            {
              id: '2',
              time: '12:00',
              title: 'Check into Hotel',
              description: 'Check into your hotel in Shibuya',
              location: 'Shibuya District',
              type: 'accommodation',
              duration: 60,
              cost: 0
            },
            {
              id: '3',
              time: '14:00',
              title: 'Lunch at Local Ramen Shop',
              description: 'Try authentic Tokyo ramen',
              location: 'Shibuya',
              type: 'dining',
              duration: 90,
              cost: 15
            }
          ]
        }
      ]
    };
  }

  // API Methods with fallback to mock data
  async getTrips(token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for trips');
      return {
        success: true,
        data: [
          this.generateMockTrip('1'),
          this.generateMockTrip('2'),
          this.generateMockTrip('3')
        ]
      };
    }

    try {
      console.log('🚀 Calling real backend for trips with token:', token ? 'token exists' : 'no token');
      const result = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.TRIPS.LIST,
        { method: 'GET' },
        token
      );
      console.log('📊 Backend trips response:', result);
      return result;
    } catch (error) {
      console.warn('❌ Backend call failed, using mock data:', error);
      return {
        success: true,
        data: [this.generateMockTrip()]
      };
    }
  }

  async getTrip(tripId: string, token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for trip:', tripId);
      return {
        success: true,
        data: this.generateMockTrip(tripId)
      };
    }

    try {
      return await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.TRIPS.DETAIL.replace(':id', tripId),
        { method: 'GET' },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return {
        success: true,
        data: this.generateMockTrip(tripId)
      };
    }
  }

  async createTrip(tripData: any, token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for create trip');
      const newTrip = this.generateMockTrip();
      return {
        success: true,
        data: { ...newTrip, ...tripData }
      };
    }

    try {
      return await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.TRIPS.CREATE,
        {
          method: 'POST',
          body: JSON.stringify(tripData)
        },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      const newTrip = this.generateMockTrip();
      return {
        success: true,
        data: { ...newTrip, ...tripData }
      };
    }
  }

  async updateTrip(tripId: string, updates: any, token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for update trip:', tripId);
      return {
        success: true,
        data: { ...this.generateMockTrip(tripId), ...updates }
      };
    }

    try {
      return await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.TRIPS.UPDATE.replace(':id', tripId),
        {
          method: 'PUT',
          body: JSON.stringify(updates)
        },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return {
        success: true,
        data: { ...this.generateMockTrip(tripId), ...updates }
      };
    }
  }

  async deleteTrip(tripId: string, token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for delete trip:', tripId);
      return { success: true };
    }

    try {
      return await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.TRIPS.DELETE.replace(':id', tripId),
        { method: 'DELETE' },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return { success: true };
    }
  }

  async getItinerary(tripId: string, token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for itinerary:', tripId);
      return {
        success: true,
        data: this.generateMockItinerary(tripId)
      };
    }

    try {
      return await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.ITINERARIES.BY_TRIP.replace(':tripId', tripId),
        { method: 'GET' },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return {
        success: true,
        data: this.generateMockItinerary(tripId)
      };
    }
  }

  async createItinerary(itineraryData: any, token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for create itinerary');
      return {
        success: true,
        data: this.generateMockItinerary(itineraryData.trip_id)
      };
    }

    try {
      return await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.ITINERARIES.CREATE,
        {
          method: 'POST',
          body: JSON.stringify(itineraryData)
        },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return {
        success: true,
        data: this.generateMockItinerary(itineraryData.trip_id)
      };
    }
  }

  // Authentication methods
  async signUp(email: string, password: string, userData?: any) {
    // Always use backend for authentication - no mock fallback
    return await backendApiCall(
      BACKEND_API_CONFIG.ENDPOINTS.SUPABASE_AUTH.SIGNUP,
      {
        method: 'POST',
        body: JSON.stringify({ email, password, ...userData })
      }
    );
  }

  async signIn(email: string, password: string) {
    // Always use backend for authentication - no mock fallback
    return await backendApiCall(
      BACKEND_API_CONFIG.ENDPOINTS.SUPABASE_AUTH.SIGNIN,
      {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }
    );
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    return await this.checkBackendHealth();
  }

  // Sign out method
  async signOut() {
    if (this.config.useMockData) {
      console.log('Using mock data for signout');
      return { success: true };
    }

    try {
      return await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.SUPABASE_AUTH.SIGNOUT,
        { method: 'POST' }
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return { success: true };
    }
  }

  // Subscription methods
  async createCheckoutSession(planData: any, token?: string) {
    console.log('🔄 Creating checkout session...', {
      useMockData: this.config.useMockData,
      hasToken: !!token,
      planData,
      backendUrl: this.config.backendUrl
    });

    // Always try real backend first, regardless of health check status
    try {
      console.log('🚀 Attempting real backend call...');
      console.log('📡 Full URL will be:', `${this.config.backendUrl}/api/subscriptions/create-checkout-session`);
      console.log('🔑 Token preview:', token ? `${token.substring(0, 20)}...` : 'no token');

      const result = await backendApiCall(
        '/api/subscriptions/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify(planData)
        },
        token
      );

      console.log('✅ Real backend call successful:', result);
      return result;
    } catch (error) {
      console.warn('❌ Real backend call failed, falling back to mock data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      });

      // Only use mock data if the real backend call actually fails
      return {
        success: true,
        data: {
          sessionId: 'mock-session-123',
          sessionUrl: 'https://checkout.stripe.com/mock-session'
        }
      };
    }
  }

  async getSubscriptionStatus(token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for subscription status');
      return {
        success: true,
        data: {
          isPremium: false,
          expiresAt: null,
          isActive: false
        }
      };
    }

    try {
      return await backendApiCall(
        '/subscriptions/status',
        { method: 'GET' },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return {
        success: true,
        data: {
          isPremium: false,
          expiresAt: null,
          isActive: false
        }
      };
    }
  }

  async cancelSubscription(token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for subscription cancellation');
      return { success: true, message: 'Subscription cancelled successfully' };
    }

    try {
      return await backendApiCall(
        '/api/payments/cancel-subscription',
        { method: 'POST' },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return { success: true, message: 'Subscription cancelled successfully' };
    }
  }

  // User preferences and customization methods
  async getUserPreferences(token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for user preferences');
      return {
        success: true,
        data: {
          customization: {
            aiPersonality: 'friendly',
            planStyle: 'detailed',
            language: 'ja',
            includePhotos: true,
            includeReviews: true,
            includeTransportDetails: true,
            includeBudgetBreakdown: true,
            includeLocalTips: true,
            includeEmergencyInfo: true,
            maxActivitiesPerDay: 5,
            preferredStartTime: '09:00',
            preferredEndTime: '21:00'
          }
        }
      };
    }

    try {
      return await backendApiCall(
        '/auth/preferences',
        { method: 'GET' },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return {
        success: true,
        data: {
          customization: {
            aiPersonality: 'friendly',
            planStyle: 'detailed',
            language: 'ja',
            includePhotos: true,
            includeReviews: true,
            includeTransportDetails: true,
            includeBudgetBreakdown: true,
            includeLocalTips: true,
            includeEmergencyInfo: true,
            maxActivitiesPerDay: 5,
            preferredStartTime: '09:00',
            preferredEndTime: '21:00'
          }
        }
      };
    }
  }

  async updateUserPreferences(preferences: any, token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for updating user preferences');
      return { success: true, message: 'Preferences updated successfully' };
    }

    try {
      return await backendApiCall(
        '/auth/preferences',
        {
          method: 'PUT',
          body: JSON.stringify(preferences)
        },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return { success: true, message: 'Preferences updated successfully' };
    }
  }

  // eSIM methods
  async getESIMPlans(token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for eSIM plans');
      return {
        success: true,
        data: [
          {
            id: 'plan_1',
            name: 'Japan 3GB - 15 Days',
            description: '日本全国で使える15日間3GBプラン',
            dataAmount: '3GB',
            validity: '15日',
            price: { amount: 3500, currency: 'JPY' },
            coverage: ['Japan'],
            features: ['High-speed data', '24/7 support'],
            isAvailable: true
          },
          {
            id: 'plan_2',
            name: 'Japan 10GB - 30 Days',
            description: '日本全国で使える30日間10GBプラン',
            dataAmount: '10GB',
            validity: '30日',
            price: { amount: 8500, currency: 'JPY' },
            coverage: ['Japan'],
            features: ['High-speed data', '24/7 support'],
            isAvailable: true
          }
        ]
      };
    }

    try {
      return await backendApiCall(
        '/api/esim/plans',
        { method: 'GET' },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return {
        success: true,
        data: [
          {
            id: 'plan_1',
            name: 'Japan 3GB - 15 Days',
            description: '日本全国で使える15日間3GBプラン',
            dataAmount: '3GB',
            validity: '15日',
            price: { amount: 3500, currency: 'JPY' },
            coverage: ['Japan'],
            features: ['High-speed data', '24/7 support'],
            isAvailable: true
          }
        ]
      };
    }
  }

  async purchaseESIM(purchaseData: any, token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for eSIM purchase');
      return {
        success: true,
        data: {
          orderId: 'mock-order-123',
          qrCode: 'data:image/png;base64,mock-qr-code',
          activationCode: 'MOCK123456',
          planName: purchaseData.planId,
          expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    }

    // Always try real backend for purchases - don't fallback to mock data
    // This ensures users see proper error messages from the backend
    return await backendApiCall(
      '/api/esim/purchase',
      {
        method: 'POST',
        body: JSON.stringify(purchaseData)
      },
      token
    );
  }

  async getESIMOrders(token?: string) {
    if (this.config.useMockData) {
      console.log('Using mock data for eSIM orders');
      return {
        success: true,
        data: [] // Empty array - no orders until user purchases
      };
    }

    try {
      return await backendApiCall(
        '/api/esim/orders',
        { method: 'GET' },
        token
      );
    } catch (error) {
      console.warn('Backend call failed, using mock data:', error);
      return {
        success: true,
        data: [] // Empty array - no orders until user purchases
      };
    }
  }


  // Get service status
  getServiceStatus() {
    return {
      isBackendAvailable: this.isBackendAvailable,
      useMockData: this.config.useMockData,
      backendUrl: this.config.backendUrl,
      lastHealthCheck: this.lastHealthCheck
    };
  }

  // Force backend health check
  async forceHealthCheck(): Promise<boolean> {
    console.log('🔄 Forcing backend health check...');
    this.lastHealthCheck = 0; // Reset last check time
    return await this.checkBackendHealth();
  }

  // Reset to use real backend (disable mock data)
  resetToBackend() {
    console.log('🔄 Resetting to use real backend...');
    this.config.useMockData = false;
    this.lastHealthCheck = 0; // Reset last check time
  }

  // Force use of real backend (bypass health check)
  forceUseBackend() {
    console.log('🔄 Forcing use of real backend...');
    this.config.useMockData = false;
    this.isBackendAvailable = true;
    this.lastHealthCheck = 0;
  }

  // Test backend connection manually
  async testBackendConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing backend connection...');
      const response = await fetch(`${this.config.backendUrl}/test`);
      const data = await response.json();
      console.log('✅ Backend test successful:', data);
      return true;
    } catch (error) {
      console.error('❌ Backend test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const backendService = new BackendService();
export default backendService;
