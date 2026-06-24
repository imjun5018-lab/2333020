import { Suspense } from "react";
import TarotRevealClient from "./tarot-reveal-client";

export default function TarotRevealPage() {
  return (
    <Suspense fallback={<main className="mobile-shell result-page" />}>
      <TarotRevealClient />
    </Suspense>
  );
}
