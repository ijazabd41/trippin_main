import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Google Translate API configuration
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

// Check if Google Translate API key is configured
if (!GOOGLE_TRANSLATE_API_KEY) {
  console.warn('⚠️  GOOGLE_TRANSLATE_API_KEY environment variable is not set');
  console.warn('   Google Translate features will not work. Please configure your Google Translate API key.');
}

// Text translation endpoint
router.post('/translate', async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    if (!sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Source and target languages are required'
      });
    }

    // Check if Google Translate API key is configured
    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.log('🔄 Google Translate API key not configured, using fallback translation');
      
      // Enhanced fallback translation with basic pattern matching
      const fallbackTranslations = {
        'ja-en': {
          'こんにちは': 'Hello',
          'ありがとう': 'Thank you',
          'すみません': 'Excuse me',
          'はい': 'Yes',
          'いいえ': 'No',
          'おはよう': 'Good morning',
          'こんばんは': 'Good evening',
          'さようなら': 'Goodbye',
          'こんにちは、元気ですか？': 'Hello, how are you?',
          'ありがとうございます': 'Thank you very much',
          'すみません、英語を話せますか？': 'Excuse me, do you speak English?'
        },
        'en-ja': {
          'Hello': 'こんにちは',
          'Thank you': 'ありがとう',
          'Excuse me': 'すみません',
          'Yes': 'はい',
          'No': 'いいえ',
          'Good morning': 'おはよう',
          'Good evening': 'こんばんは',
          'Goodbye': 'さようなら',
          'How are you?': '元気ですか？',
          'Thank you very much': 'ありがとうございます',
          'Do you speak English?': '英語を話せますか？'
        },
        'en-es': {
          'Hello': 'Hola',
          'Thank you': 'Gracias',
          'Yes': 'Sí',
          'No': 'No',
          'Good morning': 'Buenos días',
          'Good evening': 'Buenas tardes',
          'Goodbye': 'Adiós'
        },
        'es-en': {
          'Hola': 'Hello',
          'Gracias': 'Thank you',
          'Sí': 'Yes',
          'No': 'No',
          'Buenos días': 'Good morning',
          'Buenas tardes': 'Good evening',
          'Adiós': 'Goodbye'
        }
      };
      
      const key = `${sourceLanguage}-${targetLanguage}`;
      const fallback = fallbackTranslations[key] || {};
      let translatedText = fallback[text];
      
      if (!translatedText) {
        // If no exact match, try to provide a more helpful message
        const languageNames = {
          'ja': 'Japanese',
          'en': 'English',
          'es': 'Spanish',
          'fr': 'French',
          'de': 'German',
          'it': 'Italian',
          'pt': 'Portuguese',
          'ru': 'Russian',
          'zh': 'Chinese',
          'ko': 'Korean',
          'ar': 'Arabic',
          'hi': 'Hindi'
        };
        
        const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
        const targetLangName = languageNames[targetLanguage] || targetLanguage;
        
        translatedText = `⚠️ Google Translate API not configured\n\nTo enable full translation:\n1. Get a Google Translate API key\n2. Add GOOGLE_TRANSLATE_API_KEY to your .env file\n3. Restart the server\n\nText: "${text}"\nFrom: ${sourceLangName}\nTo: ${targetLangName}`;
      }
      
      return res.json({
        success: true,
        data: {
          translatedText,
          detectedSourceLanguage: sourceLanguage,
          sourceLanguage,
          targetLanguage
        },
        isMockData: true,
        message: 'Google Translate API not configured, showing basic translation'
      });
    }

    // Build Google Translate API request
    const params = new URLSearchParams({
      key: GOOGLE_TRANSLATE_API_KEY,
      q: text,
      source: sourceLanguage,
      target: targetLanguage,
      format: 'text'
    });

    const url = `${GOOGLE_TRANSLATE_API_URL}?${params}`;
    console.log('🔍 Google Translate API Request:', url.replace(GOOGLE_TRANSLATE_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();

    if (data.error) {
      console.error('Google Translate API Error:', data.error);
      throw new Error(`Google Translate API error: ${data.error.message}`);
    }

    if (!data.data || !data.data.translations || data.data.translations.length === 0) {
      throw new Error('No translation result received');
    }

    const translation = data.data.translations[0];

    res.json({
      success: true,
      data: {
        translatedText: translation.translatedText,
        detectedSourceLanguage: translation.detectedSourceLanguage || sourceLanguage,
        sourceLanguage,
        targetLanguage
      },
      isMockData: false
    });

  } catch (error) {
    console.error('Google Translate API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate text',
      error: error.message
    });
  }
});

