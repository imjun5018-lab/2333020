"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase-client";

type Tab = "cookie" | "animal" | "star";

const animalByRemainder = ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yatqauonguxjrprcsfyx.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const starSigns = [
  { name: "염소자리", from: [12, 22], to: [1, 19] },
  { name: "물병자리", from: [1, 20], to: [2, 18] },
  { name: "물고기자리", from: [2, 19], to: [3, 20] },
  { name: "양자리", from: [3, 21], to: [4, 19] },
  { name: "황소자리", from: [4, 20], to: [5, 20] },
  { name: "쌍둥이자리", from: [5, 21], to: [6, 20] },
  { name: "게자리", from: [6, 21], to: [7, 22] },
  { name: "사자자리", from: [7, 23], to: [8, 22] },
  { name: "처녀자리", from: [8, 23], to: [9, 22] },
  { name: "천칭자리", from: [9, 23], to: [10, 22] },
  { name: "전갈자리", from: [10, 23], to: [11, 21] },
  { name: "사수자리", from: [11, 22], to: [12, 21] }
];

function getAnimal(year: number) {
  return animalByRemainder[year % 12];
}

function isInRange(month: number, day: number, from: number[], to: number[]) {
  const value = month * 100 + day;
  const start = from[0] * 100 + from[1];
  const end = to[0] * 100 + to[1];
  return start > end ? value >= start || value <= end : value >= start && value <= end;
}

function getStarSign(date: string) {
  const [, monthRaw, dayRaw] = date.split("-").map(Number);
  return starSigns.find((sign) => isInRange(monthRaw, dayRaw, sign.from, sign.to))?.name || "";
}

export default function TodayPage() {
  const [tab, setTab] = useState<Tab>("cookie");
  const [birthDate, setBirthDate] = useState("");
  const [name, setName] = useState("");
  const [cookieOpen, setCookieOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const animal = useMemo(() => birthDate ? getAnimal(Number(birthDate.slice(0, 4))) : "", [birthDate]);
  const star = useMemo(() => birthDate ? getStarSign(birthDate) : "", [birthDate]);

  const generate = async (category: Tab) => {
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (supabaseKey) {
        headers.apikey = supabaseKey;
        headers.Authorization = `Bearer ${supabaseKey}`;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/fortune-generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          category,
          profile: {
            name,
            birthDate,
            animal: category === "animal" ? animal : undefined,
            starSign: category === "star" ? star : undefined
          }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "운세 생성에 실패했습니다.");
      }
      setResult(data.result);
      setSaved(Boolean(data.saved));
    } catch (err) {
      setError(err instanceof Error ? err.message : "운세 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mobile-shell today-page">
      <nav className="top-tabs" aria-label="주요 메뉴">
        <Link href="/saju">정통사주</Link>
        <Link href="/tarot">타로</Link>
        <Link href="/today" className="active">오늘운세</Link>
      </nav>

      <section className="result-card">
        <span className="accent-label">오늘의 운세</span>
        <h1>포춘쿠키와 띠별, 별자리 운세</h1>
        <p>생년월일을 입력하면 띠와 별자리를 계산해 OpenAI가 오늘의 메시지를 생성합니다.</p>
      </section>

      <section className="today-tabs">
        {[
          ["cookie", "포춘쿠키"],
          ["animal", "띠별운세"],
          ["star", "별자리운세"]
        ].map(([id, label]) => (
          <button className={tab === id ? "active" : ""} type="button" key={id} onClick={() => {
            setTab(id as Tab);
            setResult(null);
            setError("");
          }}>{label}</button>
        ))}
      </section>

      {tab === "cookie" && (
        <section className="cookie-panel">
          <button className={`fortune-cookie ${cookieOpen ? "cracked" : ""}`} type="button" onClick={() => {
            setCookieOpen(true);
            generate("cookie");
          }} aria-label="포춘쿠키 열기">
            <span className="cookie-left" />
            <span className="cookie-right" />
            <i />
          </button>
          <p>{cookieOpen ? "쿠키가 열렸습니다. 메시지를 확인하세요." : "쿠키를 눌러 오늘의 운세를 열어보세요."}</p>
        </section>
      )}

      {(tab === "animal" || tab === "star") && (
        <section className="auth-card fortune-form">
          <label>이름<input value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 달빛손님" /></label>
          <label>생년월일<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
          {birthDate && tab === "animal" && <p className="computed-sign">계산된 띠: <b>{animal}띠</b></p>}
          {birthDate && tab === "star" && <p className="computed-sign">계산된 별자리: <b>{star}</b></p>}
          <button className="primary-button" type="button" disabled={!birthDate || loading} onClick={() => generate(tab)}>
            {loading ? "생성 중..." : "오늘 운세 생성"}
          </button>
        </section>
      )}

      {error && <p className="error-text">{error}</p>}
      {result && (
        <section className="fortune-result">
          <span className="accent-label">{tab === "cookie" ? "쿠키 메시지" : tab === "animal" ? `${animal}띠 운세` : `${star} 운세`}</span>
          <h2>{result.title}</h2>
          <p>{result.summary}</p>
          <div className="fortune-result-grid">
            <div><b>행운</b><span>{result.lucky}</span></div>
            <div><b>주의</b><span>{result.caution}</span></div>
            <div><b>실행</b><span>{result.action}</span></div>
          </div>
          <div className="result-actions compact-actions">
            <Link className="primary-button secondary" href={saved ? "/profile" : "/login"}>
              {saved ? "내 보관함에서 보기" : "로그인하고 보관하기"}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
