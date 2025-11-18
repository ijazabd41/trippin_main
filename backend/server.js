// Load environment variables FIRST, before any other imports
// This ensures environment variables are available when route files are imported
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file (backend/server.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly load .env from the backend directory
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes (after environment variables are loaded)
import authRoutes from './routes/auth.js';
import supabaseAuthRoutes from './routes/supabase-auth.js';
import tripRoutes from './routes/trips.js';
import itineraryRoutes from './routes/itineraries.js';
import paymentRoutes from './routes/payments.js';
import subscriptionRoutes from './routes/subscriptions.js';
import openaiRoutes from './routes/openai.js';
import googleMapsRoutes from './routes/google-maps.js';
import googleTranslateRoutes from './routes/google-translate.js';
import esimRoutes from './routes/esim.js';
import esimProviderRoutes from './routes/esim-provider-integration.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// Stripe webhook raw body must be available for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logger (dev aid)
app.use((req, res, next) => {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    // Log route matching for debugging
    if (req.originalUrl.includes('/api/esim')) {
      console.log(`🔍 ESIM route request: ${req.method} ${req.originalUrl}`, {
        path: req.path,
        baseUrl: req.baseUrl,
        url: req.url
      });
    }
  } catch {}
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint for frontend connection
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is accessible from frontend',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/supabase-auth', supabaseAuthRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/google-maps', googleMapsRoutes);
app.use('/api/google-translate', googleTranslateRoutes);
app.use('/api/esim', esimRoutes);
app.use('/api/esim-provider', esimProviderRoutes);

// Debug: Log all registered routes (dev only)
if (process.env.NODE_ENV === 'development') {
  console.log('📋 Registered ESIM routes:', {
    base: '/api/esim',
    routes: ['/purchase (POST)', '/plans (GET)', '/orders (GET)', '/test (GET)']
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Trippin Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      supabaseAuth: '/api/supabase-auth',
      trips: '/api/trips',
      itineraries: '/api/itineraries',
      bookings: '/api/bookings',
      payments: '/api/payments'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trippin Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