// Detect language endpoint
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    // Check if Google Translate API key is configured
    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.log('🔄 Google Translate API key not configured, using fallback detection');
      
      // Simple language detection based on character patterns
      const detectLanguage = (text) => {
        if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
          return 'ja'; // Japanese or Chinese characters
        }
        if (/[\u4E00-\u9FAF]/.test(text)) {
          return 'zh'; // Chinese characters
        }
        if (/[\uAC00-\uD7AF]/.test(text)) {
          return 'ko'; // Korean characters
        }
        if (/[\u0600-\u06FF]/.test(text)) {
          return 'ar'; // Arabic characters
        }
        if (/[\u0400-\u04FF]/.test(text)) {
          return 'ru'; // Cyrillic characters
        }
        return 'en'; // Default to English
      };
      
      const detectedLanguage = detectLanguage(text);
      
      return res.json({
        success: true,
        data: {
          language: detectedLanguage,
          confidence: 0.7
        },
        isMockData: true,
        message: 'Google Translate API not configured, using basic detection'
      });
    }

    // Build Google Translate API request for language detection
    const params = new URLSearchParams({
      key: GOOGLE_TRANSLATE_API_KEY,
      q: text
    });

    const url = `${GOOGLE_TRANSLATE_API_URL}/detect?${params}`;
    console.log('🔍 Google Translate Detect API Request:', url.replace(GOOGLE_TRANSLATE_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();

    if (data.error) {
      console.error('Google Translate Detect API Error:', data.error);
      throw new Error(`Google Translate Detect API error: ${data.error.message}`);
    }

    if (!data.data || !data.data.detections || data.data.detections.length === 0) {
      throw new Error('No language detection result received');
    }

    const detection = data.data.detections[0][0];

    res.json({
      success: true,
      data: {
        language: detection.language,
        confidence: detection.confidence
      },
      isMockData: false
    });

  } catch (error) {
    console.error('Google Translate Detect API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect language',
      error: error.message
    });
  }
});

// Get supported languages endpoint
router.get('/languages', async (req, res) => {
  try {
    // Check if Google Translate API key is configured
    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.log('🔄 Google Translate API key not configured, using fallback languages');
      
      const fallbackLanguages = [
        { language: 'ja', name: 'Japanese' },
        { language: 'en', name: 'English' },
        { language: 'zh', name: 'Chinese (Simplified)' },
        { language: 'ko', name: 'Korean' },
        { language: 'es', name: 'Spanish' },
        { language: 'fr', name: 'French' },
        { language: 'hi', name: 'Hindi' },
        { language: 'ru', name: 'Russian' },
        { language: 'ar', name: 'Arabic' },
        { language: 'id', name: 'Indonesian' },
        { language: 'pt', name: 'Portuguese' },
        { language: 'th', name: 'Thai' },
        { language: 'vi', name: 'Vietnamese' },
        { language: 'it', name: 'Italian' }
      ];
      
      return res.json({
        success: true,
        data: fallbackLanguages,
        isMockData: true,
        message: 'Google Translate API not configured, showing basic language list'
      });
    }

    // Build Google Translate API request for supported languages
    const params = new URLSearchParams({
      key: GOOGLE_TRANSLATE_API_KEY,
      target: 'en' // Get language names in English
    });

    const url = `${GOOGLE_TRANSLATE_API_URL}/languages?${params}`;
    console.log('🔍 Google Translate Languages API Request:', url.replace(GOOGLE_TRANSLATE_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('Google Translate Languages API Error:', data.error);
      throw new Error(`Google Translate Languages API error: ${data.error.message}`);
    }

    if (!data.data || !data.data.languages) {
      throw new Error('No supported languages received');
    }

    res.json({
      success: true,
      data: data.data.languages,
      isMockData: false
    });

  } catch (error) {
    console.error('Google Translate Languages API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported languages',
      error: error.message
    });
  }
});

