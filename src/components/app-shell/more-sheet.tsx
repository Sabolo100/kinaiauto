"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Award, BookOpen, ShoppingBag, GraduationCap, Download, ChevronRight,
  ScrollText, FileText, Shield, Cookie, Trash2, Scale, Mail,
} from "lucide-react";
import { BottomSheet } from "./bottom-sheet";
import { INSTALL_EVENT, useAppShell } from "./app-shell-context";
import { useQuoteCart } from "@/components/quote-context";
import { OPEN_TUTORIAL_EVENT } from "@/components/tutorial";

const LEGAL = [
  { href: "/impresszum", label: "Impresszum", Icon: FileText },
  { href: "/aszf", label: "ÁSZF", Icon: ScrollText },
  { href: "/adatkezeles", label: "Adatkezelési tájékoztató", Icon: Shield },
  { href: "/cookie", label: "Cookie beállítások", Icon: Cookie },
  { href: "/adatok-torlese", label: "Adatok törlése", Icon: Trash2 },
  { href: "/jogi-nyilatkozat", label: "Jogi nyilatkozat", Icon: Scale },
];

export function MoreSheet({ lastUpdated }: { lastUpdated: string }) {
  const { moreOpen, closeMore, isStandalone } = useAppShell();
  const { count } = useQuoteCart();
  const pathname = usePathname();

  // close on navigation
  useEffect(() => { closeMore(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pathname]);

  return (
    <BottomSheet
      open={moreOpen}
      onClose={closeMore}
      title={
        <span className="m-logo m-logo--sheet">
          <b>kinaiauto</b><span className="dot" /><span className="tld">com</span>
        </span>
      }
      ariaLabel="További menüpontok"
    >
      <div className="more-grid">
        <Link href="/markak" className="more-tile" onClick={closeMore}>
          <span className="more-tile-ico"><Award size={22} /></span>
          <span className="more-tile-t">Márkák</span>
          <span className="more-tile-s">Háttér, importőr, kereskedők</span>
        </Link>
        <Link href="/tudastar" className="more-tile" onClick={closeMore}>
          <span className="more-tile-ico"><BookOpen size={22} /></span>
          <span className="more-tile-t">Tudástár</span>
          <span className="more-tile-s">Hajtás, hatótáv, garancia</span>
        </Link>
        <Link href="/ajanlatkeres" className="more-tile" onClick={closeMore}>
          <span className="more-tile-ico more-tile-ico--accent">
            <ShoppingBag size={22} />
            {count > 0 ? <span className="more-tile-badge">{count}</span> : null}
          </span>
          <span className="more-tile-t">Ajánlatkérés</span>
          <span className="more-tile-s">{count > 0 ? `${count} modell a kosárban` : "Kosár üres"}</span>
        </Link>
        <button
          type="button"
          className="more-tile"
          onClick={() => { closeMore(); setTimeout(() => window.dispatchEvent(new Event(OPEN_TUTORIAL_EVENT)), 250); }}
        >
          <span className="more-tile-ico"><GraduationCap size={22} /></span>
          <span className="more-tile-t">Bemutató</span>
          <span className="more-tile-s">Hogyan működik az oldal</span>
        </button>
      </div>

      {!isStandalone && (
        <button
          type="button"
          className="more-install"
          onClick={() => { closeMore(); setTimeout(() => window.dispatchEvent(new Event(INSTALL_EVENT)), 250); }}
        >
          <span className="more-install-ico"><Download size={18} /></span>
          <span className="more-install-txt">
            <b>Tedd a kezdőképernyőre</b>
            <small>Appként, teljes képernyőn, offline is</small>
          </span>
          <ChevronRight size={18} className="more-install-chev" />
        </button>
      )}

      <div className="more-section-h">Jogi &amp; információ</div>
      <ul className="more-list">
        {LEGAL.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link href={href} onClick={closeMore}>
              <Icon size={16} /><span>{label}</span><ChevronRight size={16} className="chev" />
            </Link>
          </li>
        ))}
        <li>
          <a href="mailto:info@kinaiauto.com">
            <Mail size={16} /><span>Kapcsolat</span><ChevronRight size={16} className="chev" />
          </a>
        </li>
      </ul>

      <div className="more-foot">
        <p>Az árak tájékoztató jellegűek — vásárlás előtt ellenőrizd a hivatalos márkaoldalon vagy kereskedőnél.</p>
        <span className="mono">© {new Date().getFullYear()} kínaiautó.com · adatok {lastUpdated}</span>
      </div>
    </BottomSheet>
  );
}
