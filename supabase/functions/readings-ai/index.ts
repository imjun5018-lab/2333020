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
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

    if (!openaiKey) {
      return json(req, {
        error: "OPENAI_API_KEY is not configured",
        fallbackEndpoint: "/functions/v1/readings-test",
      }, 501);
    }

    const { name, birthDate, birthTime, topic } = await req.json().catch(() => ({}));

    if (!birthDate) {
      return json(req, { error: "birthDate is required" }, 400);
    }

    const prompt = [
      "한국어로 사주 플랫폼의 사용자 리포트 초안을 작성해줘.",
      "전문가처럼 단정적으로 운명을 확정하지 말고, 자기이해와 실행 조언 중심으로 작성해.",
      `이름: ${name || "사용자"}`,
      `생년월일: ${birthDate}`,
      `태어난 시간: ${birthTime || "시간 미상"}`,
      `관심 주제: ${topic || "overall"}`,
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
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return json(req, { error: "OpenAI request failed", detail }, 502);
    }

    const data = await response.json();
    const reading =
      data.output_text ||
      data.output?.flatMap((item: { content?: unknown[] }) => item.content || [])?.find(
        (item: { type?: string }) => item.type === "output_text",
      )?.text ||
      "";

    return json(req, { reading });
  } catch (error) {
    return json(req, { error: "Internal server error", detail: String(error) }, 500);
  }
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
