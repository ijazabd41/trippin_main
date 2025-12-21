import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, MapPin, Users, DollarSign, Clock, Check, Download, Share2, Star, Car, Hotel, Plane, AlertCircle } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBackendTrip } from '../contexts/BackendTripContext';
import { apiCall, API_CONFIG } from '../config/api';
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';
import MockDataNotice from '../components/MockDataNotice';
import GeneratedPlanDisplay from '../components/GeneratedPlanDisplay';
import { GeneratedPlan } from '../services/PlanGenerationService';

// Debug logging helper
const logDebug = (message: string, data?: any) => {
  console.log(`[PlanGeneration] ${message}`, data || '');
};

const PlanGeneration: React.FC = () => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const { user, userProfile } = useSupabaseAuth();
  const { createTrip, addToFavorites } = useBackendTrip();
  const isAuthenticated = !!user;
  const isPremium = userProfile?.is_premium || false;
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [showMockNotice, setShowMockNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const isGeneratingRef = useRef(false); // Use ref to prevent re-render issues

  useEffect(() => {
    console.log('PlanGeneration component mounted');
    console.log('Current localStorage keys:', Object.keys(localStorage));
    
    // Prevent multiple calls using ref
    if (isGeneratingRef.current) {
      console.log('⚠️ Plan generation already in progress, skipping...');
      return;
    }
    
    // First check if we already have a generated plan
    const existingPlan = localStorage.getItem('trippin-generated-plan');
    if (existingPlan) {
      try {
        const plan = JSON.parse(existingPlan);
        console.log('✅ Found existing plan in localStorage, loading it...');
        setGeneratedPlan(plan);
        setIsLoading(false);
        return;
      } catch (error) {
        console.warn('Failed to parse existing plan, will generate new one:', error);
      }
    }
    
    // Check if generation is already in progress (from previous session)
    const generatingFlag = localStorage.getItem('trippin-generating-plan');
    if (generatingFlag) {
      console.log('⚠️ Found generation flag, waiting for completion...');
      // Clear stale flag if it's older than 5 minutes
      try {
        const flagTime = parseInt(generatingFlag);
        if (Date.now() - flagTime > 5 * 60 * 1000) {
          console.log('Clearing stale generation flag');
          localStorage.removeItem('trippin-generating-plan');
        } else {
          console.log('Generation in progress, skipping new generation');
          return;
        }
      } catch (error) {
        localStorage.removeItem('trippin-generating-plan');
      }
    }
    
    // First try to load existing plan, if not found, generate new one
    const tripData = JSON.parse(localStorage.getItem('trippin-complete-data') || '{}');
    console.log('Trip data from localStorage:', tripData);
    
    // Debug: Check data structure
    if (tripData && Object.keys(tripData).length > 0) {
      console.log('🔍 Data structure analysis:');
      console.log('- Has basicInfo:', !!tripData.basicInfo);
      console.log('- Has travelStyle:', !!tripData.travelStyle);
      console.log('- Has detailedPreferences:', !!tripData.detailedPreferences);
      console.log('- Destination:', tripData.basicInfo?.destination || tripData.destination);
      console.log('- Budget:', tripData.travelStyle?.budget || tripData.budget);
      console.log('- Interests:', tripData.travelStyle?.interests || tripData.interests);
      
      console.log('Found trip data, generating plan...', tripData);
      generatePlan(tripData);
    } else {
      console.log('No trip data found, loading existing plan...');
      loadGeneratedPlan();
    }
  }, []); // Empty deps - only run once on mount

  const loadGeneratedPlan = () => {
    console.log('Loading generated plan...');
    try {
      // Try to load the generated plan from localStorage
      const storedPlan = localStorage.getItem('trippin-generated-plan');
      console.log('Stored plan:', storedPlan);
      if (storedPlan) {
        const plan = JSON.parse(storedPlan);
        setGeneratedPlan(plan);
        setIsLoading(false);
        logDebug('Loaded generated plan from localStorage', plan);
        return;
      }

      // If no plan found, try to load from complete data
      const tripData = JSON.parse(localStorage.getItem('trippin-complete-data') || '{}');
      console.log('Trip data:', tripData);
      if (tripData.generatedPlan) {
        setGeneratedPlan(tripData.generatedPlan);
        setIsLoading(false);
        logDebug('Loaded generated plan from complete data', tripData.generatedPlan);
        return;
      }

      // If still no plan, generate a sample plan for demonstration
      console.log('No generated plan found, creating sample plan for demonstration');
      const samplePlan = {
        id: 'sample-plan-1',
        title: 'Sample Tokyo Adventure',
        destination: 'Tokyo, Japan',
        duration: 3,
        budget: {
          total: 150000,
          currency: 'JPY',
          breakdown: {
            accommodation: 60000,
            transportation: 30000,
            food: 40000,
            activities: 15000,
            miscellaneous: 5000
          }
        },
        itinerary: [
          {
            day: 1,
            date: new Date().toISOString().split('T')[0],
            theme: 'Arrival and Orientation',
            activities: [
              {
                time: '09:00',
                title: 'Arrival at Narita Airport',
                description: 'Arrive and take the train to Tokyo',
                location: 'Narita Airport',
                type: 'transport',
                duration: 120,
                cost: 3000,
                tips: 'Get a JR Pass for unlimited travel',
                bookingInfo: 'Book in advance for better prices'
              },
              {
                time: '12:00',
                title: 'Check into Hotel',
                description: 'Check into your hotel in Shibuya',
                location: 'Shibuya District',
                type: 'accommodation',
                duration: 60,
                cost: 0,
                tips: 'Store luggage if early check-in not available'
              },
              {
                time: '14:00',
                title: 'Lunch at Local Ramen Shop',
                description: 'Try authentic Tokyo ramen',
                location: 'Shibuya',
                type: 'dining',
                duration: 90,
                cost: 1200,
                tips: 'Try the tonkotsu ramen'
              }
            ]
          }
        ],
        recommendations: {
          restaurants: [
            {
              name: 'Tsukiji Fish Market',
              cuisine: 'Sushi',
              priceRange: '$$',
              location: 'Tsukiji',
              description: 'Fresh sushi and seafood'
            }
          ],
          attractions: [
            {
              name: 'Senso-ji Temple',
              type: 'Temple',
              location: 'Asakusa',
              description: 'Historic Buddhist temple',
              bestTime: 'Morning'
            }
          ],
          transportation: [
            {
              type: 'JR Pass',
              description: 'Unlimited train travel',
              cost: 30000,
              tips: 'Buy before arriving in Japan'
            }
          ]
        },
        practicalInfo: {
          weather: 'Check local weather forecast',
          packingList: ['Clothes', 'Passport', 'Camera', 'Charger'],
          localCustoms: ['Remove shoes indoors', 'Bow when greeting'],
          emergencyContacts: ['Police: 110', 'Ambulance: 119'],
          usefulPhrases: ['Hello', 'Thank you', 'Excuse me']
        },
        createdAt: new Date().toISOString()
      };

      setGeneratedPlan(samplePlan);
      setIsLoading(false);
      setNoticeMessage(t('planGeneration.notice.samplePlan'));
      setShowMockNotice(true);
    } catch (error) {
      console.error('Error loading generated plan:', error);
      setNoticeMessage(t('planGeneration.notice.loadFailed'));
      setShowMockNotice(true);
      setIsLoading(false);
    }
  };

  const createUserPlan = (tripData: any) => {
    console.log('Creating user plan from data:', tripData);
    
    // Extract user preferences from nested structure
    const destination = tripData.basicInfo?.destination || tripData.destination || 'Tokyo, Japan';
    const startDate = tripData.basicInfo?.startDate || tripData.startDate;
    const endDate = tripData.basicInfo?.endDate || tripData.endDate;
    
    // Calculate duration from dates
    let duration = 3;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      duration = tripData.duration || 3;
    }
    
    const budget = tripData.travelStyle?.budget || tripData.budget || 100000;
    const travelers = tripData.basicInfo?.travelers || tripData.travelers || 1;
    const interests = tripData.travelStyle?.interests || tripData.interests || ['culture', 'food'];
    const accommodation = tripData.detailedPreferences?.accommodationType || tripData.accommodation || 'hotel';
    
    // Create a comprehensive plan based on user data
    const plan = {
      id: `user-plan-${Date.now()}`,
      title: `${destination} Adventure`,
      destination: destination,
      duration: duration,
      budget: {
        total: budget,
        currency: 'JPY',
        breakdown: {
          accommodation: Math.round(budget * 0.4),
          transportation: Math.round(budget * 0.2),
          food: Math.round(budget * 0.25),
          activities: Math.round(budget * 0.1),
          miscellaneous: Math.round(budget * 0.05)
        }
      },
      itinerary: createItinerary(destination, duration, interests),
      recommendations: createRecommendations(destination, interests),
      practicalInfo: createPracticalInfo(destination),
      createdAt: new Date().toISOString()
    };
    
    console.log('Created user plan structure:', {
      hasBudget: !!plan.budget,
      hasBreakdown: !!plan.budget.breakdown,
      hasItinerary: !!plan.itinerary,
      hasRecommendations: !!plan.recommendations,
      hasPracticalInfo: !!plan.practicalInfo
    });
    
    return plan;
  };

  const createItinerary = (destination: string, duration: number, interests: string[]) => {
    const itinerary = [];
    const today = new Date();
    
    for (let day = 1; day <= duration; day++) {
      const date = new Date(today.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
      const dayActivities = createDayActivities(destination, day, interests);
      
      itinerary.push({
        day: day,
        date: date.toISOString().split('T')[0],
        theme: getDayTheme(day, interests),
        activities: dayActivities
      });
    }
    
    return itinerary;
  };

  const createDayActivities = (destination: string, day: number, interests: string[]) => {
    const activities = [];
    
    if (day === 1) {
      // Arrival day
      activities.push(
        {
          time: '09:00',
          title: `Arrival at ${destination}`,
          description: 'Arrive and check into accommodation',
          location: destination,
          type: 'transport',
          duration: 120,
          cost: 3000,
          tips: 'Get local transportation pass',
          bookingInfo: 'Book in advance for better prices'
        },
        {
          time: '12:00',
          title: 'Check into Hotel',
          description: 'Check into your accommodation',
          location: destination,
          type: 'accommodation',
          duration: 60,
          cost: 0,
          tips: 'Store luggage if early check-in not available'
        },
        {
          time: '14:00',
          title: 'Local Lunch',
          description: 'Try local cuisine',
          location: destination,
          type: 'dining',
          duration: 90,
          cost: 1500,
          tips: 'Ask locals for recommendations'
        }
      );
    } else {
      // Regular days
      if (interests.includes('culture')) {
        activities.push({
          time: '09:00',
          title: 'Cultural Site Visit',
          description: 'Explore historical and cultural attractions',
          location: destination,
          type: 'sightseeing',
          duration: 180,
          cost: 2000,
          tips: 'Arrive early to avoid crowds'
        });
      }
      
      if (interests.includes('food')) {
        activities.push({
          time: '12:00',
          title: 'Local Food Experience',
          description: 'Try authentic local dishes',
          location: destination,
          type: 'dining',
          duration: 120,
          cost: 2500,
          tips: 'Try street food for authentic experience'
        });
      }
      
      if (interests.includes('nature')) {
        activities.push({
          time: '15:00',
          title: 'Nature Exploration',
          description: 'Visit parks or natural attractions',
          location: destination,
          type: 'nature',
          duration: 120,
          cost: 1000,
          tips: 'Bring comfortable walking shoes'
        });
      }
    }
    
    return activities;
  };

  const getDayTheme = (day: number, interests: string[]) => {
    const themes = [
      'Arrival and Orientation',
      'Cultural Exploration',
      'Local Experiences',
      'Adventure and Discovery',
      'Relaxation and Reflection'
    ];
    
    if (day === 1) return themes[0];
    if (day === 2) return themes[1];
    if (day === 3) return themes[2];
    if (day === 4) return themes[3];
    return themes[4];
  };

  const createRecommendations = (destination: string, interests: string[]) => {
    const recommendations = {
      restaurants: [],
      attractions: [],
      transportation: []
    };
    
    if (interests.includes('food')) {
      recommendations.restaurants.push(
        {
          name: 'Local Market',
          cuisine: 'Local',
          priceRange: '$',
          location: destination,
          description: 'Fresh local ingredients and authentic flavors'
        },
        {
          name: 'Traditional Restaurant',
          cuisine: 'Traditional',
          priceRange: '$$',
          location: destination,
          description: 'Authentic local cuisine in traditional setting'
        }
      );
    }
    
    if (interests.includes('culture')) {
      recommendations.attractions.push(
        {
          name: 'Historic Temple',
          type: 'Cultural',
          location: destination,
          description: 'Historic religious site',
          bestTime: 'Morning'
        },
        {
          name: 'Museum',
          type: 'Museum',
          location: destination,
          description: 'Local history and culture',
          bestTime: 'Afternoon'
        }
      );
    }
    
    recommendations.transportation.push(
      {
        type: 'Local Pass',
        description: 'Unlimited local transportation',
        cost: 2000,
        tips: 'Buy at station or online'
      }
    );
    
    return recommendations;
  };

  const createPracticalInfo = (destination: string) => {
    return {
      weather: 'Check local weather forecast before traveling',
      packingList: ['Clothes', 'Passport', 'Camera', 'Charger', 'Comfortable shoes'],
      localCustoms: ['Respect local traditions', 'Learn basic phrases', 'Follow local etiquette'],
      emergencyContacts: ['Police: 110', 'Ambulance: 119', 'Tourist helpline'],
      usefulPhrases: ['Hello', 'Thank you', 'Excuse me', 'Where is...?', 'How much?']
    };
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Saving plan to backend...', generatedPlan);
      
      // Create trip data from the generated plan
      const tripData = {
        title: generatedPlan.title,
        destination: generatedPlan.destination,
        start_date: generatedPlan.itinerary?.[0]?.date || new Date().toISOString().split('T')[0],
        end_date: generatedPlan.itinerary?.[generatedPlan.itinerary.length - 1]?.date || new Date().toISOString().split('T')[0],
        budget: generatedPlan.budget?.total || 0,
        currency: generatedPlan.budget?.currency || 'JPY',
        travelers: 1, // Default, could be extracted from tripData
        interests: [], // Could be extracted from tripData
        status: 'planning' as const,
        itinerary: generatedPlan.itinerary,
        recommendations: generatedPlan.recommendations,
        practical_info: generatedPlan.practicalInfo,
        is_public: false
      };
      
      console.log('🚀 Creating trip with data:', tripData);
      const savedTrip = await createTrip(tripData);
      console.log('✅ Trip saved successfully:', savedTrip);
      
      setSavedTripId(savedTrip.id);
      
      // Show success message
      setNoticeMessage(t('planGeneration.notice.saveSuccess'));
      setShowMockNotice(true);
      
      // Store the saved trip in localStorage for dashboard access
      localStorage.setItem('trippin-recent-trip', JSON.stringify(savedTrip));
      
    } catch (error) {
      console.error('❌ Error saving plan:', error);
      setNoticeMessage(t('planGeneration.notice.saveFailed'));
      setShowMockNotice(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!savedTripId) {
      console.log('No saved trip to favorite');
      return;
    }
    
    try {
      console.log('⭐ Adding trip to favorites:', savedTripId);
      await addToFavorites(savedTripId);
      setNoticeMessage(t('planGeneration.notice.favorited'));
      setShowMockNotice(true);
    } catch (error) {
      console.error('❌ Error adding to favorites:', error);
      setNoticeMessage(t('planGeneration.notice.favoriteFailed'));
      setShowMockNotice(true);
    }
  };

  const handleDownloadPlan = () => {
    if (!generatedPlan) {
      console.log('No plan to download');
      return;
    }
    
    try {
      console.log('📥 Downloading plan...', generatedPlan);
      
      // Create a formatted text version of the plan
      const planText = formatPlanForDownload(generatedPlan);
      
      // Create and download the file
      const blob = new Blob([planText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedPlan.title.replace(/[^a-zA-Z0-9]/g, '_')}_travel_plan.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Plan downloaded successfully');
      setNoticeMessage(t('planGeneration.notice.downloaded'));
      setShowMockNotice(true);
    } catch (error) {
      console.error('❌ Error downloading plan:', error);
      setNoticeMessage(t('planGeneration.notice.downloadFailed'));
      setShowMockNotice(true);
    }
  };

  const formatPlanForDownload = (plan: GeneratedPlan): string => {
    let text = '';
    
    // Header
    text += `========================================\n`;
    text += `${plan.title}\n`;
    text += `========================================\n\n`;
    
    // Basic Info
    text += `目的地: ${plan.destination}\n`;
    text += `期間: ${plan.duration}日間\n`;
    text += `予算: ${plan.budget?.currency || 'JPY'} ${plan.budget?.total?.toLocaleString() || '0'}\n\n`;
    
    // Budget Breakdown
    if (plan.budget?.breakdown) {
      text += `予算内訳:\n`;
      Object.entries(plan.budget.breakdown).forEach(([category, amount]) => {
        text += `  ${category}: ${plan.budget?.currency || 'JPY'} ${amount.toLocaleString()}\n`;
      });
      text += `\n`;
    }
    
    // Itinerary
    text += `日程:\n`;
    text += `========================================\n`;
    
    plan.itinerary?.forEach((day, index) => {
      text += `\n${day.day}日目 - ${day.theme || '観光'}\n`;
      text += `日付: ${day.date}\n`;
      text += `----------------------------------------\n`;
      
      day.activities?.forEach((activity) => {
        text += `${activity.time} - ${activity.title}\n`;
        text += `  場所: ${activity.location}\n`;
        text += `  説明: ${activity.description}\n`;
        if (activity.duration) {
          text += `  所要時間: ${activity.duration}分\n`;
        }
        if (activity.cost && activity.cost > 0) {
          text += `  費用: ${plan.budget?.currency || 'JPY'} ${activity.cost.toLocaleString()}\n`;
        }
        if (activity.tips) {
          text += `  ヒント: ${activity.tips}\n`;
        }
        text += `\n`;
      });
    });
    
    // Recommendations
    if (plan.recommendations && plan.recommendations.length > 0) {
      text += `\nおすすめスポット:\n`;
      text += `========================================\n`;
      plan.recommendations.forEach((rec) => {
        text += `${rec.name}\n`;
        text += `  説明: ${rec.description}\n`;
        text += `  場所: ${rec.location}\n`;
        if (rec.cost) {
          text += `  費用: ${plan.budget?.currency || 'JPY'} ${rec.cost.toLocaleString()}\n`;
        }
        if (rec.rating) {
          text += `  評価: ${rec.rating}\n`;
        }
        text += `\n`;
      });
    }
    
    // Practical Info
    if (plan.practicalInfo) {
      text += `\n実用情報:\n`;
      text += `========================================\n`;
      
      if (plan.practicalInfo.weather) {
        text += `天気: ${plan.practicalInfo.weather}\n`;
      }
      
      if (plan.practicalInfo.packingList && plan.practicalInfo.packingList.length > 0) {
        text += `持参品:\n`;
        plan.practicalInfo.packingList.forEach((item) => {
          text += `  - ${item}\n`;
        });
        text += `\n`;
      }
      
      if (plan.practicalInfo.localCustoms && plan.practicalInfo.localCustoms.length > 0) {
        text += `現地のマナー:\n`;
        plan.practicalInfo.localCustoms.forEach((custom) => {
          text += `  - ${custom}\n`;
        });
        text += `\n`;
      }
      
      if (plan.practicalInfo.emergencyContacts && plan.practicalInfo.emergencyContacts.length > 0) {
        text += `緊急連絡先:\n`;
        plan.practicalInfo.emergencyContacts.forEach((contact) => {
          text += `  - ${contact}\n`;
        });
        text += `\n`;
      }
      
      if (plan.practicalInfo.usefulPhrases && plan.practicalInfo.usefulPhrases.length > 0) {
        text += `便利なフレーズ:\n`;
        plan.practicalInfo.usefulPhrases.forEach((phrase) => {
          text += `  - ${phrase}\n`;
        });
        text += `\n`;
      }
    }
    
    // Footer
    text += `\n========================================\n`;
    text += `このプランは ${new Date().toLocaleDateString('ja-JP')} に生成されました。\n`;
    text += `Trippin - あなたの旅のパートナー\n`;
    text += `========================================\n`;
    
    return text;
  };

  const generatePlan = useCallback(async (tripData: any) => {
    // Prevent concurrent generation using ref
    if (isGeneratingRef.current) {
      console.warn('⚠️ Plan generation already in progress, ignoring duplicate call');
      return;
    }

    // Check if plan already exists for this trip data
    const existingPlan = localStorage.getItem('trippin-generated-plan');
    if (existingPlan) {
      try {
        const plan = JSON.parse(existingPlan);
        const tripDestination = tripData.basicInfo?.destination || tripData.destination;
        if (plan.destination === tripDestination) {
          console.log('✅ Found existing plan for this destination, using it');
          setGeneratedPlan(plan);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Failed to parse existing plan:', error);
      }
    }

    console.log('generatePlan called with:', tripData);
    isGeneratingRef.current = true; // Set flag immediately using ref
    setIsLoading(true);
    setProgress(0);
    setShowMockNotice(false);
    setNoticeMessage(null);
    
    // Set generation flag in localStorage to prevent duplicate calls across page refreshes
    localStorage.setItem('trippin-generating-plan', Date.now().toString());
    
    logDebug('Starting plan generation process', tripData);
    
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          if (Math.floor(newProgress / 10) > Math.floor(prev / 10)) {
            logDebug(`Progress: ${Math.floor(newProgress)}%`);
          }
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 1000);
      
      logDebug('Preparing to call OpenAI generate function');
      
      // Create a comprehensive plan based on user data
      console.log('Creating user plan from trip data:', tripData);
      const userPlan = createUserPlan(tripData);
      console.log('Created user plan:', userPlan);
      
      // Try to call OpenAI API first - ONLY ONCE
      let aiEnhancedPlan = null;
      try {
        // Flatten the nested data structure for the API
        const flattenedTripData = {
          destination: tripData.basicInfo?.destination || tripData.destination,
          startDate: tripData.basicInfo?.startDate || tripData.startDate,
          endDate: tripData.basicInfo?.endDate || tripData.endDate,
          travelers: tripData.basicInfo?.travelers || tripData.travelers,
          budget: tripData.travelStyle?.budget || tripData.budget,
          currency: tripData.travelStyle?.currency || tripData.currency || 'JPY',
          interests: tripData.travelStyle?.interests || tripData.interests,
          accommodationType: tripData.detailedPreferences?.accommodationType || tripData.accommodationType,
          transportationType: tripData.detailedPreferences?.transportationType || tripData.transportationType,
          dietaryRestrictions: tripData.travelStyle?.dietaryRestrictions || tripData.dietaryRestrictions,
          specialRequirements: tripData.detailedPreferences?.specialRequirements || tripData.specialRequirements,
          language: currentLanguage,
          generateMultiplePlans: true
        };
        
        console.log('🚀 Sending flattened data to OpenAI (SINGLE CALL):', flattenedTripData);
        
        // Use backendApiCall to route to Supabase edge function - SINGLE CALL
        const result = await backendApiCall(BACKEND_API_CONFIG.ENDPOINTS.OPENAI.GENERATE, {
          method: 'POST',
          body: JSON.stringify({ 
            tripData: flattenedTripData
          })
        });

        console.log('📥 OpenAI API response received:', {
          success: result.success,
          hasData: !!result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          dataType: typeof result.data,
          isArray: Array.isArray(result.data)
        });

        if (result.success && result.data) {
          aiEnhancedPlan = result.data;
          logDebug('✅ OpenAI API call successful - stopping here', result.data);
          console.log('🎯 Frontend received AI plan (COMPLETE):', JSON.stringify(result.data, null, 2));
        } else {
          console.warn('⚠️ OpenAI API response missing data:', result);
        }
      } catch (apiError: any) {
        logDebug('❌ OpenAI API call failed, using enhanced plan', apiError);
        console.error('API Error details:', {
          message: apiError.message,
          status: apiError.status,
          endpoint: apiError.endpoint
        });
        setNoticeMessage('AI処理が利用できないため、基本プランを表示しています。');
        setShowMockNotice(true);
      }
      
      // Use AI enhanced plan if available, otherwise use user plan
      let finalPlan = aiEnhancedPlan || userPlan;
      
      // Ensure the plan has all required properties
      if (finalPlan && !finalPlan.budget) {
        finalPlan.budget = userPlan.budget;
      }
      if (finalPlan && !finalPlan.recommendations) {
        finalPlan.recommendations = userPlan.recommendations;
      }
      if (finalPlan && !finalPlan.practicalInfo) {
        finalPlan.practicalInfo = userPlan.practicalInfo;
      }

      logDebug('Final plan created', finalPlan);
      console.log('🎯 Final plan structure:', {
        hasBudget: !!finalPlan.budget,
        hasBreakdown: !!finalPlan.budget?.breakdown,
        hasItinerary: !!finalPlan.itinerary,
        hasRecommendations: !!finalPlan.recommendations,
        hasPracticalInfo: !!finalPlan.practicalInfo
      });
      console.log('📋 Complete final plan:', JSON.stringify(finalPlan, null, 2));
      
      if (finalPlan) {
        // Set the generated plan FIRST before any other state updates
        setGeneratedPlan(finalPlan);
        
        // Store the plan in localStorage IMMEDIATELY
        localStorage.setItem('trippin-generated-plan', JSON.stringify(finalPlan));
        
        // Clear generation flag in localStorage
        localStorage.removeItem('trippin-generating-plan');
        
        // Then update loading state
        setIsLoading(false);
        setProgress(100);
        
        logDebug('✅ Plan generation completed successfully - NO MORE API CALLS');
      } else {
        throw new Error('プラン生成に失敗しました');
      }
    } catch (error) {
      logDebug('Error in plan generation', error);
      setNoticeMessage('プランの生成中にエラーが発生しました。');
      setShowMockNotice(true);
      // Clear generation flag on error
      localStorage.removeItem('trippin-generating-plan');
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setProgress(100);
      setIsLoading(false);
      isGeneratingRef.current = false; // Clear flag using ref
      logDebug('Plan generation process completed - flag cleared');
    }
  }, [currentLanguage]); // Only depend on currentLanguage



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {isLoading ? t('planGeneration.title') : t('planGeneration.complete')}
          </h1>
          <p className="text-lg text-gray-600">
            {isLoading ? t('planGeneration.subtitle') : t('planGeneration.completeSubtitle')}
          </p>
        </motion.div>
        
        {/* Mock Data Notice */}
        {showMockNotice && !isLoading && noticeMessage && (
          <MockDataNotice 
            message={noticeMessage}
            onRetry={() => setShowMockNotice(false)}
            className="max-w-4xl mx-auto mb-4"
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-t-purple-600 border-r-transparent border-b-transparent border-l-transparent"
                style={{ transform: `rotate(${progress * 3.6}deg)` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('planGeneration.generating')}</h2>
            <p className="text-gray-600 mb-6">{t('planGeneration.generatingDescription')}</p>
            
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <div className="text-left">
                  <div className="h-2 bg-purple-200 rounded-full w-full">
                    <div
                      className="h-2 bg-purple-600 rounded-full"
                      style={{ width: `${Math.min(progress * 1.5, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{t('planGeneration.step1')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <div className="h-2 bg-blue-200 rounded-full w-full">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${Math.max(0, Math.min((progress - 30) * 1.5, 100))}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{t('planGeneration.step2')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <div className="h-2 bg-green-200 rounded-full w-full">
                    <div
                      className="h-2 bg-green-600 rounded-full"
                      style={{ width: `${Math.max(0, Math.min((progress - 60) * 2.5, 100))}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{t('planGeneration.step3')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {!isLoading && generatedPlan && (
          <div className="space-y-4">
            <GeneratedPlanDisplay
              plan={generatedPlan}
              onSave={handleSavePlan}
              onDownload={handleDownloadPlan}
            />
            
            {/* Additional Action Buttons */}
            {savedTripId && (
              <motion.div
                className="flex justify-center space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleAddToFavorites}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Star className="w-5 h-5" />
                  <span>{t('planGeneration.actions.addToFavorites')}</span>
                </motion.button>
                
                <motion.button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Calendar className="w-5 h-5" />
                  <span>{t('planGeneration.actions.backToDashboard')}</span>
                </motion.button>
              </motion.div>
            )}
          </div>
        )}

        {/* Error State */}
        {!isLoading && !generatedPlan && (
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-red-500 mb-4">
              <AlertCircle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('planGeneration.loadErrorTitle')}</h2>
            <p className="text-gray-600 mb-6">
              {t('planGeneration.loadErrorDescription')}
            </p>
            <div className="flex space-x-4 justify-center">
                                <button
                onClick={() => navigate('/questionnaire/language')}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                {t('planGeneration.actions.backToQuestions')}
                  </button>
                <button
                  onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                {t('planGeneration.actions.backToDashboard')}
                </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default PlanGeneration;