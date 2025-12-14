import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, MapPin, Users, Heart, Copy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTrip } from '../contexts/TripContext';

interface Template {
  id: string;
  title: string;
  description: string;
  duration: string;
  budget: string;
  destinations: string[];
  rating: number;
  reviews: number;
  likes: number;
  author: string;
  image: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const TripTemplates: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { createTrip } = useTrip();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory, templates]);

  const loadTemplates = async () => {
    try {
      // Mock template data
      const mockTemplates: Template[] = [
        {
          id: 'template_1',
          title: '初心者向け東京3日間',
          description: '東京の定番スポットを効率よく回る初心者におすすめのプラン',
          duration: '3日間',
          budget: '¥80,000',
          destinations: ['浅草', '渋谷', '新宿', '銀座'],
          rating: 4.8,
          reviews: 245,
          likes: 1250,
          author: 'TokyoExplorer',
          image: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg',
          tags: ['初心者', '定番', '都市'],
          difficulty: 'easy'
        },
        {
          id: 'template_2',
          title: '京都の歴史と文化5日間',
          description: '古都京都の寺院と伝統文化を深く体験する文化的な旅',
          duration: '5日間',
          budget: '¥120,000',
          destinations: ['清水寺', '金閣寺', '嵐山', '祇園'],
          rating: 4.9,
          reviews: 189,
          likes: 980,
          author: 'KyotoLover',
          image: 'https://images.pexels.com/photos/161251/senso-ji-temple-asakusa-tokyo-japan-161251.jpeg',
          tags: ['文化', '歴史', '寺院'],
          difficulty: 'medium'
        },
        {
          id: 'template_3',
          title: '大阪グルメツアー2日間',
          description: '大阪の名物グルメを食べ歩く美食の旅',
          duration: '2日間',
          budget: '¥50,000',
          destinations: ['道頓堀', '新世界', '黒門市場', '梅田'],
          rating: 4.7,
          reviews: 156,
          likes: 750,
          author: 'OsakaFoodie',
          image: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg',
          tags: ['グルメ', '食べ歩き', '短期'],
          difficulty: 'easy'
        },
        {
          id: 'template_4',
          title: '北海道自然満喫7日間',
          description: '北海道の雄大な自然と温泉を楽しむリラックス旅行',
          duration: '7日間',
          budget: '¥200,000',
          destinations: ['札幌', '函館', '小樽', '登別'],
          rating: 4.6,
          reviews: 98,
          likes: 520,
          author: 'HokkaidoNature',
          image: 'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg',
          tags: ['自然', '温泉', '長期'],
          difficulty: 'medium'
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template =>
        template.tags.includes(selectedCategory) ||
        template.difficulty === selectedCategory
      );
    }

    setFilteredTemplates(filtered);
  };

  const categories = [
    { key: 'all', label: 'すべて' },
    { key: '初心者', label: '初心者向け' },
    { key: 'グルメ', label: 'グルメ' },
    { key: '文化', label: '文化・歴史' },
    { key: '自然', label: '自然' },
    { key: 'easy', label: '簡単' },
    { key: 'medium', label: '中級' },
    { key: 'hard', label: '上級' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '簡単';
      case 'medium': return '中級';
      case 'hard': return '上級';
      default: return '不明';
    }
  };

  const useTemplate = (template: Template) => {
    // Create trip from template
    const templateTrip = {
      title: template.title,
      destination: template.destinations.join('・'),
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
      endDate: new Date(Date.now() + (7 + parseInt(template.duration)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'planning' as const,
      budget: parseInt(template.budget.replace(/[¥,]/g, '')),
      currency: 'JPY',
      travelers: 2,
      interests: template.tags,
      image: template.image,
      itinerary: [
        {
          day: 1,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          title: `${template.destinations[0]}探索`,
          activities: [
            {
              time: '10:00',
              name: `${template.destinations[0]}観光`,
              location: template.destinations[0],
              type: 'sightseeing',
              description: template.description,
              estimatedCost: '3000 JPY',
              duration: '120',
              rating: template.rating
            }
          ]
        }
      ]
    };

    // Create the trip and navigate to dashboard
    createTrip(templateTrip).then((newTrip) => {
      console.log('Template trip created:', newTrip);
      navigate('/dashboard');
    }).catch((error) => {
      console.error('Failed to create trip from template:', error);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loadingTemplates')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('templates.title')}</h1>
          <p className="text-lg text-gray-600">{t('templates.subtitle')}</p>
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
                placeholder={t('templates.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.key === 'all' ? t('templates.allCategories') :
                   category.key === '初心者' ? t('templates.beginner') :
                   category.key === 'グルメ' ? t('templates.gourmet') :
                   category.key === '文化' ? t('templates.culture') :
                   category.key === '自然' ? t('templates.nature') :
                   category.key === 'easy' ? t('templates.easy') :
                   category.key === 'medium' ? t('templates.medium') :
                   category.key === 'hard' ? t('templates.hard') : category.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div
                className="h-48 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${template.image})` }}
              >
                <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
                  <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer transition-colors" />
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(template.difficulty)}`}>
                    {getDifficultyText(template.difficulty)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{template.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{template.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{template.destinations.length}箇所</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-purple-600">{template.budget}</div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">{template.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({template.reviews})</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Heart className="w-4 h-4" />
                    <span>{template.likes}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => useTemplate(template)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium"
                  >
                    {t('templates.useTemplate')}
                  </button>
                  <button className="p-2 text-gray-500 hover:text-purple-600 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  {t('templates.author')}: {template.author}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('templates.noResults')}</h3>
            <p className="text-gray-600">{t('templates.noResultsDescription')}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TripTemplates;