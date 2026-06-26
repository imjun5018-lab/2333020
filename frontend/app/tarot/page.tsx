"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { readingTypes, tarotDeck } from "../../lib/tarot";

type ReadingType = (typeof readingTypes)[number];

export default function TarotPage() {
  const [type, setType] = useState<ReadingType>(readingTypes[0]);
  const [selected, setSelected] = useState<number[]>([]);
  const spreadDeck = useMemo(() => {
    return tarotDeck
      .map((card, index) => ({ card, score: (index * 37 + 11) % tarotDeck.length }))
      .sort((a, b) => a.score - b.score)
      .map(({ card }) => card);
  }, []);

  const resultHref = useMemo(() => {
    const cards = selected.map((index) => spreadDeck[index].id).join(",");
    return `/tarot/reveal?type=${type.id}&cards=${cards}`;
  }, [selected, spreadDeck, type]);

  const toggleCard = (index: number) => {
    setSelected((current) => {
      if (current.includes(index)) {
        return current.filter((card) => card !== index);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, index];
    });
  };

  return (
    <main className="mobile-shell">
      <nav className="top-tabs" aria-label="주요 메뉴">
        <Link href="/saju">정통사주</Link>
        <Link href="/tarot" className="active">타로</Link>
      </nav>

      <section className="tarot-hero">
        <Image src="/media/hero-tarot-mobile.png" alt="타로 서린" fill priority sizes="442px" />
        <div className="card-shade" />
        <div className="detail-copy">
          <span className="accent-label">타로 · 서린</span>
          <h1>질문을 고르고 세 장의 카드를 선택하세요</h1>
          <p>78장 타로 덱에서 세 장을 뽑아 현재, 숨은 흐름, 조언을 확인합니다.</p>
        </div>
      </section>

      <section className="tarot-reader">
        <div className="reading-type-grid">
          {readingTypes.map((item) => (
            <button
              className={type.id === item.id ? "selected" : ""}
              type="button"
              key={item.id}
              onClick={() => {
                setType(item);
                setSelected([]);
              }}
            >
              <strong>{item.label}</strong>
              <span>{item.question}</span>
            </button>
          ))}
        </div>

        <div className="reader-status">
          <strong>{type.label}</strong>
          <span>{selected.length}/3 선택</span>
        </div>

        <div className="selected-spread" aria-label="선택된 카드">
          {[0, 1, 2].map((slot) => {
            const card = selected[slot] !== undefined ? spreadDeck[selected[slot]] : null;
            return (
              <div className={card ? "spread-slot filled" : "spread-slot"} key={slot}>
                <span>{slot === 0 ? "현재" : slot === 1 ? "흐름" : "조언"}</span>
                <strong>{card?.name || "카드 대기"}</strong>
              </div>
            );
          })}
        </div>

        <div className="tarot-deck fan-deck" aria-label="타로 카드 선택">
          {spreadDeck.map((card, index) => {
            const isSelected = selected.includes(index);
            return (
              <button
                className={`tarot-card ${isSelected ? "flipped" : ""}`}
                type="button"
                key={card.id}
                onClick={() => toggleCard(index)}
                aria-pressed={isSelected}
              >
                <span className="card-face card-back">
                  <i />
                </span>
                <span className="card-face card-front">
                  <b>{selected.indexOf(index) + 1 || ""}</b>
                  <strong>{card.name}</strong>
                  <small>{card.keywords.slice(0, 2).join(" · ")}</small>
                </span>
              </button>
            );
          })}
        </div>

        {selected.length < 3 ? (
          <p className="reader-help">카드를 세 장 선택하면 결과를 볼 수 있습니다.</p>
        ) : (
          <Link className="primary-button pulse-button" href={resultHref}>선택한 카드 확인하기</Link>
        )}
      </section>
    </main>
  );
}
