import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, MessageCircle, Camera, Filter, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Review {
  id: string;
  tripId: string;
  tripTitle: string;
  rating: number;
  title: string;
  content: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
  images: string[];
  tags: string[];
}

const ReviewsRatings: React.FC = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showWriteReview, setShowWriteReview] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [searchQuery, ratingFilter, reviews]);

  const loadReviews = async () => {
    try {
      // Mock review data
      const mockReviews: Review[] = [
        {
          id: 'review_1',
          tripId: 'trip_1',
          tripTitle: t('dashboard.springCherryTrip'),
          rating: 5,
          title: t('reviews.sampleReview1.title') || '最高の桜体験でした！',
          content: t('reviews.sampleReview1.content') || '浅草寺から上野公園まで、桜が満開で本当に美しかったです。特に夜桜のライトアップは感動的でした。',
          author: t('reviews.sampleReview1.author') || 'さくら愛好家',
          date: '2024-04-15',
          likes: 24,
          comments: 8,
          images: [
            'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg',
            'https://images.pexels.com/photos/161251/senso-ji-temple-asakusa-tokyo-japan-161251.jpeg'
          ],
          tags: [t('reviews.tags.cherry'), t('reviews.tags.spring'), t('reviews.tags.tokyo')]
        },
        {
          id: 'review_2',
          tripId: 'trip_2',
          tripTitle: t('dashboard.osakaGourmetTour'),
          rating: 4,
          title: t('reviews.sampleReview2.title') || 'たこ焼きが絶品！',
          content: t('reviews.sampleReview2.content') || '道頓堀のたこ焼き屋さんを巡りました。どこも美味しくて、大阪の食文化を満喫できました。',
          author: t('reviews.sampleReview2.author') || 'グルメ探検家',
          date: '2024-04-10',
          likes: 18,
          comments: 5,
          images: [
            'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg'
          ],
          tags: [t('reviews.tags.gourmet'), t('reviews.tags.osaka'), t('reviews.tags.takoyaki')]
        },
        {
          id: 'review_3',
          tripId: 'trip_3',
          tripTitle: t('reviews.sampleReview3.tripTitle') || '京都文化体験',
          rating: 5,
          title: t('reviews.sampleReview3.title') || '伝統文化に触れる素晴らしい旅',
          content: t('reviews.sampleReview3.content') || '清水寺での朝の参拝、茶道体験、着物レンタルなど、京都の伝統文化を深く体験できました。',
          author: t('reviews.sampleReview3.author') || '文化愛好者',
          date: '2024-04-05',
          likes: 32,
          comments: 12,
          images: [],
          tags: [t('reviews.tags.culture'), t('reviews.tags.kyoto'), t('reviews.tags.tradition')]
        }
      ];
      
      setReviews(mockReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = reviews;

    if (searchQuery) {
      filtered = filtered.filter(review =>
        review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.tripTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(review => review.rating === rating);
    }

    setFilteredReviews(filtered);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const WriteReviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('reviews.writeReviewModal.title')}</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reviews.writeReviewModal.tripTitle')}</label>
            <input
              type="text"
              placeholder={t('reviews.writeReviewModal.tripTitlePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reviews.writeReviewModal.rating')}</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} className="p-1">
                  <Star className="w-8 h-8 text-gray-300 hover:text-yellow-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reviews.writeReviewModal.reviewTitle')}</label>
            <input
              type="text"
              placeholder={t('reviews.writeReviewModal.reviewTitlePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reviews.writeReviewModal.content')}</label>
            <textarea
              rows={6}
              placeholder={t('reviews.writeReviewModal.contentPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reviews.writeReviewModal.addPhotos')}</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('reviews.writeReviewModal.addPhotosDescription')}</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowWriteReview(false)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('reviews.writeReviewModal.cancel')}
            </button>
            <button className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all">
              {t('reviews.writeReviewModal.submit')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('reviews.title')}</h1>
          <p className="text-lg text-gray-600">{t('reviews.subtitle')}</p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('reviews.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">{t('reviews.allRatings')}</option>
              <option value="5">★★★★★ (5)</option>
              <option value="4">★★★★☆ (4)</option>
              <option value="3">★★★☆☆ (3)</option>
              <option value="2">★★☆☆☆ (2)</option>
              <option value="1">★☆☆☆☆ (1)</option>
            </select>
            <button
              onClick={() => setShowWriteReview(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              {t('reviews.writeReview')}
            </button>
          </div>
        </motion.div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{review.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{t('reviews.trip')}: {review.tripTitle}</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-600">{t('reviews.by')} {review.author}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {new Date(review.date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>

              {review.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {review.images.map((image, imageIndex) => (
                    <div
                      key={imageIndex}
                      className="h-32 bg-cover bg-center rounded-xl"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {review.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{review.likes} {t('reviews.likes')}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{review.comments} {t('reviews.comments')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('reviews.noResults')}</h3>
            <p className="text-gray-600">{t('reviews.noResultsDescription')}</p>
          </motion.div>
        )}

        {showWriteReview && <WriteReviewModal />}
      </div>
    </div>
  );
};

export default ReviewsRatings;