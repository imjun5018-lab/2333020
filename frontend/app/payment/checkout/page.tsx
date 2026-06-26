"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createOrderId, getPaymentRedirectUrl, requireLogin, supabaseUrl, supabaseKey, type PendingPayment } from "../../../lib/payment";
import { supabase } from "../../../lib/supabase-client";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>;
    };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("결제 SDK를 불러오지 못했습니다."));
    document.body.appendChild(script);
  });
}

export default function PaymentCheckoutPage() {
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [message, setMessage] = useState("결제 정보를 준비하고 있습니다.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pending-payment");
    if (!raw) {
      setMessage("결제할 리딩 정보가 없습니다.");
      return;
    }

    setPending(JSON.parse(raw) as PendingPayment);
    setMessage("");
  }, []);

  const requestPayment = async () => {
    if (!pending) return;

    setLoading(true);
    setMessage("");

    const session = await requireLogin();
    if (!session) {
      setMessage("로그인 후 결제할 수 있습니다.");
      setLoading(false);
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (supabaseKey) headers.apikey = supabaseKey;
      const configResponse = await fetch(`${supabaseUrl}/functions/v1/payment-config`, { headers });
      const config = await configResponse.json();
      if (!configResponse.ok) {
        throw new Error(config.error || "결제 설정을 불러오지 못했습니다.");
      }

      await loadScript("https://js.tosspayments.com/v1/payment-widget");

      if (!window.TossPayments) {
        throw new Error("토스 결제 SDK가 준비되지 않았습니다.");
      }

      const { data } = await supabase.auth.getUser();
      const orderId = createOrderId(pending.kind);
      sessionStorage.setItem("pending-payment-order", JSON.stringify({ ...pending, orderId }));

      const tossPayments = window.TossPayments(config.clientKey);
      await tossPayments.requestPayment("카드", {
        amount: pending.amount,
        orderId,
        orderName: pending.orderName,
        customerEmail: data.user?.email,
        customerName: data.user?.email?.split("@")[0] || "월연당 회원",
        successUrl: getPaymentRedirectUrl(`/payment/success?kind=${pending.kind}&orderName=${encodeURIComponent(pending.orderName)}`),
        failUrl: getPaymentRedirectUrl("/payment/fail"),
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제 요청에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <main className="mobile-shell form-page">
      <section className="result-card">
        <span className="accent-label">결제</span>
        <h1>{pending?.orderName || "리딩 결제"}</h1>
        <p>토스페이먼츠 테스트 결제로 결제 승인 후 결과를 생성하고 내 보관함에 저장합니다.</p>
      </section>
      {pending && (
        <section className="payment-summary">
          <div><b>상품</b><span>{pending.orderName}</span></div>
          <div><b>금액</b><span>{pending.amount.toLocaleString("ko-KR")}원</span></div>
          <button className="primary-button" type="button" onClick={requestPayment} disabled={loading}>
            {loading ? "결제창 준비 중..." : "토스페이먼츠로 결제"}
          </button>
          <Link className="primary-button secondary" href={pending.kind === "tarot" ? "/tarot" : "/today"}>돌아가기</Link>
        </section>
      )}
      {message && <p className="error-text">{message}</p>}
    </main>
  );
}
