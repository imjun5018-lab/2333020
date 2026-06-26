"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { readingTypes } from "../../lib/tarot";

const catalog = [
  {
    title: "정통 사주",
    description: "기질, 관계, 일, 돈의 흐름을 태어난 시간으로 확인합니다.",
    href: "/saju",
    tags: ["사주", "정통", "생년월일", "월하", "운세"],
    image: "/media/hero-saju-mobile.png",
  },
  {
    title: "타로",
    description: "질문을 고르고 세 장의 카드로 현재와 조언을 확인합니다.",
    href: "/tarot",
    tags: ["타로", "연애", "선택", "마음", "카드"],
    image: "/media/hero-tarot-mobile.png",
  },
  {
    title: "오늘의 운세",
    description: "포춘쿠키, 띠별운세, 별자리운세를 결제 후 저장합니다.",
    href: "/today",
    tags: ["오늘", "포춘쿠키", "띠별", "별자리", "운세"],
    image: "/media/ai-report.png",
  },
  ...readingTypes.map((type) => ({
    title: type.label,
    description: type.question,
    href: "/tarot",
    tags: ["타로", type.label, type.id],
    image: "/media/hero-tarot-mobile.png",
  })),
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return catalog;

    return catalog.filter((item) =>
      [item.title, item.description, ...item.tags].some((text) => text.toLowerCase().includes(normalized)),
    );
  }, [query]);

  return (
    <main className="mobile-shell search-page">
      <section className="result-card">
        <span className="accent-label">검색</span>
        <h1>원하는 운세를 찾아보세요</h1>
        <p>사주, 타로, 포춘쿠키, 띠별운세, 별자리운세를 한 번에 검색합니다.</p>
      </section>

      <section className="search-panel">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 연애, 오늘, 별자리, 선택"
          autoFocus
        />
      </section>

      <section className="search-results">
        {results.map((item) => (
          <Link className="search-item" href={item.href} key={`${item.title}-${item.href}`}>
            <div>
              <Image src={item.image} alt="" fill sizes="92px" />
            </div>
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
          </Link>
        ))}
        {results.length === 0 && (
          <div className="empty-panel">
            <strong>검색 결과가 없습니다.</strong>
            <p>다른 키워드로 다시 검색해 주세요.</p>
          </div>
        )}
      </section>
    </main>
  );
}
