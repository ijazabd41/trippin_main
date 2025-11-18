import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Download,
  Share2,
  Heart,
  Navigation,
  Utensils,
  Camera,
  ShoppingBag,
  Wifi,
  Phone,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { GeneratedPlan } from '../services/PlanGenerationService';
import { formatCurrency } from '../utils/currencyFormatter';

interface GeneratedPlanDisplayProps {
  plan: GeneratedPlan;
  onSave?: () => void;
  onDownload?: () => void;
}

const GeneratedPlanDisplay: React.FC<GeneratedPlanDisplayProps> = ({ 
  plan, 
  onSave, 
  onDownload 
}) => {
  // Add null checks and default values
  if (!plan) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">プランが見つかりません</h2>
          <p className="text-gray-600">プランデータが正しく読み込まれませんでした。</p>
        </div>
      </div>
    );
  }
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [activeTab, setActiveTab] = useState<'itinerary' | 'recommendations' | 'practical'>('itinerary');

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };


  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sightseeing': return <Camera className="w-4 h-4" />;
      case 'dining': return <Utensils className="w-4 h-4" />;
      case 'transport': return <Navigation className="w-4 h-4" />;
      case 'accommodation': return <Heart className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Plan Header */}
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{plan.title}</h1>
            <div className="flex items-center space-x-6 text-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>{plan.destination}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>{plan.duration}日間</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>{formatCurrency(plan.budget?.total || 0, plan.budget?.currency || 'JPY')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <motion.button
              onClick={onSave}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Save Plan"
            >
              <Heart className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={onDownload}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Download Plan"
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Budget Breakdown */}
        {plan.budget?.breakdown && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(plan.budget.breakdown).map(([category, amount]) => (
              <div key={category} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <div className="text-sm opacity-90 capitalize">{category}</div>
                <div className="text-xl font-bold">{formatCurrency(amount, plan.budget?.currency || 'JPY')}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-gray-100 rounded-2xl p-2">
        {[
          { id: 'itinerary', label: '日程', icon: Calendar },
          { id: 'recommendations', label: 'おすすめ', icon: Star },
          { id: 'practical', label: '実用情報', icon: Info }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all ${
              activeTab === id
                ? 'bg-white shadow-lg text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'itinerary' && (
          <motion.div
            key="itinerary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {plan.itinerary?.map((day, index) => (
              <motion.div
                key={day.day}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => toggleDay(day.day)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        第{day.day}日 - {day.theme}
                      </h3>
                      <p className="text-gray-600 mt-1">{day.date}</p>
                    </div>
                    {expandedDays.has(day.day) ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedDays.has(day.day) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-6 space-y-4">
                        {day.activities.map((activity, activityIndex) => (
                          <motion.div
                            key={activityIndex}
                            className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: activityIndex * 0.1 }}
                          >
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-800">{activity.title}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{activity.time}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>{formatCurrency(activity.cost, plan.budget?.currency || 'JPY')}</span>
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-600 mb-2">{activity.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{activity.location}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{activity.duration}分</span>
                                </span>
                              </div>
                              {activity.tips && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                  <p className="text-sm text-yellow-800">💡 {activity.tips}</p>
                                </div>
                              )}
                              {activity.bookingInfo && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                  <p className="text-sm text-blue-800">📋 {activity.bookingInfo}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'recommendations' && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Restaurants */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <Utensils className="w-6 h-6 text-red-500" />
                <span>おすすめレストラン</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {plan.recommendations?.restaurants?.map((restaurant, index) => (
                  <motion.div
                    key={index}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <h4 className="font-semibold text-gray-800">{restaurant.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine} • {restaurant.priceRange}</p>
                    <p className="text-gray-600 text-sm">{restaurant.description}</p>
                    <p className="text-blue-600 text-sm mt-2">📍 {restaurant.location}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Attractions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <Camera className="w-6 h-6 text-green-500" />
                <span>観光スポット</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {plan.recommendations?.attractions?.map((attraction, index) => (
                  <motion.div
                    key={index}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <h4 className="font-semibold text-gray-800">{attraction.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{attraction.type}</p>
                    <p className="text-gray-600 text-sm mb-2">{attraction.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">📍 {attraction.location}</span>
                      <span className="text-green-600">⏰ {attraction.bestTime}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Transportation */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <Navigation className="w-6 h-6 text-blue-500" />
                <span>交通手段</span>
              </h3>
              <div className="space-y-4">
                {plan.recommendations?.transportation?.map((transport, index) => (
                  <motion.div
                    key={index}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{transport.type}</h4>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(transport.cost, plan.budget?.currency || 'JPY')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{transport.description}</p>
                    <p className="text-blue-600 text-sm">💡 {transport.tips}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'practical' && (
          <motion.div
            key="practical"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Weather */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Info className="w-6 h-6 text-blue-500" />
                <span>天候情報</span>
              </h3>
              <p className="text-gray-600">{plan.practicalInfo.weather}</p>
            </div>

            {/* Packing List */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <ShoppingBag className="w-6 h-6 text-purple-500" />
                <span>持参品リスト</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                {plan.practicalInfo.packingList.map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Local Customs */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Heart className="w-6 h-6 text-red-500" />
                <span>現地のマナー</span>
              </h3>
              <div className="space-y-2">
                {plan.practicalInfo?.localCustoms?.map((custom, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <span className="text-gray-700">{custom}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Phone className="w-6 h-6 text-red-500" />
                <span>緊急連絡先</span>
              </h3>
              <div className="space-y-2">
                {plan.practicalInfo?.emergencyContacts?.map((contact, index) => (
                  <motion.div
                    key={index}
                    className="p-3 bg-red-50 rounded-lg border border-red-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-red-800 font-medium">{contact}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Useful Phrases */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <Wifi className="w-6 h-6 text-green-500" />
                <span>便利なフレーズ</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {plan.practicalInfo?.usefulPhrases?.map((phrase, index) => (
                  <motion.div
                    key={index}
                    className="p-3 bg-green-50 rounded-lg border border-green-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-green-800">{phrase}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeneratedPlanDisplay;
