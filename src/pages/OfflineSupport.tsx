import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { WifiOff, Download, FolderSync as Sync, MapPin, Phone, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const OfflineSupport: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [offlineData, setOfflineData] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline data from localStorage
    const savedData = localStorage.getItem('trippin_offline_data');
    if (savedData) {
      setOfflineData(JSON.parse(savedData));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const downloadOfflineData = () => {
    // Simulate downloading offline data
    const offlinePackage = {
      trips: [],
      maps: [],
      emergencyContacts: [],
      translations: {},
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('trippin_offline_data', JSON.stringify(offlinePackage));
    setOfflineData(offlinePackage);
  };

  const syncData = () => {
    // Simulate syncing data when back online
    if (isOnline && syncQueue.length > 0) {
      // Process sync queue
      setSyncQueue([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {isOnline ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-8 h-8 mr-2" />
                  <span className="text-lg font-semibold">{t('online')}</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="w-8 h-8 mr-2" />
                  <span className="text-lg font-semibold">{t('offline')}</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t('offline.title')}
            </h1>
            <p className="text-gray-600">
              {t('offline.subtitle')}
            </p>
          </div>

          {/* Offline Features */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Download Offline Data */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-blue-50 rounded-xl p-6"
            >
              <div className="flex items-center mb-4">
                <Download className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {t('offline.downloadOfflineData')}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {t('offline.downloadOfflineDataDescription')}
              </p>
              <button
                onClick={downloadOfflineData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('offline.download')}
              </button>
            </motion.div>

            {/* Sync Data */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-green-50 rounded-xl p-6"
            >
              <div className="flex items-center mb-4">
                <Sync className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {t('offline.syncData')}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {t('offline.syncDataDescription')}
              </p>
              <button
                onClick={syncData}
                disabled={!isOnline}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                {t('offline.sync')}
              </button>
            </motion.div>
          </div>

          {/* Available Offline Features */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t('offline.availableOfflineFeatures')}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <MapPin className="w-6 h-6 text-indigo-600 mb-2" />
                <h4 className="font-semibold text-gray-800 mb-1">
                  {t('offline.offlineMaps')}
                </h4>
                <p className="text-sm text-gray-600">
                  {t('offline.offlineMapsDescription')}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <FileText className="w-6 h-6 text-indigo-600 mb-2" />
                <h4 className="font-semibold text-gray-800 mb-1">
                  {t('offline.savedItineraries')}
                </h4>
                <p className="text-sm text-gray-600">
                  {t('offline.savedItinerariesDescription')}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <Phone className="w-6 h-6 text-indigo-600 mb-2" />
                <h4 className="font-semibold text-gray-800 mb-1">
                  {t('offline.emergencyContacts')}
                </h4>
                <p className="text-sm text-gray-600">
                  {t('offline.emergencyContactsDescription')}
                </p>
              </div>
            </div>
          </div>

          {/* Sync Queue */}
          {syncQueue.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {t('offline.pendingSync')}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {t('offline.pendingSyncDescription', { count: syncQueue.length })}
              </p>
              <div className="space-y-2">
                {syncQueue.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 text-sm">
                    {item.type}: {item.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline Data Status */}
          {offlineData && (
            <div className="bg-indigo-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('offline.offlineDataStatus')}
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{t('offline.lastUpdated')}:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(offlineData.lastUpdated).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t('offline.dataSize')}:</span>
                  <span className="ml-2 text-gray-600">2.3 MB</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OfflineSupport;