import type { VercelRequest, VercelResponse } from '@vercel/node';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface TripActivity {
  time: string;
  name: string;
  description: string;
  location: string;
  rating?: string;
  duration?: number;
  estimatedCost?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  transportDetails?: {
    method: string;
    distance?: string;
    line?: string;
    transfers?: number;
    walkingTime?: string;
  };
  reviews?: Array<{
    text: string;
    author: string;
    rating?: number;
  }>;
  tips?: string;
}

interface DayItinerary {
  day: number;
  title: string;
  description: string;
  activities: TripActivity[];
}

interface GeneratedPlan {
  destination: string;
  duration: string;
  theme: string;
  description: string;
  totalEstimatedCost: string;
  itinerary: DayItinerary[];
  highlights: string[];
  recommendations: string[];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tripData } = req.body as any;

    console.log('📥 Received trip data from frontend:', JSON.stringify(tripData, null, 2));

    if (!tripData) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({ error: 'Trip data is required' });
    }

    const language = tripData.language || 'ja';
    const generateMultiplePlans = tripData.generateMultiplePlans || false;

    // Check if OpenAI API key is available
    const disableMock = process.env.DISABLE_MOCK === '1' || process.env.DISABLE_MOCK === 'true';
    if (!process.env.OPENAI_API_KEY) {
      if (disableMock) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
      }
      console.warn('OpenAI API key not found, returning mock plan');
      const mockPlan = getMockTravelPlan();
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({
        success: true,
        data: generateMultiplePlans ? [mockPlan] : mockPlan,
        language,
        isMockData: true,
        message: 'OpenAI APIキーが設定されていないため、サンプルプランを表示しています。'
      });
    }

    // Prepare the system prompt
    const systemPrompt = `You are an expert travel planner specializing in Japan. Create detailed, personalized travel itineraries based on the user's preferences. Always respond in ${language === 'ja' ? 'Japanese' : 'English'}.

Key requirements:
1. Create realistic, achievable daily schedules (8-10 hours per day)
2. Include specific locations, timings, and transportation details
3. Add estimated costs in Japanese Yen
4. Include practical tips and recommendations
5. Consider travel time between locations
6. Provide coordinates when possible
7. Include highly rated activities (4.0+ rating preferred)
8. Add local insights and cultural context

Format your response as a JSON object matching this structure:
{
  "destination": "destination name",
  "duration": "X days Y nights",
  "theme": "main theme (e.g., 'Cultural Heritage & Modern Tokyo')",
  "description": "brief description of the plan",
  "totalEstimatedCost": "¥XX,XXX per person",
  "itinerary": [
    {
      "day": 1,
      "title": "Day title",
      "description": "Day overview",
      "activities": [
        {
          "time": "09:00",
          "name": "Activity name",
          "description": "Detailed description",
          "location": "Specific address/area",
          "rating": "4.5/5",
          "duration": 90,
          "estimatedCost": "¥1,500",
          "coordinates": {
            "lat": 35.6762,
            "lng": 139.6503
          },
          "transportDetails": {
            "method": "JR Yamanote Line",
            "distance": "15分",
            "line": "新宿駅から渋谷駅",
            "transfers": 0,
            "walkingTime": "5分"
          },
          "reviews": [
            {
              "text": "Amazing experience with beautiful views!",
              "author": "Tourist Review",
              "rating": 5
            }
          ],
          "tips": "Visit early morning for fewer crowds"
        }
      ]
    }
  ],
  "highlights": ["Key highlight 1", "Key highlight 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    // Prepare the user prompt based on trip data
    const userPrompt = `Create a personalized travel itinerary for Japan with the following details:

**Trip Information:**
- Destination: ${tripData.destination || tripData.trip?.destination || 'Japan'}
- Duration: ${tripData.startDate ? new Date(tripData.startDate).toLocaleDateString() : tripData.trip?.startDate ? new Date(tripData.trip.startDate).toLocaleDateString() : ''} to ${tripData.endDate ? new Date(tripData.endDate).toLocaleDateString() : tripData.trip?.endDate ? new Date(tripData.trip.endDate).toLocaleDateString() : ''}
- Travelers: ${tripData.travelers || tripData.trip?.travelers || 1} people
- Budget: ${tripData.budget || tripData.trip?.budget?.amount || 'Not specified'} ${tripData.currency || tripData.trip?.budget?.currency || 'JPY'}

