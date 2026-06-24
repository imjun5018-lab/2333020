"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const signup = () => {
    if (!nickname || !email || password.length < 8) {
      setMessage("닉네임, 이메일, 8자 이상 비밀번호를 입력해 주세요.");
      return;
    }
    setMessage("테스트 회원가입 완료. Supabase 연결 후 실제 계정 생성으로 교체됩니다.");
    setTimeout(() => router.push("/login"), 700);
  };

  const kakaoSignup = () => {
    setMessage("카카오 가입은 Supabase Kakao OAuth 설정 후 연결됩니다.");
  };

  return (
    <main className="mobile-shell form-page">
      <Link className="app-logo" href="/">월연당</Link>
      <h1>회원가입</h1>
      <p>리딩 결과와 생성 이미지를 안전하게 저장할 계정을 만듭니다.</p>
      <form className="auth-card" onSubmit={(event) => event.preventDefault()}>
        <label>닉네임<input type="text" placeholder="예: 달빛손님" value={nickname} onChange={(event) => setNickname(event.target.value)} /></label>
        <label>이메일<input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>비밀번호<input type="password" placeholder="8자 이상" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="primary-button" type="button" onClick={signup}>가입하기</button>
        <button className="primary-button kakao" type="button" onClick={kakaoSignup}>카카오로 가입하기</button>
        {message && <p className="auth-message">{message}</p>}
        <Link href="/login">이미 계정이 있나요? 로그인</Link>
      </form>
    </main>
  );
}
