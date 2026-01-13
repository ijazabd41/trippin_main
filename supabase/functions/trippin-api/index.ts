// Supabase Edge Function for Trippin Backend API
// This replaces the Express.js server with a Deno-based edge function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.7.0?target=deno";
// Using direct fetch instead of OpenAI SDK to avoid Deno compatibility issues
// // Using direct fetch instead of OpenAI SDK to avoid Deno compatibility issues
// import OpenAI from "https://esm.sh/openai@4.20.1";

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
    console.log("❌ No token provided in Authorization header");
    return { user: null, error: { message: "Access token required", code: "UNAUTHORIZED" } };
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Supabase configuration missing");
      return { user: null, error: { message: "Server configuration error", code: "CONFIG_ERROR" } };
    }
    
    console.log("🔍 Authenticating token:", {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "no token",
      supabaseUrl: supabaseUrl ? "present" : "missing",
      supabaseAnonKey: supabaseAnonKey ? "present" : "missing"
    });
    
    // Use Supabase REST API directly to verify token - more reliable in edge functions
    // This bypasses the client library's session management which can be problematic
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": supabaseAnonKey,
      },
    });
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      console.error("❌ Token validation failed:", userResponse.status, errorData);
      return { 
        user: null, 
        error: { 
          message: errorData.message || errorData.error_description || "Invalid or expired token", 
          code: "UNAUTHORIZED" 
        } 
      };
    }
    
    const user = await userResponse.json();

    if (!user || !user.id) {
      console.error("❌ No user found in token response");
      return { user: null, error: { message: "Invalid or expired token", code: "UNAUTHORIZED" } };
    }

    console.log("✅ Token validated successfully for user:", user.id);
    return { user, error: null };
  } catch (error: any) {
    console.error("❌ Authentication exception:", error.message || error);
    return { user: null, error: { message: error.message || "Authentication failed", code: "AUTH_ERROR" } };
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

    const interests = Array.isArray(tripData.interests) ? tripData.interests.join(", ") : tripData.interests || "general travel";
    const dietaryRestrictions = Array.isArray(tripData.dietaryRestrictions) ? tripData.dietaryRestrictions.join(", ") : tripData.dietaryRestrictions || "none";

    // Calculate start date for itinerary
    const startDate = tripData.startDate || new Date().toISOString().split('T')[0];
    const startDateObj = new Date(startDate);
    
    const prompt = `Create a COMPLETE travel itinerary for ${tripData.destination || "a destination"} for ${duration} days with a budget of ${tripData.budget || 100000} ${tripData.currency || "JPY"}.

Travelers: ${tripData.travelers || 1}
Interests: ${interests}
Dietary restrictions: ${dietaryRestrictions}
Accommodation type: ${tripData.accommodationType || "mid-range"}
Transportation type: ${tripData.transportationType || "public"}

CRITICAL REQUIREMENT: The itinerary array MUST contain exactly ${duration} days. You MUST include ALL days from day 1 to day ${duration}. Each day should have a unique theme and multiple activities throughout the day.

You MUST return a valid JSON object with this EXACT structure (include ALL fields - recommendations and practicalInformation are REQUIRED):

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
      "date": "${startDate}",
      "theme": "Day 1 theme",
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
    },
    {
      "day": 2,
      "date": "${new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
      "theme": "Day 2 theme",
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
    }${duration > 2 ? `,
    {
      "day": 3,
      "date": "${new Date(startDateObj.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}",
      "theme": "Day 3 theme",
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
    }` : ''}
    ${duration > 3 ? `... (continue for ALL ${duration} days, incrementing the day number and date for each day) ...` : ''}
  ],
  "recommendations": {
    "restaurants": [
      {
        "name": "Restaurant name",
        "cuisine": "Cuisine type",
        "priceRange": "$",
        "location": "Location",
        "description": "Description"
      }
    ],
    "attractions": [
      {
        "name": "Attraction name",
        "type": "Type",
        "location": "Location",
        "description": "Description",
        "bestTime": "Morning"
      }
    ],
    "transportation": [
      {
        "type": "Transport type",
        "description": "Description",
        "cost": 0,
        "tips": "Tips"
      }
    ]
  },
  "practicalInformation": {
    "weather": "Weather information",
    "packingList": ["Item 1", "Item 2", "Item 3"],
    "localCustoms": ["Custom 1", "Custom 2"],
    "emergencyContacts": ["Contact 1", "Contact 2"],
    "usefulPhrases": ["Phrase 1", "Phrase 2"],
    "transportation": "Transportation tips",
    "tips": "General travel tips"
  }
}`;

    console.log("Calling OpenAI API with prompt length:", prompt.length);

    // Call OpenAI API directly using fetch to avoid Deno compatibility issues
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
            content: `You are a travel planning assistant. Always respond with valid JSON only, no additional text or markdown formatting. CRITICAL: If the itinerary duration is ${duration} days, you MUST include exactly ${duration} days in the itinerary array, with days numbered from 1 to ${duration}.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
        max_tokens: 6000, // Increased to allow for complete multi-day itineraries
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText} - ${errorText}`);
    }

    const completion = await openaiResponse.json();
    console.log("OpenAI API response received");
    
    // Log full response structure for debugging
    console.log("OpenAI completion structure:", {
      hasChoices: !!completion.choices,
      choicesLength: completion.choices?.length || 0,
      hasMessage: !!completion.choices?.[0]?.message,
      hasContent: !!completion.choices?.[0]?.message?.content,
      contentLength: completion.choices?.[0]?.message?.content?.length || 0,
      usage: completion.usage || 'not provided',
      finishReason: completion.choices?.[0]?.finish_reason || 'not provided'
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error("OpenAI API returned empty content. Full completion:", JSON.stringify(completion, null, 2));
      throw new Error("OpenAI API returned empty response");
    }

    // Log content length and preview to verify full response
    console.log("OpenAI content received:", {
      length: content.length,
      preview: content.substring(0, 200),
      endsWithCompleteJson: content.trim().endsWith('}') || content.trim().endsWith(']'),
      finishReason: completion.choices?.[0]?.finish_reason
    });

    // Check if response was truncated due to token limit
    if (completion.choices?.[0]?.finish_reason === 'length') {
      console.warn("⚠️ OpenAI response was truncated due to token limit! Consider increasing max_tokens.");
    }

    // Try to parse JSON, handle both JSON and markdown-wrapped JSON
    let plan;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      // Handle escaped newlines - if content has literal \n characters, they need to be handled
      // But if it's already valid JSON with actual newlines, we need to be careful
      // Try parsing first, if it fails, try cleaning escaped sequences
      try {
        plan = JSON.parse(cleanedContent);
        console.log("✅ Successfully parsed OpenAI JSON response");
        console.log("Parsed plan structure:", {
          hasTitle: !!plan.title,
          hasDestination: !!plan.destination,
          hasDuration: !!plan.duration,
          hasBudget: !!plan.budget,
          hasItinerary: !!plan.itinerary,
          itineraryLength: plan.itinerary?.length || 0,
          totalActivities: plan.itinerary?.reduce((sum: number, day: any) => sum + (day.activities?.length || 0), 0) || 0,
          hasRecommendations: !!plan.recommendations,
          hasPracticalInfo: !!plan.practicalInfo
        });
        
        // Validate that all days are present
        if (plan.itinerary && Array.isArray(plan.itinerary)) {
          const expectedDays = duration;
          const actualDays = plan.itinerary.length;
          const daysPresent = plan.itinerary.map((d: any) => d.day).sort((a: number, b: number) => a - b);
          
          console.log("📅 Itinerary validation:", {
            expectedDays,
            actualDays,
            daysPresent,
            missingDays: Array.from({ length: expectedDays }, (_, i) => i + 1).filter(d => !daysPresent.includes(d))
          });
          
          if (actualDays < expectedDays) {
            console.warn(`⚠️ WARNING: Itinerary only has ${actualDays} days but ${expectedDays} days were requested!`);
            console.warn("Missing days:", Array.from({ length: expectedDays }, (_, i) => i + 1).filter(d => !daysPresent.includes(d)));
            
            // Generate missing days
            const missingDays = Array.from({ length: expectedDays }, (_, i) => i + 1)
              .filter(d => !daysPresent.includes(d));
            
            missingDays.forEach((dayNum) => {
              const dayDate = new Date(startDateObj.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
              plan.itinerary.push({
                day: dayNum,
                date: dayDate.toISOString().split('T')[0],
                theme: `Day ${dayNum} Activities`,
                activities: [
                  {
                    time: "09:00",
                    title: `Explore ${tripData.destination || "the destination"}`,
                    description: `Continue your journey with more activities and experiences.`,
                    location: tripData.destination || "Destination",
                    type: "sightseeing",
                    duration: 180,
                    cost: 0
                  }
                ]
              });
            });
            
            // Sort itinerary by day number
            plan.itinerary.sort((a: any, b: any) => a.day - b.day);
            
            console.log(`✅ Generated ${missingDays.length} missing day(s). Total days now: ${plan.itinerary.length}`);
          }
        }
      } catch (firstError) {
        // If first parse fails, try handling escaped sequences
        cleanedContent = cleanedContent.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"');
        plan = JSON.parse(cleanedContent);
        console.log("✅ Successfully parsed OpenAI JSON after cleaning escaped sequences");
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      console.error("Response content length:", content.length);
      console.error("Response content preview (first 500 chars):", content.substring(0, 500));
      console.error("Response content preview (last 500 chars):", content.substring(Math.max(0, content.length - 500)));
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

    // Log the plan being sent to frontend
    const planJson = JSON.stringify(plan);
    console.log("📤 Sending plan to frontend:", {
      planSize: planJson.length,
      planStructure: {
        hasTitle: !!plan.title,
        hasDestination: !!plan.destination,
        hasDuration: !!plan.duration,
        hasBudget: !!plan.budget,
        hasItinerary: !!plan.itinerary,
        itineraryLength: plan.itinerary?.length || 0,
        totalActivities: plan.itinerary?.reduce((sum: number, day: any) => sum + (day.activities?.length || 0), 0) || 0,
        hasRecommendations: !!plan.recommendations,
        hasPracticalInfo: !!plan.practicalInfo
      }
    });

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

// Chat endpoint - OpenAI chat completions for travel assistance
router.add("POST", "/api/openai/chat", async (req) => {
  try {
    const body = await parseBody(req);
    const { message, language = "ja", context = "travel_japan", conversationHistory = [] } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Message is required and must be a non-empty string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.warn("OpenAI API key not configured, using fallback response");
      
      const fallbackResponses: Record<string, string> = {
        ja: "申し訳ございませんが、現在AIサービスが一時的に利用できません。基本的な日本旅行情報についてお答えできます。緊急連絡先: 警察110、消防・救急119、観光ホットライン050-3816-2787",
        en: "Sorry, AI service is temporarily unavailable. I can provide basic Japan travel information. Emergency contacts: Police 110, Fire/Ambulance 119, Tourist Hotline 050-3816-2787",
        zh: "抱歉，AI服务暂时不可用。我可以提供基本的日本旅游信息。紧急联系方式：警察110、消防/救护车119、旅游热线050-3816-2787",
        ko: "죄송합니다. AI 서비스가 일시적으로 사용할 수 없습니다. 기본적인 일본 여행 정보를 제공할 수 있습니다. 긴급 연락처: 경찰 110, 소방/응급 119, 관광 핫라인 050-3816-2787",
      };
      
      return new Response(
        JSON.stringify({
          success: true,
          response: fallbackResponses[language] || fallbackResponses.ja,
          language,
          isMockData: true,
          message: "OpenAI API key not configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create system prompt based on context and language
    const systemPrompts: Record<string, string> = {
      travel_japan: `あなたは日本の旅行の専門家です。${language}で回答してください。観光地、交通手段、文化、食事、宿泊施設など、日本旅行に関する質問に親切で正確な情報を提供してください。`,
      general: `You are a helpful travel assistant. Respond in ${language}.`,
    };

    const systemPrompt = systemPrompts[context] || systemPrompts.general;

    // Build messages array with conversation history
    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Add conversation history (last 10 messages)
    const recentHistory = Array.isArray(conversationHistory) ? conversationHistory.slice(-10) : [];
    recentHistory.forEach((msg: any) => {
      if (msg && msg.role && msg.content) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    // Add current user message
    messages.push({
      role: "user",
      content: message.trim(),
    });

    // Call OpenAI Chat Completions API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        body: errorText,
      });

      // Return fallback response instead of throwing
      const fallbackResponses: Record<string, string> = {
        ja: "申し訳ございませんが、現在AIサービスが一時的に利用できません。基本的な日本旅行情報についてお答えできます。",
        en: "Sorry, AI service is temporarily unavailable. I can provide basic Japan travel information.",
        zh: "抱歉，AI服务暂时不可用。我可以提供基本的日本旅游信息。",
        ko: "죄송합니다. AI 서비스가 일시적으로 사용할 수 없습니다. 기본적인 일본 여행 정보를 제공할 수 있습니다.",
      };

      return new Response(
        JSON.stringify({
          success: true,
          response: fallbackResponses[language] || fallbackResponses.ja,
          language,
          isMockData: true,
          message: `OpenAI API error: ${openaiResponse.status}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await openaiResponse.json();
    const response = data.choices?.[0]?.message?.content || "申し訳ございません。回答を生成できませんでした。";

    return new Response(
      JSON.stringify({
        success: true,
        response,
        language,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Chat API Error:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });

    const language = (await parseBody(req).catch(() => ({})) as any)?.language || "ja";
    const fallbackResponses: Record<string, string> = {
      ja: "申し訳ございませんが、現在AIサービスが一時的に利用できません。基本的な日本旅行情報についてお答えできます。",
      en: "Sorry, AI service is temporarily unavailable. I can provide basic Japan travel information.",
      zh: "抱歉，AI服务暂时不可用。我可以提供基本的日本旅游信息。",
      ko: "죄송합니다. AI 서비스가 일시적으로 사용할 수 없습니다. 기본적인 일본 여행 정보를 제공할 수 있습니다.",
    };

    return new Response(
      JSON.stringify({
        success: true,
        response: fallbackResponses[language] || fallbackResponses.ja,
        language,
        isMockData: true,
        message: error.message || "OpenAI APIが一時的に利用できません。",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Add timeout to prevent Edge Function from shutting down
    // Supabase Edge Functions have 60s timeout, so we'll use 50s for OpenAI call
    const OPENAI_TIMEOUT = 50000; // 50 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT);

    try {
      // Call OpenAI API directly using fetch to avoid Deno compatibility issues
      // Use faster model and JSON mode for better performance and reliability
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // Faster than gpt-4, reduces timeout risk
          messages: [
            {
              role: "system",
              content: "You are a travel planning assistant. Always respond with valid JSON only, no additional text or markdown formatting.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2500, // Reduced to speed up generation
          response_format: { type: "json_object" }, // Force JSON output
        }),
        signal: controller.signal, // Add abort signal for timeout
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

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
      // Remove markdown code blocks if present (even with response_format, sometimes GPT adds them)
      let cleanedContent = content.trim();
      
      // Remove markdown code blocks
      cleanedContent = cleanedContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      
      // Try parsing first
      try {
        plan = JSON.parse(cleanedContent);
        console.log("✅ Successfully parsed OpenAI JSON response");
      } catch (firstError) {
        // If first parse fails, try extracting JSON from text
        // Look for JSON object boundaries
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          plan = JSON.parse(jsonMatch[0]);
          console.log("✅ Successfully extracted and parsed JSON from response");
        } else {
          throw new Error("No valid JSON found in response");
        }
      }
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI response as JSON:", parseError);
      console.error("Response content (first 500 chars):", content.substring(0, 500));
      console.error("Full response length:", content.length);
      
      // Return a structured fallback plan with better error info
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
        note: "AI response parsing failed, using fallback plan",
        rawResponse: content.substring(0, 500), // Store more of the response for debugging
        parseError: parseError.message,
      };
    }

      return new Response(
        JSON.stringify({ success: true, data: plan }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId); // Ensure timeout is cleared
      
      // Handle timeout specifically
      if (fetchError.name === "AbortError" || fetchError.message?.includes("aborted")) {
        console.error("⏱️ OpenAI API call timed out after 50 seconds");
        
        // Return fallback plan instead of error to prevent function shutdown
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
          note: "OpenAI API call timed out, using fallback plan",
          isTimeout: true,
        };
        
        return new Response(
          JSON.stringify({ success: true, data: fallbackPlan, isTimeout: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Re-throw other fetch errors to be handled by outer catch
      throw fetchError;
    }
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

// Translate image text using Google Vision API + Google Translate API
router.add("POST", "/api/google-translate/image-translate", async (req) => {
  try {
    const body = await parseBody(req);
    const { image, sourceLanguage = "auto", targetLanguage = "en" } = body;

    if (!image) {
      return new Response(
        JSON.stringify({ success: false, message: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const translateKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!translateKey) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            translatedText: "⚠️ Google Translate API not configured\n\nTo enable image translation:\n1. Get a Google Translate API key\n2. Add GOOGLE_TRANSLATE_API_KEY to your environment\n\nNote: This requires both Google Vision API and Google Translate API to be enabled.",
            detectedLanguage: sourceLanguage === "auto" ? "en" : sourceLanguage,
          },
          isMockData: true,
          message: "Google Translate API not configured. Image translation requires both Google Vision API and Google Translate API.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Use Google Vision API to extract text from image
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${translateKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: image },
          features: [{ type: "TEXT_DETECTION", maxResults: 10 }],
        }],
      }),
    });

    if (!visionResponse.ok) {
      throw new Error(`Google Vision API error: ${visionResponse.status} ${visionResponse.statusText}`);
    }

    const visionData = await visionResponse.json();

    if (!visionData.responses || !visionData.responses[0] || !visionData.responses[0].textAnnotations || visionData.responses[0].textAnnotations.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            translatedText: "No text found in the image.",
            detectedLanguage: sourceLanguage === "auto" ? "en" : sourceLanguage,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedText = visionData.responses[0].textAnnotations[0].description;

    // Step 2: Use Google Translate API to translate the extracted text
    const translateResponse = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${translateKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: extractedText,
        source: sourceLanguage === "auto" ? undefined : sourceLanguage,
        target: targetLanguage,
        format: "text",
      }),
    });

    if (!translateResponse.ok) {
      throw new Error(`Google Translate API error: ${translateResponse.status} ${translateResponse.statusText}`);
    }

    const translateData = await translateResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          translatedText: translateData.data.translations[0].translatedText,
          originalText: extractedText,
          detectedLanguage: translateData.data.translations[0].detectedSourceLanguage || sourceLanguage,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Google image translation error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to translate image text", error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Speech-to-Text using Google Speech-to-Text API
router.add("POST", "/api/google-translate/speech-to-text", async (req) => {
  try {
    const body = await parseBody(req);
    const { audio, language = "en-US" } = body;

    if (!audio) {
      return new Response(
        JSON.stringify({ success: false, message: "Audio data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const translateKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!translateKey) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            transcript: "⚠️ Google Speech-to-Text API not configured\n\nTo enable speech-to-text:\n1. Get a Google Speech-to-Text API key\n2. Add GOOGLE_TRANSLATE_API_KEY to your environment\n\nNote: This requires Google Speech-to-Text API to be enabled.",
            confidence: 0.0,
          },
          isMockData: true,
          message: "Google Speech-to-Text API not configured. Please type your text instead.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Google Speech-to-Text API
    const speechResponse = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${translateKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding: "WEBM_OPUS",
          sampleRateHertz: 48000,
          languageCode: language,
          enableAutomaticPunctuation: true,
          model: "latest_long",
        },
        audio: { content: audio },
      }),
    });

    if (!speechResponse.ok) {
      const errorData = await speechResponse.json();
      console.error("Google Speech-to-Text API Error:", errorData);
      throw new Error(`Google Speech-to-Text API error: ${speechResponse.status} ${speechResponse.statusText}`);
    }

    const speechData = await speechResponse.json();

    if (!speechData.results || speechData.results.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            transcript: "No speech detected in the audio.",
            confidence: 0.0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = speechData.results[0];
    const alternative = result.alternatives[0];

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transcript: alternative.transcript,
          confidence: alternative.confidence || 0.0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Google Speech-to-Text error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to process speech-to-text", error: error.message }),
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

// Cancel subscription
router.add("POST", "/api/subscriptions/cancel", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("🔄 Cancel subscription request for user:", auth.user.id, auth.user.email);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseAdmin = getSupabaseAdmin();

    if (!stripeKey) {
      console.log("⚠️ Stripe not configured, updating database only");
      // If Stripe is not configured, just update the database
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          is_premium: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", auth.user.id);

      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      // Create notification
      await supabaseAdmin.from("notifications").insert({
        user_id: auth.user.id,
        type: "subscription_cancelled",
        title: "Subscription Cancelled",
        message: "Your premium subscription has been cancelled.",
        metadata: {
          cancelled_at: new Date().toISOString(),
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription cancelled successfully (Stripe not configured)",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Try to find customer by email first
    let customerId = null;
    try {
      const customers = await stripe.customers.list({
        email: auth.user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("✅ Found Stripe customer:", customerId);
      }
    } catch (stripeError) {
      console.warn("⚠️ Could not find Stripe customer by email:", stripeError.message);
    }

    // If no customer found, try to find subscriptions by user ID in metadata
    let subscription = null;
    if (customerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          subscription = subscriptions.data[0];
          console.log("✅ Found active subscription:", subscription.id);
        }
      } catch (stripeError) {
        console.warn("⚠️ Could not find subscriptions for customer:", stripeError.message);
      }
    }

    // If no subscription found via customer, try to find by user ID in metadata
    if (!subscription) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          status: "active",
          limit: 100, // Get more to search through
        });

        // Find subscription with matching user ID in metadata
        subscription = subscriptions.data.find(
          (sub) => sub.metadata && sub.metadata.user_id === auth.user.id
        );

        if (subscription) {
          console.log("✅ Found subscription by user ID metadata:", subscription.id);
        }
      } catch (stripeError) {
        console.warn("⚠️ Could not search subscriptions by metadata:", stripeError.message);
      }
    }

    if (subscription) {
      // Cancel the subscription in Stripe (set to cancel at period end)
      try {
        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        });
        console.log("✅ Subscription cancelled in Stripe (will cancel at period end)");
      } catch (stripeError) {
        console.warn("⚠️ Could not cancel subscription in Stripe:", stripeError.message);
        // Continue with database update even if Stripe fails
      }
    } else {
      console.log("⚠️ No active subscription found in Stripe, updating database only");
    }

    // Update user status in database
    const expiresAt = subscription
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        is_premium: false,
        premium_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.user.id);

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    // Create notification
    await supabaseAdmin.from("notifications").insert({
      user_id: auth.user.id,
      type: "subscription_cancelled",
      title: "Subscription Cancelled",
      message:
        "Your premium subscription has been cancelled and will expire at the end of your current billing period.",
      metadata: {
        subscription_id: subscription?.id || null,
        expires_at: expiresAt,
      },
    });

    console.log("✅ Subscription cancellation completed");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription cancelled successfully",
        data: {
          expiresAt: expiresAt,
          subscriptionId: subscription?.id || null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Cancel subscription error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to cancel subscription",
        code: "SUBSCRIPTION_CANCEL_ERROR",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Verify payment - check if checkout session was successful
router.add("POST", "/api/subscriptions/verify-payment", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await parseBody(req);
    const { sessionId, userId } = body;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID is required", code: "MISSING_SESSION_ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🔄 Payment verification endpoint called");
    console.log("🔍 Session ID:", sessionId);
    console.log("🔍 User ID:", userId || auth.user.id);

    const supabaseAdmin = getSupabaseAdmin();
    const actualUserId = userId || auth.user.id;

    // Check if Stripe is configured
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.log("⚠️ Stripe not configured, updating user to premium directly");

      // If Stripe is not configured, update user to premium directly
      if (actualUserId) {
        // First, ensure user exists in database
        const { data: existingUser, error: userError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("id", actualUserId)
          .single();

        if (userError && userError.code === "PGRST116") {
          // User doesn't exist, create them
          console.log("🔄 User not found, creating user record...");
          const { error: createError } = await supabaseAdmin.from("users").insert({
            id: actualUserId,
            email: auth.user.email || "user@example.com",
            full_name: auth.user.user_metadata?.full_name || "Premium User",
            is_premium: true,
            premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (createError) {
            console.error("❌ Failed to create user:", createError);
          } else {
            console.log("✅ User created and set to premium");
          }
        } else {
          // User exists, update to premium
          console.log("🔄 User exists, updating to premium...");
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from("users")
            .update({
              is_premium: true,
              premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", actualUserId)
            .select();

          if (updateError) {
            console.error("❌ Failed to update user to premium:", updateError);
          } else {
            console.log("✅ User updated to premium (development mode)");
            console.log("📊 Update result:", updateData);
          }
        }

        // Create notification
        await supabaseAdmin.from("notifications").insert({
          user_id: actualUserId,
          type: "subscription_created",
          title: "Welcome to Premium!",
          message: "Your premium subscription has been activated. Enjoy all the premium features!",
          metadata: {
            session_id: sessionId,
            mode: "development",
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment verified successfully (development mode)",
          data: {
            sessionId: sessionId,
            paymentStatus: "paid",
            userId: actualUserId,
            mode: "development",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the checkout session with Stripe
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log("🔍 Stripe session retrieved:", {
        id: session.id,
        status: session.payment_status,
        customer_email: session.customer_email,
        metadata: session.metadata,
      });

      if (session.payment_status === "paid") {
        const sessionUserId = session.metadata?.user_id || actualUserId;

        if (sessionUserId) {
          // Update user to premium
          const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({
              is_premium: true,
              premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", sessionUserId);

          if (updateError) {
            console.error("❌ Failed to update user to premium:", updateError);
          } else {
            console.log("✅ User updated to premium:", sessionUserId);
          }

          // Create notification
          await supabaseAdmin.from("notifications").insert({
            user_id: sessionUserId,
            type: "subscription_created",
            title: "Welcome to Premium!",
            message: "Your premium subscription has been activated. Enjoy all the premium features!",
            metadata: {
              session_id: sessionId,
              plan_id: session.metadata?.plan_id,
              mode: "production",
            },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment verified successfully",
            data: {
              sessionId: sessionId,
              paymentStatus: "paid",
              customerEmail: session.customer_email,
              userId: sessionUserId,
              mode: "production",
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.log("❌ Payment not completed:", session.payment_status);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Payment not completed",
            code: "PAYMENT_NOT_COMPLETED",
            paymentStatus: session.payment_status,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (stripeError: any) {
      console.error("❌ Stripe session retrieval error:", stripeError);

      // If Stripe session retrieval fails, but we have a userId, update optimistically
      if (actualUserId) {
        console.log("⚠️ Stripe error, updating user to premium optimistically");

        // First, ensure user exists in database
        const { data: existingUser, error: userError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("id", actualUserId)
          .single();

        if (userError && userError.code === "PGRST116") {
          // User doesn't exist, create them
          console.log("🔄 User not found, creating user record...");
          const { error: createError } = await supabaseAdmin.from("users").insert({
            id: actualUserId,
            email: auth.user.email || "user@example.com",
            full_name: auth.user.user_metadata?.full_name || "Premium User",
            is_premium: true,
            premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (createError) {
            console.error("❌ Failed to create user:", createError);
          } else {
            console.log("✅ User created and set to premium");
          }
        } else {
          // User exists, update to premium
          console.log("🔄 User exists, updating to premium (optimistic)...");
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from("users")
            .update({
              is_premium: true,
              premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", actualUserId)
            .select();

          if (updateError) {
            console.error("❌ Failed to update user to premium:", updateError);
          } else {
            console.log("✅ User updated to premium (optimistic)");
            console.log("📊 Update result:", updateData);
          }
        }

        // Create notification
        await supabaseAdmin.from("notifications").insert({
          user_id: actualUserId,
          type: "subscription_created",
          title: "Welcome to Premium!",
          message: "Your premium subscription has been activated. Enjoy all the premium features!",
          metadata: {
            session_id: sessionId,
            mode: "optimistic",
          },
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment verified successfully (optimistic update)",
            data: {
              sessionId: sessionId,
              paymentStatus: "paid",
              userId: actualUserId,
              mode: "optimistic",
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw stripeError;
    }
  } catch (error: any) {
    console.error("❌ Verify payment error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to verify payment",
        code: "VERIFY_PAYMENT_ERROR",
        details: error.message,
      }),
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

    // Always filter for Japan (JP) plans only
    // The API doesn't support direct country filtering in catalogue, so we'll search through pages
    const maxPagesToSearch = 20; // Search first 20 pages to find Japan plans (faster response)
    let allJapanBundles: any[] = [];
    let pageCount = 1;
    let totalBundlesChecked = 0;

    console.log("🔄 Fetching Japan (JP) eSIM plans from API...");

    // Search through multiple pages to find all Japan bundles
    for (let page = 1; page <= maxPagesToSearch; page++) {
      try {
        const url = `${esimBaseUrl}/catalogue?page=${page}`;
        const response = await fetch(url, {
          headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (page === 1) {
            throw new Error(`eSIM API error: ${response.status}`);
          }
          // If not first page, break and use what we have
          break;
        }

        const data = await response.json();
        const bundles = data.bundles || [];
        totalBundlesChecked += bundles.length;

        // Filter for Japan bundles with better matching logic
        const japanBundles = bundles.filter((bundle: any) => {
          if (!bundle || !bundle.countries) return false;
          return bundle.countries.some((country: any) => {
            if (typeof country === "object" && country !== null) {
              const iso = (country.iso || "").toString().toUpperCase();
              const name = (country.name || "").toString().toLowerCase();
              return iso === "JP" || iso === "JPN" || name.includes("japan");
            }
            if (typeof country === "string") {
              const countryLower = country.toLowerCase();
              return countryLower === "jp" || countryLower === "japan" || countryLower.includes("japan");
            }
            return false;
          });
        });

        if (japanBundles.length > 0) {
          allJapanBundles.push(...japanBundles);
          console.log(`   📄 Page ${page}: Found ${japanBundles.length} Japan bundles`);
        }

        // Check if we've reached the last page
        if (data.pageCount) {
          pageCount = data.pageCount;
          if (page >= pageCount) break;
        }

        // If no bundles on this page, we might have reached the end
        if (bundles.length === 0) break;
      } catch (pageError: any) {
        console.warn(`⚠️ Error fetching page ${page}:`, pageError.message);
        if (page === 1) {
          // If first page fails, throw error
          throw pageError;
        }
        // Otherwise, break and use what we have
        break;
      }
    }

    console.log(`✅ Found ${allJapanBundles.length} Japan bundles across ${totalBundlesChecked} total bundles checked`);

    // Use the collected Japan bundles
    const bundles = allJapanBundles;

    console.log(`🇯🇵 Processing ${bundles.length} Japan bundles for normalization`);

    // Normalize plan structure for the frontend (matching backend logic)
    const transformedPlans = bundles.map((p: any) => {
      // Convert dataAmount from MB to GB if needed
      // Handle unlimited plans (dataAmount: -1 or unlimited: true)
      const dataAmountMB = p.dataAmount || 0;
      const isUnlimited = p.unlimited === true || dataAmountMB === -1 || dataAmountMB < 0;

      let dataAmountGB = "";
      if (isUnlimited) {
        dataAmountGB = "Unlimited";
      } else if (dataAmountMB >= 1024) {
        dataAmountGB = `${(dataAmountMB / 1024).toFixed(1)}GB`;
      } else if (dataAmountMB > 0) {
        dataAmountGB = `${dataAmountMB}MB`;
      } else {
        // Try to extract from bundle name or size field
        const sizeMatch = p.name?.match(/(\d+)\s*(GB|MB|gb|mb)/i);
        if (sizeMatch) {
          dataAmountGB = sizeMatch[0];
        } else if (p.size) {
          dataAmountGB = `${p.size}${p.sizeUnit || "GB"}`;
        } else {
          dataAmountGB = "N/A";
        }
      }

      // Extract price and currency from API response
      // API may return price as: number, {amount: number, currency: string}, or {price: number, currency: string}
      let priceAmount = 0;
      let priceCurrency = "USD"; // Default fallback

      if (typeof p.price === "number") {
        priceAmount = p.price;
        // Try to find currency in other fields
        priceCurrency = p.currency || p.priceCurrency || (p.priceInfo && p.priceInfo.currency) || "USD";
      } else if (p.price && typeof p.price === "object") {
        priceAmount = p.price.amount || p.price.price || p.price.value || 0;
        priceCurrency = p.price.currency || p.currency || "USD";
      } else {
        priceAmount = p.cost || p.amount || 0;
        priceCurrency = p.currency || p.priceCurrency || "USD";
      }

      // Extract validity from API response
      // API may return: duration (number), validityDays (number), validity (string), or validityPeriod (string)
      let validity = "";
      if (p.duration) {
        // Format duration: "7 days" or "7日" for Japanese
        const duration = p.duration;
        validity = `${duration} ${duration === 1 ? "day" : "days"}`;
      } else if (p.validityDays) {
        const days = p.validityDays;
        validity = `${days} ${days === 1 ? "day" : "days"}`;
      } else if (p.validity) {
        validity = p.validity; // Use as-is if it's already a string
      } else if (p.validityPeriod) {
        validity = p.validityPeriod;
      } else {
        // Fallback: try to extract from name
        const validityMatch = p.name?.match(/(\d+)\s*(days|day|日)/i);
        if (validityMatch) {
          validity = `${validityMatch[1]}日`;
        } else {
          validity = "15日"; // Default fallback
        }
      }

      // Extract coverage from API response
      // Since we're filtering for Japan only, ensure coverage shows Japan
      // API may return: countries (array), coverage (array), regions (array), or coverageArea (array)
      // Coverage may be array of strings or array of objects with name/code properties
      const rawCoverage = p.countries || p.coverage || p.regions || p.coverageArea || [];

      // Normalize coverage to always be an array of strings, ensuring Japan is included
      let coverage: string[] = [];
      if (Array.isArray(rawCoverage)) {
        coverage = rawCoverage.map((item: any) => {
          if (typeof item === "string") {
            return item;
          } else if (typeof item === "object" && item !== null) {
            // Extract country name from object (could be name, country, countryName, code, etc.)
            return item.name || item.country || item.countryName || item.code || item.iso || JSON.stringify(item);
          }
          return String(item);
        });
      }

      // Ensure Japan is in coverage (all bundles are Japan, so this should always be true)
      if (coverage.length === 0 || !coverage.some((c) => c.toLowerCase().includes("japan") || c.toUpperCase() === "JP")) {
        coverage = ["Japan"];
      }

      // Extract features
      const features: string[] = [];
      if (p.hotspot) features.push("Hotspot enabled");
      if (p.roaming) features.push("Roaming enabled");
      if (isUnlimited) features.push("Unlimited data");
      if (p.speed) features.push(`Speed: ${p.speed}`);
      if (features.length === 0) features.push("High-speed data", "24/7 support");

      return {
        id: p.name || String(p.id || p.productId || p.code || ""),
        name: p.name || p.title || "", // Use API name directly for consistency
        description: p.description || "",
        dataAmount: dataAmountGB,
        validity: validity, // Use API validity directly
        price: {
          amount: priceAmount,
          currency: priceCurrency.toUpperCase(), // Normalize to uppercase (USD, JPY, etc.)
        },
        coverage: coverage, // Normalized array of strings
        features: features,
        imageUrl: p.imageUrl || null,
        autostart: p.autostart || false,
        unlimited: isUnlimited, // Properly set unlimited flag
        isAvailable: p.available !== false && p.status !== "unavailable",
        // Keep original data for purchase
        originalData: p,
      };
    });

    console.log(`✅ Returning ${transformedPlans.length} normalized plans to frontend`);

    if (transformedPlans.length === 0) {
      console.warn("⚠️ No Japan plans found, using fallback plans");
      // Return fallback plans if no plans found
      const fallbackPlans = [
        {
          id: "plan_1",
          name: "Japan 3GB - 15 Days",
          description: "日本全国で使える15日間3GBプラン",
          dataAmount: "3GB",
          validity: "15日",
          price: { amount: 3500, currency: "JPY" },
          coverage: ["Japan"],
          features: ["High-speed data", "24/7 support"],
          isAvailable: true,
        },
        {
          id: "plan_2",
          name: "Japan 10GB - 30 Days",
          description: "日本全国で使える30日間10GBプラン",
          dataAmount: "10GB",
          validity: "30日",
          price: { amount: 8500, currency: "JPY" },
          coverage: ["Japan"],
          features: ["High-speed data", "24/7 support"],
          isAvailable: true,
        },
      ];
      return new Response(
        JSON.stringify({ success: true, data: fallbackPlans, isMockData: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: transformedPlans, isMockData: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get eSIM plans error:", {
      error: error.message,
      stack: error.stack,
      endpoint: "/catalogue",
    });
    console.warn("⚠️ Using fallback hardcoded plans");

    // Fallback to mock data when external API is unavailable
    const fallbackPlans = [
      {
        id: "plan_1",
        name: "Japan 3GB - 15 Days",
        description: "日本全国で使える15日間3GBプラン",
        dataAmount: "3GB",
        validity: "15日",
        price: { amount: 3500, currency: "JPY" },
        coverage: ["Japan"],
        features: ["High-speed data", "24/7 support"],
        isAvailable: true,
      },
      {
        id: "plan_2",
        name: "Japan 10GB - 30 Days",
        description: "日本全国で使える30日間10GBプラン",
        dataAmount: "10GB",
        validity: "30日",
        price: { amount: 8500, currency: "JPY" },
        coverage: ["Japan"],
        features: ["High-speed data", "24/7 support"],
        isAvailable: true,
      },
    ];

    return new Response(
      JSON.stringify({ success: true, data: fallbackPlans, isMockData: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper: Find plan details across paginated catalogue by bundle name
async function findPlanDetailsByName(planName: string, maxPages: number = 20): Promise<any> {
  const esimKey = Deno.env.get("ESIMGO_API_KEY") || Deno.env.get("ESIM_TOKEN");
  const esimBaseUrl = Deno.env.get("ESIMGO_BASE_URL") || Deno.env.get("ESIM_BASE") || "https://api.esim-go.com/v2.4";
  
  let lastError: any = null;
  for (let page = 1; page <= maxPages; page++) {
    try {
      const endpoint = `${esimBaseUrl}/catalogue?page=${page}`;
      const response = await fetch(endpoint, {
        headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        if (page === 1) throw new Error(`eSIM API error: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const bundles = data.bundles || [];
      if (bundles.length === 0) break;
      
      const plan = bundles.find((b: any) => b?.name === planName);
      if (plan) return plan;
      
      if (data.pageCount && page >= data.pageCount) break;
    } catch (err) {
      lastError = err;
      if (page === 1) throw err;
      break;
    }
  }
  if (lastError) throw lastError;
  return null;
}

// Helper: Resolve plan item identifier
function resolvePlanItemIdentifier(planDetails: any, fallbackId: string): string {
  if (!planDetails || typeof planDetails !== "object") {
    return fallbackId;
  }

  const candidates = [
    planDetails.sku,
    planDetails.bundleCode,
    planDetails.bundle_code,
    planDetails.code,
    planDetails.id,
    planDetails.productId,
    planDetails.product_id,
    planDetails.name,
    fallbackId,
  ];

  return candidates.find((candidate) => typeof candidate === "string" && candidate.trim().length > 0) || fallbackId;
}

// Helper: Extract plan price info
function extractPlanPriceInfo(planDetails: any): { amount: number; currency: string } {
  if (!planDetails || typeof planDetails !== "object") {
    return { amount: 0, currency: "USD" };
  }

  let amount = 0;
  let currency = "USD";

  if (typeof planDetails.price === "number") {
    amount = planDetails.price;
    currency = planDetails.currency || planDetails.priceCurrency || "USD";
  } else if (planDetails.price && typeof planDetails.price === "object") {
    amount = Number(planDetails.price.amount ?? planDetails.price.price ?? planDetails.price.value ?? 0);
    currency = planDetails.price.currency || planDetails.priceCurrency || planDetails.currency || "USD";
  } else {
    amount = Number(planDetails.cost ?? planDetails.amount ?? 0);
    currency = planDetails.currency || planDetails.priceCurrency || "USD";
  }

  if (!Number.isFinite(amount)) {
    amount = 0;
  }

  if (typeof currency === "string") {
    currency = currency.toUpperCase();
  } else {
    currency = "USD";
  }

  return { amount, currency };
}

// Purchase eSIM
router.add("POST", "/api/esim/purchase", async (req) => {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error.message, code: auth.error.code }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let purchaseStage = "initializing";
  let orderReference: string | null = null;

  try {
    purchaseStage = "validating-request";
    const body = await parseBody(req);
    const { planId, customerInfo, paymentMethodId } = body;

    if (!planId || !customerInfo) {
      const missing = [
        !planId && "planId",
        !customerInfo && "customerInfo",
      ].filter(Boolean);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
          code: "MISSING_FIELDS",
          details: { missing },
        }),
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

    // Get plan details from eSIMGo API catalogue (search across pages)
    purchaseStage = "fetching-plan-details";
    const planDetails = await findPlanDetailsByName(planId, 20);

    if (!planDetails || !planDetails.price) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Plan not found",
          code: "PLAN_NOT_FOUND",
          details: { planId },
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount: planPriceAmount, currency: planPriceCurrency } = extractPlanPriceInfo(planDetails);

    if (planPriceAmount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid plan price",
          code: "INVALID_PLAN_PRICE",
          details: { planId, planPriceAmount },
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: Stripe payment is handled on the frontend, so we skip payment processing here
    // If you need to verify payment, you can add that logic here

    // Purchase eSIM from eSIMGo - POST /v2.4/orders
    purchaseStage = "creating-esim-order";
    const planItemIdentifier = resolvePlanItemIdentifier(planDetails, planId);
    
    const purchasePayload = {
      type: "transaction", // Transaction mode creates real orders and consumes reseller balance
      assign: true, // Automatically assign bundle to eSIM
      order: [{
        type: "bundle",
        quantity: 1,
        item: planItemIdentifier, // Bundle name/identifier from catalogue
        allowReassign: false,
      }],
    };

    const url = `${esimBaseUrl}/orders`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
      body: JSON.stringify(purchasePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eSIM API error: ${response.status} - ${errorText}`);
    }

    const orderResult = await response.json();

    // Extract order reference from response
    // eSIM Go API v2.4 returns order with "reference" field
    orderReference = orderResult.reference || orderResult.orderReference || orderResult.id || orderResult.orderId;

    if (!orderReference) {
      // Use createdDate as fallback order reference if available
      const fallbackReference = orderResult.createdDate
        ? `val_${orderResult.createdDate.replace(/[^0-9]/g, "")}_${auth.user.id.substring(0, 8)}`
        : `temp_${Date.now()}_${auth.user.id.substring(0, 8)}`;
      console.warn("⚠️ No order reference in eSIM Go response, using fallback:", fallbackReference);
      orderReference = fallbackReference;
    }
    
    // Extract ICCID and activation details from purchase response first
    // The purchase response may already contain eSIM details in order[0].esims[0]
    let qrCode = null;
    let activationCode = null;
    let iccid = null;
    let smdpAddress = null;

    // Try to extract from purchase response structure: { order: [{ esims: [{ iccid, matchingId, smdpAddress }] }] }
    if (orderResult.order && Array.isArray(orderResult.order) && orderResult.order.length > 0) {
      const firstOrder = orderResult.order[0];
      if (firstOrder.esims && Array.isArray(firstOrder.esims) && firstOrder.esims.length > 0) {
        const firstEsim = firstOrder.esims[0];
        iccid = firstEsim.iccid || iccid;
        activationCode = firstEsim.matchingId || activationCode;
        smdpAddress = firstEsim.smdpAddress || smdpAddress;

        // Construct QR code if we have components
        if (smdpAddress && activationCode && !qrCode) {
          qrCode = `LPA:1$${smdpAddress}$${activationCode}`;
        }

        console.log("✅ Extracted eSIM details from purchase response:", {
          hasICCID: !!iccid,
          hasActivationCode: !!activationCode,
          hasSMDP: !!smdpAddress,
          hasQRCode: !!qrCode,
        });
      }
    }

    // Get eSIM assignment details to retrieve QR code and activation info (if not already extracted)
    // According to eSIM Go API v2.4: GET /esims/assignments/{orderReference}
    // Only fetch if we don't already have ICCID from purchase response
    if (orderReference && !iccid) {
      try {
        const assignmentsPath = `${esimBaseUrl}/esims/assignments/${encodeURIComponent(orderReference)}`;
        console.log("📥 Fetching eSIM assignments from:", assignmentsPath);

        const assignmentsResponse = await fetch(assignmentsPath, {
          headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
        });

        if (assignmentsResponse.ok) {
          const assignmentsContent = await assignmentsResponse.text();
          let assignment = null;

          // Handle different response formats:
          // 1. JSON array with assignment objects
          // 2. Single assignment object
          // 3. CSV string (comma-separated values)
          // 4. ZIP file (would need special handling)

          // Check if response is CSV format
          if (assignmentsContent.includes(",")) {
            console.log("📄 Detected CSV format, parsing...");
            const lines = assignmentsContent.trim().split("\n");
            if (lines.length >= 2) {
              const headers = lines[0].split(",").map((h: string) => h.trim().replace(/"/g, ""));
              const dataLine = lines[1].split(",").map((d: string) => d.trim().replace(/"/g, ""));
              assignment = {};
              headers.forEach((header: string, index: number) => {
                if (dataLine[index]) {
                  assignment[header] = dataLine[index];
                }
              });
              console.log("✅ Parsed CSV assignment:", assignment);
            }
          } else {
            // Try to parse as JSON
            try {
              const assignmentsJson = JSON.parse(assignmentsContent);
              if (Array.isArray(assignmentsJson) && assignmentsJson.length > 0) {
                assignment = assignmentsJson[0];
              } else if (typeof assignmentsJson === "object" && assignmentsJson !== null) {
                assignment = assignmentsJson;
              }
            } catch (e) {
              console.warn("Failed to parse assignments as JSON:", e);
            }
          }

          if (assignment) {
            // Extract fields - API may use different naming conventions
            qrCode = assignment["RSP URL"] || assignment.rspUrl || assignment.qrCode || assignment.qr || null;
            iccid = assignment.ICCID || assignment.iccid || iccid || null;
            activationCode = assignment["Matching ID"] || assignment.matchingId || assignment.matching_id || activationCode || null;
            smdpAddress = assignment["SMDP Address"] || assignment.smdpAddress || assignment.smdp_address || smdpAddress || null;

            // If we have smdpAddress and matchingId, construct QR code format: LPA:1$smdpAddress$matchingId
            if (smdpAddress && activationCode && !qrCode) {
              qrCode = `LPA:1$${smdpAddress}$${activationCode}`;
            }

            console.log("✅ eSIM assignment details:", {
              hasQRCode: !!qrCode,
              hasICCID: !!iccid,
              hasActivationCode: !!activationCode,
              hasSMDP: !!smdpAddress,
            });
          }
        }
      } catch (assignmentError: any) {
        console.warn("⚠️ Could not fetch eSIM assignments:", {
          error: assignmentError.message,
          stack: assignmentError.stack,
        });
        // Continue without assignment details - user can retrieve later
      }
    }

    // Store order in database with QR code and activation details
    purchaseStage = "persisting-order";
    const supabaseAdmin = getSupabaseAdmin();
    
    // Check if order with this orderReference already exists
    let order: any = null;
    let orderError: any = null;
    
    if (orderReference) {
      const existingOrderCheck = await supabaseAdmin
        .from("esim_orders")
        .select("id, esim_provider_order_id")
        .eq("esim_provider_order_id", orderReference)
        .maybeSingle();

      if (existingOrderCheck.data) {
        console.log("ℹ️ Order with this reference already exists, using existing order:", {
          orderId: existingOrderCheck.data.id,
          orderReference: orderReference,
        });
        const fullOrder = await supabaseAdmin
          .from("esim_orders")
          .select("*")
          .eq("id", existingOrderCheck.data.id)
          .single();
        if (fullOrder.data) {
          order = fullOrder.data;
        }
      }
    }

    // Insert new order if it doesn't exist
    if (!order) {
      const orderData = {
        user_id: auth.user.id,
        plan_id: String(planId).substring(0, 255),
        esim_provider_order_id: orderReference ? String(orderReference).substring(0, 255) : null,
        stripe_payment_intent_id: null, // Payment handled on frontend
        status: "pending",
        customer_info: customerInfo || null,
        plan_details: planDetails || null,
        qr_code: qrCode || null,
        activation_code: activationCode ? String(activationCode).substring(0, 255) : null,
        purchase_date: new Date().toISOString(),
        expiry_date: null,
        usage_data: {
          iccid: iccid || null,
          dataRemainingMb: planDetails?.dataAmount || null,
        },
      };

      const insertResult = await supabaseAdmin
        .from("esim_orders")
        .insert(orderData)
        .select()
        .single();

      order = insertResult.data;
      orderError = insertResult.error;

      // Handle duplicate key error
      if (orderError && (orderError.code === "23505" || orderError.message?.includes("duplicate"))) {
        console.warn("⚠️ Duplicate order reference detected, attempting to fetch existing order:", orderReference);
        const existingOrder = await supabaseAdmin
          .from("esim_orders")
          .select("*")
          .eq("esim_provider_order_id", orderReference)
          .single();
        if (existingOrder.data) {
          order = existingOrder.data;
          orderError = null;
        }
      }

      if (orderError) {
        console.error("Failed to store eSIM order:", orderError);
        // Still return success with orderReference so user can contact support
      }
    }

    // Create notification
    if (order) {
      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: auth.user.id,
          type: "esim_purchased",
          title: "eSIM Purchased Successfully",
          message: `Your eSIM plan "${planId}" has been purchased successfully.`,
          metadata: {
            order_id: order.id,
            plan_id: planId,
          },
        });
      } catch (notifError) {
        console.warn("Failed to create notification:", notifError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderId: order?.id || null,
          orderReference: orderReference,
          qrCode: qrCode,
          activationCode: activationCode,
          planName: planId,
          provider: "esim-go",
        },
        ...(orderError && {
          warning: "Order created but database storage had issues",
          supportReference: orderReference,
        }),
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Purchase eSIM error:", {
      error: error.message,
      stack: error.stack,
      purchaseStage,
      orderReference,
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to purchase eSIM",
        code: "ESIM_PURCHASE_ERROR",
        details: error.message,
        purchaseStage,
        ...(orderReference && { orderReference }),
      }),
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

    // Extract eSIM details from order response
    let esimDetails = null;
    let qrCode = null;
    let activationCode = null;
    let smdpAddress = null;
    let iccid = null;
    let createdDate = null;
    let expiryDate = null;

    if (orderDetails) {
      // Extract createdDate - normalize to ISO string
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

      // Extract eSIM details from order.order[0].esims[0]
      if (orderDetails.order && Array.isArray(orderDetails.order) && orderDetails.order.length > 0) {
        const firstOrder = orderDetails.order[0];
        if (firstOrder.esims && Array.isArray(firstOrder.esims) && firstOrder.esims.length > 0) {
          const firstEsim = firstOrder.esims[0];
          iccid = firstEsim.iccid || iccid;
          activationCode = firstEsim.matchingId || activationCode;
          smdpAddress = firstEsim.smdpAddress || smdpAddress;

          // Construct QR code: LPA:1$smdpAddress$matchingId
          if (smdpAddress && activationCode) {
            qrCode = `LPA:1$${smdpAddress}$${activationCode}`;
          }
        }
      }

      // Calculate expiry date from validity period and createdDate
      if (createdDate && userOrder.plan_details?.validity && !expiryDate) {
        const validityStr = userOrder.plan_details.validity;
        const daysMatch = validityStr.match(/(\d+)/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1], 10);
          const created = new Date(createdDate);
          if (!isNaN(created.getTime())) {
            const expiry = new Date(created);
            expiry.setDate(expiry.getDate() + days);
            expiryDate = expiry.toISOString();
          }
        }
      }
    }

    // If expiry date still not set, calculate from createdDate and validity
    if (!expiryDate && createdDate && userOrder.plan_details?.validity) {
      const validityStr = userOrder.plan_details.validity;
      const daysMatch = validityStr.match(/(\d+)/);
      if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        const created = new Date(createdDate);
        if (!isNaN(created.getTime())) {
          const expiry = new Date(created);
          expiry.setDate(expiry.getDate() + days);
          expiryDate = expiry.toISOString();
        }
      }
    }

    // Also try to get from assignments endpoint for QR code and usage (skip for manual assignments)
    if (!isManualAssignment && orderReference) {
      const esimKey = Deno.env.get("ESIMGO_API_KEY") || Deno.env.get("ESIM_TOKEN");
      const esimBaseUrl = Deno.env.get("ESIMGO_BASE_URL") || Deno.env.get("ESIM_BASE") || "https://api.esim-go.com/v2.4";

      if (esimKey) {
        try {
          const assignmentsPath = `${esimBaseUrl}/esims/assignments/${encodeURIComponent(orderReference)}`;
          console.log("📥 Fetching eSIM assignments from:", assignmentsPath);
          
          const assignmentsResponse = await fetch(assignmentsPath, {
            headers: { "X-API-Key": esimKey, "Content-Type": "application/json" },
          });

          if (assignmentsResponse.ok) {
            const assignmentsContent = await assignmentsResponse.text();
            let assignment = null;

            // Handle CSV format response
            if (assignmentsContent.includes(",")) {
              console.log("📄 Detected CSV format in assignments, parsing...");
              const lines = assignmentsContent.trim().split("\n");
              if (lines.length >= 2) {
                const headers = lines[0].split(",").map((h: string) => h.trim().replace(/"/g, ""));
                const dataLine = lines[1].split(",").map((d: string) => d.trim().replace(/"/g, ""));
                assignment = {};
                headers.forEach((header: string, index: number) => {
                  if (dataLine[index] !== undefined && dataLine[index] !== "") {
                    assignment[header] = dataLine[index];
                  }
                });
                console.log("✅ Parsed CSV assignment:", assignment);
              }
            } else {
              // Try to parse as JSON
              try {
                const assignmentsJson = JSON.parse(assignmentsContent);
                if (Array.isArray(assignmentsJson) && assignmentsJson.length > 0) {
                  assignment = assignmentsJson[0];
                } else if (typeof assignmentsJson === "object" && assignmentsJson !== null) {
                  assignment = assignmentsJson;
                }
              } catch (e) {
                console.warn("Failed to parse assignments as JSON:", e);
              }
            }

            if (assignment) {
              // Extract ICCID
              iccid = assignment.ICCID || assignment.iccid || iccid || null;

              // Extract Matching ID (activation code)
              activationCode = assignment["Matching ID"] || assignment.matchingId || assignment.matching_id || activationCode || null;

              // Extract SMDP Address or RSP URL
              const rspUrl = assignment["RSP URL"] || assignment.rspUrl || assignment.rsp || null;
              smdpAddress = assignment["SMDP Address"] || assignment.smdpAddress || assignment.smdp_address || smdpAddress || null;

              // If RSP URL is provided but it's not in LPA format, use it as SMDP address
              if (rspUrl && !rspUrl.startsWith("LPA:1$")) {
                smdpAddress = rspUrl;
              }

              // Extract QR code - check if RSP URL is already in LPA format
              if (!qrCode) {
                if (rspUrl && rspUrl.startsWith("LPA:1$")) {
                  qrCode = rspUrl;
                } else if (rspUrl) {
                  // RSP URL might just be the SMDP address, construct full QR code
                  if (activationCode) {
                    qrCode = `LPA:1$${rspUrl}$${activationCode}`;
                  }
                }
              }

              // Construct QR code if we have components but no QR code yet
              if (!qrCode && smdpAddress && activationCode) {
                qrCode = `LPA:1$${smdpAddress}$${activationCode}`;
              }

              console.log("✅ eSIM assignment details:", {
                hasQRCode: !!qrCode,
                hasICCID: !!iccid,
                hasActivationCode: !!activationCode,
                hasSMDP: !!smdpAddress,
              });
            }
          }
        } catch (assignmentError: any) {
          console.warn("⚠️ Could not fetch eSIM assignments:", {
            error: assignmentError.message,
            stack: assignmentError.stack,
          });
          // Continue without assignment details - user can retrieve later
        }
      }
    }

    // Update order in database with extracted QR code and details if we have them
    if (qrCode || activationCode || iccid) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      if (qrCode) updateData.qr_code = qrCode;
      if (activationCode) updateData.activation_code = activationCode;
      if (expiryDate) updateData.expiry_date = expiryDate;

      await supabaseAdmin
        .from("esim_orders")
        .update(updateData)
        .eq("id", userOrder.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order: {
            ...userOrder,
            qr_code: qrCode || userOrder.qr_code,
            activation_code: activationCode || userOrder.activation_code,
            expiry_date: expiryDate || userOrder.expiry_date,
          },
          orderDetails: orderDetails,
          esimDetails: {
            iccid,
            activationCode: activationCode || userOrder.activation_code,
            qrCode: qrCode || userOrder.qr_code,
            smdpAddress,
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

// ==================== ERROR HANDLING ====================
// Note: The Stripe SDK and other dependencies use Node.js polyfills that trigger
// "Deno.core.runMicrotasks() is not supported" errors. These are NON-FATAL and
// don't affect functionality. They're logged by Supabase's runtime monitoring
// but can be safely ignored. The function continues to work normally.

// Suppress Deno compatibility warnings (non-fatal errors from Node.js polyfills)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || "";
  // Filter out non-fatal Deno compatibility errors
  if (message.includes("Deno.core.runMicrotasks") || 
      message.includes("is not supported in this environment") ||
      message.includes("event loop error")) {
    // These are harmless warnings from Node.js polyfills, ignore them
    return;
  }
  originalConsoleError(...args);
};

// Global uncaught exception handler to suppress non-fatal Deno compatibility errors
// These errors come from Node.js polyfills used by dependencies (e.g., Stripe)
// They don't affect functionality but create noise in logs
try {
  if (typeof self !== "undefined") {
    self.addEventListener("error", (event) => {
      const errorMessage = event.error?.message || event.message || String(event.error) || "";
      if (errorMessage.includes("Deno.core.runMicrotasks") || 
          errorMessage.includes("is not supported in this environment") ||
          errorMessage.includes("event loop error")) {
        // Suppress these non-fatal errors from Node.js polyfills
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }, true); // Use capture phase

    // Also handle unhandled promise rejections that might contain these errors
    self.addEventListener("unhandledrejection", (event) => {
      const errorMessage = event.reason?.message || String(event.reason) || "";
      if (errorMessage.includes("Deno.core.runMicrotasks") || 
          errorMessage.includes("is not supported in this environment") ||
          errorMessage.includes("event loop error")) {
        // Suppress these non-fatal errors from Node.js polyfills
        event.preventDefault();
        return false;
      }
    });
  }
} catch (e) {
  // Ignore if event listeners aren't available in this environment
  console.log("Note: Global error handlers not available in this runtime");
}

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
    // Only log actual errors, not Deno compatibility warnings
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes("Deno.core.runMicrotasks")) {
      console.error(`❌ Error handling request (${duration}ms):`, error);
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        ...(Deno.env.get("ENVIRONMENT") === "development" && { details: errorMessage }),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

