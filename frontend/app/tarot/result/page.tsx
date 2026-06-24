"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { positionLabels, readingTypes, type TarotCard } from "../../../lib/tarot";

type GeneratedResult = {
  title: string;
  summary: string;
  cards: Array<{
    position: string;
    name: string;
    keywords: string[];
    interpretation: string;
  }>;
  advice: string;
  caution: string;
};

type StoredResult = {
  type: string;
  cards: TarotCard[];
  result: GeneratedResult;
  saved: boolean;
};

function typeLabel(type: string) {
  return readingTypes.find((item) => item.id === type)?.label || "타로 결과";
}

export default function TarotResultPage() {
  const [stored, setStored] = useState<StoredResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("tarot-result");
    if (raw) {
      setStored(JSON.parse(raw));
    }
  }, []);

  if (!stored) {
    return (
      <main className="mobile-shell result-page">
        <header className="app-header"><Link className="app-logo" href="/">월연당</Link></header>
        <section className="result-card">
          <span className="accent-label">결과 없음</span>
          <h1>생성된 타로 결과가 없습니다</h1>
          <p>카드를 선택하고 뒤집은 뒤 결과를 생성해 주세요.</p>
        </section>
        <section className="result-actions">
          <Link className="primary-button" href="/tarot">타로 리딩 시작하기</Link>
        </section>
      </main>
    );
  }

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
        <span className="accent-label">{typeLabel(stored.type)}</span>
        <h1>{stored.result.title}</h1>
        <p>{stored.result.summary}</p>
      </section>

      <section className="result-spread">
        {stored.result.cards.map((card, index) => (
          <article className="result-tarot-card" key={`${card.name}-${index}`}>
            <div className="result-card-art">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{card.name}</strong>
            </div>
            <div>
              <p className="result-position">{card.position || positionLabels[index]}</p>
              <h2>{card.keywords.join(" · ")}</h2>
              <p>{card.interpretation}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="result-card result-summary">
        <span className="accent-label">종합 조언</span>
        <h2>다음 행동</h2>
        <p>{stored.result.advice}</p>
        <p className="caution-text">{stored.result.caution}</p>
      </section>

      <section className="result-actions">
        <Link className="primary-button" href="/tarot">다시 카드 뽑기</Link>
        <Link className="primary-button secondary" href="/login">{stored.saved ? "저장됨" : "로그인하고 저장하기"}</Link>
      </section>
    </main>
  );
}
