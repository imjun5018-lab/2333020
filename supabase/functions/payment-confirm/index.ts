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
    const { paymentKey, orderId, amount, orderName, productKind } = await req.json();
    if (!paymentKey || !orderId || !amount || !orderName || !productKind) {
      return json(req, { error: "paymentKey, orderId, amount, orderName, productKind are required" }, 400);
    }

    const secretKey = Deno.env.get("TOSS_SECRET_KEY");
    if (!secretKey) {
      return json(req, { error: "TOSS_SECRET_KEY is not configured" }, 501);
    }

    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${secretKey}:`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const payment = await tossResponse.json();
    if (!tossResponse.ok) {
      return json(req, { error: "Toss payment confirm failed", detail: payment }, 502);
    }

    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      return json(req, { error: "Supabase admin client is not configured" }, 501);
    }

    const { data: record, error } = await supabaseAdmin
      .from("payments")
      .upsert({
        user_id: user.id,
        order_id: orderId,
        payment_key: paymentKey,
        order_name: orderName,
        product_kind: productKind,
        amount,
        currency: payment.currency || "KRW",
        status: payment.status || "DONE",
        method: payment.method || null,
        approved_at: payment.approvedAt || new Date().toISOString(),
        raw_data: payment,
      }, { onConflict: "order_id" })
      .select()
      .single();

    if (error) {
      return json(req, { error: "Failed to save payment", detail: error.message }, 500);
    }

    return json(req, { payment: record });
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
