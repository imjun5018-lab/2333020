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
    const { category, profile } = await req.json().catch(() => ({}));

    if (!["cookie", "animal", "star"].includes(category)) {
      return json(req, { error: "category must be cookie, animal, or star" }, 400);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

    if (!openaiKey) {
      return json(req, { error: "OPENAI_API_KEY is not configured", model: openaiModel }, 501);
    }

    const prompt = [
      "한국어 모바일 운세 서비스의 오늘 운세를 생성해줘.",
      "공포감이나 확정적 예언은 피하고, 실행 가능한 조언 중심으로 작성해.",
      "JSON만 반환하고 markdown 코드블록은 쓰지 마.",
      "JSON 스키마: {\"title\": string, \"summary\": string, \"lucky\": string, \"caution\": string, \"action\": string}",
      `운세 종류: ${category}`,
      `사용자 정보: ${JSON.stringify(profile || {})}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: openaiModel,
        input: prompt,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return json(req, { error: "OpenAI request failed", detail }, 502);
    }

    const data = await response.json();
    const outputText =
      data.output_text ||
      data.output?.flatMap((item: { content?: unknown[] }) => item.content || [])?.find(
        (item: { type?: string }) => item.type === "output_text",
      )?.text ||
      "";

    let result;
    try {
      result = JSON.parse(outputText);
    } catch {
      result = {
        title: "오늘의 운세",
        summary: outputText,
        lucky: "차분한 선택",
        caution: "서두른 판단",
        action: "오늘 할 수 있는 작은 일 하나를 정하세요.",
      };
    }

    const user = await getUser(req);
    let saved = false;
    let record = null;

    if (user?.id) {
      const supabaseAdmin = createAdminClient();
      if (supabaseAdmin) {
        const { data: savedRecord, error } = await supabaseAdmin
          .from("fortune_readings")
          .insert({
            user_id: user.id,
            category,
            profile: profile || {},
            result,
            model: openaiModel,
          })
          .select()
          .single();

        if (!error) {
          saved = true;
          record = savedRecord;
        }
      }
    }

    return json(req, { result, model: openaiModel, saved, record });
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
