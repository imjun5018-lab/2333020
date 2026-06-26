"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authHeaders, supabaseUrl } from "../../lib/payment";

type AdminData = {
  profiles: any[];
  tarotReadings: any[];
  fortuneReadings: any[];
  payments: any[];
  reviews: any[];
};

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [message, setMessage] = useState("관리자 데이터를 불러오고 있습니다.");
  const [tab, setTab] = useState<"users" | "readings" | "payments" | "reviews">("users");

  const load = async () => {
    setMessage("관리자 데이터를 불러오고 있습니다.");
    const headers = await authHeaders();
    const response = await fetch(`${supabaseUrl}/functions/v1/admin-dashboard`, { headers });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error === "Admin only" ? "관리자 권한이 필요합니다." : result.error || "관리자 데이터를 불러오지 못했습니다.");
      return;
    }

    setData(result);
    setMessage("");
  };

  useEffect(() => {
    load();
  }, []);

  const cancelPayment = async (paymentId: string) => {
    const headers = await authHeaders();
    const response = await fetch(`${supabaseUrl}/functions/v1/payment-cancel`, {
      method: "POST",
      headers,
      body: JSON.stringify({ paymentId, cancelReason: "관리자 취소 처리" }),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "결제 취소에 실패했습니다.");
      return;
    }

    setMessage("결제 취소가 처리되었습니다.");
    await load();
  };

  return (
    <main className="mobile-shell admin-page">
      <section className="result-card">
        <span className="accent-label">관리자</span>
        <h1>서비스 운영 관리</h1>
        <p>유저, 사주 및 운세 내역, 결제내역과 리뷰를 확인합니다.</p>
      </section>

      <section className="today-tabs admin-tabs">
        {[
          ["users", "유저"],
          ["readings", "운세"],
          ["payments", "결제"],
          ["reviews", "리뷰"],
        ].map(([id, label]) => (
          <button className={tab === id ? "active" : ""} type="button" key={id} onClick={() => setTab(id as typeof tab)}>
            {label}
          </button>
        ))}
      </section>

      {message && <p className="auth-message">{message}</p>}

      {data && tab === "users" && (
        <section className="admin-list">
          {data.profiles.map((profile) => (
            <article className="archive-item" key={profile.id}>
              <span>{profile.role}</span>
              <h3>{profile.nickname || profile.email || "회원"}</h3>
              <p>{profile.email || "-"} · {profile.provider}</p>
              <small>{formatDate(profile.created_at)}</small>
            </article>
          ))}
        </section>
      )}

      {data && tab === "readings" && (
        <section className="admin-list">
          {[...data.tarotReadings, ...data.fortuneReadings].map((reading) => (
            <article className="archive-item" key={`${reading.category || reading.reading_type}-${reading.id}`}>
              <span>{reading.category ? "오늘운세" : "타로"}</span>
              <h3>{reading.result?.title || "리딩 결과"}</h3>
              <p>{reading.result?.summary || reading.result?.advice || "-"}</p>
              <small>{formatDate(reading.created_at)}</small>
            </article>
          ))}
        </section>
      )}

      {data && tab === "payments" && (
        <section className="admin-list">
          {data.payments.map((payment) => (
            <article className="archive-item payment-item" key={payment.id}>
              <span>{payment.status}</span>
              <h3>{payment.order_name}</h3>
              <p>{payment.amount?.toLocaleString("ko-KR")}원 · {payment.method || "-"}</p>
              <small>{formatDate(payment.created_at)}</small>
              {payment.status !== "CANCELED" && payment.status !== "PARTIAL_CANCELED" && (
                <button className="primary-button secondary" type="button" onClick={() => cancelPayment(payment.id)}>
                  결제 취소
                </button>
              )}
            </article>
          ))}
        </section>
      )}

      {data && tab === "reviews" && (
        <section className="admin-list">
          {data.reviews.map((review) => (
            <article className="archive-item" key={review.id}>
              <span>{review.reading_kind}</span>
              <h3>{review.display_name} · {review.rating}점</h3>
              <p>{review.content}</p>
              <small>{formatDate(review.created_at)}</small>
            </article>
          ))}
        </section>
      )}

      <section className="result-actions">
        <Link className="primary-button secondary" href="/">홈으로</Link>
      </section>
    </main>
  );
}
