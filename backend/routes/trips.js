import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint without authentication
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Trips endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// Get all trips for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    // Check if Supabase is configured, if not return mock data
    console.log('🔍 Environment check in trips route:', {
      SUPABASE_URL: process.env.SUPABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      isUndefined: process.env.SUPABASE_URL === undefined,
      isDefault: process.env.SUPABASE_URL === 'https://your-project.supabase.co'
    });
    
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://your-project.supabase.co') {
      console.log('⚠️ Supabase not configured, returning mock trips data');
      const mockTrips = [
        {
          id: 'mock-trip-1',
          user_id: req.user?.id || 'mock-user-id',
          title: 'Tokyo Adventure',
          description: 'A wonderful trip to Tokyo, Japan',
          destination: 'Tokyo, Japan',
          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'planning',
          budget: 2000,
          currency: 'USD',
          travelers: 2,
          interests: ['culture', 'food', 'sightseeing'],
          image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          itineraries: [],
          bookings: []
        },
        {
          id: 'mock-trip-2',
          user_id: req.user?.id || 'mock-user-id',
          title: 'Paris Getaway',
          description: 'Romantic trip to the City of Light',
          destination: 'Paris, France',
          start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'upcoming',
          budget: 1500,
          currency: 'EUR',
          travelers: 2,
          interests: ['art', 'romance', 'history'],
          image_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800',
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          itineraries: [],
          bookings: []
        }
      ];

      return res.json({
        success: true,
        data: mockTrips
      });
    }

    // For development, return mock data if database query fails
    if (process.env.NODE_ENV === 'development') {
      try {
        let query = supabase
          .from('trips')
          .select(`
            *,
            itineraries(*),
            bookings(*)
          `)
          .eq('user_id', req.user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq('status', status);
        }

        const { data: trips, error } = await query;

        if (error) {
          console.warn('Database query failed, returning mock data:', error.message);
          // Return mock data for development
          const mockTrips = [
            {
              id: 'mock-trip-1',
              user_id: req.user.id,
              title: 'Tokyo Adventure',
              description: 'A wonderful trip to Tokyo, Japan',
              destination: 'Tokyo, Japan',
              start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'planning',
              budget: 2000,
              currency: 'USD',
              travelers: 2,
              interests: ['culture', 'food', 'sightseeing'],
              image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
              is_public: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              itineraries: [],
              bookings: []
            },
            {
              id: 'mock-trip-2',
              user_id: req.user.id,
              title: 'Paris Getaway',
              description: 'Romantic trip to the City of Light',
              destination: 'Paris, France',
              start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end_date: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'upcoming',
              budget: 1500,
              currency: 'EUR',
              travelers: 2,
              interests: ['art', 'romance', 'history'],
              image_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800',
              is_public: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              itineraries: [],
              bookings: []
            }
          ];

          return res.json({
            success: true,
            data: mockTrips
          });
        }

        return res.json({
          success: true,
          data: trips
        });
      } catch (dbError) {
        console.warn('Database error, returning mock data:', dbError.message);
        // Return mock data if database is not available
        const mockTrips = [
          {
            id: 'mock-trip-1',
            user_id: req.user.id,
            title: 'Tokyo Adventure',
            description: 'A wonderful trip to Tokyo, Japan',
            destination: 'Tokyo, Japan',
            start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'planning',
            budget: 2000,
            currency: 'USD',
            travelers: 2,
            interests: ['culture', 'food', 'sightseeing'],
            image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
            is_public: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            itineraries: [],
            bookings: []
          }
        ];

        return res.json({
          success: true,
          data: mockTrips
        });
      }
    }

    // Production mode - use database
    let query = supabase
      .from('trips')
      .select(`
        *,
        itineraries(*),
        bookings(*)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: trips, error } = await query;

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to fetch trips',
        code: 'TRIPS_FETCH_ERROR'
      });
    }

    res.json({
      success: true,
      data: trips
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trips',
      code: 'TRIPS_FETCH_ERROR'
    });
  }
});

// Get public trips (for discovery)
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const { destination, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('trips')
      .select(`
        id,
        title,
        description,
        destination,
        start_date,
        end_date,
        budget,
        currency,
        travelers,
        interests,
        image_url,
        created_at,
        users!trips_user_id_fkey(full_name, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (destination) {
      query = query.ilike('destination', `%${destination}%`);
    }

    const { data: trips, error } = await query;

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to fetch public trips',
        code: 'PUBLIC_TRIPS_FETCH_ERROR'
      });
    }

    res.json({
      success: true,
      data: trips
    });
  } catch (error) {
    console.error('Get public trips error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch public trips',
      code: 'PUBLIC_TRIPS_FETCH_ERROR'
    });
  }
});

