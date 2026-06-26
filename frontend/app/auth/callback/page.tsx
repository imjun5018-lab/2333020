"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ensureProfile, supabase } from "../../../lib/supabase-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("로그인 정보를 확인하고 있습니다.");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        await ensureProfile();
        router.replace("/");
        router.refresh();
        return;
      }

      setMessage("로그인 세션을 찾지 못했습니다. 다시 로그인해 주세요.");
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main className="mobile-shell form-page">
      <Link className="app-logo" href="/">월연당</Link>
      <h1>인증 처리</h1>
      <p>{message}</p>
      <Link className="primary-button" href="/login">로그인으로 돌아가기</Link>
    </main>
  );
}