**Interests & Preferences:**
${tripData.interests?.map((interest: any) => `- ${interest.name || interest} (${interest.category || 'general'})`).join('\n') || tripData.preferences?.interests?.map((interest: any) => `- ${interest.name} (${interest.category})`).join('\n') || '- General sightseeing'}

**Transportation Preferences:**
${tripData.transportationType || tripData.preferences?.transportation?.map((transport: any) => `- ${transport.name}`).join('\n') || '- Public transportation'}

**Accommodation Preferences:**
${tripData.accommodationType || tripData.preferences?.accommodation?.map((accommodation: any) => `- ${accommodation.name}`).join('\n') || '- Hotels'}

**Special Requirements:**
${tripData.specialRequirements || tripData.preferences?.esim ? '- eSIM data plan needed' : ''}
${tripData.dietaryRestrictions?.length > 0 ? `- Dietary restrictions: ${tripData.dietaryRestrictions.join(', ')}` : ''}

Please create ${generateMultiplePlans ? '3 different travel plans with varying themes (cultural, modern/tech, nature/food focused)' : 'one comprehensive travel plan'} that incorporates these preferences and provides a memorable experience in Japan.`;

    console.log('📝 Generated user prompt:', userPrompt);

    // Call OpenAI API
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.8,
          response_format: { type: "json_object" }
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}`);
      }

      const data = await openaiResponse.json();
      console.log('🔍 OpenAI Raw Response:', JSON.stringify(data, null, 2));

      const content = data.choices[0]?.message?.content;
      console.log('📝 OpenAI Content:', content);

      if (!content) {
        throw new Error('No response generated from OpenAI');
      }

      try {
        const parsedPlan = JSON.parse(content);
        console.log('✅ Parsed OpenAI Plan:', JSON.stringify(parsedPlan, null, 2));

        // Validate the response structure
        if (!parsedPlan.destination || !parsedPlan.itinerary) {
          console.error('❌ Invalid plan structure:', {
            hasDestination: !!parsedPlan.destination,
            hasItinerary: !!parsedPlan.itinerary,
            plan: parsedPlan
          });
          throw new Error('Invalid plan structure received');
        }

        // If multiple plans requested, create variations
        if (generateMultiplePlans) {
          const basePlan = parsedPlan;
          const plans = [
            {
              ...basePlan,
              theme: 'Cultural Heritage & Traditional Experience',
              description: 'Deep dive into Japan\'s rich cultural heritage and traditions'
            },
            {
              ...basePlan,
              theme: 'Modern Tokyo & Technology',
              description: 'Explore cutting-edge technology and modern urban culture',
              totalEstimatedCost: '¥95,000 per person'
            },
            {
              ...basePlan,
              theme: 'Nature & Culinary Journey',
              description: 'Experience Japan\'s natural beauty and world-renowned cuisine',
              totalEstimatedCost: '¥75,000 per person'
            }
          ];

          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.status(200).json({
            success: true,
            data: plans,
            language
          });
        }

        // Transform the API response to match frontend expectations
        const transformedPlan = {
          id: `plan-${Date.now()}`,
          title: `${parsedPlan.destination} Adventure`,
          destination: parsedPlan.destination,
          duration: parseInt(parsedPlan.duration.split(' ')[0]) || 3,
          budget: {
            total: parseInt(parsedPlan.totalEstimatedCost.replace(/[¥,]/g, '')) || 100000,
            currency: 'JPY',
            breakdown: {
              accommodation: Math.round(parseInt(parsedPlan.totalEstimatedCost.replace(/[¥,]/g, '')) * 0.4),
              transportation: Math.round(parseInt(parsedPlan.totalEstimatedCost.replace(/[¥,]/g, '')) * 0.2),
              food: Math.round(parseInt(parsedPlan.totalEstimatedCost.replace(/[¥,]/g, '')) * 0.25),
              activities: Math.round(parseInt(parsedPlan.totalEstimatedCost.replace(/[¥,]/g, '')) * 0.1),
              miscellaneous: Math.round(parseInt(parsedPlan.totalEstimatedCost.replace(/[¥,]/g, '')) * 0.05)
            }
          },
          itinerary: parsedPlan.itinerary.map((day: any) => ({
            day: day.day,
            date: new Date().toISOString().split('T')[0],
            theme: day.title,
            activities: day.activities.map((activity: any) => ({
              time: activity.time,
              title: activity.name,
              description: activity.description,
              location: activity.location,
              type: getActivityType(activity.name),
              duration: activity.duration || 60,
              cost: parseInt(activity.estimatedCost?.replace(/[¥,]/g, '') || '0'),
              tips: activity.tips || '',
              bookingInfo: activity.transportDetails?.method || ''
            }))
          })),
          recommendations: {
            restaurants: [
              {
                name: 'Local Restaurant',
                cuisine: 'Local',
                priceRange: '$$',
                location: parsedPlan.destination,
                description: 'Authentic local cuisine'
              }
            ],
            attractions: parsedPlan.highlights.map((highlight: string) => ({
              name: highlight,
              type: 'Attraction',
              location: parsedPlan.destination,
              description: highlight,
              bestTime: 'Morning'
            })),
            transportation: [
              {
                type: 'Local Pass',
                description: 'Unlimited local transportation',
                cost: 2000,
                tips: 'Buy at station or online'
              }
            ]
          },
          practicalInfo: {
            weather: 'Check local weather forecast before traveling',
            packingList: ['Clothes', 'Passport', 'Camera', 'Charger', 'Comfortable shoes'],
            localCustoms: ['Respect local traditions', 'Learn basic phrases', 'Follow local etiquette'],
            emergencyContacts: ['Police: 110', 'Ambulance: 119', 'Tourist helpline'],
            usefulPhrases: ['Hello', 'Thank you', 'Excuse me', 'Where is...?', 'How much?']
          },
          createdAt: new Date().toISOString()
        };

        console.log('🔄 Transformed Plan:', JSON.stringify(transformedPlan, null, 2));

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({
          success: true,
          data: transformedPlan,
          language
        });

      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        throw new Error('Invalid response format from AI service');
      }
    } catch (openaiError) {
      console.error('OpenAI API call failed:', openaiError);
      // Provide fallback mock data unless disabled
      if (disableMock) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(502).json({ error: 'AI upstream unavailable' });
      }
      const mockPlan = {
        id: `mock-plan-${Date.now()}`,
        title: `${tripData.basicInfo?.destination || 'Tokyo'} Adventure`,
        destination: tripData.basicInfo?.destination || 'Tokyo, Japan',
        duration: 7,
        budget: {
          total: 85000,
          currency: 'JPY',
          breakdown: {
            accommodation: 34000,
            transportation: 17000,
            food: 21250,
            activities: 8500,
            miscellaneous: 4250
          }
        },
        itinerary: [
          {
            day: 1,
            date: new Date().toISOString().split('T')[0],
            theme: 'Arrival & Tokyo Station Area',
            activities: [
              {
                time: '14:00',
                title: 'Tokyo Station & Marunouchi Area',
                description: 'Historic railway station and modern business district with excellent shopping',
                location: 'Tokyo Station, Marunouchi, Chiyoda City, Tokyo',
                type: 'transport',
                duration: 120,
                cost: 2000,
                tips: 'Store luggage in coin lockers to explore freely',
                bookingInfo: 'Airport Express'
              },
              {
                time: '16:30',
                title: 'Imperial Palace East Gardens',
                description: 'Beautiful traditional Japanese gardens with historical significance',
                location: '1-1 Chiyoda, Chiyoda City, Tokyo',
                type: 'sightseeing',
                duration: 90,
                cost: 0,
                tips: 'Closes at 4:30 PM, visit early. Free entry but closes on Mondays and Fridays',
                bookingInfo: 'Walking'
              },
              {
                time: '19:00',
                title: 'Ginza District Dinner',
                description: 'Upscale shopping and dining district with traditional and modern restaurants',
                location: 'Ginza, Chuo City, Tokyo',
                type: 'dining',
                duration: 120,
                cost: 4000,
                tips: 'Many department stores close at 8 PM, dine early or explore night food scene',
                bookingInfo: 'Tokyo Metro'
              }
            ]
          },
          {
            day: 2,
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            theme: 'Traditional Culture & Asakusa',
            activities: [
              {
                time: '09:00',
                title: 'Senso-ji Temple',
                description: 'Tokyo\'s oldest temple with traditional market street approach',
                location: '2-3-1 Asakusa, Taito City, Tokyo',
                type: 'sightseeing',
                duration: 120,
                cost: 0,
                tips: 'Visit early morning (8 AM) for fewer crowds and better photos',
                bookingInfo: 'Tokyo Metro'
              },
              {
                time: '11:30',
                title: 'Tokyo Skytree',
                description: 'World\'s second-tallest structure with panoramic city views',
                location: '1-1-2 Oshiage, Sumida City, Tokyo',
                type: 'sightseeing',
                duration: 150,
                cost: 2100,
                tips: 'Book tickets online in advance. Clear day views reach Mount Fuji',
                bookingInfo: 'Walking + Train'
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

      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({
        success: true,
        data: generateMultiplePlans ? [mockPlan] : mockPlan,
        language,
        isMockData: true,
        message: 'OpenAI APIが一時的に利用できないため、サンプルプランを表示しています。'
      });
    }

  } catch (error) {
    console.error('Travel Plan Generation Error:', error);
    const disableMock = process.env.DISABLE_MOCK === '1' || process.env.DISABLE_MOCK === 'true';
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (disableMock) {
      return res.status(500).json({ error: 'Server error' });
    }
    const mockPlan = {
      id: `fallback-plan-${Date.now()}`,
      title: 'Tokyo Adventure',
      destination: 'Tokyo, Japan',
      duration: 3,
      budget: {
        total: 85000,
        currency: 'JPY',
        breakdown: {
          accommodation: 34000,
          transportation: 17000,
          food: 21250,
          activities: 8500,
          miscellaneous: 4250
        }
      },
      itinerary: [
        {
          day: 1,
          date: new Date().toISOString().split('T')[0],
          theme: 'Arrival & Tokyo Station Area',
          activities: [
            {
              time: '14:00',
              title: 'Tokyo Station & Marunouchi Area',
              description: 'Historic railway station and modern business district with excellent shopping',
              location: 'Tokyo Station, Marunouchi, Chiyoda City, Tokyo',
              type: 'transport',
              duration: 120,
              cost: 2000,
              tips: 'Store luggage in coin lockers to explore freely',
              bookingInfo: 'Airport Express'
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

    return res.status(200).json({
      success: true,
      data: mockPlan,
      language: (req.body as any)?.tripData?.language || 'ja',
      isMockData: true,
      message: 'サーバーエラーが発生したため、サンプルプランを表示しています。'
    });
  }
}

// Helper function to determine activity type based on name
function getActivityType(activityName: string): string {
  const name = activityName.toLowerCase();
  if (name.includes('restaurant') || name.includes('dining') || name.includes('food') || name.includes('lunch') || name.includes('dinner')) {
    return 'dining';
  }
  if (name.includes('temple') || name.includes('shrine') || name.includes('museum') || name.includes('garden') || name.includes('park')) {
    return 'sightseeing';
  }
  if (name.includes('station') || name.includes('train') || name.includes('metro') || name.includes('bus') || name.includes('transport')) {
    return 'transport';
  }
  if (name.includes('hotel') || name.includes('accommodation') || name.includes('check-in') || name.includes('check-in')) {
    return 'accommodation';
  }
  return 'sightseeing';
}
