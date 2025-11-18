// Utility functions for premium status checking
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  is_premium?: boolean;
  role?: string;
}

interface UserWithPremium {
  isPremium?: boolean;
}

/**
 * Check if a user has premium access
 * @param userProfile - User profile from Supabase
 * @param user - User object (may have isPremium property)
 * @returns boolean indicating if user has premium access
 */
export const isUserPremium = (userProfile?: UserProfile | null, user?: UserWithPremium | null): boolean => {
  // Check userProfile first (most reliable)
  if (userProfile?.is_premium === true) {
    return true;
  }
  
  // Fallback to user.isPremium (for backward compatibility)
  if (user?.isPremium === true) {
    return true;
  }
  
  return false;
};

/**
 * Get premium status for display purposes
 * @param userProfile - User profile from Supabase
 * @param user - User object (may have isPremium property)
 * @returns object with premium status information
 */
export const getPremiumStatus = (userProfile?: UserProfile | null, user?: UserWithPremium | null) => {
  const isPremium = isUserPremium(userProfile, user);
  
  return {
    isPremium,
    isActive: isPremium,
    planName: isPremium ? 'プレミアムプラン' : 'フリープラン',
    status: isPremium ? 'active' : 'free'
  };
};

/**
 * Check if premium features should be accessible
 * @param userProfile - User profile from Supabase
 * @param user - User object (may have isPremium property)
 * @returns boolean indicating if premium features should be accessible
 */
export const hasPremiumAccess = (userProfile?: UserProfile | null, user?: UserWithPremium | null): boolean => {
  return isUserPremium(userProfile, user);
};
