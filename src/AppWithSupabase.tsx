import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { SupabaseAuthProvider, useSupabaseAuth } from './contexts/SupabaseAuthContext';
import { BackendTripProvider } from './contexts/BackendTripContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Header from './components/Header';

// Lazy load components to avoid initial loading issues
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const QuestionnaireFlow = React.lazy(() => import('./pages/QuestionnaireFlow'));
const PlanGeneration = React.lazy(() => import('./pages/PlanGeneration'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const SupabaseAuthPage = React.lazy(() => import('./pages/SupabaseAuthPage'));
const TripDetail = React.lazy(() => import('./pages/TripDetail'));
const TripEdit = React.lazy(() => import('./pages/TripEdit'));
const ESIMManagement = React.lazy(() => import('./pages/ESIMManagement'));
const ChatBot = React.lazy(() => import('./pages/ChatBot'));
const HelpFAQ = React.lazy(() => import('./pages/HelpFAQ'));
const TranslationTool = React.lazy(() => import('./pages/TranslationTool'));
const MapNavigation = React.lazy(() => import('./pages/MapNavigation'));
const TripShare = React.lazy(() => import('./pages/TripShare'));
const TripTemplates = React.lazy(() => import('./pages/TripTemplates'));
const ReviewsRatings = React.lazy(() => import('./pages/ReviewsRatings'));
const ProfileSettings = React.lazy(() => import('./pages/ProfileSettings'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));
const NotificationSettings = React.lazy(() => import('./pages/NotificationSettings'));
const LocaleSettings = React.lazy(() => import('./pages/LocaleSettings'));
const BookingManagement = React.lazy(() => import('./pages/BookingManagement'));
const LegalPages = React.lazy(() => import('./pages/LegalPages'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const CookiePolicy = React.lazy(() => import('./pages/CookiePolicy'));
const ErrorPages = React.lazy(() => import('./pages/ErrorPages'));
const OfflineSupport = React.lazy(() => import('./pages/OfflineSupport'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

import SEOHead from './components/SEOHead';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import CookieBanner from './components/CookieBanner';

// Loading component
const LoadingSpinner = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
};

// Scroll to top component
const ScrollToTop: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return null;
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useSupabaseAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return user ? <>{children}</> : <Navigate to="/supabase-auth/login" />;
};

// Component to conditionally render header and padding
const ConditionalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Always show header now
  const isQuestionnairePage = false;
  
  return (
    <>
      <Header />
      <div className="pt-16">
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <LanguageProvider>
        <Router>
          <SupabaseAuthProvider>
            <BackendTripProvider>
              <NotificationProvider>
                <ScrollToTop />
                <SEOHead />
                <ConditionalLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/auth/*" element={<AuthPage />} />
                      <Route path="/supabase-auth/*" element={<SupabaseAuthPage />} />
                      <Route path="/questionnaire/*" element={<QuestionnaireFlow />} />
                      <Route path="/plan-generation" element={<PlanGeneration />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/payment-success" element={<PaymentSuccess />} />
                      <Route path="/legal" element={<LegalPages />} />
                      <Route path="/legal/terms" element={<TermsOfService />} />
                      <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                      <Route path="/legal/cookies" element={<CookiePolicy />} />
                      <Route path="/help" element={<HelpFAQ />} />
                      <Route path="/chat" element={<ChatBot />} />
                      <Route path="/translate" element={<TranslationTool />} />
                      <Route path="/map" element={<MapNavigation />} />
                      <Route path="/templates" element={<TripTemplates />} />
                      <Route path="/reviews" element={<ReviewsRatings />} />
                      <Route path="/offline" element={<OfflineSupport />} />

                      {/* Protected Routes */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } />

                      <Route path="/trip/:tripId" element={
                        <ProtectedRoute>
                          <TripDetail />
                        </ProtectedRoute>
                      } />

                      <Route path="/esim" element={
                        <ProtectedRoute>
                          <ESIMManagement />
                        </ProtectedRoute>
                      } />
                      <Route path="/share/:shareId" element={<TripShare />} />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <ProfileSettings />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings/notifications" element={
                        <ProtectedRoute>
                          <NotificationSettings />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings/locale" element={
                        <ProtectedRoute>
                          <LocaleSettings />
                        </ProtectedRoute>
                      } />
                      <Route path="/bookings" element={
                        <ProtectedRoute>
                          <BookingManagement />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin" element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } />
                      
                      {/* Error Routes */}
                      <Route path="/404" element={<ErrorPages type="404" />} />
                      <Route path="/500" element={<ErrorPages type="500" />} />
                      <Route path="/503" element={<ErrorPages type="503" />} />
                      <Route path="*" element={<ErrorPages type="404" />} />
                    </Routes>
                  </Suspense>
                </ConditionalLayout>
                <PWAInstallPrompt />
                <CookieBanner />
              </NotificationProvider>
            </BackendTripProvider>
          </SupabaseAuthProvider>
        </Router>
      </LanguageProvider>
    </div>
  );
}

export default App;
