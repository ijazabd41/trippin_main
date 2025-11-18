import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        user_preferences(*)
      `)
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ 
        error: 'User profile not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { 
      full_name, 
      phone, 
      date_of_birth, 
      nationality, 
      preferred_language, 
      timezone,
      bio,
      avatar,
      newsletter_subscription,
      notifications_enabled,
      marketing_emails
    } = req.body;

    // Update user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({
        full_name,
        phone,
        date_of_birth,
        nationality,
        preferred_language,
        timezone,
        avatar_url: avatar, // Map avatar to avatar_url
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ 
        error: 'Failed to update profile',
        code: 'PROFILE_UPDATE_ERROR',
        details: userError.message
      });
    }

    // Update user preferences if provided
    if (newsletter_subscription !== undefined || notifications_enabled !== undefined || marketing_emails !== undefined) {
      try {
        // Check if preferences exist
        const { data: existingPrefs } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', req.user.id)
          .single();

        const updateData = {};
        if (newsletter_subscription !== undefined) updateData.newsletter_subscription = newsletter_subscription;
        if (notifications_enabled !== undefined) updateData.notifications_enabled = notifications_enabled;
        if (marketing_emails !== undefined) updateData.marketing_emails = marketing_emails;
        updateData.updated_at = new Date().toISOString();

        if (existingPrefs) {
          // Update existing preferences
          const { error: prefsError } = await supabase
            .from('user_preferences')
            .update(updateData)
            .eq('user_id', req.user.id);

          if (prefsError) {
            console.error('Preferences update error:', prefsError);
            // Don't fail the entire request for preferences
          }
        } else {
          // Create new preferences
          const { error: prefsError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: req.user.id,
              ...updateData
            });

          if (prefsError) {
            console.error('Preferences create error:', prefsError);
            // Don't fail the entire request for preferences
          }
        }
      } catch (prefsError) {
        console.error('Preferences handling error:', prefsError);
        // Don't fail the entire request for preferences
      }
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const {
      travel_style,
      budget_range,
      accommodation_preference,
      transportation_preference,
      interests,
      dietary_restrictions,
      accessibility_needs
    } = req.body;

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let result;
    if (existingPrefs) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          travel_style,
          budget_range,
          accommodation_preference,
          transportation_preference,
          interests,
          dietary_restrictions,
          accessibility_needs,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: req.user.id,
          travel_style,
          budget_range,
          accommodation_preference,
          transportation_preference,
          interests,
          dietary_restrictions,
          accessibility_needs
        })
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      return res.status(400).json({ 
        error: 'Failed to update preferences',
        code: 'PREFERENCES_UPDATE_ERROR',
        details: result.error.message
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ 
      error: 'Failed to update preferences',
      code: 'PREFERENCES_UPDATE_ERROR'
    });
  }
});

// Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to fetch notifications',
        code: 'NOTIFICATIONS_FETCH_ERROR'
      });
    }

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      code: 'NOTIFICATIONS_FETCH_ERROR'
    });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to mark notification as read',
        code: 'NOTIFICATION_UPDATE_ERROR'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ 
      error: 'Failed to mark notification as read',
      code: 'NOTIFICATION_UPDATE_ERROR'
    });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to mark all notifications as read',
        code: 'NOTIFICATIONS_UPDATE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ 
      error: 'Failed to mark all notifications as read',
      code: 'NOTIFICATIONS_UPDATE_ERROR'
    });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    // This will cascade delete all related data due to foreign key constraints
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user.id);

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to delete account',
        code: 'ACCOUNT_DELETE_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      error: 'Failed to delete account',
      code: 'ACCOUNT_DELETE_ERROR'
    });
  }
});

export default router;
