// Supabase Edge Function for Trippin Backend API
// This replaces the Express.js server with a Deno-based edge function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.7.0?target=deno";
// Using direct fetch instead of OpenAI SDK to avoid Deno compatibility issues

// CORS headers helper
// Note: Using "*" allows all origins. For production, you can restrict this
// by setting CORS_ORIGIN environment variable, but Supabase edge functions
// handle CORS at the gateway level, so "*" is fine here.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Initialize Supabase clients
// Note: SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
// are automatically provided by Supabase Edge Functions runtime
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
    let pathname = url.pathname;
    
    console.log(`🔍 Router handling: original pathname="${pathname}"`);

    // Strip the function name prefix if present (e.g., /trippin-api/health -> /health)
    // Supabase includes the function name in the pathname
    if (pathname.startsWith('/trippin-api')) {
      pathname = pathname.replace('/trippin-api', '') || '/';
      console.log(`🔍 Stripped /trippin-api prefix, new pathname="${pathname}"`);
    }
    // Also handle /functions/v1/trippin-api prefix if present
    if (pathname.startsWith('/functions/v1/trippin-api')) {
      pathname = pathname.replace('/functions/v1/trippin-api', '') || '/';
      console.log(`🔍 Stripped /functions/v1/trippin-api prefix, new pathname="${pathname}"`);
    }

    const methodRoutes = this.routes.get(method);
    if (!methodRoutes) {
      console.log(`❌ No routes found for method: ${method}`);
      return null;
    }

    // Try exact match first
    if (methodRoutes.has(pathname)) {
      console.log(`✅ Exact match found for pathname: "${pathname}"`);
      return await methodRoutes.get(pathname)!(req, {});
    }

    // Try pattern matching
    for (const [pattern, handler] of methodRoutes.entries()) {
      const params = this.matchRoute(pattern, pathname);
      if (params !== null) {
        console.log(`✅ Pattern match found: pattern="${pattern}", pathname="${pathname}"`);
        return await handler(req, params);
      }
    }

    console.log(`❌ No route match found for pathname: "${pathname}"`);
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
router.add("GET", "/api/test", async (req) => {
  console.log("✅ /api/test endpoint called");
  console.log("Request URL:", req.url);
  console.log("Request method:", req.method);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));
  
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
      const duration = tripData.startDate && tripData.endDate 
        ? Math.ceil((new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : tripData.duration || 3;
      
      const fallbackPlan = {
        id: `fallback-plan-${Date.now()}`,
        title: `${tripData.destination || "Destination"} Adventure`,
        destination: tripData.destination || "Unknown Destination",
        duration: duration,
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
            date: tripData.startDate || new Date().toISOString().split("T")[0],
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

    // Use OpenAI API via direct fetch (avoiding SDK compatibility issues with Deno)
    // Build a more detailed prompt
    const duration = tripData.startDate && tripData.endDate 
      ? Math.ceil((new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : tripData.duration || 3;

    const prompt = `Create a detailed travel itinerary for ${tripData.destination || "a destination"} for ${duration} days with a budget of ${tripData.budget || 100000} ${tripData.currency || "JPY"}. 

Include:
- Daily activities with times, locations, and descriptions
- Budget breakdown by category
- Practical information (transportation, tips, etc.)
- Recommendations based on interests: ${Array.isArray(tripData.interests) ? tripData.interests.join(", ") : tripData.interests || "general travel"}

Return the response as a valid JSON object with this structure:
{
  "title": "Trip title",
  "destination": "destination name",
  "duration": ${duration},
  "budget": {
    "total": ${tripData.budget || 100000},
    "currency": "${tripData.currency || "JPY"}",
    "breakdown": {
      "accommodation": 0,
      "transportation": 0,
      "food": 0,
      "activities": 0,
      "miscellaneous": 0
    }
  },
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Day theme",
      "activities": [
        {
          "time": "HH:MM",
          "title": "Activity title",
          "description": "Activity description",
          "location": "Location name",
          "type": "activity type",
          "duration": 120,
          "cost": 0
        }
      ]
    }
  ]
}`;

    console.log("Calling OpenAI API with prompt length:", prompt.length);

    // Call OpenAI API directly using fetch
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a travel planning assistant. Always respond with valid JSON only, no additional text or markdown formatting. Do not wrap the JSON in code blocks.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText} - ${errorText}`);
    }

    const completion = await openaiResponse.json();
    console.log("OpenAI API response received");

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI API returned empty response");
    }

    // Try to parse JSON, handle both JSON and markdown-wrapped JSON
    let plan;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      plan = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      console.error("Response content:", content.substring(0, 500));
      // Return a structured fallback plan
      plan = {
        id: `fallback-plan-${Date.now()}`,
        title: `${tripData.destination || "Destination"} Adventure`,
        destination: tripData.destination || "Unknown Destination",
        duration: duration,
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
            date: tripData.startDate || new Date().toISOString().split("T")[0],
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
        note: "AI response was not in valid JSON format, using fallback plan",
        rawResponse: content.substring(0, 200),
      };
    }

    return new Response(
      JSON.stringify({ success: true, data: plan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OpenAI generate error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Failed to generate trip plan", 
        error: error.message || "Unknown error",
        details: Deno.env.get("ENVIRONMENT") === "development" ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Alias route for /openai/generate (without /api prefix) for backward compatibility
// This route uses the same handler as /api/openai/generate
router.add("POST", "/openai/generate", async (req) => {
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
      const duration = tripData.startDate && tripData.endDate 
        ? Math.ceil((new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : tripData.duration || 3;
      
      const fallbackPlan = {
        id: `fallback-plan-${Date.now()}`,
        title: `${tripData.destination || "Destination"} Adventure`,
        destination: tripData.destination || "Unknown Destination",
        duration: duration,
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
            date: tripData.startDate || new Date().toISOString().split("T")[0],
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

    // Use OpenAI API via direct fetch (avoiding SDK compatibility issues with Deno)
    const duration = tripData.startDate && tripData.endDate 
      ? Math.ceil((new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : tripData.duration || 3;

    const prompt = `Create a detailed travel itinerary for ${tripData.destination || "a destination"} for ${duration} days with a budget of ${tripData.budget || 100000} ${tripData.currency || "JPY"}. 

Include:
- Daily activities with times, locations, and descriptions
- Budget breakdown by category
- Practical information (transportation, tips, etc.)
- Recommendations based on interests: ${Array.isArray(tripData.interests) ? tripData.interests.join(", ") : tripData.interests || "general travel"}

Return the response as a valid JSON object with this structure:
{
  "title": "Trip title",
  "destination": "destination name",
  "duration": ${duration},
  "budget": {
    "total": ${tripData.budget || 100000},
    "currency": "${tripData.currency || "JPY"}",
    "breakdown": {
      "accommodation": 0,
      "transportation": 0,
      "food": 0,
      "activities": 0,
      "miscellaneous": 0
    }
  },
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Day theme",
      "activities": [
        {
          "time": "HH:MM",
          "title": "Activity title",
          "description": "Activity description",
          "location": "Location name",
          "type": "activity type",
          "duration": 120,
          "cost": 0
        }
      ]
    }
  ]
}`;

    console.log("Calling OpenAI API with prompt length:", prompt.length);

    // Call OpenAI API directly using fetch
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a travel planning assistant. Always respond with valid JSON only, no additional text or markdown formatting. Do not wrap the JSON in code blocks.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText} - ${errorText}`);
    }

    const completion = await openaiResponse.json();
    console.log("OpenAI API response received");

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI API returned empty response");
    }

    // Try to parse JSON, handle both JSON and markdown-wrapped JSON
    let plan;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      plan = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      console.error("Response content:", content.substring(0, 500));
      // Return a structured fallback plan
      plan = {
        id: `fallback-plan-${Date.now()}`,
        title: `${tripData.destination || "Destination"} Adventure`,
        destination: tripData.destination || "Unknown Destination",
        duration: duration,
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
            date: tripData.startDate || new Date().toISOString().split("T")[0],
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
        note: "AI response was not in valid JSON format, using fallback plan",
        rawResponse: content.substring(0, 200),
      };
    }

    return new Response(
      JSON.stringify({ success: true, data: plan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OpenAI generate error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Failed to generate trip plan", 
        error: error.message || "Unknown error",
        details: Deno.env.get("ENVIRONMENT") === "development" ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== GOOGLE MAPS ROUTES ====================

// Get nearby places
router.add("POST", "/api/google-maps", async (req) => {
  try {
    const body = await parseBody(req);
    const { location, radius = "5000", types = [], type, keyword } = body;

    if (!location) {
      return new Response(
        JSON.stringify({ success: false, message: "Location is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const googleMapsKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!googleMapsKey) {
      // Return fallback data
      const fallbackPlaces = [
        {
          id: "1",
          name: "浅草寺",
          nameEn: "Senso-ji Temple",
          category: "temples-shrines",
          rating: 4.8,
          distance: "0.5km",
          address: "東京都台東区浅草2-3-1",
          lat: 35.7148,
          lng: 139.7967,
        },
      ];

      return new Response(
        JSON.stringify({ success: true, data: fallbackPlaces, isMockData: true, message: "Google Maps API not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Google Places API request
    const params = new URLSearchParams({
      location: location,
      radius: radius,
      key: googleMapsKey,
    });

    const resolvedType = type || (Array.isArray(types) && types.length > 0 ? types[0] : "point_of_interest");
    if (resolvedType) {
      params.append("type", resolvedType);
    }
    if (keyword) {
      params.append("keyword", keyword);
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const places = data.results.map((place: any, index: number) => ({
      id: place.place_id || `place-${index}`,
      name: place.name,
      nameEn: place.name,
      category: place.types?.[0] || "point_of_interest",
      rating: place.rating || 0,
      distance: "Unknown",
      address: place.vicinity || "Address not available",
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      image: place.photos && place.photos.length > 0
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${googleMapsKey}`
        : null,
    }));

    return new Response(
      JSON.stringify({ success: true, data: places, isMockData: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Google Places API Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch places", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get place details
router.add("POST", "/api/google-maps/details", async (req) => {
  try {
    const body = await parseBody(req);
    const { placeId, language } = body;

    if (!placeId) {
      return new Response(
        JSON.stringify({ success: false, message: "placeId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const googleMapsKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!googleMapsKey) {
      return new Response(
        JSON.stringify({ success: true, isMockData: true, data: null, message: "Google Maps API not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key: googleMapsKey,
      fields: "place_id,name,formatted_address,formatted_phone_number,opening_hours,website,url,geometry/location,rating,user_ratings_total,photos",
    });
    if (language) params.append("language", language);

    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Place Details error: ${data.status}`);
    }

    const r = data.result;
    const details = {
      id: r.place_id,
      name: r.name,
      address: r.formatted_address,
      phone: r.formatted_phone_number || null,
      website: r.website || null,
      url: r.url || null,
      rating: r.rating || null,
      userRatingsTotal: r.user_ratings_total || 0,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
      openingHours: r.opening_hours?.weekday_text || null,
      photos: Array.isArray(r.photos) ? r.photos.slice(0, 5).map((p: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${p.photo_reference}&key=${googleMapsKey}`
      ) : [],
    };

    return new Response(
      JSON.stringify({ success: true, data: details, isMockData: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Place Details API Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch place details", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== GOOGLE TRANSLATE ROUTES ====================

// Translate text
router.add("POST", "/api/google-translate/translate", async (req) => {
  try {
    const body = await parseBody(req);
    const { text, sourceLanguage, targetLanguage } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ success: false, message: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sourceLanguage || !targetLanguage) {
      return new Response(
        JSON.stringify({ success: false, message: "Source and target languages are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const translateKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!translateKey) {
      // Fallback translation
      const fallbackTranslations: Record<string, Record<string, string>> = {
        "ja-en": { "こんにちは": "Hello", "ありがとう": "Thank you" },
        "en-ja": { "Hello": "こんにちは", "Thank you": "ありがとう" },
      };
      const key = `${sourceLanguage}-${targetLanguage}`;
      const translatedText = fallbackTranslations[key]?.[text] || `⚠️ Google Translate API not configured. Text: "${text}"`;

      return new Response(
        JSON.stringify({
          success: true,
          data: { translatedText, detectedSourceLanguage: sourceLanguage, sourceLanguage, targetLanguage },
          isMockData: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({
      key: translateKey,
      q: text,
      source: sourceLanguage,
      target: targetLanguage,
      format: "text",
    });

    const url = `https://translation.googleapis.com/language/translate/v2?${params}`;
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    const data = await response.json();

    if (data.error) {
      throw new Error(`Google Translate API error: ${data.error.message}`);
    }

    const translation = data.data.translations[0];

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          translatedText: translation.translatedText,
          detectedSourceLanguage: translation.detectedSourceLanguage || sourceLanguage,
          sourceLanguage,
          targetLanguage,
        },
        isMockData: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Google Translate API Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to translate text", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Detect language
router.add("POST", "/api/google-translate/detect", async (req) => {
  try {
    const body = await parseBody(req);
    const { text } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ success: false, message: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const translateKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!translateKey) {
      // Simple fallback detection
      let detectedLanguage = "en";
      if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) detectedLanguage = "ja";
      else if (/[\u4E00-\u9FAF]/.test(text)) detectedLanguage = "zh";
      else if (/[\uAC00-\uD7AF]/.test(text)) detectedLanguage = "ko";

      return new Response(
        JSON.stringify({ success: true, data: { language: detectedLanguage, confidence: 0.7 }, isMockData: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({ key: translateKey, q: text });
    const url = `https://translation.googleapis.com/language/translate/v2/detect?${params}`;
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    const data = await response.json();

    if (data.error) {
      throw new Error(`Google Translate Detect API error: ${data.error.message}`);
    }

    const detection = data.data.detections[0][0];

    return new Response(
      JSON.stringify({ success: true, data: { language: detection.language, confidence: detection.confidence }, isMockData: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Google Translate Detect API Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to detect language", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get supported languages
router.add("GET", "/api/google-translate/languages", async (req) => {
  try {
    const translateKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!translateKey) {
      const fallbackLanguages = [
        { language: "ja", name: "Japanese" },
        { language: "en", name: "English" },
        { language: "zh", name: "Chinese (Simplified)" },
        { language: "ko", name: "Korean" },
      ];

      return new Response(
        JSON.stringify({ success: true, data: fallbackLanguages, isMockData: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({ key: translateKey, target: "en" });
    const url = `https://translation.googleapis.com/language/translate/v2/languages?${params}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Google Translate Languages API error: ${data.error.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: data.data.languages, isMockData: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Google Translate Languages API Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to get supported languages", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== SUBSCRIPTIONS ROUTES ====================

// Create checkout session
router.add("POST", "/api/subscriptions/create-checkout-session", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const { planId, successUrl, cancelUrl } = body;

    if (!planId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "planId, successUrl, and cancelUrl are required", code: "MISSING_FIELDS" }),
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const plans: Record<string, any> = {
      premium: { name: "プレミアムプラン", price: 2500, currency: "JPY", interval: "month" },
    };

    const plan = plans[planId];
    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Invalid plan ID", code: "INVALID_PLAN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: { name: plan.name, description: "AI搭載の旅行プランニングサービス" },
            unit_amount: plan.price,
            recurring: { interval: plan.interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&user_id=${auth.user.id}`,
      cancel_url: cancelUrl,
      customer_email: auth.user.email,
      metadata: { user_id: auth.user.id, plan_id: planId, plan_name: plan.name },
      subscription_data: { metadata: { user_id: auth.user.id, plan_id: planId } },
    });

    return new Response(
      JSON.stringify({ success: true, data: { sessionId: session.id, sessionUrl: session.url } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create checkout session error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session", code: "CHECKOUT_SESSION_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get subscription status
router.add("GET", "/api/subscriptions/status", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("is_premium, premium_expires_at, email")
      .eq("id", auth.user.id)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch user status", code: "USER_STATUS_ERROR", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isPremium = user.is_premium;
    const expiresAt = user.premium_expires_at;
    const isActive = isPremium && (!expiresAt || new Date(expiresAt) > new Date());

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          isPremium: isActive,
          planName: isActive ? "プレミアムプラン" : "フリープラン",
          amount: isActive ? 2500 : 0,
          currency: "JPY",
          interval: "month",
          nextBillingDate: isActive ? expiresAt : null,
          status: isActive ? "active" : "free",
          expiresAt: expiresAt,
          isActive: isActive,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get subscription status error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get subscription status", code: "SUBSCRIPTION_STATUS_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== ADDITIONAL PAYMENT ROUTES ====================

// Confirm payment
router.add("POST", "/api/payments/confirm", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const { payment_intent_id } = body;

    if (!payment_intent_id) {
      return new Response(
        JSON.stringify({ error: "Payment intent ID is required", code: "MISSING_PAYMENT_INTENT" }),
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: "Payment not successful", code: "PAYMENT_NOT_SUCCESSFUL", status: paymentIntent.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        transaction_id: paymentIntent.charges.data[0]?.id,
        payment_method: paymentIntent.payment_method_types[0],
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", payment_intent_id)
      .eq("user_id", auth.user.id)
      .select()
      .single();

    if (paymentError) {
      return new Response(
        JSON.stringify({ error: "Failed to update payment record", code: "PAYMENT_UPDATE_ERROR", details: paymentError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: payment }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Confirm payment error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to confirm payment", code: "PAYMENT_CONFIRM_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get payment history
router.add("GET", "/api/payments", async (req) => {
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
      .from("payments")
      .select("*, bookings!payments_booking_id_fkey(*, trips!bookings_trip_id_fkey(title, destination))")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: payments, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch payments", code: "PAYMENTS_FETCH_ERROR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: payments }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get payments error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch payments", code: "PAYMENTS_FETCH_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== ESIM ROUTES ====================

// Get eSIM plans
router.add("GET", "/api/esim/plans", async (req) => {
  try {
    const esimKey = Deno.env.get("ESIMGO_API_KEY") || Deno.env.get("ESIM_TOKEN");
    const esimBaseUrl = Deno.env.get("ESIMGO_BASE_URL") || Deno.env.get("ESIM_BASE") || "https://api.esim-go.com/v2.4";

    if (!esimKey) {
      return new Response(
        JSON.stringify({ success: false, message: "eSIM API key not configured", isMockData: true, data: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `${esimBaseUrl}/catalogue?page=1`;
    const response = await fetch(url, {
      headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`eSIM API error: ${response.status}`);
    }

    const data = await response.json();
    const bundles = data.bundles || [];

    // Filter for Japan plans
    const japanBundles = bundles.filter((bundle: any) => {
      if (!bundle?.countries) return false;
      return bundle.countries.some((country: any) => {
        const iso = (country?.iso || country || "").toString().toUpperCase();
        return iso === "JP" || iso === "JPN" || iso.includes("JAPAN");
      });
    });

    return new Response(
      JSON.stringify({ success: true, data: japanBundles, isMockData: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get eSIM plans error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch eSIM plans", error: error.message, data: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Purchase eSIM
router.add("POST", "/api/esim/purchase", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const { planName, customerInfo } = body;

    if (!planName || !customerInfo) {
      return new Response(
        JSON.stringify({ error: "Plan name and customer info are required", code: "MISSING_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const esimKey = Deno.env.get("ESIMGO_API_KEY") || Deno.env.get("ESIM_TOKEN");
    const esimBaseUrl = Deno.env.get("ESIMGO_BASE_URL") || Deno.env.get("ESIM_BASE") || "https://api.esim-go.com/v2.4";

    if (!esimKey) {
      return new Response(
        JSON.stringify({ error: "eSIM API key not configured", code: "ESIM_UNCONFIGURED" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order
    const orderData = {
      bundle: planName,
      customer: customerInfo,
      type: "validate", // Testing mode
    };

    const url = `${esimBaseUrl}/orders`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eSIM API error: ${response.status} - ${errorText}`);
    }

    const orderResult = await response.json();

    // Store order in database
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: order, error: orderError } = await supabase
      .from("esim_orders")
      .insert({
        user_id: auth.user.id,
        plan_name: planName,
        order_reference: orderResult.orderReference || orderResult.id,
        status: "pending",
        provider_data: orderResult,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        data: { order: order || orderResult, message: "Order created successfully" },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Purchase eSIM error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to purchase eSIM", code: "ESIM_PURCHASE_ERROR", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get eSIM orders
router.add("GET", "/api/esim/orders", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: orders, error } = await supabase
      .from("esim_orders")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders", code: "ORDERS_FETCH_ERROR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: orders || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get eSIM orders error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch orders", code: "ORDERS_FETCH_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get single eSIM order
router.add("GET", "/api/esim/orders/:id", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: order, error } = await supabase
      .from("esim_orders")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found", code: "ORDER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: order }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get eSIM order error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch order", code: "ORDER_FETCH_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get order details from eSIM provider by orderReference
router.add("GET", "/api/esim/orders/:orderReference/details", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { orderReference } = params;
    if (!orderReference) {
      return new Response(
        JSON.stringify({ success: false, error: "Order reference is required", code: "MISSING_ORDER_REFERENCE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: userOrder, error: orderError } = await supabaseAdmin
      .from("esim_orders")
      .select("*")
      .eq("esim_provider_order_id", orderReference)
      .eq("user_id", auth.user.id)
      .single();

    if (orderError || !userOrder) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found or access denied", code: "ORDER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if manual assignment
    const isManualAssignment = orderReference.startsWith("manual-");
    let orderDetails = null;

    if (!isManualAssignment) {
      const esimKey = Deno.env.get("ESIMGO_API_KEY") || Deno.env.get("ESIM_TOKEN");
      const esimBaseUrl = Deno.env.get("ESIMGO_BASE_URL") || Deno.env.get("ESIM_BASE") || "https://api.esim-go.com/v2.4";

      if (esimKey) {
        try {
          const url = `${esimBaseUrl}/orders/${encodeURIComponent(orderReference)}`;
          const response = await fetch(url, {
            headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
          });

          if (response.ok) {
            orderDetails = await response.json();
          }
        } catch (apiError) {
          console.warn("Failed to fetch order details from eSIM Go API:", apiError);
        }
      }
    }

    // Extract eSIM details
    let esimDetails = null;
    let qrCode = null;
    let activationCode = null;
    let iccid = null;
    let createdDate = null;
    let expiryDate = null;

    if (orderDetails) {
      const rawCreatedDate = orderDetails.createdDate || orderDetails.created_date || orderDetails.created || userOrder.purchase_date || userOrder.created_at;
      if (rawCreatedDate) {
        try {
          const date = new Date(rawCreatedDate);
          if (!isNaN(date.getTime())) {
            createdDate = date.toISOString();
          }
        } catch (e) {
          console.warn("Failed to parse createdDate:", rawCreatedDate);
        }
      }

      if (orderDetails.order && Array.isArray(orderDetails.order) && orderDetails.order.length > 0) {
        const firstOrder = orderDetails.order[0];
        if (firstOrder.esims && Array.isArray(firstOrder.esims) && firstOrder.esims.length > 0) {
          const firstEsim = firstOrder.esims[0];
          iccid = firstEsim.iccid || iccid;
          activationCode = firstEsim.matchingId || activationCode;
          const smdpAddress = firstEsim.smdpAddress;

          if (smdpAddress && activationCode) {
            qrCode = `LPA:1$${smdpAddress}$${activationCode}`;
          }
        }
      }

      // Calculate expiry date
      if (createdDate && userOrder.plan_details?.validity && !expiryDate) {
        const validityStr = userOrder.plan_details.validity;
        const daysMatch = validityStr.match(/(\d+)/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1], 10);
          const expiry = new Date(createdDate);
          expiry.setDate(expiry.getDate() + days);
          expiryDate = expiry.toISOString();
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order: userOrder,
          orderDetails: orderDetails,
          esimDetails: {
            iccid,
            activationCode,
            qrCode,
            createdDate,
            expiryDate,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get eSIM order details error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch order details", code: "ORDER_DETAILS_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Activate eSIM
router.add("POST", "/api/esim/orders/:id/activate", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: order, error: orderError } = await supabase
      .from("esim_orders")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", auth.user.id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found", code: "ORDER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Order cannot be activated", code: "INVALID_ACTIVATION_STATUS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to activate via eSIM Go API
    let activationResult = null;
    const esimKey = Deno.env.get("ESIMGO_API_KEY") || Deno.env.get("ESIM_TOKEN");
    const esimBaseUrl = Deno.env.get("ESIMGO_BASE_URL") || Deno.env.get("ESIM_BASE") || "https://api.esim-go.com/v2.4";

    if (esimKey && order.esim_provider_order_id) {
      try {
        // Fetch assignment details as activation confirmation
        const url = `${esimBaseUrl}/esims/assignments/${encodeURIComponent(order.esim_provider_order_id)}`;
        const response = await fetch(url, {
          headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
        });

        if (response.ok) {
          activationResult = await response.json();
        }
      } catch (apiError) {
        console.warn("Failed to activate via eSIM Go API:", apiError);
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("esim_orders")
      .update({
        status: "active",
        activated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update order status", code: "ORDER_UPDATE_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: activationResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Activate eSIM error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to activate eSIM", code: "ESIM_ACTIVATION_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get eSIM usage
router.add("GET", "/api/esim/orders/:id/usage", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: order, error: orderError } = await supabase
      .from("esim_orders")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", auth.user.id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found", code: "ORDER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isUnlimited = order.plan_details?.unlimited === true ||
      order.plan_details?.dataAmount === "Unlimited" ||
      (typeof order.plan_details?.dataAmount === "string" && order.plan_details.dataAmount.toLowerCase().includes("unlimited"));

    let usage = null;
    const esimKey = Deno.env.get("ESIMGO_API_KEY") || Deno.env.get("ESIM_TOKEN");
    const esimBaseUrl = Deno.env.get("ESIMGO_BASE_URL") || Deno.env.get("ESIM_BASE") || "https://api.esim-go.com/v2.4";

    if (esimKey && order.esim_provider_order_id) {
      try {
        const url = `${esimBaseUrl}/esims/assignments/${encodeURIComponent(order.esim_provider_order_id)}`;
        const response = await fetch(url, {
          headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
        });

        if (response.ok) {
          usage = await response.json();
        }
      } catch (apiError) {
        console.warn("Failed to fetch usage from eSIM Go API:", apiError);
      }
    }

    let assignment = null;
    if (usage) {
      if (Array.isArray(usage) && usage.length > 0) {
        assignment = usage[0];
      } else if (typeof usage === "object") {
        assignment = usage;
      }
    }

    let usageData = order.usage_data || {};

    if (assignment && !isUnlimited) {
      const dataRemainingMb = assignment.dataRemainingMb || assignment["Data Remaining MB"] || assignment.dataRemaining || assignment.remainingData || null;
      const dataUsedMb = assignment.dataUsedMb || assignment["Data Used MB"] || assignment.dataUsed || assignment.usedData || null;
      const dataTotalMb = assignment.dataTotalMb || assignment["Data Total MB"] || assignment.dataTotal || assignment.totalData || null;

      if (dataRemainingMb !== null || dataUsedMb !== null || dataTotalMb !== null) {
        const totalGB = dataTotalMb ? (dataTotalMb / 1024) : 0;
        let usedGB = 0;
        if (dataUsedMb !== null) {
          usedGB = dataUsedMb / 1024;
        } else if (dataRemainingMb !== null && dataTotalMb !== null) {
          usedGB = Math.max(0, (dataTotalMb - dataRemainingMb) / 1024);
        }

        usageData = {
          dataRemainingMb: dataRemainingMb || (totalGB > 0 ? (totalGB - usedGB) * 1024 : null),
          dataUsedMb: dataUsedMb || (usedGB * 1024),
          dataTotalMb: dataTotalMb || (totalGB * 1024),
          usedGB: Number(usedGB.toFixed(2)),
          totalGB: Number(totalGB.toFixed(2)),
          lastUpdated: new Date().toISOString(),
          ...usageData,
        };
      }
    } else if (isUnlimited) {
      usageData = {
        ...usageData,
        unlimited: true,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Persist usage snapshot
    await supabase
      .from("esim_orders")
      .update({ usage_data: usageData })
      .eq("id", params.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderId: order.id,
          unlimited: isUnlimited,
          ...(isUnlimited
            ? { unlimited: true, message: "Unlimited data plan" }
            : {
                usedGB: usageData.usedGB || 0,
                totalGB: usageData.totalGB || 0,
                dataRemainingMb: usageData.dataRemainingMb,
                dataUsedMb: usageData.dataUsedMb,
                dataTotalMb: usageData.dataTotalMb,
                percentage: usageData.totalGB > 0 ? Math.round(((usageData.usedGB || 0) / usageData.totalGB) * 100) : 0,
              }),
          lastUpdated: usageData.lastUpdated || new Date().toISOString(),
          raw: assignment || usage,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get eSIM usage error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch usage", code: "USAGE_FETCH_ERROR", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Cancel eSIM order
router.add("POST", "/api/esim/orders/:id/cancel", async (req, params) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient(req.headers.get("authorization"));
    const { data: order, error: orderError } = await supabase
      .from("esim_orders")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", auth.user.id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found", code: "ORDER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.status === "active") {
      return new Response(
        JSON.stringify({ error: "Active eSIM cannot be cancelled", code: "ACTIVE_ESIM_CANNOT_CANCEL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to cancel via eSIM Go API (may not be supported)
    let cancelResult = null;
    const esimKey = Deno.env.get("ESIMGO_API_KEY") || Deno.env.get("ESIM_TOKEN");
    const esimBaseUrl = Deno.env.get("ESIMGO_BASE_URL") || Deno.env.get("ESIM_BASE") || "https://api.esim-go.com/v2.4";

    if (esimKey && order.esim_provider_order_id) {
      try {
        const url = `${esimBaseUrl}/orders/${encodeURIComponent(order.esim_provider_order_id)}/cancel`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
        });

        if (response.ok) {
          cancelResult = await response.json();
        }
      } catch (cancelError) {
        console.warn("Cancel endpoint not available, updating status only:", cancelError);
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("esim_orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update order status", code: "ORDER_UPDATE_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: cancelResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cancel eSIM order error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to cancel order", code: "ORDER_CANCEL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  const startTime = Date.now();
  const url = new URL(req.url);
  console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname}`);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("✅ Handling OPTIONS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Try to handle the request with router
    const response = await router.handle(req);
    if (response) {
      const duration = Date.now() - startTime;
      console.log(`✅ Request handled successfully in ${duration}ms`);
      return response;
    }

    // 404 for unmatched routes
    console.log(`❌ Route not found: ${url.pathname}`);
    return new Response(
      JSON.stringify({ error: "Endpoint not found", code: "NOT_FOUND", path: url.pathname }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error handling request (${duration}ms):`, error);
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

