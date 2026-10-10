"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { ArrowDown, Grid2x2, LayoutGrid, List, MapPin } from "lucide-react";
import type { Brand, Dealer, ModelPhoto, ModelRow } from "@/lib/types";
import { brandLogoUrl } from "@/lib/media-urls";
import { ModelCard } from "@/components/model-card";
import { CompareProvider, useCompare } from "@/components/compare-context";
import { CompareBar } from "@/components/compare-bar";
import { DealerMap } from "./dealer-map";
import "./brands.css";

type Props = {
  brand: Brand;
  brands: Brand[];
  models: ModelRow[];
  dealers: Dealer[];
  brandCounts: Record<string, number>;
  photoMap?: Record<string, ModelPhoto[]>;
  /** Data-generated answer block (entity name first), shown under the tagline. */
  summary?: string;
  /** Price extent of the whole catalogue (M Ft) — scales the price-range bar. */
  priceScale?: { min: number; max: number };
};

const fmt = (v: number, d = 1) => v.toFixed(d).replace(".", ",");
/** Stagger index for CSS animation-delay (`--i`). */
const idx = (i: number) => ({ "--i": i }) as CSSProperties;

/** Counts up to `value` once the tile scrolls into view. SSR / no-JS / reduced-motion show the final value. */
function CountUp({ value, decimals = 0, delay = 0 }: { value: number; decimals?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mountedAt = performance.now();
    let raf = 0, timer = 0, started = false;
    setShown(0);
    const run = () => {
      if (started) return;
      started = true;
      const from = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - from) / 1300);
        setShown(value * (1 - Math.pow(1 - p, 4)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      io.disconnect();
      // Tiles that are visible on load wait for their CSS entrance; later ones start at once.
      timer = window.setTimeout(run, Math.max(0, delay - (performance.now() - mountedAt)));
    }, { threshold: 0.4 });
    io.observe(el);
    const safety = window.setTimeout(run, 5000); // never leave a rendered snapshot on 0
    return () => { io.disconnect(); clearTimeout(timer); clearTimeout(safety); cancelAnimationFrame(raf); };
  }, [value, delay]);
  return <span ref={ref}>{fmt(shown, decimals)}</span>;
}

