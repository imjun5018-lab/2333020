"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { positionLabels, tarotById, type TarotCard } from "../../../lib/tarot";
import { supabase } from "../../../lib/supabase-client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yatqauonguxjrprcsfyx.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default function TarotRevealClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "today";
  const cards = useMemo(() => {
    return (searchParams.get("cards") || "")
      .split(",")
      .map((id) => tarotById[id])
      .filter(Boolean) as TarotCard[];
  }, [searchParams]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allFlipped = cards.length === 3 && flipped.length === 3;

  const generateResult = async () => {
    setLoading(true);
    setError("");
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

      const response = await fetch(`${supabaseUrl}/functions/v1/tarot-generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ readingType: type, cards, isPaidUser: Boolean(accessToken) })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "결과 생성에 실패했습니다.");
      }

      sessionStorage.setItem("tarot-result", JSON.stringify({ type, cards, result: data.result, saved: data.saved }));
      router.push("/tarot/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "결과 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mobile-shell result-page">
      <header className="app-header">
        <Link className="app-logo" href="/">월연당</Link>
      </header>
      <nav className="top-tabs" aria-label="주요 메뉴">
        <Link href="/saju">정통사주</Link>
        <Link href="/tarot" className="active">타로</Link>
      </nav>

      <section className="result-card">
        <span className="accent-label">카드 확인</span>
        <h1>선택한 세 장을 천천히 뒤집어보세요</h1>
        <p>모든 카드를 확인한 뒤 OpenAI가 카드 조합에 맞춘 결과를 생성합니다.</p>
      </section>

      <section className="reveal-spread">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index);
          return (
            <button
              className={`reveal-card ${isFlipped ? "flipped" : ""}`}
              type="button"
              key={card.id}
              onClick={() => setFlipped((current) => current.includes(index) ? current : [...current, index])}
            >
              <span className="card-face card-back"><i /></span>
              <span className="card-face card-front">
                <b>{positionLabels[index]}</b>
                <strong>{card.name}</strong>
                <small>{card.keywords.join(" · ")}</small>
              </span>
            </button>
          );
        })}
      </section>

      {error && <p className="error-text">{error}</p>}

      <section className="result-actions">
        <button className="primary-button" type="button" disabled={!allFlipped || loading} onClick={generateResult}>
          {loading ? "결과 생성 중..." : "결과 생성하기"}
        </button>
        <Link className="primary-button secondary" href="/tarot">다시 선택하기</Link>
      </section>
    </main>
  );
}
