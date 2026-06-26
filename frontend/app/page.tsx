"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase-client";

const heroCards = [
  {
    href: "/saju",
    badge: "정통사주",
    title: "내 인생 전반을 정통사주로",
    desc: "태어난 시간 속 흐름을 월하가 차분하게 읽어드립니다.",
    image: "/media/hero-saju-mobile.png"
  },
  {
    href: "/tarot",
    badge: "타로",
    title: "지금 마음의 답을 타로로",
    desc: "서린의 카드 리딩으로 관계와 선택의 방향을 확인하세요.",
    image: "/media/hero-tarot-mobile.png"
  }
];

const sections = [
  {
    title: "궁금한 운세 골라보세요",
    items: [
      { title: "정통 사주", desc: "기질, 시기, 인생 흐름", href: "/saju", image: "/media/hero-saju-mobile.png" },
      { title: "타로", desc: "연애, 선택, 속마음", href: "/tarot", image: "/media/hero-tarot-mobile.png" }
    ]
  }
];

type Review = {
  id: string;
  reading_kind: string;
  rating: number;
  content: string;
  display_name: string;
  created_at: string;
};

function reviewKindLabel(kind: string) {
  if (kind === "tarot") return "타로";
  if (kind === "fortune") return "오늘운세";
  return "사주";
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase
      .from("reading_reviews")
      .select("id,reading_kind,rating,content,display_name,created_at")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setReviews((data || []) as Review[]));
  }, []);

  return (
    <main className="mobile-shell">
      <nav className="top-tabs" aria-label="주요 메뉴">
        <Link href="/saju" className="active">정통사주</Link>
        <Link href="/tarot">타로</Link>
      </nav>

      <section className="intro-strip" aria-label="월연당 소개">
        <strong>오늘은 무엇이 궁금하세요?</strong>
        <p>{user ? `${user.email || "회원"}님, 리딩을 이어갈 수 있습니다.` : "정통사주와 타로만 남겨 더 빠르게 고를 수 있게 정리했습니다."}</p>
      </section>

      <section className="hero-scroll" aria-label="대표 운세">
        {heroCards.map((card) => (
          <Link className="hero-card" href={card.href} key={card.title}>
            <Image src={card.image} alt="" fill sizes="390px" priority={card.href === "/saju"} />
            <div className="card-shade" />
            <div className="hero-card-copy">
              <span>{card.badge}</span>
              <h1>{card.title}</h1>
              <p>{card.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      <div className="pager-dots" aria-hidden="true">
        <b />
        <i />
      </div>

      <section className="quick-actions" aria-label="빠른 실행">
        <Link href="/saju">생년월일로 사주 보기</Link>
        <Link href="/tarot">카드로 마음 확인</Link>
        <Link href="/today">오늘의 운세 열기</Link>
        <Link href="/login">저장한 리포트 열기</Link>
      </section>

      {sections.map((section) => (
        <section className="content-section" key={section.title}>
          <div className="section-title-row">
            <h2>{section.title}</h2>
          </div>
          <div className="mini-card-grid">
            {section.items.map((item) => (
              <Link className="mini-card" href={item.href} key={item.title}>
                <Image src={item.image} alt="" fill sizes="180px" />
                <div className="card-shade" />
                <div>
                  <span>월연당</span>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="content-section">
        <div className="section-title-row">
          <h2>최근 리뷰</h2>
        </div>
        {reviews.length > 0 ? (
          <div className="review-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div>
                  <span>{reviewKindLabel(review.reading_kind)}</span>
                  <b>{"★".repeat(review.rating)}</b>
                </div>
                <p>{review.content}</p>
                <strong>{review.display_name}</strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <strong>아직 등록된 리뷰가 없습니다.</strong>
            <p>로그인 후 리딩 결과 화면에서 첫 리뷰를 남겨보세요.</p>
          </div>
        )}
      </section>

      <section className="guide-panel">
        <p className="accent-label">오늘 시작하기</p>
        <h2>정통사주와 타로를 하나의 기록으로</h2>
        <p>
          로그인하면 리딩 결과와 생성 이미지를 Supabase 보관함에 저장하는 구조로 이어집니다.
        </p>
        <ul className="mini-list">
          <li><span>01</span> 카카오 또는 이메일 로그인</li>
          <li><span>02</span> 사주 정보나 타로 질문 입력</li>
          <li><span>03</span> AI 리포트 생성 후 보관</li>
        </ul>
        <div className="button-row">
          {user ? (
            <>
              <Link href="/profile">프로필</Link>
              <Link href="/today">오늘의 운세</Link>
            </>
          ) : (
            <>
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
