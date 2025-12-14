// Supabase Edge Function for Trippin Backend API
// This replaces the Express.js server with a Deno-based edge function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.7.0?target=deno";
import OpenAI from "https://esm.sh/openai@4.20.1";

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase clients
const getSupabaseClient = (authHeader: string | null) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader ?? "" },
    },
  });
};

const getSupabaseAdmin = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Authentication middleware
const authenticateToken = async (req: Request): Promise<{ user: any; error: any }> => {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return { user: null, error: { message: "Access token required", code: "UNAUTHORIZED" } };
  }

  try {
    const supabase = getSupabaseClient(authHeader);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: { message: "Invalid or expired token", code: "UNAUTHORIZED" } };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: { message: "Authentication failed", code: "AUTH_ERROR" } };
  }
};

// Parse request body
const parseBody = async (req: Request): Promise<any> => {
  const contentType = req.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await req.json();
  }
  return {};
};

// Route handler type
type RouteHandler = (req: Request, params: Record<string, string>) => Promise<Response>;

// Router class
class Router {
  private routes: Map<string, Map<string, RouteHandler>> = new Map();

  add(method: string, path: string, handler: RouteHandler) {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(path, handler);
  }

  async handle(req: Request): Promise<Response | null> {
    const url = new URL(req.url);
    const method = req.method;
    const pathname = url.pathname;

    const methodRoutes = this.routes.get(method);
    if (!methodRoutes) return null;

    // Try exact match first
    if (methodRoutes.has(pathname)) {
      return await methodRoutes.get(pathname)!(req, {});
    }

    // Try pattern matching
    for (const [pattern, handler] of methodRoutes.entries()) {
      const params = this.matchRoute(pattern, pathname);
      if (params !== null) {
        return await handler(req, params);
      }
    }

    return null;
  }

  private matchRoute(pattern: string, pathname: string): Record<string, string> | null {
    const patternParts = pattern.split("/");
    const pathParts = pathname.split("/");

    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }
}

// Create router instance
const router = new Router();

