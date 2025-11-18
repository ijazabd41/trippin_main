import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth components
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Login attempt with:', { email, password: '***' });
      const { error } = await signIn(email, password);
      console.log('Login result:', { error });
      
      if (error) {
        console.error('Login error details:', error);
        // Show more specific error messages
        if (error.message.includes('Invalid credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('EMAIL_NOT_VERIFIED')) {
          setError('Please verify your email before signing in. Check your inbox for a verification link or use the manual verification below.');
        } else if (error.message.includes('Please sign up first')) {
          setError('No account found with this email. Please sign up first.');
        } else {
          setError(error.message);
        }
      } else {
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => navigate('/supabase-auth/register')}
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              create a new account
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={() => navigate('/supabase-auth/forgot-password')}
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignInButton />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Starting signup process...');
      const { error } = await signUp(email, password, { full_name: fullName });
      console.log('Signup result:', { error });
      
      if (error) {
        console.error('Signup error:', error);
        setError(error.message);
      } else {
        console.log('Signup successful, navigating to verify-email page');
        navigate('/supabase-auth/verify-email');
      }
    } catch (err) {
      console.error('Signup exception:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => navigate('/auth/login')}
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              sign in to your existing account
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Create a password"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignInButton />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/supabase-auth/login')}
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

const GoogleSignInButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useSupabaseAuth();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google sign in error:', error);
      }
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </>
      )}
    </button>
  );
};

