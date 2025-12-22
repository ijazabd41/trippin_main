import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, Trash2, Loader, Crown, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { backendApiCall } from '../config/backend-api';

const ProfileSettings: React.FC = () => {
  const { t } = useLanguage();
  const { user, userProfile, updateProfile, session } = useSupabaseAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    birthDate: '',
    bio: '',
    avatar: user?.avatar || '',
    preferences: {
      newsletter: true,
      notifications: true,
      marketing: false
    }
  });

  // Initialize profile data when user or userProfile changes
  useEffect(() => {
    console.log('ProfileSettings: User/session state changed:', {
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      session: session ? { hasToken: !!session.access_token, tokenPreview: session.access_token?.substring(0, 20) + '...' } : null,
      userProfile: userProfile ? { id: userProfile.id, full_name: userProfile.full_name } : null
    });
    
    if (user) {
      setProfileData({
        name: user.name || userProfile?.full_name || '',
        email: user.email || '',
        phone: userProfile?.phone || '',
        location: userProfile?.nationality || '',
        birthDate: userProfile?.date_of_birth || '',
        bio: userProfile?.bio || '',
        avatar: user.avatar || userProfile?.avatar_url || '',
        preferences: {
          newsletter: userProfile?.newsletter_subscription || true,
          notifications: userProfile?.notifications_enabled || true,
          marketing: userProfile?.marketing_emails || false
        }
      });
    }
  }, [user, userProfile, session]);

  const handleSave = async () => {
    if (!user) {
      setSaveMessage(t('profile.errors.notLoggedIn'));
      return;
    }

    if (!session?.access_token) {
      setSaveMessage(t('profile.errors.noAuthToken'));
      return;
    }

    console.log('Saving profile with token:', session.access_token.substring(0, 20) + '...');
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Prepare the profile update data
      const updateData = {
        full_name: profileData.name,
        phone: profileData.phone,
        nationality: profileData.location,
        date_of_birth: profileData.birthDate,
        bio: profileData.bio,
        avatar: profileData.avatar,
        newsletter_subscription: profileData.preferences.newsletter,
        notifications_enabled: profileData.preferences.notifications,
        marketing_emails: profileData.preferences.marketing
      };

      // Call the backend API to update profile
      const result = await backendApiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      }, session?.access_token);

      if (result.success) {
        // Update the local context
        await updateProfile(updateData);
        setSaveMessage(t('profile.messages.saveSuccess'));
        setIsEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error(result.message || t('profile.errors.saveFailed'));
      }
    } catch (error) {
      console.error('Profile save error:', error);
      setSaveMessage(t('profile.errors.saveFailedRetry'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({ ...profileData, avatar: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('profile.title')}</h1>
          <p className="text-lg text-gray-600">{t('profile.subtitle')}</p>
          
          {/* Save Message */}
          {saveMessage && (
            <motion.div
              className={`mt-4 p-4 rounded-xl ${
                saveMessage === t('profile.messages.saveSuccess')
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {saveMessage}
            </motion.div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profileData.avatar ? (
                    <img
                      src={profileData.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    profileData.name.charAt(0).toUpperCase()
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{profileData.name}</h2>
              <p className="text-gray-600 mb-4">{profileData.email}</p>
              
              {/* Premium Status Badge */}
              {userProfile?.is_premium && (
                <div className="mb-4">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-full px-4 py-2">
                    <Crown className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">{t('profile.premiumBadge')}</span>
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                {isEditing ? t('profile.actions.cancel') : t('profile.actions.edit')}
              </button>
            </div>
          </motion.div>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6">{t('profile.sections.basicInfo')}</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    {t('profile.fields.name')}
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    {t('profile.fields.email')}
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    {t('profile.fields.phone')}
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    {t('profile.fields.location')}
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    {t('profile.fields.birthDate')}
                  </label>
                  <input
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.fields.bio')}
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 resize-none"
                    placeholder={t('profile.fields.bioPlaceholder')}
                  />
                </div>
              </div>
            </motion.div>

            {/* Preferences */}
            <motion.div
              className="bg-white rounded-3xl shadow-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6">{t('profile.sections.settings')}</h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profileData.preferences.newsletter}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      preferences: { ...profileData.preferences, newsletter: e.target.checked }
                    })}
                    disabled={!isEditing}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-700">{t('profile.preferences.newsletter')}</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profileData.preferences.notifications}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      preferences: { ...profileData.preferences, notifications: e.target.checked }
                    })}
                    disabled={!isEditing}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-700">{t('profile.preferences.notifications')}</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profileData.preferences.marketing}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      preferences: { ...profileData.preferences, marketing: e.target.checked }
                    })}
                    disabled={!isEditing}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-700">{t('profile.preferences.marketing')}</span>
                </label>
              </div>
            </motion.div>

            {/* Action Buttons */}
            {isEditing && (
              <motion.div
                className="flex space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>{t('profile.actions.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{t('profile.actions.save')}</span>
                    </>
                  )}
                </button>
                <button className="flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-6 py-3 rounded-xl hover:bg-red-200 transition-colors">
                  <Trash2 className="w-5 h-5" />
                  <span>{t('profile.actions.deleteAccount')}</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;