// Translate image text using Google Vision API + Google Translate API
router.post('/image-translate', async (req, res) => {
  try {
    const { image, sourceLanguage = 'auto', targetLanguage = 'en' } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.log('🔄 Google Translate API key not configured, using fallback image translation');
      
      // Fallback response for image translation
      return res.json({
        success: true,
        data: {
          translatedText: '⚠️ Google Translate API not configured\n\nTo enable image translation:\n1. Get a Google Translate API key\n2. Add GOOGLE_TRANSLATE_API_KEY to your .env file\n3. Restart the server\n\nNote: This requires both Google Vision API and Google Translate API to be enabled.',
          detectedLanguage: sourceLanguage === 'auto' ? 'en' : sourceLanguage
        },
        isMockData: true,
        message: 'Google Translate API not configured. Image translation requires both Google Vision API and Google Translate API.'
      });
    }

    // Step 1: Use Google Vision API to extract text from image
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: image
          },
          features: [{
            type: 'TEXT_DETECTION',
            maxResults: 10
          }]
        }]
      })
    });

    if (!visionResponse.ok) {
      throw new Error(`Google Vision API error: ${visionResponse.status} ${visionResponse.statusText}`);
    }

    const visionData = await visionResponse.json();
    
    if (!visionData.responses || !visionData.responses[0] || !visionData.responses[0].textAnnotations) {
      return res.json({
        success: true,
        data: {
          translatedText: 'No text found in the image.',
          detectedLanguage: sourceLanguage === 'auto' ? 'en' : sourceLanguage
        }
      });
    }

    const extractedText = visionData.responses[0].textAnnotations[0].description;
    
    // Step 2: Use Google Translate API to translate the extracted text
    const translateResponse = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: extractedText,
        source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        target: targetLanguage,
        format: 'text'
      })
    });

    if (!translateResponse.ok) {
      throw new Error(`Google Translate API error: ${translateResponse.status} ${translateResponse.statusText}`);
    }

    const translateData = await translateResponse.json();
    
    res.json({
      success: true,
      data: {
        translatedText: translateData.data.translations[0].translatedText,
        originalText: extractedText,
        detectedLanguage: translateData.data.translations[0].detectedSourceLanguage || sourceLanguage
      }
    });
  } catch (error) {
    console.error('Google image translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate image text',
      error: error.message
    });
  }
});

// Speech-to-Text using Google Speech-to-Text API
router.post('/speech-to-text', async (req, res) => {
  try {
    const { audio, language = 'en-US' } = req.body;
    
    if (!audio) {
      return res.status(400).json({
        success: false,
        message: 'Audio data is required'
      });
    }

    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.log('🔄 Google Translate API key not configured, using fallback speech-to-text');
      
      // Fallback response for speech-to-text
      return res.json({
        success: true,
        data: {
          transcript: '⚠️ Google Speech-to-Text API not configured\n\nTo enable speech-to-text:\n1. Get a Google Speech-to-Text API key\n2. Add GOOGLE_TRANSLATE_API_KEY to your .env file\n3. Restart the server\n\nNote: This requires Google Speech-to-Text API to be enabled.',
          confidence: 0.0
        },
        isMockData: true,
        message: 'Google Speech-to-Text API not configured. Please type your text instead.'
      });
    }

    // Use Google Speech-to-Text API
    const speechResponse = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: language,
          enableAutomaticPunctuation: true,
          model: 'latest_long'
        },
        audio: {
          content: audio
        }
      })
    });

    if (!speechResponse.ok) {
      const errorData = await speechResponse.json();
      console.error('Google Speech-to-Text API Error:', errorData);
      throw new Error(`Google Speech-to-Text API error: ${speechResponse.status} ${speechResponse.statusText}`);
    }

    const speechData = await speechResponse.json();
    
    if (!speechData.results || speechData.results.length === 0) {
      return res.json({
        success: true,
        data: {
          transcript: 'No speech detected in the audio.',
          confidence: 0.0
        }
      });
    }

    const result = speechData.results[0];
    const alternative = result.alternatives[0];
    
    res.json({
      success: true,
      data: {
        transcript: alternative.transcript,
        confidence: alternative.confidence || 0.0
      }
    });
  } catch (error) {
    console.error('Google Speech-to-Text error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process speech-to-text',
      error: error.message
    });
  }
});

export default router;
