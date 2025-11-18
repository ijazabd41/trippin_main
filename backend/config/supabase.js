import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const createMissingClientProxy = (clientName) => {
  console.log(`⚠️ Supabase not configured: ${clientName} is unavailable. Using mock mode.`);
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'auth') {
        return {
          getUser: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
          signOut: async () => ({ error: null }),
          signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
          signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } })
        };
      }
      return () => ({ data: null, error: { message: 'Supabase not configured' } });
    },
    apply() {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
  });
};

// Client for user operations (uses anon key)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createMissingClientProxy('supabase');

// Admin client for server operations (uses service role key)
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : createMissingClientProxy('supabaseAdmin');

// Database schema and table names
export const TABLES = {
  USERS: 'users',
  TRIPS: 'trips',
  ITINERARIES: 'itineraries',
  BOOKINGS: 'bookings',
  PAYMENTS: 'payments',
  REVIEWS: 'reviews',
  FAVORITES: 'favorites',
  SHARED_TRIPS: 'shared_trips',
  NOTIFICATIONS: 'notifications',
  USER_PREFERENCES: 'user_preferences'
};

// RLS (Row Level Security) policies helper
export const createRLSPolicy = async (tableName, policyName, policyDefinition) => {
  try {
    const { error } = await supabaseAdmin.rpc('create_policy', {
      table_name: tableName,
      policy_name: policyName,
      policy_definition: policyDefinition
    });
    
    if (error) {
      console.error(`Error creating RLS policy for ${tableName}:`, error);
    }
  } catch (error) {
    console.error(`Error creating RLS policy for ${tableName}:`, error);
  }
};

export default supabase;
