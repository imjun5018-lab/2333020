"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { positionLabels, readingTypes, type TarotCard } from "../../../lib/tarot";
import { ensureProfile, supabase } from "../../../lib/supabase-client";

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
  record?: { id: string } | null;
};

function typeLabel(type: string) {
  return readingTypes.find((item) => item.id === type)?.label || "타로 결과";
}

export default function TarotResultPage() {
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("tarot-result");
    if (raw) {
      setStored(JSON.parse(raw));
    }
  }, []);

  if (!stored) {
    return (
      <main className="mobile-shell result-page">
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
        <Link className="primary-button secondary" href={stored.saved ? "/profile" : "/login"}>
          {stored.saved ? "내 보관함에서 보기" : "로그인하고 저장하기"}
        </Link>
      </section>

      {stored.saved && stored.record?.id && (
        <section className="review-panel">
          <span className="accent-label">리뷰 작성</span>
          <h2>이번 리딩은 어땠나요?</h2>
          <div className="rating-row" aria-label="별점 선택">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                className={value <= rating ? "active" : ""}
                type="button"
                key={value}
                onClick={() => setRating(value)}
                aria-label={`${value}점`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            placeholder="리딩을 보고 느낀 점을 남겨주세요."
            rows={4}
          />
          <button
            className="primary-button"
            type="button"
            disabled={reviewLoading || review.trim().length < 5}
            onClick={async () => {
              setReviewLoading(true);
              setReviewMessage("");
              const { data: userData } = await supabase.auth.getUser();
              const profile = await ensureProfile();

              if (!userData.user) {
                setReviewMessage("로그인 후 리뷰를 작성할 수 있습니다.");
                setReviewLoading(false);
                return;
              }

              const displayName =
                (profile as { nickname?: string } | null)?.nickname ||
                userData.user.email?.split("@")[0] ||
                "월연당 회원";

              const { error } = await supabase.from("reading_reviews").insert({
                user_id: userData.user.id,
                reading_kind: "tarot",
                reading_id: stored.record?.id,
                rating,
                content: review.trim(),
                display_name: displayName,
              });

              setReviewLoading(false);
              if (error) {
                setReviewMessage("리뷰 저장에 실패했습니다. 내용을 확인해 주세요.");
                return;
              }

              setReview("");
              setReviewMessage("리뷰가 등록되었습니다. 메인 화면에 반영됩니다.");
            }}
          >
            {reviewLoading ? "등록 중..." : "리뷰 등록"}
          </button>
          {reviewMessage && <p className="auth-message">{reviewMessage}</p>}
        </section>
      )}
    </main>
  );
}
