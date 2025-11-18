import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorPagesProps {
  type: '404' | '500' | '503';
}

const ErrorPages: React.FC<ErrorPagesProps> = ({ type }) => {
  const navigate = useNavigate();

  const getErrorContent = () => {
    switch (type) {
      case '404':
        return {
          title: 'ページが見つかりません',
          description: 'お探しのページは存在しないか、移動された可能性があります。',
          icon: '🔍',
          actions: [
            { label: 'ホームに戻る', action: () => navigate('/'), icon: Home },
            { label: '前のページに戻る', action: () => window.history.back(), icon: ArrowLeft }
          ]
        };
      case '500':
        return {
          title: 'サーバーエラー',
          description: 'サーバーで問題が発生しました。しばらくしてからもう一度お試しください。',
          icon: '⚠️',
          actions: [
            { label: 'ページを再読み込み', action: () => window.location.reload(), icon: RefreshCw },
            { label: 'ホームに戻る', action: () => navigate('/'), icon: Home }
          ]
        };
      case '503':
        return {
          title: 'メンテナンス中',
          description: 'サービスは現在メンテナンス中です。しばらくお待ちください。',
          icon: '🔧',
          actions: [
            { label: 'ページを再読み込み', action: () => window.location.reload(), icon: RefreshCw },
            { label: 'ホームに戻る', action: () => navigate('/'), icon: Home }
          ]
        };
      default:
        return {
          title: 'エラーが発生しました',
          description: '予期しないエラーが発生しました。',
          icon: '❌',
          actions: [
            { label: 'ホームに戻る', action: () => navigate('/'), icon: Home }
          ]
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <motion.div
        className="text-center max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="text-8xl mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {errorContent.icon}
        </motion.div>

        <motion.h1
          className="text-4xl font-bold text-gray-800 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {errorContent.title}
        </motion.h1>

        <motion.p
          className="text-lg text-gray-600 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {errorContent.description}
        </motion.p>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {errorContent.actions.map((action, index) => (
            <motion.button
              key={index}
              onClick={action.action}
              className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <action.icon className="w-5 h-5" />
              <span>{action.label}</span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          className="mt-8 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          エラーコード: {type}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ErrorPages;