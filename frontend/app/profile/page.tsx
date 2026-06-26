"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ensureProfile, supabase } from "../../lib/supabase-client";
import { authHeaders, supabaseUrl } from "../../lib/payment";

type Profile = {
  id: string;
  email: string | null;
  nickname: string | null;
  provider: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type TarotArchive = {
  id: string;
  reading_type: string;
  result: {
    title?: string;
    summary?: string;
  };
  created_at: string;
};

type FortuneArchive = {
  id: string;
  category: string;
  result: {
    title?: string;
    summary?: string;
  };
  created_at: string;
};

type PaymentRecord = {
  id: string;
  order_name: string;
  product_kind: string;
  amount: number;
  status: string;
  created_at: string;
  canceled_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function fortuneLabel(category: string) {
  if (category === "animal") return "띠별운세";
  if (category === "star") return "별자리운세";
  return "포춘쿠키";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("프로필을 불러오고 있습니다.");
  const [loading, setLoading] = useState(true);
  const [tarotArchive, setTarotArchive] = useState<TarotArchive[]>([]);
  const [fortuneArchive, setFortuneArchive] = useState<FortuneArchive[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!userData.user) {
        router.replace("/login");
        return;
      }

      setUser(userData.user);
      const ensured = await ensureProfile();

      if (!mounted) return;

      if (ensured) {
        setProfile(ensured as Profile);
        setMessage("");
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .select("id,email,nickname,provider,avatar_url,created_at,updated_at")
          .eq("id", userData.user.id)
          .single();

        if (!mounted) return;

        if (error) {
          setMessage("프로필을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        } else {
          setProfile(data as Profile);
          setMessage("");
        }
      }

      const [tarotResult, fortuneResult, paymentResult] = await Promise.all([
        supabase
          .from("tarot_readings")
          .select("id,reading_type,result,created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("fortune_readings")
          .select("id,category,result,created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("payments")
          .select("id,order_name,product_kind,amount,status,created_at,canceled_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (!mounted) return;

      setTarotArchive((tarotResult.data || []) as TarotArchive[]);
      setFortuneArchive((fortuneResult.data || []) as FortuneArchive[]);
      setPayments((paymentResult.data || []) as PaymentRecord[]);
      setLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const cancelPayment = async (paymentId: string) => {
    setPaymentMessage("");
    const headers = await authHeaders();
    const response = await fetch(`${supabaseUrl}/functions/v1/payment-cancel`, {
      method: "POST",
      headers,
      body: JSON.stringify({ paymentId, cancelReason: "사용자 환불 요청" }),
    });
    const data = await response.json();

    if (!response.ok) {
      setPaymentMessage(data.error || "환불 요청에 실패했습니다.");
      return;
    }

    setPayments((current) => current.map((payment) => payment.id === paymentId ? data.payment : payment));
    setPaymentMessage("환불 처리가 완료되었습니다.");
  };

  return (
    <main className="mobile-shell profile-page">
      <section className="profile-hero">
        <span>내 계정</span>
        <h1>{profile?.nickname || user?.email?.split("@")[0] || "프로필"}</h1>
        <p>로그인한 계정의 기본 정보와 Supabase 프로필 연결 상태입니다.</p>
      </section>

      {message && <p className="auth-message">{message}</p>}

      <section className="profile-panel" aria-busy={loading}>
        <div className="profile-avatar" aria-hidden="true">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" />
          ) : (
            <strong>{(profile?.nickname || user?.email || "월").slice(0, 1).toUpperCase()}</strong>
          )}
        </div>
        <dl className="profile-list">
          <div>
            <dt>이메일</dt>
            <dd>{profile?.email || user?.email || "-"}</dd>
          </div>
          <div>
            <dt>닉네임</dt>
            <dd>{profile?.nickname || "-"}</dd>
          </div>
          <div>
            <dt>가입 방식</dt>
            <dd>{profile?.provider === "kakao" ? "카카오" : "이메일"}</dd>
          </div>
          <div>
            <dt>가입일</dt>
            <dd>{formatDate(profile?.created_at)}</dd>
          </div>
        </dl>
      </section>

      <section className="profile-actions">
        <Link className="primary-button" href="/tarot">타로 리딩 시작</Link>
        <Link className="primary-button secondary" href="/today">오늘의 운세 보기</Link>
        <button className="primary-button secondary" type="button" onClick={signOut}>로그아웃</button>
      </section>

      <section className="archive-section">
        <div className="section-title-row">
          <h2>내 보관함</h2>
        </div>
        {tarotArchive.length === 0 && fortuneArchive.length === 0 ? (
          <div className="empty-panel">
            <strong>아직 저장된 리딩이 없습니다.</strong>
            <p>로그인한 상태에서 타로 또는 오늘의 운세를 보면 자동으로 저장됩니다.</p>
          </div>
        ) : (
          <div className="archive-list">
            {tarotArchive.map((item) => (
              <article className="archive-item" key={`tarot-${item.id}`}>
                <span>타로</span>
                <h3>{item.result?.title || "타로 리딩"}</h3>
                <p>{item.result?.summary || "저장된 타로 결과입니다."}</p>
                <small>{formatDate(item.created_at)}</small>
              </article>
            ))}
            {fortuneArchive.map((item) => (
              <article className="archive-item" key={`fortune-${item.id}`}>
                <span>{fortuneLabel(item.category)}</span>
                <h3>{item.result?.title || "오늘의 운세"}</h3>
                <p>{item.result?.summary || "저장된 오늘의 운세입니다."}</p>
                <small>{formatDate(item.created_at)}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="archive-section">
        <div className="section-title-row">
          <h2>결제내역</h2>
        </div>
        {paymentMessage && <p className="auth-message">{paymentMessage}</p>}
        {payments.length === 0 ? (
          <div className="empty-panel">
            <strong>결제내역이 없습니다.</strong>
            <p>결제 후 리딩 결과를 보면 이곳에 구매 정보가 표시됩니다.</p>
          </div>
        ) : (
          <div className="archive-list">
            {payments.map((payment) => (
              <article className="archive-item payment-item" key={payment.id}>
                <span>{payment.product_kind === "tarot" ? "타로" : payment.product_kind === "fortune" ? "운세" : "사주"}</span>
                <h3>{payment.order_name}</h3>
                <p>{payment.amount.toLocaleString("ko-KR")}원 · {payment.status}</p>
                <small>{formatDate(payment.created_at)}</small>
                {payment.status !== "CANCELED" && payment.status !== "PARTIAL_CANCELED" && (
                  <button className="primary-button secondary" type="button" onClick={() => cancelPayment(payment.id)}>
                    환불 요청
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
