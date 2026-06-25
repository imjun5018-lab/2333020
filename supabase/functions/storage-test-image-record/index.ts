import { createClient } from "npm:@supabase/supabase-js@2";

function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return json(req, {
        error: "Supabase service role is not configured",
        note: "Final production storage should use Supabase bucket policies and signed URLs.",
      }, 501);
    }

    const { userId, path, metadata } = await req.json().catch(() => ({}));

    if (!userId || !path) {
      return json(req, { error: "userId and path are required" }, 400);
    }

    const { data, error } = await supabase
      .from("image_records")
      .insert({ user_id: userId, path, metadata: metadata || {} })
      .select()
      .single();

    if (error) {
      return json(req, { error: error.message }, 500);
    }

    return json(req, { record: data });
  } catch (error) {
    return json(req, { error: "Internal server error", detail: String(error) }, 500);
  }
});

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || getSecretKey();

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey);
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
