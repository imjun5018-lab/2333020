import Image from "next/image";
import Link from "next/link";

export default function SajuPage() {
  return (
    <main className="mobile-shell">
      <header className="app-header">
        <Link className="app-logo" href="/">
          <Image src="/media/brand-wolyeondang.png" alt="월연당 로고" width={34} height={34} />
          <span>월연당</span>
        </Link>
      </header>
      <nav className="top-tabs" aria-label="주요 메뉴">
        <Link href="/saju" className="active">정통사주</Link>
        <Link href="/tarot">타로</Link>
      </nav>
      <section className="detail-hero">
        <Image src="/media/hero-saju-mobile.png" alt="정통사주 월하" fill priority sizes="442px" />
        <div className="card-shade" />
        <div className="detail-copy">
          <span className="accent-label">정통사주 · 월하</span>
          <h1>태어난 시간에 숨은 흐름을 읽어드립니다</h1>
          <p>기질, 관계, 일의 방향, 다가오는 시기를 한 번에 정리하는 정통사주 리딩입니다.</p>
        </div>
      </section>
      <section className="detail-panel">
        <h2>무엇을 확인하나요?</h2>
        <ul className="check-list">
          <li>나의 기본 기질과 강점</li>
          <li>올해 조심해야 할 선택</li>
          <li>일, 관계, 돈의 흐름</li>
          <li>AI 리포트와 이미지 보관</li>
        </ul>
        <Link className="primary-button" href="/login">사주 리딩 시작하기</Link>
      </section>
    </main>
  );
}
