import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, MapPin, Phone, Languages as Translate, Camera, Book, Loader, Wifi, CreditCard, Calendar, Star, Settings, Download, Globe, Crown, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { isUserPremium } from '../utils/premiumUtils';
import { apiCall, API_CONFIG, APIError } from '../config/api';
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';
import { handleVercelError, globalErrorHandler } from '../utils/errorHandler';
import MockDataNotice from '../components/MockDataNotice';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  isTyping?: boolean;
  error?: boolean;
}

const ChatBot: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { user, userProfile, isAuthenticated } = useSupabaseAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showMockNotice, setShowMockNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use translation system instead of hardcoded content
  const getLocalizedContent = () => {
    return {
      title: t('chatBot.title'),
      subtitle: t('chatBot.subtitle'),
      quickActions: t('chatBot.quickActions'),
      emergency: t('chatBot.emergency'),
      translation: t('chatBot.translation'),
      nearby: t('chatBot.nearby'),
      weather: t('chatBot.weather'),
      esim: t('chatBot.esim'),
      bookings: t('chatBot.bookings'),
      payments: t('chatBot.payments'),
      reviews: t('chatBot.reviews'),
      offline: t('chatBot.offline'),
      helpCenter: t('chatBot.helpCenter'),
      inputPlaceholder: t('chatBot.inputPlaceholder'),
      emergencyContent: t('chatBot.emergencyContent'),
      translationContent: t('chatBot.translationContent'),
      nearbyContent: t('chatBot.nearbyContent'),
      weatherContent: t('chatBot.weatherContent'),
      esimContent: t('chatBot.esimContent'),
      bookingsContent: t('chatBot.bookingsContent'),
      paymentsContent: t('chatBot.paymentsContent'),
      reviewsContent: t('chatBot.reviewsContent'),
      offlineContent: t('chatBot.offlineContent'),
      greeting: t('chatBot.greeting')
    };
  };

  // Old hardcoded content (kept for reference but not used)
  const getOldLocalizedContent = () => {
    switch (currentLanguage) {
      case 'en':
        return {
          title: 'AI Chat Assistant',
          subtitle: '24/7 support anytime',
          quickActions: 'Quick Actions',
          emergency: 'Emergency Contacts',
          translation: 'Translation',
          nearby: 'Nearby Info',
          weather: 'Weather Info',
          helpCenter: 'Help Center',
          inputPlaceholder: 'Type a message...',
          emergencyContent: `🚨 Emergency Contacts

Police: 110
Fire/Ambulance: 119
Tourist Hotline: 050-3816-2787

When reporting your location, please check nearby landmarks or addresses.`,
          translationContent: 'Translation features are available. Text translation, voice translation, and photo translation are possible.',
          nearbyContent: 'You can search for tourist attractions, restaurants, and transportation around your current location.',
          weatherContent: `🌤️ Today's Weather Information

Tokyo: Sunny, 22°C
Osaka: Cloudy, 20°C
Kyoto: Sunny, 21°C

※Please check the Japan Meteorological Agency website for the latest weather information.`,
          greeting: 'Hello! Ask me anything about traveling in Japan.'
        };
      case 'zh':
        return {
          title: 'AI聊天助手',
          subtitle: '24小时随时为您服务',
          quickActions: '快速操作',
          emergency: '紧急联系方式',
          translation: '翻译',
          nearby: '周边信息',
          weather: '天气信息',
          helpCenter: '帮助中心',
          inputPlaceholder: '输入消息...',
          emergencyContent: `🚨 紧急联系方式

警察: 110
消防/急救: 119
旅游热线: 050-3816-2787

报告位置时，请确认附近的地标或地址。`,
          translationContent: '可以使用翻译功能。支持文本翻译、语音翻译和照片翻译。',
          nearbyContent: '可以搜索当前位置周围的旅游景点、餐厅和交通工具。',
          weatherContent: `🌤️ 今日天气信息

东京: 晴天，22°C
大阪: 多云，20°C
京都: 晴天，21°C

※请查看日本气象厅网站获取最新天气信息。`,
          greeting: '您好！请随时询问关于日本旅行的任何问题。'
        };
      case 'ko':
        return {
          title: 'AI 채팅 어시스턴트',
          subtitle: '24시간 언제든지 지원',
          quickActions: '빠른 작업',
          emergency: '긴급 연락처',
          translation: '번역',
          nearby: '주변 정보',
          weather: '날씨 정보',
          helpCenter: '도움말 센터',
          inputPlaceholder: '메시지를 입력하세요...',
          emergencyContent: `🚨 긴급 연락처

경찰: 110
소방/응급: 119
관광 핫라인: 050-3816-2787

위치를 신고할 때는 주변 랜드마크나 주소를 확인해 주세요.`,
          translationContent: '번역 기능을 이용하실 수 있습니다. 텍스트 번역, 음성 번역, 사진 번역이 가능합니다.',
          nearbyContent: '현재 위치 주변의 관광 명소, 레스토랑, 교통수단을 검색할 수 있습니다.',
          weatherContent: `🌤️ 오늘의 날씨 정보

도쿄: 맑음, 22°C
오사카: 흐림, 20°C
교토: 맑음, 21°C

※최신 날씨 정보는 일본 기상청 웹사이트에서 확인하세요.`,
          greeting: '안녕하세요! 일본 여행에 대해 무엇이든 물어보세요.'
        };
      case 'es':
        return {
          title: 'Asistente de Chat IA',
          subtitle: 'Soporte 24/7 en cualquier momento',
          quickActions: 'Acciones Rápidas',
          emergency: 'Contactos de Emergencia',
          translation: 'Traducción',
          nearby: 'Información Cercana',
          weather: 'Información del Clima',
          helpCenter: 'Centro de Ayuda',
          inputPlaceholder: 'Escribe un mensaje...',
          emergencyContent: `🚨 Contactos de Emergencia

Policía: 110
Bomberos/Ambulancia: 119
Línea Turística: 050-3816-2787

Al reportar tu ubicación, verifica puntos de referencia o direcciones cercanas.`,
          translationContent: 'Las funciones de traducción están disponibles. Es posible traducción de texto, voz y fotos.',
          nearbyContent: 'Puedes buscar atracciones turísticas, restaurantes y transporte alrededor de tu ubicación actual.',
          weatherContent: `🌤️ Información del Clima de Hoy

Tokio: Soleado, 22°C
Osaka: Nublado, 20°C
Kioto: Soleado, 21°C

※Consulta el sitio web de la Agencia Meteorológica de Japón para información actualizada.`,
          greeting: '¡Hola! Pregúntame cualquier cosa sobre viajar a Japón.'
        };
      case 'fr':
        return {
          title: 'Assistant de Chat IA',
          subtitle: 'Support 24/7 à tout moment',
          quickActions: 'Actions Rapides',
          emergency: 'Contacts d\'Urgence',
          translation: 'Traduction',
          nearby: 'Infos Proximité',
          weather: 'Infos Météo',
          helpCenter: 'Centre d\'Aide',
          inputPlaceholder: 'Tapez un message...',
          emergencyContent: `🚨 Contacts d'Urgence

Police: 110
Pompiers/Ambulance: 119
Ligne Touristique: 050-3816-2787

Lors du signalement de votre position, vérifiez les points de repère ou adresses à proximité.`,
          translationContent: 'Les fonctions de traduction sont disponibles. Traduction de texte, vocale et photo possible.',
          nearbyContent: 'Vous pouvez rechercher des attractions touristiques, restaurants et transports autour de votre position.',
          weatherContent: `🌤️ Informations Météo d'Aujourd'hui

Tokyo: Ensoleillé, 22°C
Osaka: Nuageux, 20°C
Kyoto: Ensoleillé, 21°C

※Consultez le site de l'Agence Météorologique du Japon pour les dernières informations.`,
          greeting: 'Bonjour! Demandez-moi n\'importe quoi sur les voyages au Japon.'
        };
      case 'hi':
        return {
          title: 'AI चैट असिस्टेंट',
          subtitle: '24/7 कभी भी सहायता',
          quickActions: 'त्वरित कार्य',
          emergency: 'आपातकालीन संपर्क',
          translation: 'अनुवाद',
          nearby: 'आसपास की जानकारी',
          weather: 'मौसम की जानकारी',
          helpCenter: 'सहायता केंद्र',
          inputPlaceholder: 'संदेश टाइप करें...',
          emergencyContent: `🚨 आपातकालीन संपर्क

पुलिस: 110
अग्निशमन/एम्बुलेंस: 119
पर्यटक हॉटलाइन: 050-3816-2787

अपना स्थान बताते समय, आसपास के स्थलचिह्न या पते की जांच करें।`,
          translationContent: 'अनुवाद सुविधाएं उपलब्ध हैं। टेक्स्ट अनुवाद, आवाज अनुवाद और फोटो अनुवाद संभव है।',
          nearbyContent: 'आप अपने वर्तमान स्थान के आसपास पर्यटन स्थल, रेस्तरां और परिवहन खोज सकते हैं।',
          weatherContent: `🌤️ आज की मौसम जानकारी

टोक्यो: धूप, 22°C
ओसाका: बादल, 20°C
क्योटो: धूप, 21°C

※नवीनतम मौसम जानकारी के लिए जापान मौसम विज्ञान एजेंसी की वेबसाइट देखें।`,
          greeting: 'नमस्ते! जापान यात्रा के बारे में कुछ भी पूछें।'
        };
      case 'ru':
        return {
          title: 'ИИ Чат-Ассистент',
          subtitle: 'Поддержка 24/7 в любое время',
          quickActions: 'Быстрые Действия',
          emergency: 'Экстренные Контакты',
          translation: 'Перевод',
          nearby: 'Информация Поблизости',
          weather: 'Информация о Погоде',
          helpCenter: 'Центр Помощи',
          inputPlaceholder: 'Введите сообщение...',
          emergencyContent: `🚨 Экстренные Контакты

Полиция: 110
Пожарная/Скорая: 119
Туристическая Линия: 050-3816-2787

При сообщении о местоположении проверьте ближайшие ориентиры или адреса.`,
          translationContent: 'Доступны функции перевода. Возможен перевод текста, голоса и фотографий.',
          nearbyContent: 'Вы можете искать туристические достопримечательности, рестораны и транспорт вокруг вашего местоположения.',
          weatherContent: `🌤️ Информация о Погоде Сегодня

Токио: Солнечно, 22°C
Осака: Облачно, 20°C
Киото: Солнечно, 21°C

※Проверьте сайт Японского Метеорологического Агентства для актуальной информации.`,
          greeting: 'Привет! Спрашивайте что угодно о путешествиях в Японию.'
        };
      case 'ar':
        return {
          title: 'مساعد الدردشة بالذكاء الاصطناعي',
          subtitle: 'دعم 24/7 في أي وقت',
          quickActions: 'الإجراءات السريعة',
          emergency: 'جهات الاتصال الطارئة',
          translation: 'الترجمة',
          nearby: 'معلومات قريبة',
          weather: 'معلومات الطقس',
          helpCenter: 'مركز المساعدة',
          inputPlaceholder: 'اكتب رسالة...',
          emergencyContent: `🚨 جهات الاتصال الطارئة

الشرطة: 110
الإطفاء/الإسعاف: 119
الخط الساخن السياحي: 050-3816-2787

عند الإبلاغ عن موقعك، تحقق من المعالم أو العناوين القريبة.`,
          translationContent: 'ميزات الترجمة متاحة. ترجمة النص والصوت والصور ممكنة.',
          nearbyContent: 'يمكنك البحث عن المعالم السياحية والمطاعم والمواصلات حول موقعك الحالي.',
          weatherContent: `🌤️ معلومات الطقس اليوم

طوكيو: مشمس، 22°C
أوساكا: غائم، 20°C
كيوتو: مشمس، 21°C

※يرجى مراجعة موقع وكالة الأرصاد الجوية اليابانية للحصول على أحدث معلومات الطقس.`,
          greeting: 'مرحباً! اسألني أي شيء عن السفر إلى اليابان.'
        };
      case 'id':
        return {
          title: 'Asisten Chat AI',
          subtitle: 'Dukungan 24/7 kapan saja',
          quickActions: 'Tindakan Cepat',
          emergency: 'Kontak Darurat',
          translation: 'Terjemahan',
          nearby: 'Info Sekitar',
          weather: 'Info Cuaca',
          helpCenter: 'Pusat Bantuan',
          inputPlaceholder: 'Ketik pesan...',
          emergencyContent: `🚨 Kontak Darurat

Polisi: 110
Pemadam Kebakaran/Ambulans: 119
Hotline Wisata: 050-3816-2787

Saat melaporkan lokasi Anda, periksa landmark atau alamat terdekat.`,
          translationContent: 'Fitur terjemahan tersedia. Terjemahan teks, suara, dan foto dimungkinkan.',
          nearbyContent: 'Anda dapat mencari tempat wisata, restoran, dan transportasi di sekitar lokasi Anda.',
          weatherContent: `🌤️ Informasi Cuaca Hari Ini

Tokyo: Cerah, 22°C
Osaka: Berawan, 20°C
Kyoto: Cerah, 21°C

※Silakan periksa situs web Badan Meteorologi Jepang untuk informasi cuaca terbaru.`,
          greeting: 'Halo! Tanyakan apa saja tentang perjalanan ke Jepang.'
        };
      case 'pt':
        return {
          title: 'Assistente de Chat IA',
          subtitle: 'Suporte 24/7 a qualquer momento',
          quickActions: 'Ações Rápidas',
          emergency: 'Contatos de Emergência',
          translation: 'Tradução',
          nearby: 'Informações Próximas',
          weather: 'Informações do Tempo',
          helpCenter: 'Central de Ajuda',
          inputPlaceholder: 'Digite uma mensagem...',
          emergencyContent: `🚨 Contatos de Emergência

Polícia: 110
Bombeiros/Ambulância: 119
Linha Turística: 050-3816-2787

Ao relatar sua localização, verifique pontos de referência ou endereços próximos.`,
          translationContent: 'Recursos de tradução estão disponíveis. Tradução de texto, voz e foto são possíveis.',
          nearbyContent: 'Você pode pesquisar atrações turísticas, restaurantes e transporte ao redor da sua localização.',
          weatherContent: `🌤️ Informações do Tempo Hoje

Tóquio: Ensolarado, 22°C
Osaka: Nublado, 20°C
Quioto: Ensolarado, 21°C

※Consulte o site da Agência Meteorológica do Japão para informações atualizadas.`,
          greeting: 'Olá! Pergunte-me qualquer coisa sobre viajar para o Japão.'
        };
      case 'th':
        return {
          title: 'ผู้ช่วยแชท AI',
          subtitle: 'สนับสนุน 24/7 ตลอดเวลา',
          quickActions: 'การดำเนินการด่วน',
          emergency: 'ติดต่อฉุกเฉิน',
          translation: 'การแปล',
          nearby: 'ข้อมูลใกล้เคียง',
          weather: 'ข้อมูลสภาพอากาศ',
          helpCenter: 'ศูนย์ช่วยเหลือ',
          inputPlaceholder: 'พิมพ์ข้อความ...',
          emergencyContent: `🚨 ติดต่อฉุกเฉิน

ตำรวจ: 110
ดับเพลิง/รถพยาบาล: 119
สายด่วนท่องเที่ยว: 050-3816-2787

เมื่อรายงานตำแหน่งของคุณ โปรดตรวจสอบสถานที่สำคัญหรือที่อยู่ใกล้เคียง`,
          translationContent: 'ฟีเจอร์การแปลพร้อมใช้งาน สามารถแปลข้อความ เสียง และรูปภาพได้',
          nearbyContent: 'คุณสามารถค้นหาสถานที่ท่องเที่ยว ร้านอาหาร และการขนส่งรอบตำแหน่งปัจจุบันของคุณ',
          weatherContent: `🌤️ ข้อมูลสภาพอากาศวันนี้

โตเกียว: แจ่มใส 22°C
โอซาก้า: มีเมฆ 20°C
เกียวโต: แจ่มใส 21°C

※โปรดตรวจสอบเว็บไซต์กรมอุตุนิยมวิทยาญี่ปุ่นสำหรับข้อมูลสภาพอากาศล่าสุด`,
          greeting: 'สวัสดี! ถามอะไรเกี่ยวกับการเดินทางในญี่ปุ่นได้เลย'
        };
      case 'vi':
        return {
          title: 'Trợ Lý Chat AI',
          subtitle: 'Hỗ trợ 24/7 bất cứ lúc nào',
          quickActions: 'Hành Động Nhanh',
          emergency: 'Liên Hệ Khẩn Cấp',
          translation: 'Dịch Thuật',
          nearby: 'Thông Tin Gần Đây',
          weather: 'Thông Tin Thời Tiết',
          helpCenter: 'Trung Tâm Trợ Giúp',
          inputPlaceholder: 'Nhập tin nhắn...',
          emergencyContent: `🚨 Liên Hệ Khẩn Cấp

Cảnh sát: 110
Cứu hỏa/Cấp cứu: 119
Đường dây nóng du lịch: 050-3816-2787

Khi báo cáo vị trí của bạn, hãy kiểm tra các địa danh hoặc địa chỉ gần đó.`,
          translationContent: 'Các tính năng dịch thuật có sẵn. Có thể dịch văn bản, giọng nói và ảnh.',
          nearbyContent: 'Bạn có thể tìm kiếm các điểm tham quan, nhà hàng và phương tiện giao thông xung quanh vị trí hiện tại.',
          weatherContent: `🌤️ Thông Tin Thời Tiết Hôm Nay

Tokyo: Nắng, 22°C
Osaka: Có mây, 20°C
Kyoto: Nắng, 21°C

※Vui lòng kiểm tra trang web Cơ quan Khí tượng Nhật Bản để biết thông tin thời tiết mới nhất.`,
          greeting: 'Xin chào! Hỏi tôi bất cứ điều gì về du lịch Nhật Bản.'
        };
      case 'it':
        return {
          title: 'Assistente Chat IA',
          subtitle: 'Supporto 24/7 in qualsiasi momento',
          quickActions: 'Azioni Rapide',
          emergency: 'Contatti di Emergenza',
          translation: 'Traduzione',
          nearby: 'Informazioni Vicine',
          weather: 'Informazioni Meteo',
          helpCenter: 'Centro Assistenza',
          inputPlaceholder: 'Scrivi un messaggio...',
          emergencyContent: `🚨 Contatti di Emergenza

Polizia: 110
Vigili del Fuoco/Ambulanza: 119
Linea Turistica: 050-3816-2787

Quando riporti la tua posizione, controlla punti di riferimento o indirizzi vicini.`,
          translationContent: 'Le funzioni di traduzione sono disponibili. È possibile tradurre testo, voce e foto.',
          nearbyContent: 'Puoi cercare attrazioni turistiche, ristoranti e trasporti intorno alla tua posizione attuale.',
          weatherContent: `🌤️ Informazioni Meteo di Oggi

Tokyo: Soleggiato, 22°C
Osaka: Nuvoloso, 20°C
Kyoto: Soleggiato, 21°C

※Controlla il sito dell'Agenzia Meteorologica del Giappone per informazioni aggiornate.`,
          greeting: 'Ciao! Chiedimi qualsiasi cosa sui viaggi in Giappone.'
        };
      default: // Japanese
        return {
          title: 'AIチャットアシスタント',
          subtitle: '24時間いつでもサポートします',
          quickActions: 'クイックアクション',
          emergency: '緊急連絡先',
          translation: '翻訳',
          nearby: '周辺情報',
          weather: '天気情報',
          helpCenter: 'ヘルプセンター',
          inputPlaceholder: 'メッセージを入力...',
          emergencyContent: `🚨 緊急連絡先

警察: 110
消防・救急: 119
観光ホットライン: 050-3816-2787

現在地を伝える際は、近くの目印や住所を確認してください。`,
          translationContent: '翻訳機能をご利用いただけます。テキスト翻訳、音声翻訳、写真翻訳が可能です。',
          nearbyContent: '現在地周辺の観光スポット、レストラン、交通機関を検索できます。',
          weatherContent: `🌤️ 今日の天気情報

東京: 晴れ、気温 22°C
大阪: 曇り、気温 20°C
京都: 晴れ、気温 21°C

※最新の天気情報は気象庁のウェブサイトでご確認ください。`,
          greeting: 'こんにちは！日本旅行について何でもお聞きください。'
        };
    }
  };

