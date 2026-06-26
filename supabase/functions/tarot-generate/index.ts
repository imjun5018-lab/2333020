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

type TarotCard = {
  name?: string;
  keywords?: string[];
  meaning?: string;
  advice?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { readingType, cards, isPaidUser } = body as {
      readingType?: string;
      cards?: TarotCard[];
      isPaidUser?: boolean;
    };

    if (!Array.isArray(cards) || cards.length !== 3) {
      return json(req, { error: "cards must contain exactly 3 selected tarot cards" }, 400);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

    if (!openaiKey) {
      return json(req, { error: "OPENAI_API_KEY is not configured", model: openaiModel }, 501);
    }

    const prompt = [
      "한국어로 모바일 운세 서비스의 타로 결과를 생성해줘.",
      "과도하게 단정하거나 공포감을 주지 말고, 자기 이해와 실행 조언 중심으로 작성해.",
      "결과는 JSON만 반환해. markdown 코드블록은 쓰지 마.",
      "JSON 스키마: {\"title\": string, \"summary\": string, \"cards\": [{\"position\": string, \"name\": string, \"keywords\": string[], \"interpretation\": string}], \"advice\": string, \"caution\": string}",
      `리딩 종류: ${readingType || "today"}`,
      `선택 카드: ${cards
        .map(
          (card, index) =>
            `${index + 1}. ${card.name || "알 수 없는 카드"} / 키워드: ${(card.keywords || []).join(", ")} / 기본의미: ${
              card.meaning || ""
            } / 조언: ${card.advice || ""}`,
        )
        .join("\n")}`,
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
        title: "타로 리딩 결과",
        summary: outputText,
        cards: cards.map((card, index) => ({
          position: ["현재 상태", "숨은 흐름", "다가올 조언"][index],
          name: card.name,
          keywords: card.keywords || [],
          interpretation: card.meaning,
        })),
        advice: "결과를 차분히 읽고 오늘 실행할 수 있는 작은 행동 하나를 정해보세요.",
        caution: "타로는 참고용 리딩이며 중요한 결정은 현실 조건과 함께 판단하세요.",
      };
    }

    const user = await getUser(req);
    let saved = false;
    let record = null;

    if (user?.id && isPaidUser !== false) {
      const supabaseAdmin = createAdminClient();
      if (supabaseAdmin) {
        const { data: savedRecord, error } = await supabaseAdmin
          .from("tarot_readings")
          .insert({
            user_id: user.id,
            reading_type: readingType || "today",
            cards,
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

    return json(req, {
      result,
      saved,
      record,
      savePolicy: "Logged-in users are saved to Supabase.",
    });
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
