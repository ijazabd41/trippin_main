import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { backendService } from '../services/BackendService';
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  is_premium?: boolean;
  role?: string;
}

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  clearAuthData: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  refreshUserProfileFromBackend: () => Promise<any>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  restoreSessionFromStorage: () => Promise<{ session: Session; user: User } | null>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

// Load runtime config (optional)
let runtimeConfig: { supabaseUrl?: string; supabaseAnonKey?: string } = {};
try {
  // This fetch will be ignored by bundlers at build time since it's not executed here; it's for clarity
} catch {}

// Supabase client configuration with runtime override
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseUrl = (window as any).__APP_CONFIG__?.supabaseUrl || runtimeConfig.supabaseUrl || envSupabaseUrl;
const supabaseAnonKey = (window as any).__APP_CONFIG__?.supabaseAnonKey || runtimeConfig.supabaseAnonKey || envSupabaseAnonKey;

// Helper function to get the correct frontend URL for redirects
const getFrontendUrl = (): string => {
  // Use environment variable if set (for production)
  const envFrontendUrl = import.meta.env.VITE_FRONTEND_URL;
  if (envFrontendUrl) {
    return envFrontendUrl;
  }
  // Fall back to window.location.origin (works for both dev and prod)
  return window.location.origin;
};

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl !== 'https://your-project.supabase.co' && supabaseAnonKey !== 'your-anon-key' && !!supabaseUrl && !!supabaseAnonKey;

// Debug logging
console.log('Supabase configuration check:', JSON.stringify({
  supabaseUrl: supabaseUrl ? 'configured' : 'not configured',
  supabaseAnonKey: supabaseAnonKey ? 'configured' : 'not configured',
  isSupabaseConfigured,
  envSupabaseUrl: envSupabaseUrl ? 'configured' : 'not configured',
  envSupabaseAnonKey: envSupabaseAnonKey ? 'configured' : 'not configured'
}, null, 2));

