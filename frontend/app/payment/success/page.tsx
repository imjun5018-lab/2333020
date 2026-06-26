"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authHeaders, supabaseUrl } from "../../../lib/payment";
import { supabase } from "../../../lib/supabase-client";

type PendingOrder = {
  kind: "tarot" | "fortune" | "saju";
  orderName: string;
  amount: number;
  orderId: string;
  payload: any;
};

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("결제를 승인하고 결과를 생성하고 있습니다.");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function confirmAndGenerate() {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = Number(searchParams.get("amount"));
      const raw = sessionStorage.getItem("pending-payment-order");

      if (!paymentKey || !orderId || !amount || !raw) {
        setMessage("결제 승인에 필요한 정보가 없습니다.");
        return;
      }

      const pending = JSON.parse(raw) as PendingOrder;
      if (pending.orderId !== orderId || pending.amount !== amount) {
        setMessage("결제 정보가 일치하지 않습니다.");
        return;
      }

      try {
        const headers = await authHeaders();
        const confirmResponse = await fetch(`${supabaseUrl}/functions/v1/payment-confirm`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount,
            orderName: pending.orderName,
            productKind: pending.kind,
          }),
        });
        const confirmData = await confirmResponse.json();
        if (!confirmResponse.ok) {
          throw new Error(confirmData.error || "결제 승인에 실패했습니다.");
        }

        if (pending.kind === "tarot") {
          const resultResponse = await fetch(`${supabaseUrl}/functions/v1/tarot-generate`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              readingType: pending.payload.type,
              cards: pending.payload.cards,
              isPaidUser: true,
            }),
          });
          const resultData = await resultResponse.json();
          if (!resultResponse.ok) {
            throw new Error(resultData.error || "타로 결과 생성에 실패했습니다.");
          }
          sessionStorage.setItem("tarot-result", JSON.stringify({
            type: pending.payload.type,
            cards: pending.payload.cards,
            result: resultData.result,
            saved: resultData.saved,
            record: resultData.record || null,
            payment: confirmData.payment,
          }));
          sessionStorage.removeItem("pending-payment");
          sessionStorage.removeItem("pending-payment-order");
          router.replace("/tarot/result");
          return;
        }

        if (pending.kind === "fortune") {
          const resultResponse = await fetch(`${supabaseUrl}/functions/v1/fortune-generate`, {
            method: "POST",
            headers,
            body: JSON.stringify(pending.payload),
          });
          const resultData = await resultResponse.json();
          if (!resultResponse.ok) {
            throw new Error(resultData.error || "운세 결과 생성에 실패했습니다.");
          }
          sessionStorage.setItem("fortune-result", JSON.stringify({
            ...pending.payload,
            result: resultData.result,
            saved: resultData.saved,
            record: resultData.record || null,
            payment: confirmData.payment,
          }));
          sessionStorage.removeItem("pending-payment");
          sessionStorage.removeItem("pending-payment-order");
          router.replace("/today?paid=1");
          return;
        }

        if (mounted) {
          setDone(true);
          setMessage("결제가 완료되었습니다.");
        }
      } catch (error) {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : "결제 승인 중 문제가 발생했습니다.");
        }
      }
    }

    confirmAndGenerate();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <main className="mobile-shell form-page">
      <section className="result-card">
        <span className="accent-label">{done ? "결제 완료" : "결제 확인"}</span>
        <h1>{done ? "결제가 완료되었습니다" : "결제 결과를 처리하고 있습니다"}</h1>
        <p>{message}</p>
      </section>
      <section className="result-actions">
        <Link className="primary-button" href="/profile">내 보관함 보기</Link>
        <Link className="primary-button secondary" href="/">홈으로</Link>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<main className="mobile-shell form-page" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
