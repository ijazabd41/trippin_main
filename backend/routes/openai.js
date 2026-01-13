import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY environment variable is not set');
  console.warn('   AI features will not work. Please configure your OpenAI API key.');
}

// OpenAI Generate endpoint
router.post('/generate', async (req, res) => {
  try {
    const { tripData } = req.body;
    
    if (!tripData) {
      return res.status(400).json({
        success: false,
        message: 'Trip data is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('🔄 OpenAI API key not configured, using fallback plan');
      
      const fallbackPlan = {
        id: `fallback-plan-${Date.now()}`,
        title: `${tripData.destination || 'Destination'} Adventure`,
        destination: tripData.destination || 'Unknown Destination',
        duration: tripData.duration || 3,
        budget: {
          total: tripData.budget || 100000,
          currency: tripData.currency || 'JPY',
          breakdown: {
            accommodation: Math.round((tripData.budget || 100000) * 0.4),
            transportation: Math.round((tripData.budget || 100000) * 0.2),
            food: Math.round((tripData.budget || 100000) * 0.25),
            activities: Math.round((tripData.budget || 100000) * 0.1),
            miscellaneous: Math.round((tripData.budget || 100000) * 0.05)
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
                title: 'Arrival',
                description: 'Arrive at your destination',
                location: tripData.destination || 'Destination',
                type: 'transport',
                duration: 120,
                cost: 3000,
                tips: 'Get local transportation pass',
                bookingInfo: 'Book in advance for better prices'
              }
            ]
          }
        ],
        recommendations: {
          restaurants: [
            {
              name: 'Local Restaurant',
              cuisine: 'Local',
              priceRange: '$$',
              location: tripData.destination || 'Destination',
              description: 'Try local cuisine'
            }
          ],
          attractions: [
            {
              name: 'Main Attraction',
              type: 'Sightseeing',
              location: tripData.destination || 'Destination',
              description: 'Must-see attraction',
              bestTime: 'Morning'
            }
          ],
          transportation: [
            {
              type: 'Local Transport',
              description: 'Local transportation options',
              cost: 2000,
              tips: 'Get a day pass for unlimited rides'
            }
          ]
        },
        practicalInfo: {
          weather: 'Check local weather forecast',
          packingList: ['Clothes', 'Passport', 'Camera', 'Charger'],
          localCustoms: ['Respect local traditions', 'Learn basic phrases'],
          emergencyContacts: ['Police: 110', 'Ambulance: 119'],
          usefulPhrases: ['Hello', 'Thank you', 'Excuse me']
        }
      };
      
      return res.json({
        success: true,
        data: fallbackPlan,
        message: 'Travel plan generated using fallback (OpenAI API key not configured)',
        isFallback: true
      });
    }

    console.log('🚀 OpenAI Generate Request:', tripData);

    // Create a comprehensive travel plan using OpenAI
    const prompt = `Create a detailed travel plan for ${tripData.destination || 'a destination'} for ${tripData.duration || 3} days with a budget of ${tripData.budget || 100000} ${tripData.currency || 'JPY'}. 

    Traveler preferences:
    - Travelers: ${tripData.travelers || 1}
    - Interests: ${tripData.interests?.join(', ') || 'general tourism'}
    - Accommodation: ${tripData.accommodation || 'hotel'}
    
    Please provide a comprehensive travel plan in JSON format with the following structure:
    {
      "id": "generated-plan-id",
      "title": "Destination Adventure",
      "destination": "destination name",
      "duration": number of days,
      "budget": {
        "total": budget amount,
        "currency": "JPY",
        "breakdown": {
          "accommodation": amount,
          "transportation": amount,
          "food": amount,
          "activities": amount,
          "miscellaneous": amount
        }
      },
      "itinerary": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "theme": "Day theme",
          "activities": [
            {
              "time": "HH:MM",
              "title": "Activity title",
              "description": "Activity description",
              "location": "Location",
              "type": "sightseeing|dining|transport|accommodation|nature",
              "duration": minutes,
              "cost": cost in currency,
              "tips": "Helpful tips",
              "bookingInfo": "Booking information"
            }
          ]
        }
      ],
      "recommendations": {
        "restaurants": [
          {
            "name": "Restaurant name",
            "cuisine": "Cuisine type",
            "priceRange": "$|$$|$$$",
            "location": "Location",
            "description": "Description"
          }
        ],
        "attractions": [
          {
            "name": "Attraction name",
            "type": "Type",
            "location": "Location",
            "description": "Description",
            "bestTime": "Best time to visit"
          }
        ],
        "transportation": [
          {
            "type": "Transport type",
            "description": "Description",
            "cost": cost,
            "tips": "Tips"
          }
        ]
      },
      "practicalInfo": {
        "weather": "Weather information",
        "packingList": ["item1", "item2"],
        "localCustoms": ["custom1", "custom2"],
        "emergencyContacts": ["contact1", "contact2"],
        "usefulPhrases": ["phrase1", "phrase2"]
      }
    }`;

    // Use faster model with JSON mode for better performance and reliability
    const models = ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"];
    let completion;
    let lastError;

    for (const model of models) {
      try {
        console.log(`🤖 Trying model: ${model}`);
        completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a professional travel planner. Create detailed, practical travel plans in JSON format. Always respond with valid JSON only, no additional text or markdown formatting."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2500, // Reduced to speed up generation
          response_format: { type: "json_object" } // Force JSON output
        });
        console.log(`✅ Successfully used model: ${model}`);
        break;
      } catch (error) {
        console.log(`❌ Model ${model} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!completion) {
      throw lastError || new Error('All models failed');
    }

    const response = completion.choices[0].message.content;
    
    try {
      // Remove markdown code blocks if present (even with response_format, sometimes GPT adds them)
      let cleanedContent = response.trim();
      cleanedContent = cleanedContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      
      // Try parsing first
      let planData;
      try {
        planData = JSON.parse(cleanedContent);
        console.log('✅ Successfully parsed OpenAI JSON response');
      } catch (firstError) {
        // If first parse fails, try extracting JSON from text
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          planData = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully extracted and parsed JSON from response');
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
      
      res.json({
        success: true,
        data: planData,
        message: 'Travel plan generated successfully'
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Response content (first 500 chars):', response.substring(0, 500));
      res.status(500).json({
        success: false,
        message: 'Failed to parse AI response',
        error: parseError.message,
        rawResponse: response.substring(0, 500) // Include for debugging
      });
    }

  } catch (error) {
    console.error('OpenAI Generate Error:', error);
    
    // If all models fail, return a fallback plan
    if (error.message.includes('model_not_found') || error.message.includes('does not exist') || error.message.includes('quota')) {
      console.log('🔄 All OpenAI models failed, using fallback plan');
      
      const fallbackPlan = {
        id: `fallback-plan-${Date.now()}`,
        title: `${tripData.destination || 'Destination'} Adventure`,
        destination: tripData.destination || 'Unknown Destination',
        duration: tripData.duration || 3,
        budget: {
          total: tripData.budget || 100000,
          currency: tripData.currency || 'JPY',
          breakdown: {
            accommodation: Math.round((tripData.budget || 100000) * 0.4),
            transportation: Math.round((tripData.budget || 100000) * 0.2),
            food: Math.round((tripData.budget || 100000) * 0.25),
            activities: Math.round((tripData.budget || 100000) * 0.1),
            miscellaneous: Math.round((tripData.budget || 100000) * 0.05)
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
                title: 'Arrival',
                description: 'Arrive at your destination',
                location: tripData.destination || 'Destination',
                type: 'transport',
                duration: 120,
                cost: 3000,
                tips: 'Get local transportation pass',
                bookingInfo: 'Book in advance for better prices'
              }
            ]
          }
        ],
        recommendations: {
          restaurants: [
            {
              name: 'Local Restaurant',
              cuisine: 'Local',
              priceRange: '$$',
              location: tripData.destination || 'Destination',
              description: 'Try local cuisine'
            }
          ],
          attractions: [
            {
              name: 'Main Attraction',
              type: 'Sightseeing',
              location: tripData.destination || 'Destination',
              description: 'Must-see attraction',
              bestTime: 'Morning'
            }
          ],
          transportation: [
            {
              type: 'Local Transport',
              description: 'Local transportation options',
              cost: 2000,
              tips: 'Get a day pass for unlimited rides'
            }
          ]
        },
        practicalInfo: {
          weather: 'Check local weather forecast',
          packingList: ['Clothes', 'Passport', 'Camera', 'Charger'],
          localCustoms: ['Respect local traditions', 'Learn basic phrases'],
          emergencyContacts: ['Police: 110', 'Ambulance: 119'],
          usefulPhrases: ['Hello', 'Thank you', 'Excuse me']
        }
      };
      
      res.json({
        success: true,
        data: fallbackPlan,
        message: 'Travel plan generated using fallback (OpenAI models not available)',
        isFallback: true
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate travel plan',
        error: error.message
      });
    }
  }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, language = 'ja', context = 'travel_japan', conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('🔄 OpenAI API key not configured, using fallback response');
      
      const fallbackResponses = {
        ja: '申し訳ございませんが、現在AIサービスが一時的に利用できません。基本的な日本旅行情報についてお答えできます。緊急連絡先: 警察110、消防・救急119、観光ホットライン050-3816-2787',
        en: 'Sorry, AI service is temporarily unavailable. I can provide basic Japan travel information. Emergency contacts: Police 110, Fire/Ambulance 119, Tourist Hotline 050-3816-2787',
        zh: '抱歉，AI服务暂时不可用。我可以提供基本的日本旅游信息。紧急联系方式：警察110、消防/救护车119、旅游热线050-3816-2787',
        ko: '죄송합니다. AI 서비스가 일시적으로 사용할 수 없습니다. 기본적인 일본 여행 정보를 제공할 수 있습니다. 긴급 연락처: 경찰 110, 소방/응급 119, 관광 핫라인 050-3816-2787'
      };
      
      return res.json({
        success: true,
        response: fallbackResponses[language] || fallbackResponses.ja,
        language,
        isMockData: true,
        message: 'OpenAI API key not configured'
      });
    }

    // Create system prompt based on context and language
    const systemPrompts = {
      travel_japan: {
        ja: 'あなたは日本の旅行専門家です。日本の観光地、文化、交通、食事、宿泊について詳しく案内できます。',
        en: 'You are a Japan travel expert. You can provide detailed guidance about Japanese tourist destinations, culture, transportation, food, and accommodation.',
        zh: '您是日本旅游专家。您可以提供关于日本旅游景点、文化、交通、美食和住宿的详细指导。',
        ko: '당신은 일본 여행 전문가입니다. 일본의 관광지, 문화, 교통, 음식, 숙박에 대해 자세히 안내할 수 있습니다.'
      }
    };

    const systemPrompt = systemPrompts[context]?.[language] || systemPrompts.travel_japan[language] || systemPrompts.travel_japan.ja;

    // Build messages array with conversation history
    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    // Try different models in order of preference
    const models = ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"];
    let completion;
    let lastError;

    for (const model of models) {
      try {
        console.log(`🤖 Chat trying model: ${model}`);
        completion = await openai.chat.completions.create({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        });
        console.log(`✅ Chat successfully used model: ${model}`);
        break;
      } catch (error) {
        console.log(`❌ Chat model ${model} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!completion) {
      throw lastError || new Error('All chat models failed');
    }

    const response = completion.choices[0].message.content;
    
    res.json({
      success: true,
      response,
      language,
      message: 'Chat response generated successfully'
    });

  } catch (error) {
    console.error('OpenAI Chat Error:', error);
    
    // Return fallback response for any errors
    const fallbackResponses = {
      ja: '申し訳ございませんが、現在AIサービスが一時的に利用できません。基本的な日本旅行情報についてお答えできます。',
      en: 'Sorry, AI service is temporarily unavailable. I can provide basic Japan travel information.',
      zh: '抱歉，AI服务暂时不可用。我可以提供基本的日本旅游信息。',
      ko: '죄송합니다. AI 서비스가 일시적으로 사용할 수 없습니다. 기본적인 일본 여행 정보를 제공할 수 있습니다.'
    };
    
    const language = req.body?.language || 'ja';
    
    res.json({
      success: true,
      response: fallbackResponses[language] || fallbackResponses.ja,
      language,
      isMockData: true,
      message: 'OpenAI Chat service temporarily unavailable'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'OpenAI service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
