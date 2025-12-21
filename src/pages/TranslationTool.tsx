import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Camera, Upload, Mic, Volume2, Copy, X, Loader, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiCall, API_CONFIG, APIError } from '../config/api';
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';
import { handleAWSError, globalErrorHandler } from '../utils/errorHandler';
import MockDataNotice from '../components/MockDataNotice';

const TranslationTool: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [mode, setMode] = useState<'text' | 'voice' | 'camera'>('text');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('ja');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [autoDetect, setAutoDetect] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const [speechConfidence, setSpeechConfidence] = useState<number | null>(null);
  const [showMockNotice, setShowMockNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const languages = [
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  const detectLanguage = async (text: string) => {
    try {
      const result = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.GOOGLE_TRANSLATE.DETECT,
        {
          method: 'POST',
          body: JSON.stringify({ text })
        }
      );

      if (result.success && result.data) {
        return result.data.language;
      }
    } catch (error) {
      console.error('Language detection error:', error);
    }
    return null;
  };

  const handleTextTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    setShowMockNotice(false);
    setNoticeMessage(null);
    setDetectedLanguage(null);
    
    try {
      let actualSourceLanguage = sourceLanguage;
      
      // Auto-detect language if enabled
      if (autoDetect) {
        const detected = await detectLanguage(inputText);
        if (detected) {
          actualSourceLanguage = detected;
          setDetectedLanguage(detected);
        }
      }
      
      const result = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.GOOGLE_TRANSLATE.TRANSLATE,
        {
          method: 'POST',
          body: JSON.stringify({
            text: inputText,
            sourceLanguage: actualSourceLanguage,
            targetLanguage
          })
        }
      );

      if (result.success && result.data) {
        if (result.isMockData) {
          setShowMockNotice(true);
          setNoticeMessage(result.message || 'Google Translate APIが一時的に利用できないため、基本的な翻訳を表示しています。');
        }
        setTranslatedText(result.data.translatedText);
      } else {
        throw new Error(result.message || '翻訳に失敗しました');
      }
    } catch (error) {
      const apiError = error as APIError;
      globalErrorHandler.handleError(apiError, {
        page: 'TranslationTool',
        action: 'textTranslate',
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      console.error('Translation error:', apiError);
      setShowMockNotice(true);
      setNoticeMessage(t('translation.serviceUnavailable'));
        setTranslatedText(t('translation.serviceUnavailable'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageTranslate = async () => {
    if (!imageFile) return;
    
    setIsTranslating(true);
    setShowMockNotice(false);
    setNoticeMessage(null);
    
    try {
      const base64Image = await fileToBase64(imageFile);
      
      const result = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.GOOGLE_TRANSLATE.IMAGE_TRANSLATE,
        {
          method: 'POST',
          body: JSON.stringify({
            image: base64Image,
            sourceLanguage: autoDetect ? 'auto' : sourceLanguage,
            targetLanguage
          })
        }
      );
      
      if (result.success && result.data) {
        if (result.isMockData) {
          setShowMockNotice(true);
          setNoticeMessage(result.message || 'Google Translate APIが一時的に利用できないため、基本的な翻訳を表示しています。');
        }
        setTranslatedText(result.data.translatedText);
        
        // Update detected language if auto-detect was used
        if (autoDetect && result.data.detectedLanguage) {
          setDetectedLanguage(result.data.detectedLanguage);
        }
      } else {
        throw new Error(result.message || '画像翻訳に失敗しました');
      }
    } catch (error) {
      const apiError = error as APIError;
      globalErrorHandler.handleError(apiError, {
        page: 'TranslationTool',
        action: 'imageTranslate',
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      console.error('Image translation error:', apiError);
      setShowMockNotice(true);
      setNoticeMessage(t('translation.imageServiceUnavailable'));
        setTranslatedText(t('translation.imageServiceUnavailable'));
    } finally {
      setIsTranslating(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  // Speech-to-Text functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Use WebM format which is supported by Google Speech-to-Text
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        await processAudioToText(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingText(t('translation.listening'));
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingText(t('translation.microphoneError'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingText(t('translation.processingAudio'));
    }
  };

  const processAudioToText = async (audioBlob: Blob) => {
    try {
      // Convert audio to base64
      const base64Audio = await fileToBase64(audioBlob);
      
      setRecordingText(t('translation.processingSpeech'));
      
      // Call Google Speech-to-Text API
      const result = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.GOOGLE_TRANSLATE.SPEECH_TO_TEXT,
        {
          method: 'POST',
          body: JSON.stringify({
            audio: base64Audio,
            language: getLanguageCode(sourceLanguage)
          })
        }
      );
      
      if (result.success && result.data) {
        if (result.isMockData) {
          setShowMockNotice(true);
          setNoticeMessage(result.message || 'Google Speech-to-Text APIが一時的に利用できないため、基本的な機能を表示しています。');
        }
        setRecordingText(result.data.transcript);
        setSpeechConfidence(result.data.confidence);
      } else {
        throw new Error(result.message || '音声認識に失敗しました');
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      setRecordingText(t('translation.audioProcessingError'));
      setShowMockNotice(true);
      setNoticeMessage(t('translation.speechServiceUnavailable'));
    }
  };

  // Text-to-Speech functionality
  const speakText = (text: string, language: string) => {
    if (speechSynthesisRef.current) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode(language);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
    };

    speechSynthesisRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const getLanguageCode = (languageCode: string): string => {
    const languageMap: { [key: string]: string } = {
      'ja': 'ja-JP',
      'en': 'en-US',
      'zh': 'zh-CN',
      'ko': 'ko-KR',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ru': 'ru-RU',
      'ar': 'ar-SA',
      'hi': 'hi-IN'
    };
    return languageMap[languageCode] || 'en-US';
  };

  const handleVoiceTranslate = async () => {
    if (!recordingText.trim()) {
      setRecordingText(t('translation.pleaseRecordFirst'));
      return;
    }

    setIsTranslating(true);
    setShowMockNotice(false);
    setNoticeMessage(null);
    
    try {
      let actualSourceLanguage = sourceLanguage;
      
      // Auto-detect language if enabled
      if (autoDetect) {
        const detected = await detectLanguage(recordingText);
        if (detected) {
          actualSourceLanguage = detected;
          setDetectedLanguage(detected);
        }
      }
      
      const result = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.GOOGLE_TRANSLATE.TRANSLATE,
        {
          method: 'POST',
          body: JSON.stringify({
            text: recordingText,
            sourceLanguage: actualSourceLanguage,
            targetLanguage
          })
        }
      );

      if (result.success && result.data) {
        if (result.isMockData) {
          setShowMockNotice(true);
          setNoticeMessage(result.message || 'Google Translate APIが一時的に利用できないため、基本的な翻訳を表示しています。');
        }
        setTranslatedText(result.data.translatedText);
      } else {
        throw new Error(result.message || '翻訳に失敗しました');
      }
    } catch (error) {
      const apiError = error as APIError;
      globalErrorHandler.handleError(apiError, {
        page: 'TranslationTool',
        action: 'voiceTranslate',
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      console.error('Voice translation error:', apiError);
      setShowMockNotice(true);
      setNoticeMessage(t('translation.voiceServiceUnavailable'));
        setTranslatedText(t('translation.voiceServiceUnavailable'));
    } finally {
      setIsTranslating(false);
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('translation.title')}</h1>
          <p className="text-lg text-gray-600">{t('translation.subtitle')}</p>
        </motion.div>

        {/* Mock Data Notice */}
        {showMockNotice && noticeMessage && (
          <MockDataNotice 
            message={noticeMessage}
            onRetry={() => setShowMockNotice(false)}
            className="max-w-4xl mx-auto mb-4"
          />
        )}

        {/* Mode Selection */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setMode('text')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                mode === 'text'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
              }`}
            >
              <Languages className="w-5 h-5" />
              <span>{t('translation.textTranslation')}</span>
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                mode === 'voice'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>{t('translation.voiceTranslation')}</span>
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                mode === 'camera'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>{t('translation.imageTranslation')}</span>
            </button>
          </div>
        </motion.div>

        {/* Language Selection */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid md:grid-cols-3 gap-4 items-center">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">{t('translation.sourceLanguage')}</label>
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoDetect}
                    onChange={(e) => {
                      setAutoDetect(e.target.checked);
                      if (e.target.checked) {
                        setDetectedLanguage(null);
                      }
                    }}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>{t('translation.autoDetect')}</span>
                </label>
              </div>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                disabled={autoDetect}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  autoDetect ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              {detectedLanguage && (
                <p className="mt-2 text-sm text-green-600">
                  {t('translation.detected')} {languages.find(l => l.code === detectedLanguage)?.name || detectedLanguage}
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={swapLanguages}
                className="p-3 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                title="Swap languages"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <span className="text-xs text-gray-500">{t('translation.swap')}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('translation.targetLanguage')}</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Translation Interface */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {mode === 'text' && (
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-6 border-r border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('translation.inputText')}</h3>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('translation.inputPlaceholder')}
                  className="w-full h-40 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={handleTextTranslate}
                  disabled={!inputText.trim() || isTranslating}
                  className="mt-4 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {isTranslating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>{t('translation.translating')}</span>
                    </>
                  ) : (
                    <>
                      <Languages className="w-5 h-5" />
                      <span>{t('translation.translate')}</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{t('translation.translationResult')}</h3>
                  {translatedText && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => speakText(translatedText, targetLanguage)}
                        disabled={isPlaying}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                        title={t('translation.playTranslation')}
                      >
                        {isPlaying ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={stopSpeaking}
                        disabled={!isPlaying}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title={t('translation.stopSpeaking')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
                        title={t('translation.copyToClipboard')}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="h-40 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl overflow-y-auto">
                  {translatedText ? (
                    <p className="whitespace-pre-wrap">{translatedText}</p>
                  ) : (
                    <p className="text-gray-500">{t('translation.resultPlaceholder')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {mode === 'camera' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('translation.imageTranslation')}</h3>
              
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-300 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">{t('translation.uploadAndTranslate')}</p>
                  <p className="text-sm text-gray-500">{t('translation.orClickToUpload')}</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Uploaded"
                      className="w-full h-auto rounded-xl border border-gray-300"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setTranslatedText('');
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <button
                    onClick={handleImageTranslate}
                    disabled={isTranslating}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-70"
                  >
                    {isTranslating ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>{t('translation.translating')}</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span>{t('translation.translate')}</span>
                      </>
                    )}
                  </button>
                  
                  {translatedText && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">{t('translation.result')}</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => speakText(translatedText, targetLanguage)}
                            disabled={isPlaying}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                            title={t('translation.playTranslation')}
                          >
                            {isPlaying ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={stopSpeaking}
                            disabled={!isPlaying}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title={t('translation.stopSpeaking')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="whitespace-pre-wrap">{translatedText}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'voice' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">{t('translation.voiceTranslation')}</h3>
              
              <div className="space-y-6">
                {/* Recording Section */}
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className={`w-16 h-16 ${isRecording ? 'text-red-500 animate-pulse' : 'text-purple-600'}`} />
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`px-8 py-4 rounded-xl font-medium transition-all ${
                        isRecording
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isRecording ? t('translation.recordingStop') : t('translation.recordingStart')}
                    </button>
                    
                    <p className="text-gray-600">
                      {isRecording ? t('translation.recording') : t('translation.recordingInstruction')}
                    </p>
                  </div>
                </div>

                {/* Recording Text Display */}
                {recordingText && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">{t('translation.recordedText')}</h4>
                      {speechConfidence !== null && speechConfidence > 0 && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          speechConfidence > 0.8 ? 'bg-green-100 text-green-700' :
                          speechConfidence > 0.6 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {t('translation.confidence')} {Math.round(speechConfidence * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800">{recordingText}</p>
                  </div>
                )}

                {/* Translation Controls */}
                {recordingText && recordingText !== 'Listening... Speak now' && recordingText !== 'Processing audio...' && !recordingText.includes('Error') && !recordingText.includes('not yet implemented') && (
                  <div className="space-y-4">
                    <button
                      onClick={handleVoiceTranslate}
                      disabled={isTranslating}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                    >
                      {isTranslating ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Translating...</span>
                        </>
                      ) : (
                        <>
                          <Languages className="w-5 h-5" />
                          <span>{t('translation.translateVoice')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Translation Result with TTS */}
                {translatedText && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">{t('translation.translationResultLabel')}</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => speakText(translatedText, targetLanguage)}
                          disabled={isPlaying}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                          title={t('translation.playTranslation')}
                        >
                          {isPlaying ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={stopSpeaking}
                          disabled={!isPlaying}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title={t('translation.stopSpeaking')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-800">{translatedText}</p>
                  </div>
                )}

                {/* Instructions */}
                <div className="text-center text-sm text-gray-500">
                  <p>💡 <strong>{t('translation.howToUse')}</strong></p>
                  <p>{t('translation.step1')}</p>
                  <p>{t('translation.step2')}</p>
                  <p>{t('translation.step3')}</p>
                  <p>{t('translation.step4')}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TranslationTool;