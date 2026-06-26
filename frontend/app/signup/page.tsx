"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authMessage } from "../../lib/auth-messages";
import { getSiteUrl, supabase } from "../../lib/supabase-client";

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    if (!nickname || !email || password.length < 8) {
      setMessage("닉네임, 이메일, 8자 이상 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setMessage(authMessage(error.message));
      return;
    }

    if (data.session) {
      setMessage("가입이 완료되었습니다.");
      router.push("/");
      router.refresh();
      return;
    }

    setMessage("가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.");
  };

  const kakaoSignup = async () => {
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
      <h1>회원가입</h1>
      <p>리딩 결과와 생성 이미지를 안전하게 저장할 계정을 만듭니다.</p>
      <form className="auth-card" onSubmit={(event) => event.preventDefault()}>
        <label>닉네임<input type="text" placeholder="예: 달빛손님" value={nickname} onChange={(event) => setNickname(event.target.value)} /></label>
        <label>이메일<input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>비밀번호<input type="password" placeholder="8자 이상" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="primary-button" type="button" onClick={signup} disabled={loading}>
          {loading ? "가입 중..." : "가입하기"}
        </button>
        <button className="primary-button kakao" type="button" onClick={kakaoSignup} disabled={loading}>카카오로 가입하기</button>
        {message && <p className="auth-message">{message}</p>}
        <Link href="/login">이미 계정이 있나요? 로그인</Link>
      </form>
    </main>
  );
}
