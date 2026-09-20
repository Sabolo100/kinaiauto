"use client";

import { useEffect, useState } from "react";
import { Share, SquarePlus, X, Download, MoreVertical } from "lucide-react";
import { BottomSheet } from "@/components/app-shell/bottom-sheet";
import { INSTALL_EVENT } from "@/components/app-shell/app-shell-context";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "kinai_pwa_dismissed";
const SNOOZE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function isStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}
function isMobile() {
  return window.matchMedia("(max-width: 767px)").matches;
}

/**
 * Install experience:
 *  - Android/Chrome: native beforeinstallprompt → one-tap "Telepítés"
 *  - iOS Safari: step-by-step sheet (Megosztás → Főképernyőhöz adás)
 *  - other: generic browser-menu hint
 * A slim banner appears above the tab bar after ~25 s on mobile; the
 * "Több" sheet's tile opens the flow immediately via INSTALL_EVENT.
 */
export function InstallPrompt() {
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [banner, setBanner] = useState(false);
  const [sheet, setSheet] = useState<"ios" | "generic" | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }

    const onBip = (e: Event) => { e.preventDefault(); setBip(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", onBip);
    const onInstalled = () => { setInstalled(true); setBanner(false); };
    window.addEventListener("appinstalled", onInstalled);

    let snoozed = false;
    try {
      const t = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      snoozed = t > 0 && Date.now() - t < SNOOZE_MS;
    } catch {}
    const timer = !snoozed && isMobile() ? setTimeout(() => setBanner(true), 25_000) : null;

    const onManual = () => {
      setBanner(false);
      if (bip) { void bip.prompt(); return; }
      setSheet(isIOS() ? "ios" : "generic");
    };
    window.addEventListener(INSTALL_EVENT, onManual);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(INSTALL_EVENT, onManual);
      if (timer) clearTimeout(timer);
    };
  }, [bip]);

  function dismiss() {
    setBanner(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  }

  async function install() {
    if (bip) {
      await bip.prompt();
      const { outcome } = await bip.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setBanner(false);
      setBip(null);
      return;
    }
    setBanner(false);
    setSheet(isIOS() ? "ios" : "generic");
  }

  if (installed) return null;

  return (
    <>
      {banner && (
        <div className="pwa-banner" role="complementary" aria-label="Alkalmazás telepítése">
          <img src="/icons/icon-192.png" alt="" width={40} height={40} className="pwa-banner-ico" />
          <div className="pwa-banner-txt">
            <b>kínaiautó appként</b>
            <small>Kezdőképernyőről, teljes képernyőn.</small>
          </div>
          <button type="button" className="pwa-banner-btn" onClick={install}>
            <Download size={14} /> Telepítés
          </button>
          <button type="button" className="pwa-banner-x" onClick={dismiss} aria-label="Bezárás">
            <X size={16} />
          </button>
        </div>
      )}

      <BottomSheet open={sheet !== null} onClose={() => setSheet(null)} title="Telepítés a kezdőképernyőre">
        <div className="pwa-steps">
          <div className="pwa-steps-hero">
            <img src="/icons/icon-192.png" alt="" width={56} height={56} />
            <div>
              <b>kínaiautó.com</b>
              <small>Nincs app store — pár másodperc, és a főképernyőről indul.</small>
            </div>
          </div>
          {sheet === "ios" ? (
            <ol>
              <li><span className="n">1</span><span>Koppints alul a <b>Megosztás</b> ikonra <Share size={15} className="inl" /></span></li>
              <li><span className="n">2</span><span>Görgess, és válaszd: <b>Főképernyőhöz adás</b> <SquarePlus size={15} className="inl" /></span></li>
              <li><span className="n">3</span><span>Jobb felül: <b>Hozzáadás</b>. Kész.</span></li>
            </ol>
          ) : (
            <ol>
              <li><span className="n">1</span><span>Nyisd meg a böngésző menüjét <MoreVertical size={15} className="inl" /></span></li>
              <li><span className="n">2</span><span>Válaszd: <b>Alkalmazás telepítése</b> vagy <b>Hozzáadás a kezdőképernyőhöz</b></span></li>
              <li><span className="n">3</span><span>Erősítsd meg — az ikon a főképernyőn jelenik meg.</span></li>
            </ol>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
