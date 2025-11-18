import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TestDataInjection: React.FC = () => {
  const navigate = useNavigate();

  const injectTestData = () => {
    const testTripData = {
      destination: 'Tokyo, Japan',
      duration: 3,
      budget: 150000,
      travelers: 2,
      interests: ['culture', 'food', 'nature'],
      accommodation: 'hotel',
      startDate: '2024-01-15',
      endDate: '2024-01-18',
      basicInfo: {
        tripTitle: 'Tokyo Adventure',
        travelers: 2,
        startDate: '2024-01-15',
        endDate: '2024-01-18'
      },
      travelStyle: {
        budget: '150000',
        currency: 'JPY',
        interests: ['culture', 'food', 'nature']
      }
    };

    localStorage.setItem('trippin-complete-data', JSON.stringify(testTripData));
    console.log('Test data injected:', testTripData);
    alert('Test data injected! Now navigate to plan generation page.');
  };

  const clearTestData = () => {
    localStorage.removeItem('trippin-complete-data');
    localStorage.removeItem('trippin-generated-plan');
    console.log('Test data cleared');
    alert('Test data cleared!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Test Data Injection</h1>
          <p className="text-lg text-gray-600">Inject test data to test the plan generation page</p>
        </motion.div>

        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Data</h2>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm text-gray-700">
{`{
  destination: 'Tokyo, Japan',
  duration: 3,
  budget: 150000,
  travelers: 2,
  interests: ['culture', 'food', 'nature'],
  accommodation: 'hotel',
  startDate: '2024-01-15',
  endDate: '2024-01-18'
}`}
                </pre>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={injectTestData}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                Inject Test Data
              </button>
              <button
                onClick={clearTestData}
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                Clear Test Data
              </button>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/plan-generation')}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                Go to Plan Generation
              </button>
              <button
                onClick={() => navigate('/test-plan')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Go to Test Plan Display
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p>1. Click "Inject Test Data" to store sample trip data</p>
              <p>2. Click "Go to Plan Generation" to test the plan generation page</p>
              <p>3. The page should now generate a plan based on the test data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDataInjection;



