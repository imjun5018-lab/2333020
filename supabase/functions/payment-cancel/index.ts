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

  const user = await getUser(req);
  if (!user?.id) {
    return json(req, { error: "Authentication required" }, 401);
  }

  try {
    const { paymentId, cancelReason } = await req.json();
    if (!paymentId) {
      return json(req, { error: "paymentId is required" }, 400);
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

    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !paymentRecord) {
      return json(req, { error: "Payment not found" }, 404);
    }

    const isAdmin = profile?.role === "admin";
    if (!isAdmin && paymentRecord.user_id !== user.id) {
      return json(req, { error: "Forbidden" }, 403);
    }

    const secretKey = Deno.env.get("TOSS_SECRET_KEY");
    if (!secretKey) {
      return json(req, { error: "TOSS_SECRET_KEY is not configured" }, 501);
    }

    const tossResponse = await fetch(`https://api.tosspayments.com/v1/payments/${paymentRecord.payment_key}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${secretKey}:`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancelReason: cancelReason || "사용자 요청" }),
    });

    const canceled = await tossResponse.json();
    if (!tossResponse.ok) {
      return json(req, { error: "Toss payment cancel failed", detail: canceled }, 502);
    }

    const { data: updated, error } = await supabaseAdmin
      .from("payments")
      .update({
        status: canceled.status || "CANCELED",
        canceled_at: new Date().toISOString(),
        cancel_reason: cancelReason || "사용자 요청",
        raw_data: canceled,
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) {
      return json(req, { error: "Failed to update payment", detail: error.message }, 500);
    }

    return json(req, { payment: updated });
  } catch (error) {
    return json(req, { error: "Internal server error", detail: String(error) }, 500);
  }
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
