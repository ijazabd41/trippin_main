import type { VercelRequest, VercelResponse } from '@vercel/node';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers first
  const setCorsHeaders = () => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders();
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    setCorsHeaders();
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Ensure response is always JSON
  const sendJsonResponse = (status: number, data: any) => {
    setCorsHeaders();
    res.setHeader('Content-Type', 'application/json');
    return res.status(status).json(data);
  };

  try {
    // Parse request body safely
    let body: any = {};
    try {
      if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else if (req.body) {
        body = req.body;
      }
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return sendJsonResponse(400, {
        success: false,
        error: 'Invalid request body format'
      });
    }

    const { message, language = 'ja', conversationHistory = [] } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return sendJsonResponse(400, {
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, returning mock response');
      return sendJsonResponse(200, {
        success: true,
        response: '申し訳ございませんが、現在AIサービスが一時的に利用できません。基本的な日本旅行情報についてお答えできます。',
        language,
        isMockData: true,
        message: 'OpenAI APIキーが設定されていません。'
      });
    }

    // Build messages array with conversation history
    const messages: any[] = [
      {
        role: 'system',
        content: `あなたは旅行の専門家です。${language}で回答してください。`
      }
    ];

    // Add conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach((msg: any) => {
      if (msg.role && msg.content) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: message.trim()
    });

    // Call OpenAI Chat Completions API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        body: errorText
      });
      
      // Return fallback response instead of throwing
      return sendJsonResponse(200, {
        success: true,
        response: '申し訳ございませんが、現在AIサービスが一時的に利用できません。基本的な日本旅行情報についてお答えできます。',
        language,
        isMockData: true,
        message: `OpenAI API error: ${openaiResponse.status}`
      });
    }

    const data = await openaiResponse.json();
    const response = data.choices?.[0]?.message?.content || '申し訳ございません。回答を生成できませんでした。';

    return sendJsonResponse(200, {
      success: true,
      response,
      language
    });

  } catch (error: any) {
    console.error('OpenAI Chat API Error:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Always return valid JSON, even on error
    try {
      const language = (req.body as any)?.language || 'ja';
      return sendJsonResponse(200, {
        success: true,
        response: '申し訳ございませんが、現在AIサービスが一時的に利用できません。基本的な日本旅行情報についてお答えできます。',
        language,
        isMockData: true,
        message: error.message || 'OpenAI APIが一時的に利用できません。'
      });
    } catch (fallbackError) {
      // Last resort - return minimal valid JSON
      setCorsHeaders();
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'サーバーエラーが発生しました。しばらく待ってからお試しください。'
      });
    }
  }
}