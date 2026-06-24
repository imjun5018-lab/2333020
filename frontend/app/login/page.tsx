"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const login = () => {
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setMessage("테스트 로그인 완료. Supabase 연결 후 실제 인증으로 교체됩니다.");
    setTimeout(() => router.push("/"), 700);
  };

  const kakaoLogin = () => {
    setMessage("카카오 로그인은 Supabase Kakao OAuth 설정 후 연결됩니다.");
  };

  return (
    <main className="mobile-shell form-page">
      <Link className="app-logo" href="/">월연당</Link>
      <h1>로그인</h1>
      <p>저장한 사주와 타로 리포트를 다시 확인하세요.</p>
      <form className="auth-card" onSubmit={(event) => event.preventDefault()}>
        <label>이메일<input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>비밀번호<input type="password" placeholder="비밀번호" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="primary-button" type="button" onClick={login}>이메일로 로그인</button>
        <button className="primary-button kakao" type="button" onClick={kakaoLogin}>카카오로 계속하기</button>
        {message && <p className="auth-message">{message}</p>}
        <Link href="/signup">아직 계정이 없나요? 회원가입</Link>
      </form>
    </main>
  );
}
