import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, Save, ArrowLeft, MapPin, Clock, Star } from 'lucide-react';
import { useTrip } from '../contexts/TripContext';
import { useLanguage } from '../contexts/LanguageContext';

const TripEdit: React.FC = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trips, updateTrip } = useTrip();
  const { t } = useLanguage();
  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const foundTrip = trips.find(t => t.id === tripId);
    if (foundTrip) {
      setTrip(foundTrip);
    }
  }, [tripId, trips]);

  const moveActivity = (dayIndex: number, fromIndex: number, toIndex: number) => {
    const newItinerary = [...trip.itinerary];
    const dayActivities = [...newItinerary[dayIndex].activities];

    const [reorderedItem] = dayActivities.splice(fromIndex, 1);
    dayActivities.splice(toIndex, 0, reorderedItem);

    newItinerary[dayIndex].activities = dayActivities;
    setTrip({ ...trip, itinerary: newItinerary });
  };

  const addActivity = async (dayIndex: number) => {
    const newActivity = {
      id: `activity_${Date.now()}`,
      time: '09:00',
      name: '新しいアクティビティ',
      location: '場所を入力',
      type: 'sightseeing',
      description: '説明を入力してください',
      estimatedCost: '0 JPY',
      duration: '60',
      tips: ''
    };

    const newItinerary = [...trip.itinerary];
    newItinerary[dayIndex].activities.push(newActivity);
    setTrip({ ...trip, itinerary: newItinerary });
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const newItinerary = [...trip.itinerary];
    newItinerary[dayIndex].activities.splice(activityIndex, 1);
    setTrip({ ...trip, itinerary: newItinerary });
  };

  const updateActivity = (dayIndex: number, activityIndex: number, field: string, value: string) => {
    const newItinerary = [...trip.itinerary];
    newItinerary[dayIndex].activities[activityIndex][field] = value;
    setTrip({ ...trip, itinerary: newItinerary });
  };

  const saveTrip = async () => {
    setIsLoading(true);
    try {
      await updateTrip(trip.id, trip);
      navigate(`/trip/${trip.id}`);
    } catch (error) {
      console.error('Failed to save trip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'culture': return '⛩️';
      case 'food': return '🍜';
      case 'shopping': return '🛍️';
      case 'transport': return '✈️';
      case 'sightseeing': return '🏙️';
      default: return '📍';
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">旅程を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/trip/${trip.id}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>戻る</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{trip.title} - 編集</h1>
          </div>
          
          <button
            onClick={saveTrip}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{isLoading ? '保存中...' : '保存'}</span>
          </button>
        </div>

        {/* Itinerary Editor */}
        <div className="space-y-6">
          {trip.itinerary?.map((day: any, dayIndex: number) => (
            <motion.div
              key={day.day}
              className="bg-white rounded-3xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: dayIndex * 0.1 }}
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Day {day.day}</h2>
                    <p className="text-blue-100">{day.title}</p>
                  </div>
                  <button
                    onClick={() => addActivity(dayIndex)}
                    className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>追加</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {day.activities?.map((activity: any, activityIndex: number) => (
                  <div
                    key={activity.id || activityIndex}
                    className="mb-4 p-4 border border-gray-200 rounded-xl transition-all hover:shadow-md"
                  >
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center text-xl">
                                    {getActivityIcon(activity.type)}
                                  </div>
                                </div>
                                
                                <div className="flex-1 space-y-3">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                      type="time"
                                      value={activity.time}
                                      onChange={(e) => updateActivity(dayIndex, activityIndex, 'time', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <select
                                      value={activity.type}
                                      onChange={(e) => updateActivity(dayIndex, activityIndex, 'type', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                      <option value="culture">文化・歴史</option>
                                      <option value="food">グルメ</option>
                                      <option value="shopping">ショッピング</option>
                                      <option value="transport">移動</option>
                                      <option value="sightseeing">観光</option>
                                    </select>
                                  </div>
                                  
                                  <input
                                    type="text"
                                    value={activity.name}
                                    onChange={(e) => updateActivity(dayIndex, activityIndex, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold"
                                    placeholder="アクティビティ名"
                                  />
                                  
                                  <input
                                    type="text"
                                    value={activity.location}
                                    onChange={(e) => updateActivity(dayIndex, activityIndex, 'location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="場所"
                                  />
                                  
                                  <textarea
                                    value={activity.description}
                                    onChange={(e) => updateActivity(dayIndex, activityIndex, 'description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="説明"
                                  />
                                  
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                      type="text"
                                      value={activity.estimatedCost}
                                      onChange={(e) => updateActivity(dayIndex, activityIndex, 'estimatedCost', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      placeholder="予算"
                                    />
                                    <input
                                      type="text"
                                      value={activity.duration}
                                      onChange={(e) => updateActivity(dayIndex, activityIndex, 'duration', e.target.value)}
                                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      placeholder="所要時間（分）"
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={() => removeActivity(dayIndex, activityIndex)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
      </div>
    </div>
  );
};

export default TripEdit;