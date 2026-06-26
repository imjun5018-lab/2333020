import { createClient } from "npm:@supabase/supabase-js@2";

function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

function getAllowedOrigin(req: Request) {
  const requestOrigin = req.headers.get("Origin");
  const configuredOrigins = (Deno.env.get("FRONTEND_ORIGINS") || Deno.env.get("FRONTEND_ORIGIN") || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length === 0 || configuredOrigins.includes("*")) return "*";
  if (requestOrigin && configuredOrigins.includes(requestOrigin)) return requestOrigin;
  return configuredOrigins[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "GET") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  const user = await getUser(req);
  if (!user?.id) {
    return json(req, { error: "Authentication required" }, 401);
  }

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) {
    return json(req, { error: "Supabase admin client is not configured" }, 501);
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return json(req, { error: "Admin only" }, 403);
  }

  const [profiles, tarot, fortune, payments, reviews] = await Promise.all([
    supabaseAdmin.from("profiles").select("id,email,nickname,provider,role,created_at").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("tarot_readings").select("id,user_id,reading_type,result,created_at").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("fortune_readings").select("id,user_id,category,result,created_at").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("reading_reviews").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  return json(req, {
    profiles: profiles.data || [],
    tarotReadings: tarot.data || [],
    fortuneReadings: fortune.data || [],
    payments: payments.data || [],
    reviews: reviews.data || [],
  });
});

async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = getPublishableKey();

  if (!token || !supabaseUrl || !anonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || getSecretKey();

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey);
}

function getPublishableKey() {
  const legacyAnon = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacyAnon) return legacyAnon;

  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    return keys.default || null;
  } catch {
    return null;
  }
}

function getSecretKey() {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    return keys.default || null;
  } catch {
    return null;
  }
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}
