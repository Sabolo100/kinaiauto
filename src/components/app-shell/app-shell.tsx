"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppShellContext } from "./app-shell-context";
import { MobileTopbar } from "./mobile-topbar";
import { MobileTabbar } from "./mobile-tabbar";
import { MoreSheet } from "./more-sheet";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SwRegister } from "@/components/pwa/sw-register";

/**
 * Mobile app shell. On phones (≤767px, via CSS) it replaces the desktop
 * topbar/footer with an app bar + bottom tab bar, adds a "Több" sheet,
 * page transitions, install prompt and service-worker registration.
 * On desktop everything here is hidden by CSS; the markup is cheap.
 */
export function AppShell({ children, lastUpdated }: { children: ReactNode; lastUpdated: string }) {
  const pathname = usePathname() ?? "/";
  const [moreOpen, setMoreOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const isCms = pathname.startsWith("/c4m5s6");
  const pageRef = useRef<HTMLDivElement>(null);

  // Replay the enter animation on every route change without re-mounting the
  // subtree (nested layouts such as /modellek keep their state and scroll).
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.classList.remove("app-page--in");
    void el.offsetWidth; // reflow → restart animation
    el.classList.add("app-page--in");
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const nav = navigator as Navigator & { standalone?: boolean };
    const update = () => {
      const sa = mq.matches || nav.standalone === true;
      setIsStandalone(sa);
      document.documentElement.toggleAttribute("data-standalone", sa);
    };
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const openMore = useCallback(() => setMoreOpen(true), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const ctx = useMemo(
    () => ({ moreOpen, openMore, closeMore, isStandalone }),
    [moreOpen, openMore, closeMore, isStandalone],
  );

  if (isCms) return <>{children}</>;

  return (
    <AppShellContext.Provider value={ctx}>
      <MobileTopbar />
      <div className="app-page" ref={pageRef}>
        {children}
      </div>
      <MobileTabbar />
      <MoreSheet lastUpdated={lastUpdated} />
      <InstallPrompt />
      <SwRegister />
    </AppShellContext.Provider>
  );
}
