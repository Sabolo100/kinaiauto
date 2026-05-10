"use client";

import Link from "next/link";
import { useState } from "react";
import { Grid2x2, LayoutGrid } from "lucide-react";
import type { Brand, ModelPhoto, ModelRow } from "@/lib/types";
import { ModelCard } from "@/components/model-card";
import { CompareProvider, useCompare } from "@/components/compare-context";
import { CompareBar } from "@/components/compare-bar";
import "./brands.css";

type Props = {
  brand: Brand;
  brands: Brand[];
  models: ModelRow[];
  brandCounts: Record<string, number>;
  photoMap?: Record<string, ModelPhoto[]>;
};

export function BrandPage(props: Props) {
  return (
    <CompareProvider>
      <BrandPageInner {...props} />
      <CompareBar />
    </CompareProvider>
  );
}

function BrandPageInner({ brand, brands, models, brandCounts, photoMap = {} }: Props) {
  const [zoom, setZoom] = useState<1 | 2>(2);
  const compare = useCompare();
  const tone = brand.brand_tone ?? "#444";
  const heroColor = brand.hero_color ?? "#444";
  const minP = Math.min(...models.map((m) => m.price_min_m_ft ?? 0));
  const maxP = Math.max(...models.map((m) => m.price_max_m_ft ?? 0));
  const drives = Array.from(new Set(models.map((m) => m.drive)));
  const cats = Array.from(new Set(models.map((m) => m.category)));

  return (
    <>
      {/* Brand strip (sticky) */}
      <div className="brand-strip-wrap">
        <div className="container">
          <div className="brand-strip">
            {brands.map((b) => {
              const count = brandCounts[b.slug] ?? 0;
              return (
                <Link
                  key={b.id}
                  href={`/markak/${b.slug}`}
                  className={`brand-tab ${b.id === brand.id ? "on" : ""}`}
                >
                  <span
                    className="swatch"
                    style={{ background: b.brand_tone ?? "#666" }}
                  />
                  {b.name}
                  {count > 0 ? <span className="n">{count}</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brand hero */}
      <section
        className="brand-hero"
        style={{ ["--brand-tone" as string]: heroColor }}
      >
        <div className="container brand-hero-inner">
          <div>
            <h1 className="brand-name">
              <em>{brand.name}</em>
            </h1>
            <p className="brand-tagline">{brand.tagline}</p>
            <div className="brand-quickstats">
              <div className="qs">
                <div className="l">Modellek</div>
                <div className="v">{models.length}</div>
              </div>
              <div className="qs">
                <div className="l">Ársáv</div>
                <div className="v">
                  {minP.toFixed(1).replace(".", ",")}
                  <small>—{maxP.toFixed(1).replace(".", ",")} M Ft</small>
                </div>
              </div>
              <div className="qs">
                <div className="l">Hajtások</div>
                <div className="v">{drives.length}</div>
              </div>
            </div>
          </div>
          <div className="brand-fact">
            <div className="row">
              <div className="k">Alapítva</div>
              <div className="v">{brand.founded ?? "—"}</div>
            </div>
            <div className="row">
              <div className="k">Székhely</div>
              <div className="v">{brand.hq ?? "—"}</div>
            </div>
            <div className="row">
              <div className="k">Anyavállalat</div>
              <div className="v">{brand.parent_company ?? "—"}</div>
            </div>
            <div className="row">
              <div className="k">Hivatalos</div>
              <div className="v">
                {brand.importer_site ? (
                  <a
                    href={`https://${brand.importer_site}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {brand.importer_site}
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Models block */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">A márka modelljei</div>
              <h2>
                <em>{brand.name}</em> modellek{" "}
                <span style={{ color: "var(--ink-mute)", fontSize: ".7em" }}>
                  {models.length} modell
                </span>
              </h2>
            </div>
            <div className="zoom-toggle">
              <button
                type="button"
                onClick={() => setZoom(1)}
                className={zoom === 1 ? "on" : ""}
              >
                <Grid2x2 size={14} /> Áttekintő
              </button>
              <button
                type="button"
                onClick={() => setZoom(2)}
                className={zoom === 2 ? "on" : ""}
              >
                <LayoutGrid size={14} /> Alap
              </button>
            </div>
          </div>
          <div className={`cards zoom-${zoom}`}>
            {models.map((m) => (
              <ModelCard
                key={m.id}
                model={m}
                zoom={zoom}
                isSelected={compare.has({ brand: m.brand_name, name: m.name })}
                onToggleCompare={() =>
                  compare.toggle({ brand: m.brand_name, name: m.name })
                }
                photos={photoMap[m.id]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About block */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">A márkáról</div>
              <h2>
                Mi van <em>a háttérben</em>.
              </h2>
            </div>
          </div>
          <div className="about-grid">
            <div>
              <p
                style={{
                  fontSize: 16.5,
                  lineHeight: 1.65,
                  color: "var(--ink)",
                  maxWidth: 620,
                  margin: "0 0 18px",
                }}
              >
                {brand.description}
              </p>
              <div className="pill-list">
                {cats.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </div>
            <aside className="brand-fact">
              <div className="row">
                <div className="k">Importőr</div>
                <div className="v">{brand.importer_name ?? "—"}</div>
              </div>
              <div className="row">
                <div className="k">Cím</div>
                <div className="v">{brand.importer_addr ?? "—"}</div>
              </div>
              <div className="row">
                <div className="k">Honlap</div>
                <div className="v">
                  {brand.importer_site ? (
                    <a
                      href={`https://${brand.importer_site}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {brand.importer_site}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              <div className="row">
                <div className="k">Dealerek</div>
                <div className="v">{brand.dealers_text ?? "—"}</div>
              </div>
              <div className="row">
                <div className="k">Gyárak</div>
                <div className="v">{brand.factories ?? "—"}</div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
