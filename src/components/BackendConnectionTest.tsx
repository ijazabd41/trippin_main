import React, { useState, useEffect } from 'react';
import { backendService } from '../services/BackendService';

const BackendConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<{
    isBackendAvailable: boolean;
    useMockData: boolean;
    backendUrl: string;
    lastHealthCheck: number;
  } | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get initial status
    setStatus(backendService.getServiceStatus());
    
    // Check health
    backendService.checkHealth().then(isHealthy => {
      setStatus(backendService.getServiceStatus());
    });
  }, []);

  const runTests = async () => {
    setIsLoading(true);
    try {
      // Test 1: Get trips
      const tripsResult = await backendService.getTrips();
      
      // Test 2: Create a test trip
      const createResult = await backendService.createTrip({
        title: 'Test Trip',
        destination: 'Test City',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: 1000,
        currency: 'USD',
        travelers: 1,
        interests: ['test']
      });

      // Test 3: Get itinerary
      const itineraryResult = await backendService.getItinerary(createResult.data.id);

      setTestResults({
        trips: tripsResult,
        createTrip: createResult,
        itinerary: itineraryResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Backend Connection Test</h2>
      
      {/* Status Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
        {status ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-100 rounded">
              <strong>Backend Available:</strong> 
              <span className={`ml-2 ${status.isBackendAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {status.isBackendAvailable ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="p-3 bg-gray-100 rounded">
              <strong>Using Mock Data:</strong> 
              <span className={`ml-2 ${status.useMockData ? 'text-yellow-600' : 'text-green-600'}`}>
                {status.useMockData ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="p-3 bg-gray-100 rounded">
              <strong>Backend URL:</strong> 
              <span className="ml-2 text-blue-600">{status.backendUrl}</span>
            </div>
            <div className="p-3 bg-gray-100 rounded">
              <strong>Last Health Check:</strong> 
              <span className="ml-2 text-gray-600">
                {new Date(status.lastHealthCheck).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading status...</div>
        )}
      </div>

      {/* Test Button */}
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Running Tests...' : 'Run Backend Tests'}
        </button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Test Results</h3>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600">
        <h4 className="font-semibold mb-2">How to fix connection issues:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Make sure your backend server is running on port 3001</li>
          <li>Check that the backend URL is correct in the configuration</li>
          <li>Verify that CORS is properly configured in your backend</li>
          <li>If backend is not available, the app will use mock data</li>
        </ol>
      </div>
    </div>
  );
};

export default BackendConnectionTest;



