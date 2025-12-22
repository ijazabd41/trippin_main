// Plan Generation Service with OpenAI Integration
import { apiCall, API_CONFIG } from '../config/api';
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';
import { backendService } from './BackendService';

export interface PlanGenerationRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  interests: string[];
  accommodationType?: string;
  transportationType?: string;
  dietaryRestrictions?: string[];
  specialRequirements?: string;
  language?: string;
}

export interface GeneratedPlan {
  id: string;
  title: string;
  destination: string;
  duration: number;
  budget: {
    total: number;
    currency: string;
    breakdown: {
      accommodation: number;
      transportation: number;
      food: number;
      activities: number;
      miscellaneous: number;
    };
  };
  itinerary: {
    day: number;
    date: string;
    theme: string;
    activities: {
      time: string;
      title: string;
      description: string;
      location: string;
      type: 'sightseeing' | 'dining' | 'transport' | 'accommodation' | 'activity';
      duration: number;
      cost: number;
      tips?: string;
      bookingInfo?: string;
    }[];
  }[];
  recommendations: {
    restaurants: {
      name: string;
      cuisine: string;
      priceRange: string;
      location: string;
      description: string;
    }[];
    attractions: {
      name: string;
      type: string;
      location: string;
      description: string;
      bestTime: string;
    }[];
    transportation: {
      type: string;
      description: string;
      cost: number;
      tips: string;
    }[];
  };
  practicalInfo: {
    weather?: string;
    packingList: string[];
    localCustoms: string[];
    emergencyContacts: string[];
    usefulPhrases: string[];
    transportation?: string;
    tips?: string;
  };
  createdAt: string;
}

class PlanGenerationService {
  private isGenerating: boolean = false;
  private generationPromise: Promise<GeneratedPlan> | null = null;

  // Generate a comprehensive travel plan using OpenAI
  async generatePlan(request: PlanGenerationRequest): Promise<GeneratedPlan> {
    // If already generating, return the existing promise
    if (this.isGenerating && this.generationPromise) {
      console.warn('⚠️ Plan generation already in progress, returning existing promise');
      return this.generationPromise;
    }

    // Check localStorage for existing plan with same destination
    const existingPlanKey = `trippin-plan-${request.destination}-${request.startDate}`;
    const existingPlan = localStorage.getItem(existingPlanKey);
    if (existingPlan) {
      try {
        const plan = JSON.parse(existingPlan);
        console.log('✅ Found existing plan in cache, returning it');
        return plan;
      } catch (error) {
        console.warn('Failed to parse cached plan:', error);
      }
    }

    this.isGenerating = true;

    // Create and store the promise
    this.generationPromise = (async () => {
      try {
        console.log('🚀 Starting plan generation for:', request.destination);

        // Step 1: Generate main itinerary using OpenAI
        const itinerary = await this.generateItinerary(request);
        
        // Step 2: Generate budget breakdown
        const budget = await this.generateBudget(request, itinerary);
        
        // Step 3: Generate recommendations
        const recommendations = await this.generateRecommendations(request, itinerary);
        
        // Step 4: Generate practical information
        const practicalInfo = await this.generatePracticalInfo(request);

        const plan: GeneratedPlan = {
          id: `plan-${Date.now()}`,
          title: `${request.destination} Adventure`,
          destination: request.destination,
          duration: this.calculateDuration(request.startDate, request.endDate),
          budget,
          itinerary,
          recommendations,
          practicalInfo,
          createdAt: new Date().toISOString()
        };

        // Cache the plan
        localStorage.setItem(existingPlanKey, JSON.stringify(plan));

        console.log('✅ Plan generation completed');
        return plan;

      } catch (error) {
        console.error('❌ Plan generation failed:', error);
        throw error;
      } finally {
        this.isGenerating = false;
        this.generationPromise = null;
      }
    })();

    return this.generationPromise;
  }

