"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "결제가 완료되지 않았습니다.";

  return (
    <main className="mobile-shell form-page">
      <section className="result-card">
        <span className="accent-label">결제 실패</span>
        <h1>결제를 다시 확인해 주세요</h1>
        <p>{message}</p>
      </section>
      <section className="result-actions">
        <Link className="primary-button" href="/tarot">타로로 돌아가기</Link>
        <Link className="primary-button secondary" href="/today">오늘운세로 돌아가기</Link>
      </section>
    </main>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<main className="mobile-shell form-page" />}>
      <PaymentFailContent />
    </Suspense>
  );
}
