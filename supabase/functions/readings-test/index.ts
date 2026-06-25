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

  const { name, birthDate, birthTime, topic } = await req.json().catch(() => ({}));

  if (!birthDate) {
    return json({ error: "birthDate is required" }, 400);
  }

  return json({
    reading: {
      name: name || "사용자",
      birthDate,
      birthTime: birthTime || "시간 미상",
      topic: topic || "overall",
      summary: "테스트 서버에서 생성한 임시 사주 리딩입니다.",
      strengths: ["차분한 판단", "꾸준한 실행력", "관계 조율 능력"],
      cautions: ["결정 지연", "과도한 걱정"],
      nextActions: ["이번 주 우선순위 하나 정하기", "중요한 결정은 기록 후 비교하기"],
    },
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
