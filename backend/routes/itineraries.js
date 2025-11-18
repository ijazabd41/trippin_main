import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get itineraries for a trip
router.get('/trip/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { day } = req.query;

    // First check if user owns the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('user_id')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({ 
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND'
      });
    }

    if (trip.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    let query = supabase
      .from('itineraries')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true })
      .order('start_time', { ascending: true });

    if (day) {
      query = query.eq('day_number', parseInt(day));
    }

    const { data: itineraries, error } = await query;

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to fetch itineraries',
        code: 'ITINERARIES_FETCH_ERROR'
      });
    }

    res.json({
      success: true,
      data: itineraries
    });
  } catch (error) {
    console.error('Get itineraries error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch itineraries',
      code: 'ITINERARIES_FETCH_ERROR'
    });
  }
});

// Get single itinerary
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: itinerary, error } = await supabase
      .from('itineraries')
      .select(`
        *,
        trips!itineraries_trip_id_fkey(user_id)
      `)
      .eq('id', id)
      .single();

    if (error || !itinerary) {
      return res.status(404).json({ 
        error: 'Itinerary not found',
        code: 'ITINERARY_NOT_FOUND'
      });
    }

    // Check if user owns the trip
    if (itinerary.trips.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch itinerary',
      code: 'ITINERARY_FETCH_ERROR'
    });
  }
});

// Create new itinerary item
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      trip_id,
      day_number,
      date,
      title,
      description,
      start_time,
      end_time,
      location,
      latitude,
      longitude,
      cost,
      currency,
      category,
      booking_reference,
      notes
    } = req.body;

    // Validate required fields
    if (!trip_id || !day_number || !date || !title) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if user owns the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('user_id')
      .eq('id', trip_id)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({ 
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND'
      });
    }

    if (trip.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const { data: itinerary, error } = await supabase
      .from('itineraries')
      .insert({
        trip_id,
        day_number,
        date,
        title,
        description,
        start_time,
        end_time,
        location,
        latitude,
        longitude,
        cost,
        currency,
        category,
        booking_reference,
        notes
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to create itinerary item',
        code: 'ITINERARY_CREATE_ERROR',
        details: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Create itinerary error:', error);
    res.status(500).json({ 
      error: 'Failed to create itinerary item',
      code: 'ITINERARY_CREATE_ERROR'
    });
  }
});

// Update itinerary item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.trip_id;
    delete updates.created_at;

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // First check if user owns the trip
    const { data: itinerary, error: fetchError } = await supabase
      .from('itineraries')
      .select(`
        *,
        trips!itineraries_trip_id_fkey(user_id)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !itinerary) {
      return res.status(404).json({ 
        error: 'Itinerary not found',
        code: 'ITINERARY_NOT_FOUND'
      });
    }

    if (itinerary.trips.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const { data: updatedItinerary, error } = await supabase
      .from('itineraries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to update itinerary',
        code: 'ITINERARY_UPDATE_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      data: updatedItinerary
    });
  } catch (error) {
    console.error('Update itinerary error:', error);
    res.status(500).json({ 
      error: 'Failed to update itinerary',
      code: 'ITINERARY_UPDATE_ERROR'
    });
  }
});

// Delete itinerary item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First check if user owns the trip
    const { data: itinerary, error: fetchError } = await supabase
      .from('itineraries')
      .select(`
        *,
        trips!itineraries_trip_id_fkey(user_id)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !itinerary) {
      return res.status(404).json({ 
        error: 'Itinerary not found',
        code: 'ITINERARY_NOT_FOUND'
      });
    }

    if (itinerary.trips.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to delete itinerary',
        code: 'ITINERARY_DELETE_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Itinerary item deleted successfully'
    });
  } catch (error) {
    console.error('Delete itinerary error:', error);
    res.status(500).json({ 
      error: 'Failed to delete itinerary',
      code: 'ITINERARY_DELETE_ERROR'
    });
  }
});

// Bulk update itineraries (for reordering)
router.put('/trip/:tripId/bulk', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { itineraries } = req.body;

    if (!Array.isArray(itineraries)) {
      return res.status(400).json({ 
        error: 'Itineraries must be an array',
        code: 'INVALID_INPUT'
      });
    }

    // Check if user owns the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('user_id')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({ 
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND'
      });
    }

    if (trip.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Update each itinerary item
    const updatePromises = itineraries.map((item, index) => 
      supabase
        .from('itineraries')
        .update({
          day_number: item.day_number,
          start_time: item.start_time,
          end_time: item.end_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .eq('trip_id', tripId)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Failed to update some itinerary items',
        code: 'BULK_UPDATE_ERROR',
        details: errors
      });
    }

    res.json({
      success: true,
      message: 'Itineraries updated successfully'
    });
  } catch (error) {
    console.error('Bulk update itineraries error:', error);
    res.status(500).json({ 
      error: 'Failed to update itineraries',
      code: 'BULK_UPDATE_ERROR'
    });
  }
});

export default router;
