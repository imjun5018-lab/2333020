"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ensureProfile, supabase } from "../../lib/supabase-client";

type Profile = {
  id: string;
  email: string | null;
  nickname: string | null;
  provider: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("프로필을 불러오고 있습니다.");
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
        return;
      }

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
    </main>
  );
}
