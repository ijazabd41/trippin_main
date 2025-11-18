import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, Activity, Eye, Settings, Download, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    revenue: 0,
    trips: 0,
    esimSales: 0,
    conversionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock admin dashboard data
      const mockStats = {
        totalUsers: 12543,
        activeUsers: 8921,
        revenue: 2847500,
        trips: 5632,
        esimSales: 3421,
        conversionRate: 23.4
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">管理データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">管理者ダッシュボード</h1>
          <p className="text-lg text-gray-600">TRIPPINサービスの運営状況</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+12.5%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</h3>
            <p className="text-gray-600">総ユーザー数</p>
          </motion.div>

          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+8.3%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.activeUsers.toLocaleString()}</h3>
            <p className="text-gray-600">アクティブユーザー</p>
          </motion.div>

          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+15.7%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">¥{stats.revenue.toLocaleString()}</h3>
            <p className="text-gray-600">月間売上</p>
          </motion.div>

          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+22.1%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.trips.toLocaleString()}</h3>
            <p className="text-gray-600">作成された旅程</p>
          </motion.div>

          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+18.9%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.esimSales.toLocaleString()}</h3>
            <p className="text-gray-600">eSIM販売数</p>
          </motion.div>

          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+5.2%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.conversionRate}%</h3>
            <p className="text-gray-600">コンバージョン率</p>
          </motion.div>
        </div>

        {/* Management Actions */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* System Management */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">システム管理</h2>
            
            <div className="space-y-4">
              <button className="w-full flex items-center space-x-3 p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors">
                <Settings className="w-5 h-5" />
                <span>システム設定</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors">
                <RefreshCw className="w-5 h-5" />
                <span>データ同期</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors">
                <Download className="w-5 h-5" />
                <span>レポート出力</span>
              </button>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">最近のアクティビティ</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">新規ユーザー登録</p>
                  <p className="text-xs text-gray-500">2分前</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">eSIM購入完了</p>
                  <p className="text-xs text-gray-500">5分前</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">旅程生成完了</p>
                  <p className="text-xs text-gray-500">8分前</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;