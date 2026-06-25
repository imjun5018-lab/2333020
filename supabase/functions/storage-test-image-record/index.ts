import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("FRONTEND_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return json({
        error: "Supabase service role is not configured",
        note: "Final production storage should use Supabase bucket policies and signed URLs.",
      }, 501);
    }

    const { userId, path, metadata } = await req.json().catch(() => ({}));

    if (!userId || !path) {
      return json({ error: "userId and path are required" }, 400);
    }

    const { data, error } = await supabase
      .from("image_records")
      .insert({ user_id: userId, path, metadata: metadata || {} })
      .select()
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ record: data });
  } catch (error) {
    return json({ error: "Internal server error", detail: String(error) }, 500);
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
