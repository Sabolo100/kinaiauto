"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Car, GitCompareArrows, Menu } from "lucide-react";
import { useAppShell } from "./app-shell-context";

const TABS = [
  { href: "/", label: "Főoldal", Icon: Home, match: (p: string) => p === "/" },
  { href: "/kinalat", label: "Kínálat", Icon: LayoutGrid, match: (p: string) => p.startsWith("/kinalat") },
  { href: "/modellek", label: "Modellek", Icon: Car, match: (p: string) => p.startsWith("/modellek") },
  { href: "/osszehasonlitas", label: "Összevetés", Icon: GitCompareArrows, match: (p: string) => p.startsWith("/osszehasonlitas") },
] as const;

function haptic() {
  try { navigator.vibrate?.(6); } catch {}
}

export function MobileTabbar() {
  const pathname = usePathname() ?? "/";
  const { moreOpen, openMore, closeMore } = useAppShell();

  return (
    <nav className="m-tabbar" aria-label="Alsó navigáció">
      {TABS.map(({ href, label, Icon, match }) => {
        const active = !moreOpen && match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`m-tab ${active ? "on" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => { haptic(); closeMore(); }}
          >
            <span className="m-tab-ico"><Icon size={22} strokeWidth={active ? 2.3 : 1.8} /></span>
            <span className="m-tab-lbl">{label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className={`m-tab ${moreOpen ? "on" : ""}`}
        aria-expanded={moreOpen}
        onClick={() => { haptic(); moreOpen ? closeMore() : openMore(); }}
      >
        <span className="m-tab-ico"><Menu size={22} strokeWidth={moreOpen ? 2.3 : 1.8} /></span>
        <span className="m-tab-lbl">Több</span>
      </button>
    </nav>
  );
}