  // Generate detailed itinerary using OpenAI
  private async generateItinerary(request: PlanGenerationRequest) {
    const prompt = this.buildItineraryPrompt(request);
    
    try {
      const response = await backendApiCall(BACKEND_API_CONFIG.ENDPOINTS.OPENAI.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          tripData: {
            destination: request.destination,
            startDate: request.startDate,
            endDate: request.endDate,
            travelers: request.travelers,
            budget: request.budget,
            currency: request.currency,
            interests: request.interests,
            accommodationType: request.accommodationType,
            transportationType: request.transportationType,
            dietaryRestrictions: request.dietaryRestrictions,
            specialRequirements: request.specialRequirements,
            language: request.language
          }
        })
      });

      console.log('📥 Itinerary API response:', { success: response.success, hasData: !!response.data, dataKeys: response.data ? Object.keys(response.data) : [] });
      
      if (response.success && response.data) {
        const parsed = this.parseItineraryResponse(response.data, request);
        console.log('✅ Parsed itinerary:', { days: parsed?.length || 0 });
        return parsed;
      } else {
        console.warn('⚠️ Itinerary response missing data, using fallback');
        throw new Error('Failed to generate itinerary');
      }
    } catch (error) {
      console.warn('OpenAI API failed, using fallback:', error);
      return this.generateFallbackItinerary(request);
    }
  }

  // Generate budget breakdown
  private async generateBudget(request: PlanGenerationRequest, itinerary: any) {
    const prompt = this.buildBudgetPrompt(request, itinerary);
    
    try {
      const response = await backendApiCall(BACKEND_API_CONFIG.ENDPOINTS.OPENAI.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          tripData: {
            destination: request.destination,
            startDate: request.startDate,
            endDate: request.endDate,
            travelers: request.travelers,
            budget: request.budget,
            currency: request.currency,
            interests: request.interests,
            accommodationType: request.accommodationType,
            transportationType: request.transportationType,
            dietaryRestrictions: request.dietaryRestrictions,
            specialRequirements: request.specialRequirements,
            language: request.language
          }
        })
      });

      if (response.success && response.data) {
        return this.parseBudgetResponse(response.data, request);
      } else {
        return this.generateFallbackBudget(request);
      }
    } catch (error) {
      console.warn('Budget generation failed, using fallback:', error);
      return this.generateFallbackBudget(request);
    }
  }

  // Generate recommendations
  private async generateRecommendations(request: PlanGenerationRequest, itinerary: any) {
    const prompt = this.buildRecommendationsPrompt(request, itinerary);
    
    try {
      const response = await backendApiCall(BACKEND_API_CONFIG.ENDPOINTS.OPENAI.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          tripData: {
            destination: request.destination,
            startDate: request.startDate,
            endDate: request.endDate,
            travelers: request.travelers,
            budget: request.budget,
            currency: request.currency,
            interests: request.interests,
            accommodationType: request.accommodationType,
            transportationType: request.transportationType,
            dietaryRestrictions: request.dietaryRestrictions,
            specialRequirements: request.specialRequirements,
            language: request.language
          }
        })
      });

      console.log('📥 Recommendations API response:', { success: response.success, hasData: !!response.data, dataKeys: response.data ? Object.keys(response.data) : [] });
      
      if (response.success && response.data) {
        const parsed = this.parseRecommendationsResponse(response.data);
        console.log('✅ Parsed recommendations:', { hasRestaurants: !!parsed?.restaurants, hasAttractions: !!parsed?.attractions });
        return parsed;
      } else {
        console.warn('⚠️ Recommendations response missing data, using fallback');
        return this.generateFallbackRecommendations(request);
      }
    } catch (error) {
      console.warn('Recommendations generation failed, using fallback:', error);
      return this.generateFallbackRecommendations(request);
    }
  }

  // Generate practical information
  private async generatePracticalInfo(request: PlanGenerationRequest) {
    const prompt = this.buildPracticalInfoPrompt(request);
    
    try {
      const response = await backendApiCall(BACKEND_API_CONFIG.ENDPOINTS.OPENAI.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          tripData: {
            destination: request.destination,
            startDate: request.startDate,
            endDate: request.endDate,
            travelers: request.travelers,
            budget: request.budget,
            currency: request.currency,
            interests: request.interests,
            accommodationType: request.accommodationType,
            transportationType: request.transportationType,
            dietaryRestrictions: request.dietaryRestrictions,
            specialRequirements: request.specialRequirements,
            language: request.language
          }
        })
      });

      console.log('📥 Practical Info API response:', { success: response.success, hasData: !!response.data, dataKeys: response.data ? Object.keys(response.data) : [] });
      
      if (response.success && response.data) {
        const parsed = this.parsePracticalInfoResponse(response.data);
        console.log('✅ Parsed practical info:', { hasWeather: !!parsed?.weather, hasPackingList: !!parsed?.packingList });
        return parsed;
      } else {
        console.warn('⚠️ Practical info response missing data, using fallback');
        return this.generateFallbackPracticalInfo(request);
      }
    } catch (error) {
      console.warn('Practical info generation failed, using fallback:', error);
      return this.generateFallbackPracticalInfo(request);
    }
  }

  // Build comprehensive itinerary prompt
  private buildItineraryPrompt(request: PlanGenerationRequest): string {
    return `Create a detailed ${this.calculateDuration(request.startDate, request.endDate)}-day travel itinerary for ${request.destination}.

Travel Details:
- Destination: ${request.destination}
- Dates: ${request.startDate} to ${request.endDate}
- Travelers: ${request.travelers} person(s)
- Budget: ${request.currency} ${request.budget}
- Interests: ${request.interests.join(', ')}
- Accommodation: ${request.accommodationType || 'mid-range hotels'}
- Transportation: ${request.transportationType || 'public transport and walking'}
${request.dietaryRestrictions ? `- Dietary restrictions: ${request.dietaryRestrictions.join(', ')}` : ''}
${request.specialRequirements ? `- Special requirements: ${request.specialRequirements}` : ''}

Please provide a day-by-day itinerary with:
1. Daily theme and focus
2. Specific activities with times, locations, and descriptions
3. Restaurant recommendations for each meal
4. Transportation between locations
5. Estimated costs for each activity
6. Tips and local insights

Format the response as a structured JSON object with the following structure:
{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Arrival and Orientation",
      "activities": [
        {
          "time": "09:00",
          "title": "Activity Name",
          "description": "Detailed description",
          "location": "Specific location",
          "type": "sightseeing|dining|transport|accommodation|activity",
          "duration": 120,
          "cost": 50,
          "tips": "Helpful tips",
          "bookingInfo": "Booking information if needed"
        }
      ]
    }
  ]
}`;
  }

  // Build budget prompt
  private buildBudgetPrompt(request: PlanGenerationRequest, itinerary: any): string {
    return `Create a detailed budget breakdown for a ${this.calculateDuration(request.startDate, request.endDate)}-day trip to ${request.destination} for ${request.travelers} person(s) with a total budget of ${request.currency} ${request.budget}.

Consider the following categories:
- Accommodation (hotels, hostels, etc.)
- Transportation (flights, local transport, etc.)
- Food and dining
- Activities and attractions
- Miscellaneous (shopping, tips, etc.)

Provide realistic cost estimates based on current prices and include:
- Daily averages
- Total costs per category
- Cost-saving tips
- Optional upgrades

Format as JSON:
{
  "total": ${request.budget},
  "currency": "${request.currency}",
  "breakdown": {
    "accommodation": 0,
    "transportation": 0,
    "food": 0,
    "activities": 0,
    "miscellaneous": 0
  }
}`;
  }

  // Build recommendations prompt
  private buildRecommendationsPrompt(request: PlanGenerationRequest, itinerary: any): string {
    return `Provide comprehensive recommendations for a trip to ${request.destination} based on these interests: ${request.interests.join(', ')}.

Include:
1. Top restaurants (different price ranges and cuisines)
2. Must-see attractions and landmarks
3. Transportation options and tips
4. Local experiences and hidden gems

Format as JSON:
{
  "restaurants": [
    {
      "name": "Restaurant Name",
      "cuisine": "Cuisine type",
      "priceRange": "$-$$$",
      "location": "Area/neighborhood",
      "description": "What makes it special"
    }
  ],
  "attractions": [
    {
      "name": "Attraction Name",
      "type": "Museum|Landmark|Park|etc",
      "location": "Address/area",
      "description": "What to expect",
      "bestTime": "Best time to visit"
    }
  ],
  "transportation": [
    {
      "type": "Transport type",
      "description": "How to use it",
      "cost": 0,
      "tips": "Helpful tips"
    }
  ]
}`;
  }

  // Build practical info prompt
  private buildPracticalInfoPrompt(request: PlanGenerationRequest): string {
    return `Provide practical travel information for ${request.destination} during the period ${request.startDate} to ${request.endDate}.

Include:
1. Weather conditions and what to pack
2. Essential packing list
3. Local customs and etiquette
4. Emergency contacts and important numbers
5. Useful phrases in the local language
6. Health and safety tips

Format as JSON:
{
  "weather": "Weather description and recommendations",
  "packingList": ["item1", "item2", "item3"],
  "localCustoms": ["custom1", "custom2", "custom3"],
  "emergencyContacts": ["contact1", "contact2"],
  "usefulPhrases": ["phrase1", "phrase2", "phrase3"]
}`;
  }

  // Parse AI responses
  private parseItineraryResponse(data: any, request: PlanGenerationRequest) {
    try {
      console.log('🔍 Parsing itinerary response, data type:', typeof data, 'keys:', data ? Object.keys(data) : 'null');
      
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        console.log('📋 Parsed string data, looking for itinerary:', parsed.itinerary ? 'found' : 'not found');
        return parsed.itinerary || parsed || [];
      }
      
      // Handle different response structures
      if (Array.isArray(data)) {
        console.log('📋 Data is array, returning as-is');
        return data;
      }
      
      if (data.itinerary) {
        console.log('📋 Found itinerary property');
        return data.itinerary;
      }
      
      // If data is the itinerary object itself
      if (data.day || data.activities) {
        console.log('📋 Data appears to be itinerary object, wrapping in array');
        return [data];
      }
      
      console.warn('⚠️ Unexpected itinerary data structure:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to parse itinerary response:', error, 'data:', data);
      return this.generateFallbackItinerary(request);
    }
  }

  private parseBudgetResponse(data: any, request: PlanGenerationRequest) {
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return parsed;
      }
      return data;
    } catch (error) {
      console.warn('Failed to parse budget response:', error);
      return this.generateFallbackBudget(request);
    }
  }

  private parseRecommendationsResponse(data: any) {
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return parsed;
      }
      return data;
    } catch (error) {
      console.warn('Failed to parse recommendations response:', error);
      return this.generateFallbackRecommendations({ destination: 'Unknown' } as PlanGenerationRequest);
    }
  }

  private parsePracticalInfoResponse(data: any) {
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return parsed;
      }
      return data;
    } catch (error) {
      console.warn('Failed to parse practical info response:', error);
      return this.generateFallbackPracticalInfo({ destination: 'Unknown' } as PlanGenerationRequest);
    }
  }

  // Fallback data generators
  private generateFallbackItinerary(request: PlanGenerationRequest) {
    const days = this.calculateDuration(request.startDate, request.endDate);
    const itinerary = [];

    for (let day = 1; day <= days; day++) {
      const date = new Date(request.startDate);
      date.setDate(date.getDate() + day - 1);

      itinerary.push({
        day,
        date: date.toISOString().split('T')[0],
        theme: day === 1 ? 'Arrival and Orientation' : `Day ${day} Exploration`,
        activities: [
          {
            time: '09:00',
            title: 'Morning Activity',
            description: `Explore ${request.destination} highlights`,
            location: 'City Center',
            type: 'sightseeing',
            duration: 180,
            cost: Math.floor(request.budget / days / 3),
            tips: 'Bring comfortable walking shoes',
            bookingInfo: 'Book in advance for popular attractions'
          },
          {
            time: '12:00',
            title: 'Lunch',
            description: 'Local cuisine experience',
            location: 'Local Restaurant',
            type: 'dining',
            duration: 90,
            cost: Math.floor(request.budget / days / 4),
            tips: 'Try local specialties'
          },
          {
            time: '14:00',
            title: 'Afternoon Activity',
            description: 'Cultural or recreational activity',
            location: 'Various locations',
            type: 'activity',
            duration: 240,
            cost: Math.floor(request.budget / days / 3),
            tips: 'Check opening hours'
          }
        ]
      });
    }

    return itinerary;
  }

  private generateFallbackBudget(request: PlanGenerationRequest) {
    const total = request.budget;
    return {
      total,
      currency: request.currency,
      breakdown: {
        accommodation: Math.floor(total * 0.4),
        transportation: Math.floor(total * 0.2),
        food: Math.floor(total * 0.25),
        activities: Math.floor(total * 0.1),
        miscellaneous: Math.floor(total * 0.05)
      }
    };
  }

  private generateFallbackRecommendations(request: PlanGenerationRequest) {
    return {
      restaurants: [
        {
          name: 'Local Restaurant',
          cuisine: 'Local cuisine',
          priceRange: '$$',
          location: 'City center',
          description: 'Authentic local dining experience'
        }
      ],
      attractions: [
        {
          name: 'Main Attraction',
          type: 'Landmark',
          location: 'City center',
          description: 'Must-visit landmark',
          bestTime: 'Morning or afternoon'
        }
      ],
      transportation: [
        {
          type: 'Public transport',
          description: 'Efficient and affordable',
          cost: 10,
          tips: 'Get a day pass for unlimited travel'
        }
      ]
    };
  }

  private generateFallbackPracticalInfo(request: PlanGenerationRequest) {
    return {
      weather: 'Check local weather forecast before traveling',
      packingList: ['Clothes', 'Toiletries', 'Travel documents', 'Camera', 'Charger'],
      localCustoms: ['Respect local traditions', 'Dress appropriately', 'Learn basic greetings'],
      emergencyContacts: ['Local emergency: 911', 'Tourist helpline: Check local numbers'],
      usefulPhrases: ['Hello', 'Thank you', 'Excuse me', 'Where is...?', 'How much?']
    };
  }

  // Utility methods
  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Save generated plan to backend
  async savePlan(plan: GeneratedPlan, token?: string): Promise<string> {
    try {
      const tripData = {
        title: plan.title,
        destination: plan.destination,
        start_date: plan.itinerary[0]?.date || new Date().toISOString().split('T')[0],
        end_date: plan.itinerary[plan.itinerary.length - 1]?.date || new Date().toISOString().split('T')[0],
        budget: plan.budget.total,
        currency: plan.budget.currency,
        travelers: 1, // Default, should be passed from request
        interests: [], // Should be passed from request
        status: 'planning',
        itinerary: plan.itinerary,
        recommendations: plan.recommendations,
        practical_info: plan.practicalInfo
      };

      const response = await backendService.createTrip(tripData, token);
      
      if (response.success) {
        return response.data.id;
      } else {
        console.warn('Failed to save plan to backend, but plan was generated successfully');
        return `local-plan-${Date.now()}`;
      }
    } catch (error) {
      console.warn('Error saving plan to backend, but plan was generated successfully:', error);
      return `local-plan-${Date.now()}`;
    }
  }

  // Get generation status
  isGeneratingPlan(): boolean {
    return this.isGenerating;
  }
}

// Export singleton instance
export const planGenerationService = new PlanGenerationService();
export default planGenerationService;
