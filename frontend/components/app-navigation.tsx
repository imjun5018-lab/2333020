"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase-client";

export default function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const closeMenu = () => setMenuOpen(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="app-header">
        <Link className="app-logo" href="/" onClick={closeMenu}>
          <Image src="/media/brand-wolyeondang.png" alt="월연당 로고" width={34} height={34} />
          <span>월연당</span>
        </Link>
        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="검색"
            onClick={() => router.push("/search")}
          >
            ⌕
          </button>
          <button className="icon-button" type="button" aria-label="메뉴 열기" onClick={() => setMenuOpen(true)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="menu-backdrop" role="presentation" onClick={closeMenu}>
          <aside className="menu-modal" role="dialog" aria-modal="true" aria-label="전체 메뉴" onClick={(event) => event.stopPropagation()}>
            <div className="menu-head">
              <strong>월연당 메뉴</strong>
              <button type="button" onClick={closeMenu} aria-label="메뉴 닫기">×</button>
            </div>
            <Link href="/saju">정통사주 보기</Link>
            <Link href="/tarot">타로 보기</Link>
            <Link href="/today">오늘의 운세</Link>
            <Link href="/search">검색</Link>
            {user ? (
              <>
                <Link href="/profile">프로필</Link>
                <Link href="/admin">관리자</Link>
                <button type="button" onClick={signOut}>로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login">로그인</Link>
                <Link href="/signup">회원가입</Link>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
