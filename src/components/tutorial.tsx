"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, HelpCircle, X } from "lucide-react";

const SEEN_KEY = "kinai_tutorial_seen";
export const OPEN_TUTORIAL_EVENT = "kinai:open-tutorial";

// ── Step illustrations (inline SVG, brand palette) ────────────────────────────
function IllustrationDiscover() {
  return (
    <svg viewBox="0 0 300 150" className="tut-svg" aria-hidden>
      {[0, 1, 2, 3].map((i) => {
        const x = 18 + (i % 4) * 68;
        return (
          <g key={i}>
            <rect x={x} y={34} width={56} height={82} rx={7} fill="#fff" stroke="#e5e2da" />
            <rect x={x + 7} y={42} width={42} height={26} rx={4} fill="#f0ede4" />
            <path d={`M${x + 11} 60 q4 -9 12 -9 h6 q8 0 12 9`} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
            <rect x={x + 7} y={74} width={30} height={5} rx={2.5} fill="#cfcbc0" />
            <rect x={x + 7} y={84} width={42} height={5} rx={2.5} fill="#e5e2da" />
            <rect x={x + 7} y={98} width={24} height={9} rx={3} fill="#dcfce7" />
          </g>
        );
      })}
    </svg>
  );
}

function IllustrationFilter() {
  const chips = [
    { x: 20, w: 54, on: true }, { x: 82, w: 40, on: false }, { x: 130, w: 60, on: true },
    { x: 198, w: 44, on: false }, { x: 250, w: 34, on: false },
  ];
  return (
    <svg viewBox="0 0 300 150" className="tut-svg" aria-hidden>
      <rect x={20} y={22} width={70} height={8} rx={4} fill="#cbd5e1" />
      {chips.map((c, i) => (
        <rect key={i} x={c.x} y={44} width={c.w} height={26} rx={13}
          fill={c.on ? "#2563eb" : "#fff"} stroke={c.on ? "#2563eb" : "#dbe3ee"} />
      ))}
      <rect x={20} y={92} width={260} height={6} rx={3} fill="#e5e2da" />
      <circle cx={150} cy={95} r={11} fill="#2563eb" stroke="#fff" strokeWidth="3" />
      <rect x={20} y={118} width={120} height={6} rx={3} fill="#eef1f5" />
      <rect x={150} y={118} width={130} height={6} rx={3} fill="#eef1f5" />
    </svg>
  );
}

function IllustrationViews() {
  return (
    <svg viewBox="0 0 300 150" className="tut-svg" aria-hidden>
      {/* overview (small) */}
      <g>
        <rect x={20} y={40} width={66} height={70} rx={7} fill="#fff" stroke="#e5e2da" />
        <rect x={28} y={48} width={50} height={26} rx={4} fill="#f0ede4" />
        <rect x={28} y={80} width={34} height={5} rx={2.5} fill="#cfcbc0" />
        <rect x={28} y={92} width={26} height={8} rx={3} fill="#fde68a" />
      </g>
      {/* base (medium) */}
      <g>
        <rect x={104} y={28} width={80} height={94} rx={7} fill="#fff" stroke="#e5e2da" />
        <rect x={112} y={36} width={64} height={30} rx={4} fill="#f0ede4" />
        <rect x={112} y={72} width={44} height={5} rx={2.5} fill="#cfcbc0" />
        <rect x={112} y={82} width={64} height={5} rx={2.5} fill="#e5e2da" />
        <rect x={112} y={100} width={30} height={9} rx={3} fill="#fde68a" />
      </g>
      {/* detailed (large) */}
      <g>
        <rect x={202} y={20} width={78} height={110} rx={7} fill="#fff" stroke="#d97706" strokeWidth="1.5" />
        <rect x={210} y={28} width={62} height={32} rx={4} fill="#f0ede4" />
        <rect x={210} y={66} width={40} height={5} rx={2.5} fill="#cfcbc0" />
        <rect x={210} y={76} width={62} height={5} rx={2.5} fill="#e5e2da" />
        <rect x={210} y={88} width={62} height={5} rx={2.5} fill="#e5e2da" />
        <rect x={210} y={104} width={28} height={11} rx={3} fill="#d97706" />
        <rect x={244} y={104} width={28} height={11} rx={3} fill="#fed7aa" />
      </g>
    </svg>
  );
}

