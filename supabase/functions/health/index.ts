const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("FRONTEND_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  return json({
    ok: true,
    service: "saju-platform-supabase-functions",
    mode: "supabase-edge-functions",
    supabaseConfigured: Boolean(Deno.env.get("SUPABASE_URL")),
    openaiConfigured: Boolean(Deno.env.get("OPENAI_API_KEY")),
  });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
