import type { Metadata } from "next";
import AppNavigation from "../components/app-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "월연당",
  description: "정통사주와 타로를 중심으로 운세 리포트를 제공하는 모바일 플랫폼",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppNavigation />
        {children}
      </body>
    </html>
  );
}
