import "dotenv/config";
import cors from "cors";
import express from "express";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://127.0.0.1:3001";

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const openaiModel = process.env.OPENAI_MODEL || "gpt-5.4-mini";

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "saju-platform-backend",
    mode: "test-node-server",
    supabaseConfigured: Boolean(supabase),
    openaiConfigured: Boolean(openai)
  });
});

app.post("/api/readings/test", async (req, res) => {
  const { name, birthDate, birthTime, topic } = req.body || {};

  if (!birthDate) {
    return res.status(400).json({ error: "birthDate is required" });
  }

  const reading = {
    name: name || "사용자",
    birthDate,
    birthTime: birthTime || "시간 미상",
    topic: topic || "overall",
    summary: "테스트 서버에서 생성한 임시 사주 리딩입니다.",
    strengths: ["차분한 판단", "꾸준한 실행력", "관계 조율 능력"],
    cautions: ["결정 지연", "과도한 걱정"],
    nextActions: ["이번 주 우선순위 하나 정하기", "중요한 결정은 기록 후 비교하기"]
  };

  res.json({ reading });
});

app.post("/api/readings/ai", async (req, res) => {
  if (!openai) {
    return res.status(501).json({
      error: "OPENAI_API_KEY is not configured",
      fallbackEndpoint: "/api/readings/test"
    });
  }

  const { name, birthDate, birthTime, topic } = req.body || {};

  if (!birthDate) {
    return res.status(400).json({ error: "birthDate is required" });
  }

  const prompt = [
    "한국어로 사주 플랫폼의 사용자 리포트 초안을 작성해줘.",
    "전문가처럼 단정적으로 운명을 확정하지 말고, 자기이해와 실행 조언 중심으로 작성해.",
    `이름: ${name || "사용자"}`,
    `생년월일: ${birthDate}`,
    `태어난 시간: ${birthTime || "시간 미상"}`,
    `관심 주제: ${topic || "overall"}`
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  res.json({
    reading: completion.choices[0]?.message?.content || ""
  });
});

app.post("/api/tarot/generate", async (req, res) => {
  const { readingType, cards } = req.body || {};
  const userId = req.header("x-user-id") || req.body?.userId || null;
  const isPaidUser = req.header("x-paid-user") === "true" || req.body?.isPaidUser === true;

  if (!Array.isArray(cards) || cards.length !== 3) {
    return res.status(400).json({ error: "cards must contain exactly 3 selected tarot cards" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(501).json({
      error: "OPENAI_API_KEY is not configured",
      model: openaiModel
    });
  }

  const prompt = [
    "한국어로 모바일 운세 서비스의 타로 결과를 생성해줘.",
    "과도하게 단정하거나 공포감을 주지 말고, 자기 이해와 실행 조언 중심으로 작성해.",
    "결과는 JSON만 반환해. markdown 코드블록은 쓰지 마.",
    "JSON 스키마: {\"title\": string, \"summary\": string, \"cards\": [{\"position\": string, \"name\": string, \"keywords\": string[], \"interpretation\": string}], \"advice\": string, \"caution\": string}",
    `리딩 종류: ${readingType || "today"}`,
    `선택 카드: ${cards.map((card, index) => `${index + 1}. ${card.name} / 키워드: ${(card.keywords || []).join(", ")} / 기본의미: ${card.meaning} / 조언: ${card.advice}`).join("\n")}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: openaiModel,
      input: prompt,
      text: {
        format: {
          type: "json_object"
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return res.status(502).json({ error: "OpenAI request failed", detail });
  }

  const data = await response.json();
  const outputText =
    data.output_text ||
    data.output?.flatMap((item) => item.content || [])?.find((item) => item.type === "output_text")?.text ||
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
        interpretation: card.meaning
      })),
      advice: "결과를 차분히 읽고 오늘 실행할 수 있는 작은 행동 하나를 정해보세요.",
      caution: "타로는 참고용 리딩이며 중요한 결정은 현실 조건과 함께 판단하세요."
    };
  }

  let saved = false;
  let record = null;

  if (supabase && userId && isPaidUser) {
    const { data: savedRecord, error } = await supabase
      .from("tarot_readings")
      .insert({
        user_id: userId,
        reading_type: readingType || "today",
        cards,
        result,
        model: openaiModel
      })
      .select()
      .single();

    if (!error) {
      saved = true;
      record = savedRecord;
    }
  }

  res.json({
    result,
    saved,
    record,
    savePolicy: "Only logged-in paid users are saved to Supabase."
  });
});

app.post("/api/fortune/generate", async (req, res) => {
  const { category, profile } = req.body || {};

  if (!["cookie", "animal", "star"].includes(category)) {
    return res.status(400).json({ error: "category must be cookie, animal, or star" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(501).json({
      error: "OPENAI_API_KEY is not configured",
      model: openaiModel
    });
  }

  const prompt = [
    "한국어 모바일 운세 서비스의 오늘 운세를 생성해줘.",
    "공포감이나 확정적 예언은 피하고, 실행 가능한 조언 중심으로 작성해.",
    "JSON만 반환하고 markdown 코드블록은 쓰지 마.",
    "JSON 스키마: {\"title\": string, \"summary\": string, \"lucky\": string, \"caution\": string, \"action\": string}",
    `운세 종류: ${category}`,
    `사용자 정보: ${JSON.stringify(profile || {})}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: openaiModel,
      input: prompt,
      text: {
        format: {
          type: "json_object"
        }
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return res.status(502).json({ error: "OpenAI request failed", detail });
  }

  const data = await response.json();
  const outputText =
    data.output_text ||
    data.output?.flatMap((item) => item.content || [])?.find((item) => item.type === "output_text")?.text ||
    "";

  try {
    res.json({ result: JSON.parse(outputText), model: openaiModel });
  } catch {
    res.json({
      result: {
        title: "오늘의 운세",
        summary: outputText,
        lucky: "차분한 선택",
        caution: "서두른 판단",
        action: "오늘 할 수 있는 작은 일 하나를 정하세요."
      },
      model: openaiModel
    });
  }
});

app.post("/api/storage/test-image-record", async (req, res) => {
  if (!supabase) {
    return res.status(501).json({
      error: "Supabase service role is not configured",
      note: "Final production storage should use Supabase bucket policies and signed URLs."
    });
  }

  const { userId, path, metadata } = req.body || {};

  if (!userId || !path) {
    return res.status(400).json({ error: "userId and path are required" });
  }

  const { data, error } = await supabase
    .from("image_records")
    .insert({ user_id: userId, path, metadata: metadata || {} })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ record: data });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Test backend listening on http://127.0.0.1:${port}`);
});