function IllustrationChart() {
  const bars = [
    { x: 36, h: 40 }, { x: 86, h: 78 }, { x: 136, h: 56 }, { x: 186, h: 96 }, { x: 236, h: 68 },
  ];
  return (
    <svg viewBox="0 0 300 150" className="tut-svg" aria-hidden>
      <line x1={20} y1={126} x2={284} y2={126} stroke="#e5e2da" strokeWidth="2" />
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={126 - b.h} width={30} height={b.h} rx={4} fill={i === 3 ? "#dc2626" : "#fca5a5"} />
          <rect x={b.x + 2} y={126 - b.h - 22} width={26} height={18} rx={4} fill="#fff" stroke="#e5e2da" />
          <path d={`M${b.x + 6} ${126 - b.h - 11} q3 -5 7 -5 h4 q4 0 7 5`} fill="none" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function IllustrationBrands() {
  return (
    <svg viewBox="0 0 300 150" className="tut-svg" aria-hidden>
      <rect x={20} y={22} width={260} height={106} rx={9} fill="#fff" stroke="#e5e2da" />
      <circle cx={52} cy={52} r={18} fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" />
      <path d="M44 52 h16 M52 44 v16" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
      <rect x={82} y={40} width={90} height={8} rx={4} fill="#15181a" />
      <rect x={82} y={56} width={140} height={6} rx={3} fill="#cfcbc0" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={32 + i * 60} y={84} width={50} height={32} rx={5} fill="#f7f6f2" stroke="#e5e2da" />
          <path d={`M${40 + i * 60} 104 q5 -10 14 -10 h6 q9 0 14 10`} fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function IllustrationCart() {
  return (
    <svg viewBox="0 0 300 150" className="tut-svg" aria-hidden>
      {/* flying cards */}
      <rect x={36} y={70} width={42} height={30} rx={5} fill="#fff" stroke="#e5e2da" />
      <rect x={92} y={54} width={42} height={30} rx={5} fill="#fff" stroke="#e5e2da" />
      <path d="M150 70 h44" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 7" />
      {/* cart */}
      <g transform="translate(196,42)">
        <rect x={0} y={0} width={72} height={66} rx={10} fill="#7c3aed" />
        <path d="M18 26 h36 l-4 22 h-28 z" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
        <path d="M18 26 l-4 -9 h-6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx={24} cy={55} r={3.5} fill="#fff" />
        <circle cx={46} cy={55} r={3.5} fill="#fff" />
        <circle cx={62} cy={8} r={11} fill="#dc2626" stroke="#fff" strokeWidth="2.5" />
        <text x={62} y={12} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">2</text>
      </g>
    </svg>
  );
}

function IllustrationRequest() {
  return (
    <svg viewBox="0 0 300 150" className="tut-svg" aria-hidden>
      <g transform="translate(28,52)">
        <rect x={0} y={0} width={60} height={44} rx={6} fill="#0d9488" />
        <path d="M4 6 l26 20 l26 -20" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      {[{ y: 24, c: "#16a34a" }, { y: 64, c: "#2563eb" }, { y: 104, c: "#dc2626" }].map((d, i) => (
        <g key={i}>
          <path d={`M96 74 C 150 74, 170 ${d.y + 14}, 214 ${d.y + 14}`} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="2 6" />
          <g transform={`translate(214,${d.y})`}>
            <path d="M14 0 C5 0 0 7 0 15 C0 24 14 30 14 30 C14 30 28 24 28 15 C28 7 23 0 14 0 Z" fill={d.c} />
            <circle cx={14} cy={14} r={5} fill="#fff" />
          </g>
        </g>
      ))}
    </svg>
  );
}

type Step = {
  badge: string;
  accent: string;
  tint: string;
  title: string;
  body: string;
  illo: React.ReactNode;
};

const STEPS: Step[] = [
  {
    badge: "1 · Tájékozódás",
    accent: "#16a34a",
    tint: "#f0fdf4",
    title: "Ismerd meg a kínai modellkínálatot",
    body: "A kínai márkák új terepet jelentenek. Itt egy helyen, átláthatóan nézheted végig a teljes hazai kínálatot — hogy tájékozottan dönts.",
    illo: <IllustrationDiscover />,
  },
  {
    badge: "2 · Szűrés",
    accent: "#2563eb",
    tint: "#eff6ff",
    title: "Szűrj kategória, ár vagy hajtás szerint",
    body: "A főoldalon állítsd be, mi fontos: városi kisautó vagy nagy SUV? Elektromos vagy hibrid? Milyen ársávban? Egyből látod, mi illik hozzád.",
    illo: <IllustrationFilter />,
  },
  {
    badge: "3 · Nézet",
    accent: "#d97706",
    tint: "#fffbeb",
    title: "Válaszd ki a neked tetsző kártyanézetet",
    body: "Három nézet közül választhatsz: Áttekintő (csak a lényeg), Alap és Részletes — annyi információval, amennyit épp látni szeretnél.",
    illo: <IllustrationViews />,
  },
  {
    badge: "4 · Kínálat",
    accent: "#dc2626",
    tint: "#fef2f2",
    title: "Rakd sorba a modelleket bármely szempont szerint",
    body: "A Kínálat oldalon hatótáv, teljesítmény, csomagtér, méret vagy ár szerint rendezve, egy vizuális hasábon látod, mely modellek hasonlóak.",
    illo: <IllustrationChart />,
  },
  {
    badge: "5 · Márkák & Modellek",
    accent: "#16a34a",
    tint: "#f0fdf4",
    title: "Ismerd meg a márkákat és modelleket",
    body: "Saját oldalaikon minden részlet ott van: műszaki adatok, tesztek, galéria, felszereltség és a kereskedői elérhetőségek is.",
    illo: <IllustrationBrands />,
  },
  {
    badge: "6 · Kosár",
    accent: "#7c3aed",
    tint: "#f5f3ff",
    title: "Tedd a kedvenc modelleket a kosárba",
    body: "Bárhol a kosár ikonra kattintva hozzáadhatod a modelleket. A kiválasztásod fent, az „Ajánlatkérések” menüben gyűlik össze.",
    illo: <IllustrationCart />,
  },
  {
    badge: "7 · Ajánlatkérés",
    accent: "#0d9488",
    tint: "#f0fdfa",
    title: "Kérj ajánlatot egy lépésben, sok kereskedőtől",
    body: "Végül válaszd ki a kereskedőket, és egyetlen gombbal árajánlatot kérsz mindegyiktől — egyszerre, kényelmesen.",
    illo: <IllustrationRequest />,
  },
];

export function Tutorial() {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [step, setStep] = useState(0);
  const [anim, setAnim] = useState<"in" | "next" | "prev">("in");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // Don't show onboarding inside the CMS/admin area.
  const isAdmin = pathname?.startsWith("/c4m5s6") ?? false;

  const openTutorial = useCallback((fromStart = false) => {
    if (fromStart) setStep(0);
    setOpen(true);
    setAnim("in");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setEntered(true)),
    );
  }, []);

  // First-visit auto-open (skip if arriving from an ad — the welcome popup
  // handles that case so the two don't stack).
  useEffect(() => {
    if (isAdmin) return;
    const isAd =
      searchParams.has("gclid") || searchParams.has("fbclid") ||
      searchParams.has("utm_source") || searchParams.has("welcome");
    if (isAd) return;
    let seen = false;
    try { seen = !!localStorage.getItem(SEEN_KEY); } catch {}
    if (!seen) {
      const t = setTimeout(() => openTutorial(true), 700);
      return () => clearTimeout(t);
    }
  }, [searchParams, openTutorial, isAdmin]);

  // Re-invoke via global event (footer link / floating button elsewhere)
  useEffect(() => {
    const handler = () => openTutorial(true);
    window.addEventListener(OPEN_TUTORIAL_EVENT, handler);
    return () => window.removeEventListener(OPEN_TUTORIAL_EVENT, handler);
  }, [openTutorial]);

  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
  }

  function close() {
    setEntered(false);
    markSeen();
    setTimeout(() => setOpen(false), 300);
  }

  function go(dir: 1 | -1) {
    const next = step + dir;
    if (next < 0) return;
    if (next >= STEPS.length) { close(); return; }
    setAnim(dir === 1 ? "next" : "prev");
    setStep(next);
  }

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // No onboarding chrome inside the CMS/admin area.
  if (isAdmin) return null;

  return (
    <>
      {/* Floating re-invoke button — always available */}
      <button
        type="button"
        className="tut-fab"
        aria-label="Bemutató megnyitása"
        onClick={() => openTutorial(true)}
      >
        <HelpCircle size={18} />
        <span>Bemutató</span>
      </button>

      {open && (
        <div
          className={`tut-overlay${entered ? " tut-entered" : ""}`}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Bemutató"
        >
          <div className="tut-modal">
            <button className="tut-close" onClick={close} aria-label="Kihagyom">
              <X size={16} />
            </button>

            {/* Illustration */}
            <div
              className="tut-illo"
              style={{ background: s.tint }}
              key={`illo-${step}`}
              data-anim={anim}
            >
              {s.illo}
            </div>

            {/* Content */}
            <div className="tut-content" key={`content-${step}`} data-anim={anim}>
              <span className="tut-badge" style={{ color: s.accent, background: s.tint }}>
                {s.badge}
              </span>
              <h2 className="tut-title">{s.title}</h2>
              <p className="tut-body">{s.body}</p>
            </div>

            {/* Progress dots */}
            <div className="tut-dots" role="tablist">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`tut-dot${i === step ? " on" : ""}${i < step ? " done" : ""}`}
                  style={i === step ? { background: s.accent } : undefined}
                  aria-label={`${i + 1}. lépés`}
                  onClick={() => { setAnim(i > step ? "next" : "prev"); setStep(i); }}
                />
              ))}
            </div>

            {/* Footer controls */}
            <div className="tut-footer">
              {step > 0 ? (
                <button type="button" className="tut-btn ghost" onClick={() => go(-1)}>
                  <ArrowLeft size={15} /> Vissza
                </button>
              ) : (
                <button type="button" className="tut-btn ghost" onClick={close}>
                  Kihagyom
                </button>
              )}
              <button
                type="button"
                className="tut-btn primary"
                style={{ background: s.accent }}
                onClick={() => go(1)}
              >
                {isLast ? "Kezdjük!" : "Tovább"}
                {!isLast && <ArrowRight size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
