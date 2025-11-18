import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Sign up with email and password
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // For development/testing, create a mock user if Supabase fails
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone
        },
        // Use configured frontend URL for email confirmations
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/supabase-auth/verify-email`
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return res.status(400).json({ 
        error: 'Failed to create account',
        code: 'SIGNUP_ERROR',
        details: error.message
      });
    }

    // Check if email verification is required
    const needsVerification = data.user && !data.user.email_confirmed_at;
    
    res.status(201).json({
      success: true,
      message: needsVerification 
        ? 'Account created successfully. Please check your email and click the verification link to activate your account.'
        : 'Account created successfully.',
      data: {
        user: data.user,
        session: data.session,
        needsVerification
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Failed to create account',
      code: 'SIGNUP_ERROR'
    });
  }
});

// Sign in with email and password
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase signin error:', error);
      
      // Handle specific Supabase auth errors
      if (error.code === 'email_not_confirmed') {
        return res.status(403).json({ 
          error: 'Please verify your email before signing in. Check your inbox for a verification link.',
          code: 'EMAIL_NOT_VERIFIED',
          details: 'Email verification required'
        });
      } else if (error.code === 'invalid_credentials') {
        return res.status(401).json({ 
          error: 'Invalid email or password. Please check your credentials and try again.',
          code: 'INVALID_CREDENTIALS',
          details: error.message
        });
      } else {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'SIGNIN_ERROR',
          details: error.message
        });
      }
    }

    // Check if email is verified
    if (data.user && !data.user.email_confirmed_at) {
      return res.status(403).json({ 
        error: 'Please verify your email before signing in. Check your inbox for a verification link.',
        code: 'EMAIL_NOT_VERIFIED',
        details: 'Email verification required'
      });
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ 
      error: 'Failed to sign in',
      code: 'SIGNIN_ERROR'
    });
  }
});

// Sign in with Google
router.post('/signin/google', async (req, res) => {
  try {
    const { redirectTo } = req.body;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/supabase-auth/callback`
      }
    });

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to initiate Google sign in',
        code: 'GOOGLE_SIGNIN_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      data: {
        url: data.url
      }
    });
  } catch (error) {
    console.error('Google signin error:', error);
    res.status(500).json({ 
      error: 'Failed to initiate Google sign in',
      code: 'GOOGLE_SIGNIN_ERROR'
    });
  }
});

// Sign out
// Note: Signout should work without authentication since users may sign out
// when their token is expired or invalid. We use optional auth middleware.
router.post('/signout', async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://your-project.supabase.co') {
      console.log('⚠️ Supabase not configured, using mock signout');
      return res.json({
        success: true,
        message: 'Signed out successfully'
      });
    }

    // Try to get token from request (optional for signout)
    // If token exists, we can use it, but signout should work even without it
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // If token exists, try to sign out with it
    // Otherwise, just return success (clearing client-side session)
    if (token) {
      try {
        // Try to sign out with the token
        // Note: Supabase signOut() doesn't actually need the token in the request,
        // it uses the session that was created with the token
        const { error } = await supabase.auth.signOut();

        if (error) {
          // If signout fails, still return success since client will clear session anyway
          console.warn('Supabase signout error (non-critical):', error.message);
        }
      } catch (signOutError) {
        // Non-critical error - client will clear session anyway
        console.warn('Signout error (non-critical):', signOutError.message);
      }
    }

    // Always return success - client-side session clearing is what matters
    res.json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (error) {
    console.error('Signout error:', error);
    // Even on error, return success since client will handle session clearing
    res.json({
      success: true,
      message: 'Signed out successfully'
    });
  }
});

// Refresh session
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ 
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        code: 'REFRESH_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Refresh session error:', error);
    res.status(500).json({ 
      error: 'Failed to refresh session',
      code: 'REFRESH_ERROR'
    });
  }
});

// Get current user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    // User already verified and attached by authenticateToken
    return res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user',
      code: 'USER_FETCH_ERROR'
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password`
    });

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to send reset email',
        code: 'RESET_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Failed to send reset email',
      code: 'RESET_ERROR'
    });
  }
});

// Update password
router.put('/update-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        error: 'New password is required',
        code: 'MISSING_PASSWORD'
      });
    }

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to update password',
        code: 'PASSWORD_UPDATE_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ 
      error: 'Failed to update password',
      code: 'PASSWORD_UPDATE_ERROR'
    });
  }
});

// Delete user account
router.delete('/user', authenticateToken, async (req, res) => {
  try {
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

// Email verification endpoint - handles Supabase email verification links
router.post('/verify-email', async (req, res) => {
  try {
    const { token, type, email } = req.body;

    if (!token || !type) {
      return res.status(400).json({ 
        error: 'Token and type are required',
        code: 'MISSING_FIELDS'
      });
    }

    console.log('Email verification attempt:', { 
      token: token.substring(0, 20) + '...', 
      type, 
      email,
      tokenLength: token.length 
    });

    // For email verification links, we need to use verifyOtp with the correct parameters
    // But first, let's check if this is actually an OTP token or a different type
    let verificationResult;
    
    // For email verification links, the type should be 'signup'
    const verificationType = type === 'email' ? 'signup' : type;
    
    console.log('Using verification type:', verificationType);
    
    verificationResult = await supabase.auth.verifyOtp({
      token: token,
      type: verificationType
    });

    const { data, error } = verificationResult;

    if (error) {
      console.error('Email verification error:', error);
      return res.status(400).json({ 
        error: 'Invalid verification token',
        code: 'VERIFICATION_ERROR',
        details: error.message
      });
    }

    console.log('Email verification successful:', { 
      userId: data.user?.id, 
      emailConfirmed: data.user?.email_confirmed_at 
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ 
      error: 'Failed to verify email',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/supabase-auth/verify-email`
      }
    });

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to resend verification email',
        code: 'RESEND_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      error: 'Failed to resend verification email',
      code: 'RESEND_ERROR'
    });
  }
});

// Manual verification endpoint (for debugging)
router.post('/manual-verify', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    // First, get the user by email to get their ID
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      return res.status(400).json({ 
        error: 'Failed to find user',
        code: 'USER_NOT_FOUND',
        details: userError.message
      });
    }
    
    const user = userData.users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Now update the user to mark as verified
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (error) {
      console.error('Manual verification error:', error);
      return res.status(400).json({ 
        error: 'Failed to manually verify user',
        code: 'MANUAL_VERIFY_ERROR',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'User manually verified successfully',
      data: data
    });
  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({ 
      error: 'Failed to manually verify user',
      code: 'MANUAL_VERIFY_ERROR'
    });
  }
});

// This endpoint is already defined above with authentication
// Removing duplicate endpoint

export default router;