const VerifyEmailPage: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { signIn } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Debug: Log the full URL to see what we're working with
    console.log('Full URL:', window.location.href);
    console.log('Search params:', window.location.search);
    console.log('Hash params:', window.location.hash);
    
    // Check if we have verification parameters in the URL (both query and hash)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1)); // Remove # from hash
    
    // Also check for fragment-based parameters (common in Supabase redirects)
    const fragment = window.location.hash.substring(1);
    const fragmentParams = new URLSearchParams(fragment);
    
    const token = urlParams.get('token') || hashParams.get('token') || fragmentParams.get('token');
    const type = urlParams.get('type') || hashParams.get('type') || fragmentParams.get('type');
    const email = urlParams.get('email') || hashParams.get('email') || fragmentParams.get('email');
    
    // Debug: Log all parameters we found
    console.log('Found parameters:', { token: token ? token.substring(0, 20) + '...' : null, type, email });
    console.log('All URL params:', Object.fromEntries(urlParams.entries()));
    console.log('All hash params:', Object.fromEntries(hashParams.entries()));
    console.log('All fragment params:', Object.fromEntries(fragmentParams.entries()));
    
    // Store email for resend functionality
    if (email) {
      setUserEmail(email);
    }
    
    // Check for error parameters in hash and fragment
    const error = hashParams.get('error') || fragmentParams.get('error');
    const errorCode = hashParams.get('error_code') || fragmentParams.get('error_code');
    const errorDescription = hashParams.get('error_description') || fragmentParams.get('error_description');

    console.log('Error parameters:', { error, errorCode, errorDescription });

    if (error) {
      // Handle verification errors
      setVerificationStatus('error');
      if (errorCode === 'otp_expired') {
        setMessage('The verification link has expired. This usually happens if the link is older than 24 hours. Please request a new verification email below.');
      } else if (errorCode === 'access_denied') {
        setMessage('The verification link is invalid or has already been used. Please request a new verification email below.');
      } else {
        setMessage(`Verification failed: ${errorDescription || error}`);
      }
    } else if (token && type) {
      handleEmailVerification(token, type, email);
    } else {
      // Check if this might be a Supabase callback URL
      const isSupabaseCallback = window.location.href.includes('supabase.co') || 
                                 window.location.href.includes('auth/v1/verify');
      
      if (isSupabaseCallback) {
        setMessage('This appears to be a Supabase verification callback. Please check the browser console for debugging information.');
        console.log('Supabase callback detected. Full URL:', window.location.href);
      } else {
        // Check if this is a successful verification redirect from Supabase
        // Supabase might redirect with success parameters
        const success = urlParams.get('success') || hashParams.get('success');
        const message = urlParams.get('message') || hashParams.get('message');
        
        if (success === 'true' || message) {
          console.log('Supabase verification success detected:', { success, message });
          setVerificationStatus('success');
          setMessage('Email verified successfully! You can now sign in.');
          
          // Auto-redirect to login after 2 seconds
          setTimeout(() => {
            navigate('/supabase-auth/login');
          }, 2000);
        } else {
          // No verification parameters, show the "check your email" message
          setMessage('We\'ve sent you a verification link. Please check your email and click the link to verify your account.');
        }
      }
    }
  }, []);

  const handleEmailVerification = async (token: string, type: string, email?: string | null) => {
    setIsVerifying(true);
    setMessage('Verifying your email...');

    try {
      // First try using Supabase client directly for verification
      console.log('Attempting Supabase verification with:', { 
        token: token.substring(0, 20) + '...', 
        type, 
        email,
        tokenLength: token.length 
      });
      
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // For email verification links, we need to use verifyOtp with the correct type
        // The type should be 'signup' for email verification links
        const verificationType = type === 'email' ? 'signup' : type;
        
        console.log('Using verification type:', verificationType);
        
        const { data, error } = await supabase.auth.verifyOtp({
          token: token,
          type: verificationType as any
        });
        
        if (error) {
          console.error('Supabase verification failed:', error);
          console.log('Error details:', {
            message: error.message,
            status: error.status,
            name: error.name,
            code: error.code
          });
          
          // Check for specific error types
          if (error.message.includes('expired') || error.message.includes('invalid') || error.code === 'otp_expired') {
            setVerificationStatus('error');
            setMessage('The verification link has expired or is invalid. Please request a new verification email.');
            return;
          }
          
          // Try with different type if the first attempt failed
          if (type !== 'signup') {
            console.log('Trying with type "signup"...');
            const { data: retryData, error: retryError } = await supabase.auth.verifyOtp({
              token: token,
              type: 'signup' as any
            });
            
            if (retryError) {
              console.error('Retry verification failed:', retryError);
              setVerificationStatus('error');
              setMessage('The verification link is invalid or has expired. Please request a new verification email.');
              return;
            } else {
              console.log('Retry verification successful:', retryData);
              setVerificationStatus('success');
              setMessage('Email verified successfully! You can now sign in.');
              
              // Auto-redirect to login after 2 seconds
              setTimeout(() => {
                navigate('/supabase-auth/login');
              }, 2000);
              return;
            }
          }
          
          setVerificationStatus('error');
          setMessage('The verification link is invalid or has expired. Please request a new verification email.');
          return;
        } else {
          console.log('Supabase verification successful:', data);
          setVerificationStatus('success');
          setMessage('Email verified successfully! You can now sign in.');
          
          // Auto-redirect to login after 2 seconds
          setTimeout(() => {
            navigate('/supabase-auth/login');
          }, 2000);
        }
      } else {
        console.log('Supabase not configured, using backend verification');
        // Fall back to backend verification
        const response = await fetch('http://localhost:3001/api/supabase-auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            type
          })
        });

        const data = await response.json();
        console.log('Backend verification response:', data);

        if (response.ok) {
          setVerificationStatus('success');
          setMessage('Email verified successfully! You can now sign in.');
          
          // Auto-redirect to login after 2 seconds
          setTimeout(() => {
            navigate('/supabase-auth/login');
          }, 2000);
        } else {
          setVerificationStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setMessage('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    // Use stored email or prompt for it
    const email = userEmail || prompt('Please enter your email address to resend verification:');
    if (!email) return;

    try {
      const response = await fetch('http://localhost:3001/api/supabase-auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(data.error || 'Failed to resend verification email.');
      }
    } catch (error) {
      setMessage('Failed to resend verification email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {verificationStatus === 'success' ? 'Email Verified!' : 
             verificationStatus === 'error' ? 'Verification Failed' : 
             'Check your email'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>

        {verificationStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            <p className="text-sm">Redirecting to login page...</p>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            <p className="text-sm mb-3">Please try again or contact support if the problem persists.</p>
            <button
              onClick={handleResendVerification}
              className="w-full flex justify-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Resend verification email
            </button>
          </div>
        )}

        {isVerifying && (
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => navigate('/supabase-auth/login')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Back to Sign In
          </button>

        {verificationStatus !== 'success' && (
          <div className="space-y-2">
            <button
              onClick={handleResendVerification}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Resend Verification Email
            </button>
            
            <div className="text-xs text-gray-500 text-center mt-2">
              <p>If the link keeps expiring, the issue might be:</p>
              <ul className="text-left mt-1 space-y-1">
                <li>• Link already used (can only be used once)</li>
                <li>• Link older than 24 hours</li>
                <li>• Wrong redirect URL configuration</li>
              </ul>
            </div>
            
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const { resetPassword } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {message}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Back to sign in
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};






const OAuthCallback: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session, user } = useSupabaseAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('OAuth callback: Starting authentication process...');
        
        // Check if we already have a valid session
        if (session && user) {
          console.log('OAuth callback: User already authenticated, redirecting...');
          const returnUrl = sessionStorage.getItem('oauth-return-url') || '/dashboard';
          sessionStorage.removeItem('oauth-return-url');
          navigate(returnUrl, { replace: true });
          return;
        }

        // Check for OAuth parameters in both URL search params and hash fragment
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        console.log('OAuth callback: URL params:', Object.fromEntries(urlParams.entries()));
        console.log('OAuth callback: Hash params:', Object.fromEntries(hashParams.entries()));
        
        // Check for error parameters
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (error) {
          console.error('OAuth callback error:', error, errorDescription);
          setError(`Authentication failed: ${errorDescription || error}`);
          setIsLoading(false);
          return;
        }

        // Check for success parameters (access token, etc.)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresAt = hashParams.get('expires_at');
        const tokenType = hashParams.get('token_type') || 'bearer';
        
        if (accessToken) {
          console.log('OAuth callback: Found access token, processing authentication...');
          
          try {
            // Create a session object from the OAuth parameters
            const sessionData = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt ? parseInt(expiresAt) : null,
              token_type: tokenType,
              user: null // Will be populated by Supabase
            };
            
            console.log('OAuth callback: Setting session with data:', {
              hasAccessToken: !!sessionData.access_token,
              hasRefreshToken: !!sessionData.refresh_token,
              expiresAt: sessionData.expires_at
            });
            
            // First, try to get user info directly from the access token (faster approach)
            let userData = null;
            try {
              const getUserPromise = supabase.auth.getUser(sessionData.access_token);
              const getUserTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('getUser timeout')), 10000)
              );
              
              const { data: { user }, error: userError } = await Promise.race([getUserPromise, getUserTimeoutPromise]);
              
              if (!userError && user) {
                userData = user;
                console.log('OAuth callback: User info retrieved successfully');
              } else {
                console.warn('OAuth callback: Failed to get user info:', userError);
              }
            } catch (getUserError) {
              console.warn('OAuth callback: getUser timed out or failed:', getUserError);
            }
            
            // Store session and user data in localStorage immediately
            localStorage.setItem('supabase-session', JSON.stringify(sessionData));
            if (userData) {
              localStorage.setItem('supabase-user', JSON.stringify(userData));
            }
            console.log('OAuth callback: Session stored in localStorage');
            
            // Try to set session in Supabase client (non-blocking)
            try {
              const setSessionPromise = supabase.auth.setSession(sessionData);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Session setup timeout')), 15000)
              );
              
              const { data, error: setSessionError } = await Promise.race([setSessionPromise, timeoutPromise]);
              
              if (!setSessionError && data.session && data.user) {
                console.log('OAuth callback: Supabase session set successfully');
                // Update localStorage with the complete session data
                localStorage.setItem('supabase-session', JSON.stringify(data.session));
                localStorage.setItem('supabase-user', JSON.stringify(data.user));
              } else {
                console.warn('OAuth callback: Supabase session setup failed, but localStorage session is available');
              }
            } catch (setSessionError) {
              console.warn('OAuth callback: Supabase session setup timed out, but localStorage session is available');
            }
            
            // If we have user data (either from getUser or from setSession), proceed
            if (userData || localStorage.getItem('supabase-user')) {
              console.log('OAuth callback: Authentication successful, redirecting...');
              
              // Get return URL and redirect
              const returnUrl = sessionStorage.getItem('oauth-return-url') || '/dashboard';
              sessionStorage.removeItem('oauth-return-url');
              
              console.log('OAuth callback: Redirecting to:', returnUrl);
              
              // Add a small delay to ensure the auth context has time to process the session
              setTimeout(() => {
                navigate(returnUrl, { replace: true });
              }, 100);
              return;
            } else {
              console.error('OAuth callback: No user data available');
              setError('Failed to complete authentication. Please try again.');
            }
          } catch (sessionError) {
            console.error('Error processing OAuth session:', sessionError);
            setError('Failed to complete authentication. Please try again.');
          }
        } else {
          // No access token found - check if we're still waiting for Supabase to process
          console.log('OAuth callback: No access token found, checking for existing session...');
          
          // Try to get existing session from Supabase with timeout
          try {
            const getSessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('getSession timeout')), 8000)
            );
            
            const { data: { session: existingSession }, error: sessionError } = await Promise.race([getSessionPromise, timeoutPromise]);
            
            if (!sessionError && existingSession) {
              console.log('OAuth callback: Found existing session, redirecting...');
              const returnUrl = sessionStorage.getItem('oauth-return-url') || '/dashboard';
              sessionStorage.removeItem('oauth-return-url');
              navigate(returnUrl, { replace: true });
              return;
            }
          } catch (getSessionError) {
            if (getSessionError.message === 'getSession timeout') {
              console.warn('OAuth callback: getSession timed out, checking localStorage...');
              
              // Fallback: Check localStorage for session
              const storedSession = localStorage.getItem('supabase-session');
              const storedUser = localStorage.getItem('supabase-user');
              
              if (storedSession && storedUser) {
                try {
                  const sessionData = JSON.parse(storedSession);
                  const userData = JSON.parse(storedUser);
                  
                  // Check if session is still valid
                  const isExpired = sessionData.expires_at && sessionData.expires_at <= Date.now() / 1000;
                  
                  if (!isExpired) {
                    console.log('OAuth callback: Found valid session in localStorage, redirecting...');
                    const returnUrl = sessionStorage.getItem('oauth-return-url') || '/dashboard';
                    sessionStorage.removeItem('oauth-return-url');
                    navigate(returnUrl, { replace: true });
                    return;
                  }
                } catch (parseError) {
                  console.error('OAuth callback: Failed to parse stored session:', parseError);
                }
              }
            } else {
              console.error('Error getting existing session:', getSessionError);
            }
          }
          
          // If no session found, wait a bit more for OAuth to complete
          console.log('OAuth callback: No session found, waiting for OAuth completion...');
          setTimeout(() => {
            if (!session) {
              console.log('OAuth callback: Still no session after waiting, showing error');
              setError('Authentication timed out. Please try again.');
              setIsLoading(false);
            }
          }, 3000);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('An unexpected error occurred during authentication.');
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure the auth context has time to initialize
    const timeoutId = setTimeout(handleOAuthCallback, 100);
    
    return () => clearTimeout(timeoutId);
  }, [session, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/supabase-auth/login')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const SupabaseAuthPage: React.FC = () => {
  const { user, isLoading } = useSupabaseAuth();
  const navigate = useNavigate();

  // Debug logging
  console.log('SupabaseAuthPage: Current user:', user);
  console.log('SupabaseAuthPage: Current pathname:', window.location.pathname);
  console.log('SupabaseAuthPage: Is loading:', isLoading);

  // Handle authentication state changes
  useEffect(() => {
    if (!isLoading && user && user.email_confirmed_at) {
      console.log('SupabaseAuthPage: User became authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Don't redirect while loading - wait for session restoration to complete
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated AND email is verified
  if (user && user.email_confirmed_at) {
    console.log('SupabaseAuthPage: User is authenticated and verified, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/callback" element={<OAuthCallback />} />
      <Route path="/" element={<Navigate to="/supabase-auth/login" replace />} />
    </Routes>
  );
};

export default SupabaseAuthPage;
