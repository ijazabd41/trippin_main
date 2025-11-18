// Test data for plan generation
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

// Store test data in localStorage
if (typeof window !== 'undefined') {
  localStorage.setItem('trippin-complete-data', JSON.stringify(testTripData));
  console.log('Test trip data stored in localStorage');
  console.log('Navigate to http://localhost:5173/plan-generation to test');
} else {
  console.log('Test data:', testTripData);
}