const content = getLocalizedContent();

const prevLangRef = useRef<string | null>(null);

useEffect(() => {
  if (prevLangRef.current !== currentLanguage) {
    setMessages([]);

    let cancelled = false;
    const tid = window.setTimeout(() => {
      if (cancelled) return;
      addBotMessage(content.greeting, [
        {
          label: content.emergency,
          action: () => handleQuickAction('emergency')
        },
        {
          label: content.translation,
          action: () => handleQuickAction('translation')
        },
        {
          label: content.nearby,
          action: () => handleQuickAction('nearby')
        },
        {
          label: content.weather,
          action: () => handleQuickAction('weather')
        },
        {
          label: content.esim,
          action: () => handleQuickAction('esim')
        },
        {
          label: content.bookings,
          action: () => handleQuickAction('bookings')
        },
        {
          label: content.payments,
          action: () => handleQuickAction('payments')
        },
        {
          label: content.reviews,
          action: () => handleQuickAction('reviews')
        },
        {
          label: content.offline,
          action: () => handleQuickAction('offline')
        }
      ]);
      // ★ 実際に挨拶を出したタイミングで更新
      prevLangRef.current = currentLanguage;
    }, 100);

    return () => {
      cancelled = true;  // ★ StrictModeの1回目でキャンセル
      clearTimeout(tid);
    };
  }
}, [currentLanguage, content.greeting]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (content: string, actions?: Array<{ label: string; action: () => void }>) => {
    const message: Message = {
      id: `bot_${Date.now()}`,
      type: 'bot',
      content,
      timestamp: new Date().toISOString(),
      actions
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');
    addUserMessage(userMessage);
    setIsTyping(true);

    // Reset error state
    setIsError(false);
    setShowMockNotice(false);
    setNoticeMessage(null);

    try {
      // Add user message to conversation history
      const updatedHistory = [...conversationHistory, { role: 'user', content: userMessage }];
      setConversationHistory(updatedHistory);

      // Use backend API (Supabase Edge Function) for chat
      const result = await backendApiCall(BACKEND_API_CONFIG.ENDPOINTS.OPENAI.CHAT, {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          language: currentLanguage || 'ja',
          context: 'travel_japan',
          conversationHistory: updatedHistory.slice(-10) // Keep last 10 messages for context
        })
      });

      console.log('[ChatBot] OpenAI API response:', result);
      
      if (result.success && result.response && typeof result.response === 'string' && result.response.trim()) {
        // Check if this is mock data
        if (result.isMockData) {
          setShowMockNotice(true);
          setNoticeMessage(result.message || t('chatBot.notice.mockAiUnavailable'));
        }
        
        // Add bot response to conversation history
        setConversationHistory(prev => [...prev, { role: 'assistant', content: result.response }]);
        
        addBotMessage(result.response, [
          {
            label: t('chatActions.mapCheck'),
           action: () => { window.open('/map', '_blank'); }
          },
          {
            label: t('chatActions.moreInfo'),
            action: () => console.log('Show details')
          }
        ]);
      } else {
        console.warn('[ChatBot] Invalid response format:', result);
        throw new Error(result.message || t('chatBot.errors.generationFailed'));
      }
    } catch (error) {
      const apiError = error as APIError;
      
      // Log error with context
      globalErrorHandler.handleError(apiError, {
        page: 'ChatBot',
        action: 'sendMessage',
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Handle specific Vercel errors
      const errorInfo = handleVercelError(apiError);
      
      console.error('ChatBot API Error:', {
        message: apiError.message,
        status: apiError.status,
        code: apiError.code,
        endpoint: apiError.endpoint,
        userMessage: userMessage,
        language: currentLanguage
      });
      
      setIsError(true);
      setShowMockNotice(true);
      
      // Show user-friendly error message
      if (apiError.code === 'NETWORK_OFFLINE') {
        setNoticeMessage(t('chatBot.notice.offline'));
        addBotMessage(t('chatBot.offlineBotMessage'));
      } else if (apiError.code === 'TIMEOUT') {
        setNoticeMessage(t('chatBot.notice.timeout'));
        addBotMessage(t('chatBot.timeoutBotMessage'));
      } else if (apiError.status === 429) {
        setNoticeMessage(t('chatBot.notice.rateLimited'));
        addBotMessage(t('chatBot.rateLimitedBotMessage'));
      } else if (apiError.status && apiError.status >= 500) {
        setNoticeMessage(t('chatBot.notice.serverError'));
        addBotMessage(t('chatBot.serverErrorBotMessage'));
      } else {
        setNoticeMessage(errorInfo.message || t('chatBot.notice.unavailable'));
        addBotMessage(t('chatBot.unavailableBotMessage'));
      }
      
      // Add retry action for retryable errors
      if (apiError.retryable) {
        addBotMessage('', [
          {
            label: t('common.tryAgain') || t('chatBot.actions.retry') || 'Retry',
            action: () => {
              setInputMessage(userMessage);
              handleSendMessage();
            }
          }
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
    setIsError(false);
    setShowMockNotice(false);
    setNoticeMessage(null);
    // Add greeting message after clearing
    setTimeout(() => {
      addBotMessage(content.greeting, [
        {
          label: content.emergency,
          action: () => handleQuickAction('emergency')
        },
        {
          label: content.translation,
          action: () => handleQuickAction('translation')
        },
        {
          label: content.nearby,
          action: () => handleQuickAction('nearby')
        },
        {
          label: content.weather,
          action: () => handleQuickAction('weather')
        },
        {
          label: content.esim,
          action: () => handleQuickAction('esim')
        },
        {
          label: content.bookings,
          action: () => handleQuickAction('bookings')
        },
        {
          label: content.payments,
          action: () => handleQuickAction('payments')
        },
        {
          label: content.reviews,
          action: () => handleQuickAction('reviews')
        },
        {
          label: content.offline,
          action: () => handleQuickAction('offline')
        }
      ]);
    }, 100);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'emergency':
        addBotMessage(content.emergencyContent);
        break;
      case 'translation':
        addBotMessage(content.translationContent, [
          {
            label: currentLanguage === 'en' ? 'Open Translation Tool' :
                   currentLanguage === 'zh' ? '打开翻译工具' :
                   currentLanguage === 'ko' ? '번역 도구 열기' :
                   currentLanguage === 'es' ? 'Abrir Herramienta de Traducción' :
                   currentLanguage === 'fr' ? 'Ouvrir l\'Outil de Traduction' :
                   currentLanguage === 'hi' ? 'अनुवाद उपकरण खोलें' :
                   currentLanguage === 'ru' ? 'Открыть Инструмент Перевода' :
                   currentLanguage === 'ar' ? 'فتح أداة الترجمة' :
                   currentLanguage === 'id' ? 'Buka Alat Terjemahan' :
                   currentLanguage === 'pt' ? 'Abrir Ferramenta de Tradução' :
                   currentLanguage === 'th' ? 'เปิดเครื่องมือแปล' :
                   currentLanguage === 'vi' ? 'Mở Công Cụ Dịch' :
                   currentLanguage === 'it' ? 'Apri Strumento di Traduzione' :
                   '翻訳ツールを開く',
            action: () => window.open('/translate', '_blank')
          }
        ]);
        break;
      case 'nearby':
        addBotMessage(content.nearbyContent, [
          {
            label: currentLanguage === 'en' ? 'Open Map' :
                   currentLanguage === 'zh' ? '打开地图' :
                   currentLanguage === 'ko' ? '지도 열기' :
                   currentLanguage === 'es' ? 'Abrir Mapa' :
                   currentLanguage === 'fr' ? 'Ouvrir la Carte' :
                   currentLanguage === 'hi' ? 'मैप खोलें' :
                   currentLanguage === 'ru' ? 'Открыть Карту' :
                   currentLanguage === 'ar' ? 'فتح الخريطة' :
                   currentLanguage === 'id' ? 'Buka Peta' :
                   currentLanguage === 'pt' ? 'Abrir Mapa' :
                   currentLanguage === 'th' ? 'เปิดแผนที่' :
                   currentLanguage === 'vi' ? 'Mở Bản Đồ' :
                   currentLanguage === 'it' ? 'Apri Mappa' :
                   '地図を開く',
            action: () => window.open('/map', '_blank')
          }
        ]);
        break;
      case 'weather':
        addBotMessage(content.weatherContent);
        break;
      case 'esim':
        addBotMessage(content.esimContent, [
          {
            label: currentLanguage === 'en' ? 'Manage eSIM' :
                   currentLanguage === 'zh' ? '管理eSIM' :
                   currentLanguage === 'ko' ? 'eSIM 관리' :
                   'eSIM管理',
            action: () => window.open('/esim', '_blank')
          }
        ]);
        break;
      case 'bookings':
        addBotMessage(content.bookingsContent, [
          {
            label: currentLanguage === 'en' ? 'View Bookings' :
                   currentLanguage === 'zh' ? '查看预订' :
                   currentLanguage === 'ko' ? '예약 보기' :
                   '予約を確認',
            action: () => window.open('/dashboard', '_blank')
          }
        ]);
        break;
      case 'payments':
        addBotMessage(content.paymentsContent, [
          {
            label: currentLanguage === 'en' ? 'Payment History' :
                   currentLanguage === 'zh' ? '支付历史' :
                   currentLanguage === 'ko' ? '결제 내역' :
                   '支払い履歴',
            action: () => window.open('/dashboard', '_blank')
          }
        ]);
        break;
      case 'reviews':
        addBotMessage(content.reviewsContent, [
          {
            label: currentLanguage === 'en' ? 'Write Review' :
                   currentLanguage === 'zh' ? '写评价' :
                   currentLanguage === 'ko' ? '리뷰 작성' :
                   'レビューを書く',
            action: () => window.open('/reviews', '_blank')
          }
        ]);
        break;
      case 'offline':
        addBotMessage(content.offlineContent, [
          {
            label: currentLanguage === 'en' ? 'Download Offline Data' :
                   currentLanguage === 'zh' ? '下载离线数据' :
                   currentLanguage === 'ko' ? '오프라인 데이터 다운로드' :
                   'オフラインデータをダウンロード',
            action: () => window.open('/offline', '_blank')
          }
        ]);
        break;
    }
  };

  // Check if user is premium
  if (!isUserPremium(userProfile, user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Lock className="w-12 h-12 text-purple-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🔒 {t('chatBot.premiumGate.title')}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              {t('chatBot.premiumGate.description1')}<br />
              {t('chatBot.premiumGate.description2')}
            </p>

            {/* Premium Features List */}
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-6">{t('chatBot.premiumGate.featuresTitle')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('chatBot.premiumGate.features.aiChat')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Translate className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('chatBot.premiumGate.features.translation')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('chatBot.premiumGate.features.emergency')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('chatBot.premiumGate.features.nearby')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('chatBot.premiumGate.features.weather')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Wifi className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{t('chatBot.premiumGate.features.esim')}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={() => window.location.href = '/checkout'}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Crown className="w-5 h-5" />
                <span>{t('chatBot.premiumGate.upgradeButton')}</span>
              </motion.button>
              
              <motion.button
                onClick={() => window.history.back()}
                className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{t('common.back')}</span>
              </motion.button>
            </div>
          </motion.div>
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
          <div className="flex items-center justify-center space-x-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-800">{content.title}</h1>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-full px-4 py-2">
              <Crown className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">{t('chatBot.premiumBadge')}</span>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
          <p className="text-lg text-gray-600 mb-4">{content.subtitle}</p>
          <button
            onClick={clearConversation}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Loader className="w-4 h-4" />
            <span>{t('chatBot.actions.clearChat')}</span>
          </button>
        </motion.div>

        {/* Chat Interface */}
        <div className="max-w-4xl mx-auto">
            <motion.div
              className="bg-white rounded-3xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        
                        <div className={`p-3 rounded-2xl ${message.type === 'user' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          
                          {message.actions && (
                            <div className="mt-3 space-y-2">
                              {message.actions.map((action, index) => (
                                <button
                                  key={index}
                                  onClick={action.action}
                                  className="block w-full text-left px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 p-4 rounded-2xl">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {isError && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-red-100 p-3 rounded-2xl">
                        <p className="text-red-700">申し訳ございません。一時的にサービスが利用できません。</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={content.inputPlaceholder}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {isTyping ? (
                    <div className="px-6 py-3 bg-gray-400 text-white rounded-xl">
                      <Loader className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Mock Data Notice */}
              {showMockNotice && noticeMessage && (
                <MockDataNotice 
                  message={noticeMessage}
                  onRetry={() => setShowMockNotice(false)}
                  className="mb-4"
                />
              )}
            </motion.div>
          </div>
        </div>
      </div>
    );
};

export default ChatBot;