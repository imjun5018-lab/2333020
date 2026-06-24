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
    const { category, profile } = await req.json().catch(() => ({}));

    if (!["cookie", "animal", "star"].includes(category)) {
      return json({ error: "category must be cookie, animal, or star" }, 400);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

    if (!openaiKey) {
      return json({ error: "OPENAI_API_KEY is not configured", model: openaiModel }, 501);
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
      return json({ error: "OpenAI request failed", detail }, 502);
    }

    const data = await response.json();
    const outputText =
      data.output_text ||
      data.output?.flatMap((item: { content?: unknown[] }) => item.content || [])?.find(
        (item: { type?: string }) => item.type === "output_text",
      )?.text ||
      "";

    try {
      return json({ result: JSON.parse(outputText), model: openaiModel });
    } catch {
      return json({
        result: {
          title: "오늘의 운세",
          summary: outputText,
          lucky: "차분한 선택",
          caution: "서두른 판단",
          action: "오늘 할 수 있는 작은 일 하나를 정하세요.",
        },
        model: openaiModel,
      });
    }
  } catch (error) {
    return json({ error: "Internal server error", detail: String(error) }, 500);
  }
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

