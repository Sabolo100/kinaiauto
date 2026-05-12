"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Főoldal" },
  { href: "/kinalat", label: "Kínálat" },
  { href: "/osszehasonlitas", label: "Összehasonlítás" },
  { href: "/markak", label: "Márkák" },
  { href: "/modellek", label: "Modellek" },
  { href: "/tudastar", label: "Tudástár" },
];

export function Topbar({ lastUpdated }: { lastUpdated: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/" className="logo" aria-label="kinaiauto.com — főoldal">
            <b>kinaiauto</b>
            <span className="dot" />
            <span className="tld">com</span>
          </Link>
          <nav className="menu desktop" aria-label="Főnavigáció">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "active" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="topbar-cta">
            <span className="pill">
              <span className="live" />
              Frissítve · {lastUpdated}
            </span>
            <button
              type="button"
              className="menu-toggle"
              aria-label={open ? "Menü bezárása" : "Menü nyitása"}
              aria-expanded={open}
              aria-controls="mobile-drawer"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-drawer"
        className={`mobile-drawer ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        <nav aria-label="Mobil navigáció">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? "active" : undefined}
            >
              <span>{item.label}</span>
              <span className="meta">→</span>
            </Link>
          ))}
        </nav>
        <div
          style={{
            padding: "0 18px 24px",
            color: "var(--ink-mute)",
            fontSize: 12,
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          Frissítve · {lastUpdated}
        </div>
      </div>
    </>
  );
}
