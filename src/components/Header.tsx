import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Settings, LogOut, Globe, Home, Calendar, MapPin, MessageCircle, HelpCircle, Languages, Smartphone, Star, FileText, Shield, Cookie, Users, CreditCard, Bookmark, Share2, BookTemplate as TemplateIcon, Zap, Edit, CheckCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import LanguageSelector from './LanguageSelector';
import { isUserPremium } from '../utils/premiumUtils';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user, userProfile, signOut } = useSupabaseAuth();
  const isAuthenticated = !!user;
  const logout = signOut;
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Helper function to get menu label with translation
  const getMenuLabel = (path: string, fallbackLabel?: string): string => {
    // Convert path to translation key
    const key = path
      .replace(/^\//, '') // Remove leading slash
      .replace(/\//g, '.') // Replace slashes with dots
     .replace(/-/g, ''); // Remove hyphens
    
   // Handle special cases for menu translation keys
   let translationKey = '';
   if (!key) {
     translationKey = 'menu.home';
   } else if (key === 'questionnaire.language') {
     translationKey = 'menu.questionnaire';
   } else if (key === 'supabaseauth.login') {
     translationKey = 'menu.login';
   } else if (key === 'supabaseauth.register') {
     translationKey = 'menu.register';
   } else if (key === 'legal.terms') {
     translationKey = 'menu.terms';
   } else if (key === 'legal.privacy') {
     translationKey = 'menu.privacy';
   } else if (key === 'legal.cookies') {
     translationKey = 'menu.cookies';
   } else {
     translationKey = `menu.${key}`;
   }
   
    const translated = t(translationKey);
    
    // If translation is the same as the key (not found), use fallback
    if (translated === translationKey && fallbackLabel) {
      return fallbackLabel;
    }
    
    return translated;
  };

  const publicPages = [
    { path: '/', key: 'home', icon: Home },
    { path: '/dashboard', key: 'dashboard', icon: Calendar },
    { path: '/questionnaire/language', key: 'questionnaire', icon: Calendar },
    { path: '/checkout', key: 'checkout', icon: CreditCard },
    { path: '/chat', key: 'chat', icon: MessageCircle },
    { path: '/translate', key: 'translate', icon: Languages },
    { path: '/map', key: 'map', icon: MapPin },
    { path: '/templates', key: 'templates', icon: TemplateIcon },
    { path: '/reviews', key: 'reviews', icon: Star },
    { path: '/help', key: 'help', icon: HelpCircle },
    { path: '/offline', key: 'offline', icon: Zap }
  ];

  const protectedPages = [
    { path: '/esim', key: 'esim', icon: Smartphone },
    { path: '/profile', key: 'profile', icon: User },
    { path: '/settings/notifications', key: 'notifications', icon: Settings },
    { path: '/settings/locale', key: 'locale', icon: Globe }
  ];

  const legalPages = [
    { path: '/legal', key: 'legal', icon: FileText },
    { path: '/legal/terms', key: 'terms', icon: FileText },
    { path: '/legal/privacy', key: 'privacy', icon: Shield },
    { path: '/legal/cookies', key: 'cookies', icon: Cookie }
  ];

  const adminPages = [
    { path: '/admin', key: 'admin', icon: Users }
  ];

  const authPages = [
    { path: '/supabase-auth/login', key: 'login', icon: User },
    { path: '/supabase-auth/register', key: 'register', icon: User }
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-40 border-b shadow-sm ${
          location.pathname === '/' 
            ? 'bg-black/20 backdrop-blur-md border-white/20' 
            : 'bg-white/95 backdrop-blur-md border-gray-200'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* ロゴ */}
            <motion.button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                src="/trippin-logo.png" 
                alt="TRIPPIN Logo" 
                className="w-10 h-10 rounded-full shadow-lg"
              />
              <span className={`text-2xl font-bold ${
                location.pathname === '/' 
                  ? 'text-white' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
              }`}>
                TRIPPIN
              </span>
            </motion.button>

            {/* 右側のナビゲーション */}
            <div className="flex items-center space-x-4">
              {/* 言語選択（デスクトップのみ） */}
              <div className="block">
                <LanguageSelector />
              </div>
              
              {/* ハンバーガーメニューボタン */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 transition-colors ${
                  location.pathname === '/' 
                    ? 'text-white hover:text-gray-300' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* サイドバーメニュー */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* オーバーレイ */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* サイドバー */}
            <motion.div
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* サイドバーヘッダー */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="/trippin-logo.png" 
                      alt="TRIPPIN Logo" 
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-xl font-bold">TRIPPIN</span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* ユーザー情報 */}
                {isAuthenticated && user && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-white/80">{user.email}</p>
                        {isUserPremium(userProfile, user) && (
                          <span className="inline-block px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full mt-1 flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{t('auth.premium') || 'プレミアム'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* メニューコンテンツ */}
              <div className="p-6 space-y-6">
                {/* 言語選択（メニュー上部） */}
                <div className="lg:hidden">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{t('menu.languageSelection')}</h3>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <LanguageSelector onLanguageChange={() => setIsMenuOpen(false)} />
                  </div>
                </div>
                
                {/* パブリックページ */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{t('menu.mainPages')}</h3>
                  <div className="space-y-1">
                    {publicPages.map((page) => (
                      <Link
                        key={page.path}
                        to={page.path}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          location.pathname === page.path
                            ? 'text-purple-600 bg-purple-50'
                            : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <page.icon className="w-5 h-5" />
                        <span className="text-sm">{t(`menu.${page.key}`)}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 認証ページ */}
                {!isAuthenticated && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{t('menu.account')}</h3>
                    <div className="space-y-1">
                      {authPages.map((page) => (
                        <Link
                          key={page.path}
                          to={page.path}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === page.path
                              ? 'text-purple-600 bg-purple-50'
                              : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <page.icon className="w-5 h-5" />
                          <span className="text-sm">{t(`menu.${page.key}`)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 認証が必要なページ */}
                {isAuthenticated && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{t('menu.myPages')}</h3>
                    <div className="space-y-1">
                      {protectedPages.map((page) => (
                        <Link
                          key={page.path}
                          to={page.path}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname === page.path
                              ? 'text-purple-600 bg-purple-50'
                              : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <page.icon className="w-5 h-5" />
                          <span className="text-sm">{t(`menu.${page.key}`)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 法的ページ */}
                <div>
                 <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{t('menu.legalInfo')}</h3>
                  <div className="space-y-1">
                    {legalPages.map((page) => (
                      <Link
                        key={page.path}
                        to={page.path}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          location.pathname === page.path
                            ? 'text-purple-600 bg-purple-50'
                            : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <page.icon className="w-5 h-5" />
                        <span className="text-sm">{t(`menu.${page.key}`)}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* ユーザーアクション（認証済みユーザーのみ） */}
                {isAuthenticated && user && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5" />
                        <span className="text-sm">{t('menu.profile')}</span>
                      </Link>
                      <button
                        onClick={async () => {
                          setIsMenuOpen(false);
                          try {
                            await logout();
                            // Redirect will happen in signOut function
                          } catch (error) {
                            console.error('Logout error:', error);
                            // Force redirect even if logout fails
                            window.location.href = '/';
                          }
                        }}
                        className="flex items-center space-x-3 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm">{t('menu.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;