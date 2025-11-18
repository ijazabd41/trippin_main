import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Download, Facebook, Twitter, Instagram, Link, QrCode } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TripShare: React.FC = () => {
  const { t } = useLanguage();
  const [shareUrl, setShareUrl] = useState('https://trippin.app/share/spring-sakura-2024');
  const [isSharing, setIsSharing] = useState(false);

  const mockTrip = {
    id: 'spring-sakura-2024',
    title: '春の桜旅',
    destination: '東京・京都',
    duration: '5日間',
    budget: '¥150,000',
    highlights: ['浅草寺', '清水寺', '嵐山', '東京スカイツリー'],
    image: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg'
  };

  const shareOptions = [
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', url: `https://facebook.com/sharer/sharer.php?u=${shareUrl}` },
    { name: 'Twitter', icon: Twitter, color: 'bg-sky-500', url: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${mockTrip.title}` },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-600', url: '#' },
    { name: 'LINE', icon: Share2, color: 'bg-green-500', url: `https://line.me/R/msg/text/?${shareUrl}` }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    // Show success message
  };

  const generateQRCode = () => {
    // Generate QR code for the share URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
  };

  const downloadItinerary = () => {
    // Generate and download PDF
    setIsSharing(true);
    setTimeout(() => {
      setIsSharing(false);
      // Simulate download
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">旅程シェア</h1>
          <p className="text-lg text-gray-600">あなたの素晴らしい旅程を友達と共有しよう</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Trip Preview */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div
              className="h-48 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${mockTrip.image})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">{mockTrip.title}</h2>
                <p className="text-lg">{mockTrip.destination}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{mockTrip.duration}</div>
                  <div className="text-sm text-gray-600">期間</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mockTrip.budget}</div>
                  <div className="text-sm text-gray-600">予算</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">ハイライト</h3>
                <div className="flex flex-wrap gap-2">
                  {mockTrip.highlights.map((highlight, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={downloadItinerary}
                disabled={isSharing}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                <span>{isSharing ? 'ダウンロード中...' : 'PDFダウンロード'}</span>
              </button>
            </div>
          </motion.div>

          {/* Share Options */}
          <div className="space-y-6">
            {/* Share URL */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">シェアリンク</h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* Social Media Share */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">SNSでシェア</h3>
              <div className="grid grid-cols-2 gap-4">
                {shareOptions.map((option, index) => (
                  <motion.a
                    key={option.name}
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center space-x-2 ${option.color} text-white py-3 rounded-xl hover:opacity-90 transition-opacity`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <option.icon className="w-5 h-5" />
                    <span>{option.name}</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* QR Code */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">QRコード</h3>
              <div className="text-center">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <img
                    src={generateQRCode()}
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  QRコードをスキャンして旅程を表示
                </p>
              </div>
            </motion.div>

            {/* Privacy Settings */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">プライバシー設定</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input type="radio" name="privacy" value="public" defaultChecked className="text-purple-600" />
                  <span>公開 - 誰でも閲覧可能</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="radio" name="privacy" value="friends" className="text-purple-600" />
                  <span>友達のみ - 招待した人のみ</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="radio" name="privacy" value="private" className="text-purple-600" />
                  <span>非公開 - 自分のみ</span>
                </label>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripShare;