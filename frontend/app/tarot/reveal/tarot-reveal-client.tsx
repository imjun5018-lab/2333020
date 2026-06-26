"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { positionLabels, tarotById, type TarotCard } from "../../../lib/tarot";
import { READING_PRICE, requireLogin, startPendingPayment } from "../../../lib/payment";

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
      const session = await requireLogin();
      if (!session) {
        router.push("/login");
        return;
      }

      startPendingPayment({
        kind: "tarot",
        orderName: "월연당 타로 리딩",
        amount: READING_PRICE,
        payload: { type, cards },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제를 시작하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mobile-shell result-page">
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
          {loading ? "결제 준비 중..." : "결제하고 결과 보기"}
        </button>
        <Link className="primary-button secondary" href="/tarot">다시 선택하기</Link>
      </section>
    </main>
  );
}
