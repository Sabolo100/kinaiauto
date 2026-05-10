"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/c4m5s6", label: "Áttekintés" },
  { href: "/c4m5s6/markak", label: "Márkák" },
  { href: "/c4m5s6/modellek", label: "Modellek" },
  { href: "/c4m5s6/extract", label: "PDF / URL kinyerés" },
];

export function CmsShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="cms-shell">
      <aside className="cms-sidebar">
        <div className="cms-brand">kinaiauto.com</div>
        <div className="cms-brand-sub">CMS · admin</div>
        <nav className="cms-nav">
          {ITEMS.map((it) => {
            const isActive =
              it.href === "/c4m5s6"
                ? path === "/c4m5s6"
                : path.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={isActive ? "active" : ""}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="cms-foot">
          <div>Bejelentkezve · admin</div>
          <form action="/api/cms/logout" method="post">
            <button type="submit">Kijelentkezés</button>
          </form>
        </div>
      </aside>
      <main className="cms-main">{children}</main>
    </div>
  );
}
