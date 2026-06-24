"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="mobile-shell">
      <header className="app-header">
        <Link className="app-logo" href="/">
          <Image src="/media/brand-wolyeondang.png" alt="월연당 로고" width={34} height={34} />
          <span>월연당</span>
        </Link>
        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="검색">⌕</button>
          <button className="icon-button" type="button" aria-label="메뉴 열기" onClick={() => setMenuOpen(true)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav className="top-tabs" aria-label="주요 메뉴">
        <Link href="/saju" className="active">정통사주</Link>
        <Link href="/tarot">타로</Link>
      </nav>

      <section className="intro-strip" aria-label="월연당 소개">
        <strong>오늘은 무엇이 궁금하세요?</strong>
        <p>정통사주와 타로만 남겨 더 빠르게 고를 수 있게 정리했습니다.</p>
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
          <Link href="/login">로그인</Link>
          <Link href="/signup">회원가입</Link>
        </div>
      </section>

      {menuOpen && (
        <div className="menu-backdrop" role="presentation" onClick={() => setMenuOpen(false)}>
          <aside className="menu-modal" role="dialog" aria-modal="true" aria-label="전체 메뉴" onClick={(event) => event.stopPropagation()}>
            <div className="menu-head">
              <strong>월연당 메뉴</strong>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기">×</button>
            </div>
            <Link href="/saju" onClick={() => setMenuOpen(false)}>정통사주 보기</Link>
            <Link href="/tarot" onClick={() => setMenuOpen(false)}>타로 보기</Link>
            <Link href="/login" onClick={() => setMenuOpen(false)}>로그인</Link>
            <Link href="/signup" onClick={() => setMenuOpen(false)}>회원가입</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
