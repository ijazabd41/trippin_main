import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Smartphone, Clock, MapPin, CreditCard, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const NotificationSettings: React.FC = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    email: {
      tripReminders: true,
      bookingConfirmations: true,
      paymentNotifications: true,
      promotions: false,
      newsletter: true
    },
    push: {
      tripReminders: true,
      emergencyAlerts: true,
      locationUpdates: false,
      chatMessages: true,
      promotions: false
    },
    sms: {
      emergencyOnly: true,
      bookingConfirmations: false,
      tripReminders: false
    },
    schedule: {
      quietHours: true,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'Asia/Tokyo'
    }
  });

  const handleSave = () => {
    // Save notification settings
    console.log('Saving notification settings:', settings);
  };

  const updateEmailSetting = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      email: { ...settings.email, [key]: value }
    });
  };

  const updatePushSetting = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      push: { ...settings.push, [key]: value }
    });
  };

  const updateSmsSetting = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      sms: { ...settings.sms, [key]: value }
    });
  };

  const updateScheduleSetting = (key: string, value: any) => {
    setSettings({
      ...settings,
      schedule: { ...settings.schedule, [key]: value }
    });
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('settings.notifications.title')}</h1>
          <p className="text-lg text-gray-600">{t('settings.notifications.subtitle')}</p>
        </motion.div>

        <div className="space-y-8">
          {/* Email Notifications */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t('settings.notifications.email.title')}</h2>
                <p className="text-gray-600">{t('settings.notifications.email.description')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.email.tripReminders.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.email.tripReminders.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email.tripReminders}
                  onChange={(e) => updateEmailSetting('tripReminders', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.email.bookingConfirmations.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.email.bookingConfirmations.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email.bookingConfirmations}
                  onChange={(e) => updateEmailSetting('bookingConfirmations', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.email.paymentNotifications.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.email.paymentNotifications.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email.paymentNotifications}
                  onChange={(e) => updateEmailSetting('paymentNotifications', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.email.promotions.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.email.promotions.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email.promotions}
                  onChange={(e) => updateEmailSetting('promotions', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.email.newsletter.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.email.newsletter.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email.newsletter}
                  onChange={(e) => updateEmailSetting('newsletter', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>
            </div>
          </motion.div>

          {/* Push Notifications */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t('settings.notifications.push.title')}</h2>
                <p className="text-gray-600">{t('settings.notifications.push.description')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.push.tripReminders.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.push.tripReminders.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.push.tripReminders}
                  onChange={(e) => updatePushSetting('tripReminders', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.push.emergencyAlerts.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.push.emergencyAlerts.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.push.emergencyAlerts}
                  onChange={(e) => updatePushSetting('emergencyAlerts', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.push.locationUpdates.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.push.locationUpdates.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.push.locationUpdates}
                  onChange={(e) => updatePushSetting('locationUpdates', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.push.chatMessages.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.push.chatMessages.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.push.chatMessages}
                  onChange={(e) => updatePushSetting('chatMessages', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.push.promotions.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.push.promotions.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.push.promotions}
                  onChange={(e) => updatePushSetting('promotions', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>
            </div>
          </motion.div>

          {/* SMS Notifications */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t('settings.notifications.sms.title')}</h2>
                <p className="text-gray-600">{t('settings.notifications.sms.description')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.sms.emergencyOnly.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.sms.emergencyOnly.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sms.emergencyOnly}
                  onChange={(e) => updateSmsSetting('emergencyOnly', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.sms.bookingConfirmations.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.sms.bookingConfirmations.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sms.bookingConfirmations}
                  onChange={(e) => updateSmsSetting('bookingConfirmations', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.sms.tripReminders.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.sms.tripReminders.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sms.tripReminders}
                  onChange={(e) => updateSmsSetting('tripReminders', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>
            </div>
          </motion.div>

          {/* Schedule Settings */}
          <motion.div
            className="bg-white rounded-3xl shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t('settings.notifications.schedule.title')}</h2>
                <p className="text-gray-600">{t('settings.notifications.schedule.description')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <label className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800">{t('settings.notifications.schedule.quietHours.title')}</span>
                  <p className="text-sm text-gray-600">{t('settings.notifications.schedule.quietHours.description')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.schedule.quietHours}
                  onChange={(e) => updateScheduleSetting('quietHours', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </label>

              {settings.schedule.quietHours && (
                <div className="grid md:grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.notifications.schedule.startTime')}</label>
                    <input
                      type="time"
                      value={settings.schedule.startTime}
                      onChange={(e) => updateScheduleSetting('startTime', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.notifications.schedule.endTime')}</label>
                    <input
                      type="time"
                      value={settings.schedule.endTime}
                      onChange={(e) => updateScheduleSetting('endTime', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.notifications.schedule.timezone')}</label>
                <select
                  value={settings.schedule.timezone}
                  onChange={(e) => updateScheduleSetting('timezone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Asia/Tokyo">日本標準時 (JST)</option>
                  <option value="America/New_York">東部標準時 (EST)</option>
                  <option value="America/Los_Angeles">太平洋標準時 (PST)</option>
                  <option value="Europe/London">グリニッジ標準時 (GMT)</option>
                  <option value="Asia/Shanghai">中国標準時 (CST)</option>
                  <option value="Asia/Seoul">韓国標準時 (KST)</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Save className="w-5 h-5" />
              <span>{t('settings.notifications.actions.save')}</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;