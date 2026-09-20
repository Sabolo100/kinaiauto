import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

/** Fallback page served by the service worker when there is no network. */
export default function OfflinePage() {
  return (
    <main className="container offline-page">
      <div className="offline-card">
        <div className="offline-icon" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h1>Nincs internetkapcsolat</h1>
        <p>
          Ez az oldal még nincs elmentve a készülékeden. Ha visszatér a hálózat,
          próbáld újra — a korábban megnyitott modellek offline is elérhetők.
        </p>
        <div className="offline-actions">
          <Link href="/" className="offline-btn primary">Főoldal</Link>
          <a href="" className="offline-btn">Újra próbálom</a>
        </div>
      </div>
    </main>
  );
}