// Health check
router.add("GET", "/health", async () => {
  return new Response(
    JSON.stringify({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: Deno.env.get("ENVIRONMENT") || "production",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Test endpoint
router.add("GET", "/api/test", async () => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Backend is accessible from frontend",
      timestamp: new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// ==================== AUTH ROUTES ====================

// Get current user profile
router.add("GET", "/api/auth/profile", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: user, error } = await supabase
      .from("users")
      .select("*, user_preferences(*)")
      .eq("id", auth.user.id)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "User profile not found", code: "USER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch profile", code: "PROFILE_FETCH_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Update user profile
router.add("PUT", "/api/auth/profile", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const supabase = getSupabaseClient(req.headers.get("authorization"));

    const { data: user, error: userError } = await supabase
      .from("users")
      .update({
        full_name: body.full_name,
        phone: body.phone,
        date_of_birth: body.date_of_birth,
        nationality: body.nationality,
        preferred_language: body.preferred_language,
        timezone: body.timezone,
        avatar_url: body.avatar,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.user.id)
      .select()
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({ error: "Failed to update profile", code: "PROFILE_UPDATE_ERROR", details: userError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update preferences if provided
    if (body.newsletter_subscription !== undefined || body.notifications_enabled !== undefined || body.marketing_emails !== undefined) {
      const { data: existingPrefs } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", auth.user.id)
        .single();

      const updateData: any = { updated_at: new Date().toISOString() };
      if (body.newsletter_subscription !== undefined) updateData.newsletter_subscription = body.newsletter_subscription;
      if (body.notifications_enabled !== undefined) updateData.notifications_enabled = body.notifications_enabled;
      if (body.marketing_emails !== undefined) updateData.marketing_emails = body.marketing_emails;

      if (existingPrefs) {
        await supabase.from("user_preferences").update(updateData).eq("user_id", auth.user.id);
      } else {
        await supabase.from("user_preferences").insert({ user_id: auth.user.id, ...updateData });
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to update profile", code: "PROFILE_UPDATE_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== SUPABASE AUTH ROUTES ====================

// Sign up
router.add("POST", "/api/supabase-auth/signup", async (req) => {
  try {
    const body = await parseBody(req);
    const { email, password, full_name, phone } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required", code: "MISSING_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient(null);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone },
        emailRedirectTo: `${frontendUrl}/supabase-auth/verify-email`,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to create account", code: "SIGNUP_ERROR", details: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const needsVerification = data.user && !data.user.email_confirmed_at;

    return new Response(
      JSON.stringify({
        success: true,
        message: needsVerification
          ? "Account created successfully. Please check your email and click the verification link to activate your account."
          : "Account created successfully.",
        data: {
          user: data.user,
          session: data.session,
          needsVerification,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create account", code: "SIGNUP_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Sign in
router.add("POST", "/api/supabase-auth/signin", async (req) => {
  try {
    const body = await parseBody(req);
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required", code: "MISSING_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("email_not_confirmed") || error.message.includes("Email not confirmed")) {
        return new Response(
          JSON.stringify({
            error: "Please verify your email before signing in. Check your inbox for a verification link.",
            code: "EMAIL_NOT_VERIFIED",
            details: "Email verification required",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Invalid credentials", code: "SIGNIN_ERROR", details: error.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.user && !data.user.email_confirmed_at) {
      return new Response(
        JSON.stringify({
          error: "Please verify your email before signing in. Check your inbox for a verification link.",
          code: "EMAIL_NOT_VERIFIED",
          details: "Email verification required",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { user: data.user, session: data.session },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to sign in", code: "SIGNIN_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Sign out
router.add("POST", "/api/supabase-auth/signout", async (req) => {
  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    await supabase.auth.signOut();

    return new Response(
      JSON.stringify({ success: true, message: "Signed out successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: true, message: "Signed out successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get current user
router.add("GET", "/api/supabase-auth/user", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: { user: auth.user } }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Refresh session
router.add("POST", "/api/supabase-auth/refresh", async (req) => {
  try {
    const body = await parseBody(req);
    const { refresh_token } = body;

    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: "Refresh token is required", code: "MISSING_REFRESH_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient(null);
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) {
      return new Response(
        JSON.stringify({ error: "Invalid refresh token", code: "REFRESH_ERROR", details: error.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { user: data.user, session: data.session },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to refresh session", code: "REFRESH_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Reset password
router.add("POST", "/api/supabase-auth/reset-password", async (req) => {
  try {
    const body = await parseBody(req);
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required", code: "MISSING_EMAIL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient(null);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendUrl}/auth/reset-password`,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to send reset email", code: "RESET_ERROR", details: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to send reset email", code: "RESET_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== TRIPS ROUTES ====================

// Get all trips
router.add("GET", "/api/trips", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const supabase = getSupabaseClient(req.headers.get("authorization"));
    let query = supabase
      .from("trips")
      .select("*, itineraries(*), bookings(*)")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: trips, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch trips", code: "TRIPS_FETCH_ERROR", details: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: trips }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch trips", code: "TRIPS_FETCH_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get single trip
router.add("GET", "/api/trips/:id", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: trip, error } = await supabase
      .from("trips")
      .select("*, itineraries(*), bookings(*)")
      .eq("id", params.id)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !trip) {
      return new Response(
        JSON.stringify({ error: "Trip not found", code: "TRIP_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: trip }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch trip", code: "TRIP_FETCH_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Create trip
router.add("POST", "/api/trips", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const supabase = getSupabaseClient(req.headers.get("authorization"));

    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        ...body,
        user_id: auth.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to create trip", code: "TRIP_CREATE_ERROR", details: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: trip }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create trip", code: "TRIP_CREATE_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Update trip
router.add("PUT", "/api/trips/:id", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const supabase = getSupabaseClient(req.headers.get("authorization"));

    const { data: trip, error } = await supabase
      .from("trips")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", auth.user.id)
      .select()
      .single();

    if (error || !trip) {
      return new Response(
        JSON.stringify({ error: "Trip not found or update failed", code: "TRIP_UPDATE_ERROR" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: trip }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to update trip", code: "TRIP_UPDATE_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Delete trip
router.add("DELETE", "/api/trips/:id", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", params.id)
      .eq("user_id", auth.user.id);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to delete trip", code: "TRIP_DELETE_ERROR", details: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Trip deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete trip", code: "TRIP_DELETE_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== ITINERARIES ROUTES ====================

// Get itineraries for a trip
router.add("GET", "/api/itineraries/trip/:tripId", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const day = url.searchParams.get("day");
    const supabase = getSupabaseClient(req.headers.get("authorization"));

    // Check if user owns the trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("user_id")
      .eq("id", params.tripId)
      .single();

    if (tripError || !trip) {
      return new Response(
        JSON.stringify({ error: "Trip not found", code: "TRIP_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trip.user_id !== auth.user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied", code: "ACCESS_DENIED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let query = supabase
      .from("itineraries")
      .select("*")
      .eq("trip_id", params.tripId)
      .order("day_number", { ascending: true })
      .order("start_time", { ascending: true });

    if (day) {
      query = query.eq("day_number", parseInt(day));
    }

    const { data: itineraries, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch itineraries", code: "ITINERARIES_FETCH_ERROR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: itineraries }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch itineraries", code: "ITINERARIES_FETCH_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get single itinerary
router.add("GET", "/api/itineraries/:id", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: itinerary, error } = await supabase
      .from("itineraries")
      .select("*, trips!itineraries_trip_id_fkey(user_id)")
      .eq("id", params.id)
      .single();

    if (error || !itinerary) {
      return new Response(
        JSON.stringify({ error: "Itinerary not found", code: "ITINERARY_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (itinerary.trips.user_id !== auth.user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied", code: "ACCESS_DENIED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: itinerary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch itinerary", code: "ITINERARY_FETCH_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Create itinerary
router.add("POST", "/api/itineraries", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const { trip_id, day_number, date, title } = body;

    if (!trip_id || !day_number || !date || !title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", code: "MISSING_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient(req.headers.get("authorization"));

    // Check if user owns the trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("user_id")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip || trip.user_id !== auth.user.id) {
      return new Response(
        JSON.stringify({ error: "Trip not found or access denied", code: "TRIP_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: itinerary, error } = await supabase
      .from("itineraries")
      .insert({
        ...body,
        trip_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to create itinerary", code: "ITINERARY_CREATE_ERROR", details: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: itinerary }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create itinerary", code: "ITINERARY_CREATE_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Update itinerary
router.add("PUT", "/api/itineraries/:id", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const supabase = getSupabaseClient(req.headers.get("authorization"));

    // Check ownership via trip
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("*, trips!itineraries_trip_id_fkey(user_id)")
      .eq("id", params.id)
      .single();

    if (fetchError || !itinerary || itinerary.trips.user_id !== auth.user.id) {
      return new Response(
        JSON.stringify({ error: "Itinerary not found or access denied", code: "ITINERARY_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: updated, error } = await supabase
      .from("itineraries")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to update itinerary", code: "ITINERARY_UPDATE_ERROR", details: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to update itinerary", code: "ITINERARY_UPDATE_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Delete itinerary
router.add("DELETE", "/api/itineraries/:id", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));

    // Check ownership
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("*, trips!itineraries_trip_id_fkey(user_id)")
      .eq("id", params.id)
      .single();

    if (fetchError || !itinerary || itinerary.trips.user_id !== auth.user.id) {
      return new Response(
        JSON.stringify({ error: "Itinerary not found or access denied", code: "ITINERARY_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase.from("itineraries").delete().eq("id", params.id);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to delete itinerary", code: "ITINERARY_DELETE_ERROR", details: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Itinerary deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete itinerary", code: "ITINERARY_DELETE_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== PAYMENTS ROUTES ====================

// Create payment intent (Stripe integration)
router.add("POST", "/api/payments/create-intent", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const { amount, currency = "USD", booking_id, metadata = {} } = body;

    if (!amount || !booking_id) {
      return new Response(
        JSON.stringify({ error: "Amount and booking_id are required", code: "MISSING_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Payments service unavailable", code: "PAYMENTS_UNCONFIGURED" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const supabase = getSupabaseClient(req.headers.get("authorization"));

    // Verify booking belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .eq("user_id", auth.user.id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found", code: "BOOKING_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        user_id: auth.user.id,
        booking_id,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: auth.user.id,
        booking_id,
        stripe_payment_intent_id: paymentIntent.id,
        amount,
        currency,
        status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      return new Response(
        JSON.stringify({ error: "Failed to create payment record", code: "PAYMENT_CREATE_ERROR", details: paymentError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          client_secret: paymentIntent.client_secret,
          payment_id: payment.id,
          amount,
          currency,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create payment intent error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create payment intent", code: "PAYMENT_INTENT_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== OPENAI ROUTES ====================

// Generate trip plan with OpenAI
router.add("POST", "/api/openai/generate", async (req) => {
  try {
    const body = await parseBody(req);
    const { tripData } = body;

    if (!tripData) {
      return new Response(
        JSON.stringify({ success: false, message: "Trip data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      // Return fallback plan
      const fallbackPlan = {
        id: `fallback-plan-${Date.now()}`,
        title: `${tripData.destination || "Destination"} Adventure`,
        destination: tripData.destination || "Unknown Destination",
        duration: tripData.duration || 3,
        budget: {
          total: tripData.budget || 100000,
          currency: tripData.currency || "JPY",
          breakdown: {
            accommodation: Math.round((tripData.budget || 100000) * 0.4),
            transportation: Math.round((tripData.budget || 100000) * 0.2),
            food: Math.round((tripData.budget || 100000) * 0.25),
            activities: Math.round((tripData.budget || 100000) * 0.1),
            miscellaneous: Math.round((tripData.budget || 100000) * 0.05),
          },
        },
        itinerary: [
          {
            day: 1,
            date: new Date().toISOString().split("T")[0],
            theme: "Arrival and Orientation",
            activities: [
              {
                time: "09:00",
                title: "Arrival",
                description: "Arrive at your destination",
                location: tripData.destination || "Destination",
                type: "transport",
                duration: 120,
                cost: 3000,
              },
            ],
          },
        ],
      };

      return new Response(
        JSON.stringify({ success: true, data: fallbackPlan }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use OpenAI API
    const openai = new OpenAI({ apiKey: openaiKey });

    const prompt = `Create a detailed travel itinerary for ${tripData.destination || "a destination"} for ${tripData.duration || 3} days with a budget of ${tripData.budget || 100000} ${tripData.currency || "JPY"}. Include daily activities, recommendations, and practical information.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a travel planning assistant. Create detailed, practical travel itineraries.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const plan = JSON.parse(completion.choices[0].message.content || "{}");

    return new Response(
      JSON.stringify({ success: true, data: plan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OpenAI generate error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to generate trip plan", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Try to handle the request with router
    const response = await router.handle(req);
    if (response) {
      return response;
    }

    // 404 for unmatched routes
    return new Response(
      JSON.stringify({ error: "Endpoint not found", code: "NOT_FOUND", path: new URL(req.url).pathname }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        ...(Deno.env.get("ENVIRONMENT") === "development" && { details: error.message }),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