// Additional debugging for timeout issues
console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
console.log('🔍 Is Supabase configured:', isSupabaseConfigured);

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const isUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    // Return a default context instead of throwing to prevent crashes
    // This allows components to work even if provider isn't ready yet
    console.warn('useSupabaseAuth called outside SupabaseAuthProvider, returning default context');
    return {
      user: null,
      session: null,
      userProfile: null,
      isLoading: false,
      isAuthenticated: false,
      signUp: async () => ({ error: new Error('Auth provider not available') }),
      signIn: async () => ({ error: new Error('Auth provider not available') }),
      signInWithGoogle: async () => ({ error: new Error('Auth provider not available') }),
      signOut: async () => ({ error: null }),
      clearAuthData: () => {},
      updateProfile: async () => ({ error: new Error('Auth provider not available') }),
      refreshUserProfileFromBackend: async () => ({ error: new Error('Auth provider not available') }),
      resetPassword: async () => ({ error: new Error('Auth provider not available') }),
      updatePassword: async () => ({ error: new Error('Auth provider not available') }),
      restoreSessionFromStorage: async () => null
    };
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastPremiumRefreshTokenRef = useRef<string | null>(null);
  const hasLoadedProfileFromStorageRef = useRef(false);

  useEffect(() => {
    // Attempt to load runtime config at runtime (window-injected or fetched by index.html)
    (async () => {
      try {
        if (!(window as any).__APP_CONFIG__) {
          const resp = await fetch('/app-config.json', { cache: 'no-store' });
          if (resp.ok) {
            (window as any).__APP_CONFIG__ = await resp.json();
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storedProfile = window.localStorage.getItem('supabase-user-profile');
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setUserProfile(prev => prev ?? parsedProfile);
      }
    } catch (error) {
      console.warn('Failed to load cached user profile:', error);
    } finally {
      hasLoadedProfileFromStorageRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!hasLoadedProfileFromStorageRef.current) {
      return;
    }

    try {
      if (userProfile) {
        window.localStorage.setItem('supabase-user-profile', JSON.stringify(userProfile));
      } else {
        window.localStorage.removeItem('supabase-user-profile');
      }
    } catch (error) {
      console.warn('Failed to persist user profile cache:', error);
    }
  }, [userProfile]);

  // Session restoration on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log('🔄 Starting session restoration...');
        
        // Try to restore session from localStorage first
        const storedSession = localStorage.getItem('supabase-session');
        const storedUser = localStorage.getItem('supabase-user');
        
        if (storedSession && storedUser) {
          try {
            const sessionData = JSON.parse(storedSession);
            const userData = JSON.parse(storedUser);
            
            // Check if session is still valid (not expired)
            const isExpired = sessionData.expires_at && sessionData.expires_at <= Date.now() / 1000;
            
            if (!isExpired) {
              console.log('🔄 Restoring session from localStorage');
              setSession(sessionData);
              setUser(userData);
              
              // Try to refresh user profile
              if (userData.id) {
                const profile = await fetchUserProfile(userData.id);
                setUserProfile(profile);
              }
              
              // If Supabase is configured, verify the session is still valid
              if (isSupabaseConfigured) {
                try {
                  // Add timeout to prevent hanging
                  const getUserPromise = supabase.auth.getUser(sessionData.access_token);
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('getUser timeout')), 8000)
                  );
                  
                  const result = await Promise.race([getUserPromise, timeoutPromise]) as { data: { user: any }, error: any };
                  const { data: { user: verifiedUser }, error } = result;
                  
                  if (error || !verifiedUser) {
                    console.log('🔄 Stored session invalid, clearing localStorage');
                    localStorage.removeItem('supabase-session');
                    localStorage.removeItem('supabase-user');
                    setSession(null);
                    setUser(null);
                    setUserProfile(null);
                  } else {
                    console.log('✅ Stored session verified');
                  }
                } catch (verifyError) {
                  if (verifyError.message === 'getUser timeout') {
                    console.warn('Session verification timed out, but continuing with stored session');
                  } else {
                    console.warn('Session verification failed:', verifyError);
                  }
                }
              }
            } else {
              console.log('🔄 Stored session expired, clearing localStorage');
              localStorage.removeItem('supabase-session');
              localStorage.removeItem('supabase-user');
            }
          } catch (parseError) {
            console.error('Error parsing stored session:', parseError);
            localStorage.removeItem('supabase-session');
            localStorage.removeItem('supabase-user');
          }
        }
        
        // If Supabase is configured and we don't have a valid session, try to restore from Supabase
        if (isSupabaseConfigured && !session) {
          try {
            // Add timeout to prevent hanging
            const getSessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('getSession timeout')), 10000)
            );
            
            const result = await Promise.race([getSessionPromise, timeoutPromise]) as { data: { session: any }, error: any };
            const { data: { session: supabaseSession }, error } = result;
            
            if (!error && supabaseSession) {
              console.log('🔄 Restoring session from Supabase');
              setSession(supabaseSession);
              setUser(supabaseSession.user);
              
              // Store in localStorage for persistence
              localStorage.setItem('supabase-session', JSON.stringify(supabaseSession));
              localStorage.setItem('supabase-user', JSON.stringify(supabaseSession.user));
              
              // Try to refresh user profile
              if (supabaseSession.user.id) {
                const profile = await fetchUserProfile(supabaseSession.user.id);
                setUserProfile(profile);
              }
            }
          } catch (supabaseError) {
            if (supabaseError.message === 'getSession timeout') {
              console.warn('Supabase getSession timed out, checking localStorage for session...');
              
              // Fallback: Check localStorage for session when Supabase times out
              const storedSession = localStorage.getItem('supabase-session');
              const storedUser = localStorage.getItem('supabase-user');
              
              if (storedSession && storedUser) {
                try {
                  const sessionData = JSON.parse(storedSession);
                  const userData = JSON.parse(storedUser);
                  
                  // Check if session is still valid
                  const isExpired = sessionData.expires_at && sessionData.expires_at <= Date.now() / 1000;
                  
                  if (!isExpired) {
                    console.log('🔄 Restoring session from localStorage (Supabase timeout fallback)');
                    setSession(sessionData);
                    setUser(userData);
                    
                    // Try to refresh user profile
                    if (userData.id) {
                      const profile = await fetchUserProfile(userData.id);
                      setUserProfile(profile);
                    }
                  } else {
                    console.log('🔄 Stored session expired, clearing localStorage');
                    localStorage.removeItem('supabase-session');
                    localStorage.removeItem('supabase-user');
                  }
                } catch (parseError) {
                  console.error('Error parsing stored session:', parseError);
                  localStorage.removeItem('supabase-session');
                  localStorage.removeItem('supabase-user');
                }
              }
            } else {
              console.warn('Supabase session restoration failed:', supabaseError);
            }
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Listen for Supabase auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    console.log('🔍 Setting up Supabase auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Supabase auth state change:', event, session ? 'session exists' : 'no session');
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in via Supabase, updating context state');
        setSession(session);
        setUser(session.user);
        
        // Store in localStorage for persistence
        localStorage.setItem('supabase-session', JSON.stringify(session));
        localStorage.setItem('supabase-user', JSON.stringify(session.user));
        console.log('💾 Session stored in localStorage');
        
        // Try to refresh user profile
        if (session.user.id) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('❌ User signed out via Supabase, clearing context state');
        setSession(null);
        setUser(null);
        setUserProfile(null);
        
        // Clear localStorage
        localStorage.removeItem('supabase-session');
        localStorage.removeItem('supabase-user');
        console.log('🗑️ Session cleared from localStorage');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔄 Token refreshed via Supabase, updating session');
        setSession(session);
        
        // Update localStorage with refreshed session
        localStorage.setItem('supabase-session', JSON.stringify(session));
        localStorage.setItem('supabase-user', JSON.stringify(session.user));
      }
    });

    return () => {
      console.log('🔍 Cleaning up Supabase auth state listener');
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      if (!isSupabaseConfigured || !isUuid(userId)) {
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as unknown as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Refresh user profile from backend API
  const refreshUserProfileFromBackend = useCallback(async () => {
    try {
      if (!session?.access_token) {
        console.log('No access token available for backend refresh');
        return null;
      }

      console.log('🔄 Refreshing user profile from backend...');
      console.log('🔍 Session token available:', !!session.access_token);
      console.log('🔍 Session object:', session);
      console.log('🔍 Access token (first 20 chars):', session.access_token?.substring(0, 20) + '...');
      console.log('🔍 Environment DEV:', import.meta.env.DEV);
      
      // Use backendApiCall for consistency with other API calls
      const data = await backendApiCall(
        BACKEND_API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.STATUS,
        {
          method: 'GET'
        },
        session.access_token
      );
      
      console.log('✅ Backend refresh successful:', data);
      
      if (data.success && data.data) {
        console.log('✅ User profile refreshed from backend:', data.data);
        
        // Update the local user profile state with the premium status
        if (data.data.isPremium !== undefined) {
          const updatedProfile = {
            ...userProfile,
            is_premium: data.data.isPremium
          };
          setUserProfile(updatedProfile);
          console.log('✅ Updated local user profile with premium status:', updatedProfile);
        }
        
        return data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Backend refresh error:', error);
      console.warn('⚠️ Subscription status endpoint not accessible - this is expected if backend is not fully configured');
      return null;
    }
  }, [session, userProfile]);

  useEffect(() => {
    const accessToken = session?.access_token;

    if (!accessToken) {
      lastPremiumRefreshTokenRef.current = null;
      return;
    }

    if (userProfile?.is_premium === true) {
      lastPremiumRefreshTokenRef.current = accessToken;
      return;
    }

    if (lastPremiumRefreshTokenRef.current === accessToken) {
      return;
    }

    lastPremiumRefreshTokenRef.current = accessToken;
    refreshUserProfileFromBackend();
  }, [session?.access_token, userProfile?.is_premium, refreshUserProfileFromBackend]);

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      console.log('SupabaseAuthContext: Starting signup for', email);
      const response = await backendService.signUp(email, password, userData);
      console.log('SupabaseAuthContext: Backend response:', JSON.stringify(response, null, 2));

      if (!response?.success) {
        console.error('SupabaseAuthContext: Signup failed:', response?.error);
        return { error: new Error(response?.error || 'Signup failed') };
      }

      console.log('SupabaseAuthContext: Signup successful');
      return { error: null };
    } catch (error) {
      console.error('SupabaseAuthContext: Signup exception:', error);
      return { error };
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log('SignIn called with:', JSON.stringify({ email, isSupabaseConfigured }, null, 2));
      
      
      // Always use backend authentication for security
      const response = await backendService.signIn(email, password);
      console.log('Backend response:', JSON.stringify(response, null, 2));

      // Check if the response indicates an error
      if (!response?.success || response?.error) {
        const errorMessage = response?.error || 'Signin failed';
        console.error('Authentication failed:', errorMessage);
        return { error: new Error(errorMessage) };
      }

      // Ensure we have valid session and user data
      if (!response.data?.session || !response.data?.user) {
        console.error('Invalid response data:', response);
        return { error: new Error('Invalid response from server') };
      }

      const nextSession: Session = response.data.session;
      let nextUser: User = response.data.user;
      console.log('Setting session:', nextSession ? 'session exists' : 'no session');

      // Persist session in Supabase client so SDK queries include auth (only if configured)
      // Skip Supabase session setup for now to avoid hanging issues
      if (false && nextSession?.access_token && nextSession?.refresh_token) {
        console.log('Setting Supabase session...');
        try {
          console.log('Attempting to set Supabase session with tokens:', JSON.stringify({
            access_token: nextSession.access_token ? 'token exists' : 'no token',
            refresh_token: nextSession.refresh_token ? 'token exists' : 'no token'
          }, null, 2));
          
          // Add timeout to prevent hanging
          const setSessionPromise = supabase.auth.setSession({
            access_token: nextSession.access_token,
            refresh_token: nextSession.refresh_token
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('setSession timeout')), 5000)
          );
          
          await Promise.race([setSessionPromise, timeoutPromise]);
          console.log('Supabase session set successfully');
          
          // Fetch canonical Supabase user to ensure we have a valid UUID user id
          console.log('Fetching Supabase user...');
          const { data: userResp, error: getUserError } = await supabase.auth.getUser();
          if (!getUserError && userResp?.user) {
            nextUser = userResp.user as User;
            console.log('Supabase user fetched:', nextUser ? 'user exists' : 'no user');
          } else {
            console.log('Failed to fetch Supabase user:', getUserError);
          }
        } catch (supabaseError) {
          console.error('Supabase session error:', supabaseError);
          console.log('Continuing with backend session data...');
          // Continue with the session we have from backend
        }
      } else {
        console.log('Skipping Supabase session setup - disabled to prevent hanging issues');
        console.log('Using backend session data directly for authentication');
      }

      console.log('Setting React state...');
      setSession(nextSession);
      setUser(nextUser);
      
      // Store session in localStorage for persistence
      if (nextSession && nextUser) {
        localStorage.setItem('supabase-session', JSON.stringify(nextSession));
        localStorage.setItem('supabase-user', JSON.stringify(nextUser));
        console.log('💾 Session stored in localStorage');
      }
      
      console.log('Session and user set:', JSON.stringify({ session: nextSession ? 'session exists' : 'no session', user: nextUser ? 'user exists' : 'no user' }, null, 2));

      // Attempt to load profile when possible
      console.log('Loading user profile...');
      try {
        if (nextUser?.id && isUuid(nextUser.id)) {
          const profile = await fetchUserProfile(nextUser.id);
          setUserProfile(profile);
          console.log('User profile loaded:', JSON.stringify(profile, null, 2));
        } else {
          console.log('Skipping profile load - invalid user ID');
        }
      } catch (profileError) {
        console.error('Profile loading error:', profileError);
        // Continue without profile
      }

      console.log('SignIn completed successfully');
      return { error: null };
    } catch (error) {
      console.error('SignIn error:', error);
      return { error };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      if (!isSupabaseConfigured) {
        return { error: new Error('Supabase is not configured for OAuth in this environment') };
      }

      // Store current page URL to return after OAuth
      const returnUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem('oauth-return-url', returnUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getFrontendUrl()}/supabase-auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Google OAuth exception:', error);
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log('🚪 Starting signout process...');
      
      // Clear state first to prevent UI issues
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      // Clear localStorage immediately
      try {
        localStorage.removeItem('supabase-session');
        localStorage.removeItem('supabase-user');
        localStorage.removeItem('token');
        localStorage.removeItem('supabase.auth.token');
        // Clear any other auth-related items
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
            localStorage.removeItem(key);
          }
        });
        console.log('🗑️ Session cleared from localStorage');
      } catch (storageError) {
        console.warn('⚠️ Error clearing localStorage:', storageError);
      }
      
      // Call backend signout (non-blocking)
      try {
        await backendService.signOut();
        console.log('✅ Backend signout successful');
      } catch (backendError) {
        // Non-critical - continue with signout even if backend fails
        console.warn('⚠️ Backend signout failed (non-critical):', backendError);
      }

      // Sign out from Supabase (non-blocking)
      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signOut();
          console.log('✅ Supabase signout successful');
        } catch (supabaseError) {
          // Non-critical - continue with signout even if Supabase fails
          console.warn('⚠️ Supabase signout failed (non-critical):', supabaseError);
        }
      }
      
      console.log('✅ Signout completed successfully');
      
      // Redirect to home page after successful signout
      // Use setTimeout to ensure state is cleared before navigation
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }, 100);
      
      return { error: null };
    } catch (error) {
      console.error('❌ Signout error:', error);
      // Even on error, clear local state and redirect
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      // Redirect even on error
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }, 100);
      
      return { error };
    }
  };

  // Clear all authentication data (for when user is deleted)
  const clearAuthData = () => {
    console.log('Clearing all authentication data...');
    setSession(null);
    setUser(null);
    setUserProfile(null);
    
    // Clear any localStorage data
    try {
      localStorage.removeItem('supabase-session');
      localStorage.removeItem('supabase-user');
      localStorage.removeItem('trippin-recent-trip');
      localStorage.removeItem('trippin-demo-mode');
      // Clear any other auth-related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth') || key.includes('trippin')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
    
    console.log('Authentication data cleared');
  };

  // Session restoration utility for external redirects (like Stripe)
  const restoreSessionFromStorage = async () => {
    try {
      console.log('🔄 Attempting to restore session from storage...');
      
      const storedSession = localStorage.getItem('supabase-session');
      const storedUser = localStorage.getItem('supabase-user');
      
      if (storedSession && storedUser) {
        const sessionData = JSON.parse(storedSession);
        const userData = JSON.parse(storedUser);
        
        // Check if session is still valid
        const isExpired = sessionData.expires_at && sessionData.expires_at <= Date.now() / 1000;
        
        if (!isExpired) {
          console.log('✅ Restoring session from storage');
          setSession(sessionData);
          setUser(userData);
          
          // Try to refresh user profile
          if (userData.id) {
            const profile = await fetchUserProfile(userData.id);
            setUserProfile(profile);
          }
          
          return { session: sessionData, user: userData };
        } else {
          console.log('❌ Stored session expired');
          localStorage.removeItem('supabase-session');
          localStorage.removeItem('supabase-user');
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error restoring session from storage:', error);
      return null;
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      console.log('🔄 updateProfile called with:', updates);
      console.log('🔍 User state:', { user: !!user, userId: user?.id, isSupabaseConfigured, isUuid: user?.id ? isUuid(user.id) : false });
      
      if (!user) {
        console.log('❌ No user logged in');
        return { error: new Error('No user logged in') };
      }

      // For premium status updates, update local state immediately and optionally sync with backend
      if (updates.is_premium !== undefined) {
        console.log('🔄 Updating premium status locally');
        console.log('✅ Updating local state optimistically');
        setUserProfile(prev => prev ? { ...prev, is_premium: updates.is_premium } : null);
        
        // Optionally sync with Supabase if configured (but don't block on it)
        if (isSupabaseConfigured && isUuid(user.id)) {
          console.log('🔄 Attempting to sync premium status with Supabase...');
          try {
            await supabase
              .from('users')
              .update({ is_premium: updates.is_premium })
              .eq('id', user.id);
            console.log('✅ Premium status synced with Supabase');
          } catch (syncError) {
            console.warn('⚠️ Supabase sync failed, but local state updated:', syncError);
          }
        }
        
        return { error: null };
      }

      if (!isSupabaseConfigured || !isUuid(user.id)) {
        console.log('❌ Supabase not configured or invalid user ID:', { isSupabaseConfigured, userId: user.id, isValidUuid: isUuid(user.id) });
        return { error: new Error('Supabase not configured or invalid user ID') };
      }

      console.log('🚀 Attempting to update Supabase profile...');
      
      // First, test the connection with a simple query
      console.log('🔍 Testing Supabase connection...');
      try {
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .limit(1)
          .single();
        
        if (testError) {
          console.error('❌ Supabase connection test failed:', testError);
          return { error: new Error(`Supabase connection failed: ${testError.message}`) };
        }
        
        console.log('✅ Supabase connection test passed');
      } catch (connectionError) {
        console.error('❌ Supabase connection test exception:', connectionError);
        return { error: new Error(`Supabase connection failed: ${connectionError.message}`) };
      }
      
      // Implement retry logic with exponential backoff
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Attempt ${attempt}/${maxRetries} to update profile...`);
          
          // Add timeout to prevent hanging (reduced from 10s to 5s)
          const updatePromise = supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Supabase update timeout')), 5000)
          );
          
          const result = await Promise.race([updatePromise, timeoutPromise]) as { data: any; error: any };
          const { data, error } = result;

          if (error) {
            console.error(`❌ Supabase update error (attempt ${attempt}):`, error);
            lastError = error;
            
            // If it's a timeout or connection error, retry
            if (attempt < maxRetries && (
              error.message?.includes('timeout') || 
              error.message?.includes('network') ||
              error.message?.includes('connection')
            )) {
              const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
              console.log(`⏳ Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            return { error };
          }

          console.log('✅ Profile updated successfully:', data);
          setUserProfile(data as unknown as UserProfile);
          return { error: null };
        } catch (error) {
          console.error(`❌ updateProfile exception (attempt ${attempt}):`, error);
          lastError = error;
          
          // If it's a timeout or connection error, retry
          if (attempt < maxRetries && (
            error.message?.includes('timeout') || 
            error.message?.includes('network') ||
            error.message?.includes('connection')
          )) {
            const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          return { error };
        }
      }
      
      // If all retries failed, log the error but don't fail the entire operation
      console.error('❌ All retry attempts failed, but this is not critical since backend handles the update');
      console.log('🔄 Backend has already updated the user status, continuing...');
      
      // Don't return an error - the backend has already handled the update
      // Just update the local state optimistically
      if (updates.is_premium !== undefined) {
        setUserProfile(prev => prev ? { ...prev, is_premium: updates.is_premium } : null);
      }
      
      return { error: null };
    } catch (error) {
      console.error('❌ updateProfile exception:', error);
      return { error };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      if (!isSupabaseConfigured) {
        return { error: new Error('Password reset is unavailable in mock mode') };
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getFrontendUrl()}/supabase-auth/reset-password`
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      if (!isSupabaseConfigured) {
        return { error: new Error('Password update is unavailable in mock mode') };
      }
      const { error } = await supabase.auth.updateUser({
        password
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Fetch user profile when user signs in
        if (session?.user && event === 'SIGNED_IN' && isUuid(session.user.id)) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Supabase not configured - no session restoration
      console.warn('Supabase not configured - authentication unavailable');
      setIsLoading(false);
    }
  }, []);

  // Fetch user profile when user changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (user && !userProfile && isUuid(user.id)) {
      fetchUserProfile(user.id).then(profile => {
        setUserProfile(profile);
      });
    }
  }, [user]);

  const value: SupabaseAuthContextType = {
    user,
    session,
    userProfile,
    isLoading,
    isAuthenticated: !!user && !!session,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    clearAuthData,
    updateProfile,
    refreshUserProfileFromBackend,
    resetPassword,
    updatePassword,
    restoreSessionFromStorage,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export default supabase;