// Get single trip by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        *,
        itineraries(*),
        bookings(*),
        users!trips_user_id_fkey(full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND'
      });
    }

    // Check if user owns the trip or if it's public
    if (trip.user_id !== req.user.id && !trip.is_public) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'TRIP_ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trip',
      code: 'TRIP_FETCH_ERROR'
    });
  }
});

// Create new trip
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      destination,
      start_date,
      end_date,
      budget,
      currency = 'USD',
      travelers = 1,
      interests = [],
      image_url,
      is_public = false
    } = req.body;

    // Validate required fields
    if (!title || !destination || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: req.user.id,
        title,
        description,
        destination,
        start_date,
        end_date,
        budget,
        currency,
        travelers,
        interests,
        image_url,
        is_public
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to create trip',
        code: 'TRIP_CREATE_ERROR',
        details: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ 
      error: 'Failed to create trip',
      code: 'TRIP_CREATE_ERROR'
    });
  }
});

// Update trip
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data: trip, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to update trip',
        code: 'TRIP_UPDATE_ERROR',
        details: error.message
      });
    }

    if (!trip) {
      return res.status(404).json({ 
        error: 'Trip not found or access denied',
        code: 'TRIP_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ 
      error: 'Failed to update trip',
      code: 'TRIP_UPDATE_ERROR'
    });
  }
});

// Delete trip
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to delete trip',
        code: 'TRIP_DELETE_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ 
      error: 'Failed to delete trip',
      code: 'TRIP_DELETE_ERROR'
    });
  }
});

// Add trip to favorites
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert({
        user_id: req.user.id,
        trip_id: id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ 
          error: 'Trip already in favorites',
          code: 'ALREADY_FAVORITED'
        });
      }
      return res.status(400).json({ 
        error: 'Failed to add to favorites',
        code: 'FAVORITE_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      data: favorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ 
      error: 'Failed to add to favorites',
      code: 'FAVORITE_ERROR'
    });
  }
});

// Remove trip from favorites
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', req.user.id)
      .eq('trip_id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to remove from favorites',
        code: 'FAVORITE_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ 
      error: 'Failed to remove from favorites',
      code: 'FAVORITE_ERROR'
    });
  }
});

// Share trip
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { expires_in_days = 30 } = req.body;

    // Generate share token
    const shareToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    const { data: share, error } = await supabase
      .from('shared_trips')
      .insert({
        trip_id: id,
        share_token: shareToken,
        expires_at: expiresAt.toISOString(),
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to create share link',
        code: 'SHARE_ERROR',
        details: error.message
      });
    }

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${shareToken}`;

    res.json({
      success: true,
      data: {
        share_token: shareToken,
        share_url: shareUrl,
        expires_at: share.expires_at
      }
    });
  } catch (error) {
    console.error('Share trip error:', error);
    res.status(500).json({ 
      error: 'Failed to create share link',
      code: 'SHARE_ERROR'
    });
  }
});

// Get shared trip by token
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const { data: share, error } = await supabase
      .from('shared_trips')
      .select(`
        *,
        trips(*,
          itineraries(*),
          users!trips_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (error || !share) {
      return res.status(404).json({ 
        error: 'Shared trip not found or expired',
        code: 'SHARED_TRIP_NOT_FOUND'
      });
    }

    // Check if expired
    if (new Date(share.expires_at) < new Date()) {
      return res.status(410).json({ 
        error: 'Share link has expired',
        code: 'SHARE_EXPIRED'
      });
    }

    // Update access count
    await supabase
      .from('shared_trips')
      .update({ access_count: share.access_count + 1 })
      .eq('id', share.id);

    res.json({
      success: true,
      data: share
    });
  } catch (error) {
    console.error('Get shared trip error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shared trip',
      code: 'SHARED_TRIP_FETCH_ERROR'
    });
  }
});

export default router;
