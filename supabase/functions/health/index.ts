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

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "GET") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  return json(req, {
    ok: true,
    service: "saju-platform-supabase-functions",
    mode: "supabase-edge-functions",
    supabaseConfigured: Boolean(Deno.env.get("SUPABASE_URL")),
    openaiConfigured: Boolean(Deno.env.get("OPENAI_API_KEY")),
  });
});

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}
