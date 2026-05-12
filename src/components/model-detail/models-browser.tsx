"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Brand, ModelRow } from "@/lib/types";
import { brandLogoUrl } from "@/lib/data";
import "./models-browser.css";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function sortedAlpha(brands: Brand[]) {
  return [...brands].sort((a, b) => a.name.localeCompare(b.name, "hu"));
}

// ---------------------------------------------------------------------------
// ModelsBrowserStrip
// Persistent brand + model strip used inside /app/modellek/layout.tsx.
// Reads the current URL params so it stays in sync across navigations.
// ---------------------------------------------------------------------------
export function ModelsBrowserStrip({
  brands,
  models,
}: {
  brands: Brand[];
  models: ModelRow[];
}) {
  const params = useParams() as { brand?: string; model?: string };
  const brandFromUrl = (params?.brand as string) ?? null;
  const modelFromUrl = (params?.model as string) ?? null;

  const [activeBrand, setActiveBrand] = useState<string | null>(brandFromUrl);

  // Sync when the user navigates directly to a different brand URL
  useEffect(() => {
    if (brandFromUrl) setActiveBrand(brandFromUrl);
  }, [brandFromUrl]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of models) c[m.brand_slug] = (c[m.brand_slug] ?? 0) + 1;
    return c;
  }, [models]);

  const brandModels = useMemo(
    () => (activeBrand ? models.filter((m) => m.brand_slug === activeBrand) : []),
    [activeBrand, models],
  );

  const sorted = useMemo(() => sortedAlpha(brands), [brands]);

  return (
    <>
      {/* Brand strip — wraps to multiple rows */}
      <div className="brand-strip-wrap">
        <div className="container">
          <div className="strip-section-label">Márka</div>
          <div className="brand-strip">
            {sorted.map((b) => {
              const tabLogo = brandLogoUrl(b.logo_path);
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`brand-tab${activeBrand === b.slug ? " on" : ""}`}
                  onClick={() => setActiveBrand(b.slug)}
                >
                  {tabLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tabLogo}
                      alt={b.name}
                      className="brand-tab-logo"
                      loading="lazy"
                      width={40}
                      height={18}
                    />
                  ) : (
                    <span
                      className="swatch"
                      style={{ background: b.brand_tone ?? "#666" }}
                    />
                  )}
                  {b.name}
                  <span className="n">{counts[b.slug] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Model strip — shown when a brand is active */}
      {activeBrand ? (
        <div className="strip-wrap models">
          <div className="container">
            <div className="strip-label">
              Modell{" "}
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10.5,
                  color: "var(--ink-mute)",
                }}
              >
                {brandModels.length} modell
              </span>
            </div>
            <div className="strip">
              {brandModels.map((m) => (
                <Link
                  key={m.id}
                  href={`/modellek/${m.brand_slug}/${m.slug}`}
                  className={`strip-tab model-tab${m.slug === modelFromUrl ? " on" : ""}`}
                  data-drive={m.drive}
                >
                  <span className="drive-dot" />
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// ModelsBrowser
// Full browser widget: brand strip + model strip + empty state.
// Used on the standalone /modellek page (without layout).
// ---------------------------------------------------------------------------
export function ModelsBrowser({
  brands,
  models,
  initialBrand,
  selectedModelSlug,
  hideEmpty,
}: {
  brands: Brand[];
  models: ModelRow[];
  /** Pre-select this brand slug on mount */
  initialBrand?: string;
  /** Highlight this model slug in the model strip */
  selectedModelSlug?: string;
  /** Hide the empty-state / instructions block */
  hideEmpty?: boolean;
}) {
  const [activeBrand, setActiveBrand] = useState<string | null>(initialBrand ?? null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of models) c[m.brand_slug] = (c[m.brand_slug] ?? 0) + 1;
    return c;
  }, [models]);

  const brandModels = useMemo(
    () => (activeBrand ? models.filter((m) => m.brand_slug === activeBrand) : []),
    [activeBrand, models],
  );

  const sorted = useMemo(() => sortedAlpha(brands), [brands]);

  return (
    <>
      {/* Brand strip */}
      <div className="brand-strip-wrap">
        <div className="container">
          <div className="strip-section-label">Márka</div>
          <div className="brand-strip">
            {sorted.map((b) => {
              const tabLogo = brandLogoUrl(b.logo_path);
              return (
                <button
                  type="button"
                  key={b.id}
                  className={`brand-tab${activeBrand === b.slug ? " on" : ""}`}
                  onClick={() => setActiveBrand(b.slug)}
                >
                  {tabLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tabLogo}
                      alt={b.name}
                      className="brand-tab-logo"
                      loading="lazy"
                      width={40}
                      height={18}
                    />
                  ) : (
                    <span
                      className="swatch"
                      style={{ background: b.brand_tone ?? "#666" }}
                    />
                  )}
                  {b.name}
                  <span className="n">{counts[b.slug] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Model strip */}
      {activeBrand ? (
        <div className="strip-wrap models">
          <div className="container">
            <div className="strip-label">
              Modell{" "}
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10.5,
                  color: "var(--ink-mute)",
                }}
              >
                {brandModels.length} modell
              </span>
            </div>
            <div className="strip">
              {brandModels.map((m) => (
                <Link
                  key={m.id}
                  href={`/modellek/${m.brand_slug}/${m.slug}`}
                  className={`strip-tab model-tab${m.slug === selectedModelSlug ? " on" : ""}`}
                  data-drive={m.drive}
                >
                  <span className="drive-dot" />
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Empty state */}
      {!hideEmpty && (
        <div className="empty-host">
          <div className="container">
            <div className="empty">
              <div className="empty-text">
                <span className="step">Hogyan működik</span>
                <h2>
                  Böngészési felület <em>és</em> linkkel hívható részletek.
                </h2>
                <p>
                  Erre az oldalra rákerül minden modell, amelyikre az oldal többi
                  részén bárhol a „Részletek&rdquo; gombbal vagy a modellnévre
                  kattintasz. Persze magától is használható: válaszd ki a márkát
                  fent, majd a modellt.
                </p>
                <div className="empty-shortcuts">
                  {sorted.slice(0, 8).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="empty-shortcut"
                      onClick={() => setActiveBrand(b.slug)}
                    >
                      <span
                        className="swatch"
                        style={{ background: b.brand_tone ?? "#666" }}
                      />
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="empty-steps">
                {[
                  {
                    n: 1,
                    t: "Márka",
                    d: "Válaszd ki a márkát a felső vízszintes sávban.",
                  },
                  {
                    n: 2,
                    t: "Modell",
                    d: "A márka alatt megjelennek a modellek — egyet kiválasztva nyílik a részletek nézet.",
                  },
                  {
                    n: 3,
                    t: "Részletek",
                    d: "Adatlap, galéria, felszereltségi szintek, töltés, garancia, importőri linkek és hasonló modellek.",
                  },
                  {
                    n: 4,
                    t: "Összehasonlítás",
                    d: "Bármikor átléphetsz a többmodell összevetéséhez az oldal aljáról.",
                  },
                ].map((s) => (
                  <div key={s.n} className="step-row">
                    <span className="num">{s.n}</span>
                    <div>
                      <div className="t">{s.t}</div>
                      <div className="d">{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
