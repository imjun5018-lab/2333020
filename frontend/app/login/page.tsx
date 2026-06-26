"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authMessage } from "../../lib/auth-messages";
import { getSiteUrl, supabase } from "../../lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(authMessage(error.message));
      return;
    }

    setMessage("로그인되었습니다.");
    router.push("/");
    router.refresh();
  };

  const kakaoLogin = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
        queryParams: {
          prompt: "login",
        },
      },
    });

    if (error) {
      setLoading(false);
      setMessage(authMessage(error.message));
    }
  };

  return (
    <main className="mobile-shell form-page">
      <Link className="app-logo" href="/">월연당</Link>
      <h1>로그인</h1>
      <p>저장한 사주와 타로 리포트를 다시 확인하세요.</p>
      <form className="auth-card" onSubmit={(event) => event.preventDefault()}>
        <label>이메일<input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>비밀번호<input type="password" placeholder="비밀번호" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="primary-button" type="button" onClick={login} disabled={loading}>
          {loading ? "로그인 중..." : "이메일로 로그인"}
        </button>
        <button className="primary-button kakao" type="button" onClick={kakaoLogin} disabled={loading}>카카오로 계속하기</button>
        {message && <p className="auth-message">{message}</p>}
        <Link href="/signup">아직 계정이 없나요? 회원가입</Link>
      </form>
    </main>
  );
}