/** Tagline revealed word by word; the closing two words get the italic accent + drawn underline. */
function Tagline({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  const cut = words.length > 3 ? words.length - 2 : 0;
  return (
    <p className="brand-tagline">
      {words.slice(0, cut).map((w, i) => (
        <Fragment key={i}>{i > 0 && " "}<span className="tw"><span style={idx(i)}>{w}</span></span></Fragment>
      ))}
      {cut > 0 && " "}
      <em className="tw tag-em"><span style={idx(cut)}>{words.slice(cut).join(" ")}</span></em>
    </p>
  );
}

export function BrandPage(props: Props) {
  return (
    <CompareProvider>
      <BrandPageInner {...props} />
      <CompareBar />
    </CompareProvider>
  );
}

function BrandPageInner({ brand, brands, models, dealers, brandCounts, photoMap = {}, summary, priceScale }: Props) {
  const [zoom, setZoom] = useState<1 | 2>(2);
  const [dealerView, setDealerView] = useState<"list" | "map">("list");
  const compare = useCompare();
  const stageRef = useRef<HTMLElement>(null);
  const heroColor = brand.hero_color ?? "#444";
  const heroLogo = brandLogoUrl(brand.logo_path);
  const prices = models.flatMap((m) => [m.price_min_m_ft, m.price_max_m_ft]).filter((v): v is number => v != null && v > 0);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  const drives = Array.from(new Set(models.map((m) => m.drive)));
  const cats = Array.from(new Set(models.map((m) => m.category)));

  // Price-range bar: this brand's span inside the whole catalogue's price range.
  const lo = Math.floor(Math.min(priceScale?.min ?? minP, minP));
  const hi = Math.ceil(Math.max(priceScale?.max ?? maxP, maxP));
  const span = Math.max(1, hi - lo);
  const segLeft = ((minP - lo) / span) * 100;
  const segWidth = Math.min(100 - segLeft, Math.max(2.5, ((maxP - minP) / span) * 100));

  const siteLink = brand.importer_site ? (
    <a href={`https://${brand.importer_site}`} target="_blank" rel="noopener noreferrer">{brand.importer_site}</a>
  ) : null;
  const factGroups: { label: string; rows: { k: string; v: ReactNode }[] }[] = [
    {
      label: "A márka",
      rows: [
        { k: "Alapítva", v: brand.founded },
        { k: "Székhely", v: brand.hq },
        { k: "Anyavállalat", v: brand.parent_company },
        { k: "Gyárak", v: brand.factories },
      ],
    },
    {
      label: "Magyarországon",
      rows: [
        { k: "Importőr", v: brand.importer_name },
        { k: "Cím", v: brand.importer_addr },
        { k: "Honlap", v: siteLink },
        { k: "Dealerek", v: brand.dealers_text },
      ],
    },
  ].map((g) => ({ ...g, rows: g.rows.filter((r) => r.v) }));
  let factIdx = 0;

  // Cursor spotlight (fine pointers only; the CSS ignores it elsewhere).
  const onStageMove = (e: PointerEvent<HTMLElement>) => {
    const el = stageRef.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <>
      {/* Brand strip (sticky) */}
      <div className="brand-strip-wrap">
        <div className="container">
          <div className="brand-strip">
            {[...brands]
              .sort((a, b) => a.name.localeCompare(b.name, "hu"))
              .map((b) => {
                const count = brandCounts[b.slug] ?? 0;
                const tabLogo = brandLogoUrl(b.logo_path);
                return (
                  <Link key={b.id} href={`/markak/${b.slug}`} className={`brand-tab ${b.id === brand.id ? "on" : ""}`}>
                    {tabLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tabLogo} alt={b.name} className="brand-tab-logo" loading="lazy" width={40} height={18} />
                    ) : (
                      <span className="swatch" style={{ background: b.brand_tone ?? "#666" }} />
                    )}
                    {b.name}
                    {count > 0 ? <span className="n">{count}</span> : null}
                  </Link>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── 1. Brand stage: hero + background merged ── */}
      <section
        key={brand.id}
        ref={stageRef}
        onPointerMove={onStageMove}
        className="brand-stage"
        style={{ ["--brand-tone" as string]: heroColor }}
      >
        <div className="stage-aurora" aria-hidden><i /><i /><i /></div>
        <div className="stage-dots" aria-hidden />
        <div className="stage-ghost" data-name={brand.name} aria-hidden />

        <div className="container">
          <div className="stage-eyebrow"><span className="dot" /><span>Márkaprofil</span><span className="line" /></div>

          <div className="stage-grid">
            <div className="stage-main">
              {heroLogo ? (
                <div className="brand-logo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroLogo} alt={`${brand.name} logó`} className="brand-logo-hero" loading="eager" fetchPriority="high" />
                  {/* Visually hidden (the logo is the visible heading); full phrase for crawlers and screen readers. */}
                  <h1 className="sr-only">{brand.name} autók Magyarországon</h1>
                </div>
              ) : (
                <h1 className="brand-name"><em>{brand.name}</em></h1>
              )}
              {brand.tagline ? <Tagline text={brand.tagline} /> : null}
              {summary ? <p className="brand-summary answer-capsule">{summary}</p> : null}

              {brand.description || cats.length > 0 ? (
                <div className="stage-bg">
                  <h2><em>Háttér</em>.</h2>
                  {brand.description ? <p>{brand.description}</p> : null}
                  {cats.length > 0 ? (
                    <div className="pill-list">{cats.map((c, i) => (<span key={c} style={idx(i)}>{c}</span>))}</div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {factGroups.some((g) => g.rows.length > 0) ? (
              <aside className="dossier">
                {factGroups.filter((g) => g.rows.length > 0).map((g) => (
                  <dl key={g.label} className="dossier-group">
                    <div className="dossier-label">{g.label}</div>
                    {g.rows.map((r) => (
                      <div key={r.k} className="row" style={idx(factIdx++)}>
                        <dt className="k">{r.k}</dt>
                        <dd className="v">{r.v}</dd>
                      </div>
                    ))}
                  </dl>
                ))}
              </aside>
            ) : null}
          </div>

          <div className="stage-stats">
            <a className="qs" href="#markamodellek" style={idx(0)}>
              <div className="l">Modellek</div>
              <div className="v"><CountUp value={models.length} delay={950} /></div>
              <div className="sub">Ugrás a modellekhez <ArrowDown size={12} /></div>
            </a>
            <div className="qs qs-wide" style={idx(1)}>
              <div className="l">Ársáv</div>
              {prices.length > 0 ? (
                <>
                  <div className="v">
                    <CountUp value={minP} decimals={1} delay={1040} />
                    <span className="dash">–</span>
                    <CountUp value={maxP} decimals={1} delay={1040} />
                    <small>M Ft</small>
                  </div>
                  <div className="range" aria-hidden>
                    <div className="range-track"><i style={{ left: `${segLeft}%`, width: `${segWidth}%` }} /></div>
                    <div className="range-ends"><span>{lo} M</span><span>{hi} M</span></div>
                  </div>
                </>
              ) : (
                <div className="v">—</div>
              )}
            </div>
            <div className="qs" style={idx(2)}>
              <div className="l">Hajtások</div>
              <div className="v"><CountUp value={drives.length} delay={1130} /></div>
              <div className="sub" title={drives.join(", ")}>{drives.join(" · ")}</div>
            </div>
            {dealers.length > 0 && (
              <a className="qs" href="#kereskedok" style={idx(3)}>
                <div className="l">Kereskedők</div>
                <div className="v"><CountUp value={dealers.length} delay={1220} /></div>
                <div className="sub">Ugrás a listához <ArrowDown size={12} /></div>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Dealers ── */}
      <section className="block" id="kereskedok">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">Márkakereskedők</div>
              <h2><em>{brand.name}</em> kereskedők <span style={{ color: "var(--ink-mute)", fontSize: ".7em" }}>{dealers.length} helyszín</span></h2>
            </div>
            {dealers.length > 0 && (
              <div className="zoom-toggle">
                <button type="button" onClick={() => setDealerView("list")} className={dealerView === "list" ? "on" : ""}><List size={14} /> Lista</button>
                <button type="button" onClick={() => setDealerView("map")} className={dealerView === "map" ? "on" : ""}><MapPin size={14} /> Térkép</button>
              </div>
            )}
          </div>

          {dealers.length === 0 ? (
            <p style={{ color: "var(--ink-mute)", fontSize: 15 }}>Ehhez a márkához még nincs kereskedő rögzítve.</p>
          ) : dealerView === "map" ? (
            <DealerMap dealers={dealers} />
          ) : (
            <div className="dealer-grid">
              {dealers.map((d) => (
                <div key={d.id} className="dealer-card">
                  <div className="dealer-name">{d.name}</div>
                  <address className="dealer-addr">
                    {d.zip_code ? <span>{d.zip_code} </span> : null}
                    <span>{d.city}</span>
                    {d.street ? <><br /><span>{d.street}</span></> : null}
                  </address>
                  <div className="dealer-contacts-list">
                    {d.phone ? <a href={`tel:${d.phone}`} className="dealer-contact-row"><span className="dc-icon">☎</span>{d.phone}</a> : null}
                    {d.email ? <a href={`mailto:${d.email}`} className="dealer-contact-row"><span className="dc-icon">✉</span>{d.email}</a> : null}
                    {d.website ? <a href={d.website.startsWith("http") ? d.website : `https://${d.website}`} target="_blank" rel="noopener noreferrer" className="dealer-contact-row"><span className="dc-icon">🌐</span>Honlap</a> : null}
                  </div>
                  {d.contacts && d.contacts.length > 0 ? (
                    <div className="dealer-persons">
                      {d.contacts.map((c) => (
                        <div key={c.id} className="dealer-person">
                          <span className="dp-name">{c.name}</span>
                          {c.position ? <span className="dp-pos">{c.position}</span> : null}
                          {c.phone ? <a href={`tel:${c.phone}`} className="dp-contact">☎ {c.phone}</a> : null}
                          {c.email ? <a href={`mailto:${c.email}`} className="dp-contact">✉ {c.email}</a> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {d.lat && d.lng ? (
                    <a className="dealer-map-link" href={`https://www.google.com/maps?q=${d.lat},${d.lng}`} target="_blank" rel="noopener noreferrer">📍 Térkép</a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 3. Models ── */}
      <section className="block" id="markamodellek">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">A márka modelljei</div>
              <h2><em>{brand.name}</em> modellek <span style={{ color: "var(--ink-mute)", fontSize: ".7em" }}>{models.length} modell</span></h2>
            </div>
            <div className="zoom-toggle">
              <button type="button" onClick={() => setZoom(1)} className={zoom === 1 ? "on" : ""}><Grid2x2 size={14} /> Áttekintő</button>
              <button type="button" onClick={() => setZoom(2)} className={zoom === 2 ? "on" : ""}><LayoutGrid size={14} /> Alap</button>
            </div>
          </div>
          <div className={`cards zoom-${zoom}`}>
            {models.map((m) => (
              <ModelCard key={m.id} model={m} zoom={zoom}
                isSelected={compare.has({ brand: m.brand_name, name: m.name })}
                onToggleCompare={() => compare.toggle({ brand: m.brand_name, name: m.name })}
                photos={photoMap[m.id]}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
