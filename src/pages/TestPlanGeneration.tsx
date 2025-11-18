import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GeneratedPlanDisplay from '../components/GeneratedPlanDisplay';
import { GeneratedPlan } from '../services/PlanGenerationService';

const TestPlanGeneration: React.FC = () => {
  const [testPlan] = useState<GeneratedPlan>({
    id: 'test-plan-1',
    title: 'Test Tokyo Adventure',
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
      },
      {
        day: 2,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        theme: 'Tokyo Exploration',
        activities: [
          {
            time: '09:00',
            title: 'Visit Senso-ji Temple',
            description: 'Explore the historic Buddhist temple',
            location: 'Asakusa',
            type: 'sightseeing',
            duration: 120,
            cost: 0,
            tips: 'Arrive early to avoid crowds'
          },
          {
            time: '12:00',
            title: 'Lunch at Tsukiji Fish Market',
            description: 'Fresh sushi and seafood',
            location: 'Tsukiji',
            type: 'dining',
            duration: 90,
            cost: 2500,
            tips: 'Try the tuna sashimi'
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
        },
        {
          name: 'Ramen Street',
          cuisine: 'Ramen',
          priceRange: '$',
          location: 'Tokyo Station',
          description: 'Various ramen shops'
        }
      ],
      attractions: [
        {
          name: 'Senso-ji Temple',
          type: 'Temple',
          location: 'Asakusa',
          description: 'Historic Buddhist temple',
          bestTime: 'Morning'
        },
        {
          name: 'Tokyo Skytree',
          type: 'Observation Deck',
          location: 'Sumida',
          description: 'Tallest structure in Japan',
          bestTime: 'Evening'
        }
      ],
      transportation: [
        {
          type: 'JR Pass',
          description: 'Unlimited train travel',
          cost: 30000,
          tips: 'Buy before arriving in Japan'
        },
        {
          type: 'Tokyo Metro',
          description: 'City subway system',
          cost: 200,
          tips: 'Get a day pass for unlimited rides'
        }
      ]
    },
    practicalInfo: {
      weather: 'Check local weather forecast before traveling',
      packingList: ['Clothes', 'Passport', 'Camera', 'Charger', 'JR Pass'],
      localCustoms: ['Remove shoes indoors', 'Bow when greeting', 'No tipping required'],
      emergencyContacts: ['Police: 110', 'Ambulance: 119', 'Tourist helpline: 03-3201-3331'],
      usefulPhrases: ['Hello (Konnichiwa)', 'Thank you (Arigato)', 'Excuse me (Sumimasen)', 'Where is...? (Doko desu ka?)']
    },
    createdAt: new Date().toISOString()
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Test Plan Generation</h1>
          <p className="text-lg text-gray-600">This is a test page to verify the plan display component works correctly.</p>
        </motion.div>

        <GeneratedPlanDisplay
          plan={testPlan}
          onSave={() => {
            console.log('Saving plan...');
            alert('Plan saved!');
          }}
          onShare={() => {
            console.log('Sharing plan...');
            alert('Plan shared!');
          }}
          onDownload={() => {
            console.log('Downloading plan...');
            alert('Plan downloaded!');
          }}
        />
      </div>
    </div>
  );
};

export default TestPlanGeneration;



