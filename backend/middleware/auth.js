import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/supabase.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // For development, try to extract user info from JWT token when Supabase is not configured
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://your-project.supabase.co') {
      console.log('⚠️ Supabase not configured, attempting to decode JWT token');
      console.log('🔍 SUPABASE_URL:', process.env.SUPABASE_URL);
      console.log('🔍 Token available:', !!token);
      
      if (token) {
        try {
          // Decode JWT token without verification (for development only)
          const decoded = jwt.decode(token);
          console.log('🔍 Decoded JWT:', decoded);
          if (decoded && decoded.sub) {
            console.log('✅ Successfully decoded JWT token, user ID:', decoded.sub);
            req.user = {
              id: decoded.sub,
              email: decoded.email || 'user@example.com',
              user_metadata: {
                full_name: decoded.user_metadata?.full_name || 'User'
              }
            };
            return next();
          } else {
            console.log('⚠️ JWT token decoded but no sub field found');
          }
        } catch (jwtError) {
          console.warn('⚠️ Failed to decode JWT token:', jwtError.message);
        }
      } else {
        console.log('⚠️ No token provided');
      }
      
      // Fallback to mock authentication if JWT decoding fails
      console.log('⚠️ Using mock authentication as fallback');
      req.user = {
        id: 'mock-user-id',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'Mock User'
        }
      };
      return next();
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: '認証が必要です。ログインしてください。',
        code: 'UNAUTHORIZED'
      });
    }

    // Only try to use Supabase if it's properly configured
    try {
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.log('Token verification failed:', {
          hasError: !!error,
          errorMessage: error?.message,
          hasUser: !!user
        });
        return res.status(401).json({ 
          error: 'Invalid or expired token',
          message: '認証が必要です。ログインしてください。',
          code: 'UNAUTHORIZED'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (supabaseError) {
      console.error('Supabase auth error:', supabaseError);
      // If Supabase fails, fall back to mock authentication
      console.log('⚠️ Supabase auth failed, using mock authentication');
      req.user = {
        id: 'mock-user-id',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'Mock User'
        }
      };
      return next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: '認証が必要です。ログインしてください。',
      code: 'UNAUTHORIZED'
    });
  }
};

// Middleware to check if user is premium
export const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check if user is premium (you'll need to implement this based on your user table)
  // For now, we'll assume premium status is stored in user metadata
  const isPremium = req.user.user_metadata?.is_premium || false;
  
  if (!isPremium) {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED'
    });
  }

  next();
};

// Middleware to check admin role
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Get user role from database using admin client to bypass RLS
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !userData) {
      return res.status(403).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (userData.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ 
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting middleware (basic implementation)
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }

    // Check current IP
    const userRequests = requests.get(key) || [];
    const recentRequests = userRequests.filter(ts => ts > windowStart);

    if (recentRequests.length >= max) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};
