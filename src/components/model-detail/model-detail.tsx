import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  ExternalLink,
  Fuel,
  GitCompareArrows,
  Grid2x2,
  Layers,
  Leaf,
  LifeBuoy,
  PlugZap,
  Ruler,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import type { Brand, Dealer, ModelEngineOption, ModelPhoto, ModelRow, ModelTrim } from "@/lib/types";
import { ModelGallery } from "./model-gallery";
import { DealerSection } from "./dealer-section";
import { VariantsTable } from "./variants-table";
import { QuoteButtonLarge } from "../quote-button-large";
import { fmtPrice, fmtNumber, catLabel } from "@/lib/format";
import { photoUrl } from "@/lib/data";
import "./model-detail.css";

export function ModelDetail({
  model,
  brand,
  trims,
  similar,
  photos,
  dealers,
}: {
  model: ModelRow;
  brand: Brand;
  trims: ModelTrim[];
  similar: ModelRow[];
  photos: ModelPhoto[];
  dealers: Dealer[];
}) {
  const tone = model.brand_tone ?? "#374151";
  const isEV = model.drive === "Elektromos";
  const isPHEV = model.drive === "Plug-in hibrid";
  const isHEV = model.drive === "Önttöltő hibrid";
  const hasBattery = model.battery_kwh != null;
  const heroPhoto = photoUrl(model.primary_photo_path);

  // ---- Engine variants ----------------------------------------------------
  // The variant table is always shown (same layout for 1 or N variants).
  // If the model has no engine_options rows, we synthesise a single "Alap"
  // entry from the model-level spec fields so the table is never empty.
  const opts: ModelEngineOption[] = model.engine_options ?? [];
  const hasOpts = opts.length > 0;

  const effectiveOpts: ModelEngineOption[] =
    hasOpts
      ? opts
      : model.range_km != null ||
        model.power_hp != null ||
        model.battery_kwh != null ||
        model.trunk_l != null ||
        model.seats != null ||
        model.consumption_text != null
        ? [
            {
              id: "synthetic-base",
              model_id: model.id,
              name: "Alap",
              range_km: model.range_km ?? null,
              power_hp: model.power_hp ?? null,
              battery_kwh: model.battery_kwh ?? null,
              trunk_l: model.trunk_l ?? null,
              seats: model.seats ?? null,
              consumption_text: model.consumption_text ?? null,
              sort_order: 0,
            },
          ]
        : [];

  const driveIcon = isEV ? (
    <Zap size={12} />
  ) : isPHEV ? (
    <PlugZap size={12} />
  ) : isHEV ? (
    <Leaf size={12} />
  ) : (
    <Fuel size={12} />
  );

  return (
    <div style={{ ["--brand-tone" as string]: tone }}>
      {/* HERO */}
      <section className="model-hero">
        <div className="container model-hero-inner">
          <div>
            <div className="model-meta-line">
              <Link href={`/markak/${model.brand_slug}`} className="brand-link">
                <span className="swatch" style={{ background: tone }} />
                {model.brand_name}
              </Link>
              <span className="pill-tag">
                <Layers size={12} />
                {catLabel(model.category, model.segment)}
              </span>
              <span className="pill-tag">
                {driveIcon}
                {model.drive}
              </span>
              {model.is_deal ? (
                <span className="pill-tag deal">
                  <Sparkles size={12} />
                  Akciós
                </span>
              ) : null}
            </div>
            <h1 className="model-name">
              <em>{model.name}</em>
            </h1>
            <p className="model-tagline">
              {model.is_deal
                ? `${catLabel(model.category, model.segment)}, ${model.drive.toLowerCase()} hajtás. Aktuálisan akciós listaárral elérhető a hazai kereskedői hálózatban.`
                : `${catLabel(model.category, model.segment)}, ${model.drive.toLowerCase()} hajtás. ${model.seats ?? 5} ülőhely, ${model.length_mm ? `${model.length_mm} mm hossz` : "—"}.`}
            </p>
            <div className={`price-row ${model.is_deal ? "deal" : ""}`}>
              <span className="lbl">
                {model.is_deal ? "Akciós listaár" : "Listaár (alaptól)"}
              </span>
              <div className="val">
                <span className="min">{fmtPrice(model.price_min_m_ft)}</span>
                <span className="max">max {fmtPrice(model.price_max_m_ft)}</span>
              </div>
            </div>
            <QuoteButtonLarge
              item={{
                modelId: model.id,
                brandId: model.brand_id,
                modelName: model.name,
                brandName: model.brand_name,
                modelSlug: model.slug,
                brandSlug: model.brand_slug,
              }}
            />
          </div>
          <div className={`hero-photo ${heroPhoto ? "" : "placeholder"}`}>
            {heroPhoto ? (
              <img src={heroPhoto} alt={`${model.brand_name} ${model.name}`} />
            ) : (
              <span className="ph-tag">
                {model.brand_name} {model.name} — fő külső fotó
              </span>
            )}
            <div className="photo-dots">
              <span className="on" />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">01 · Galéria</div>
              <h2>
                Külső, belső, <em>részletek</em>.
              </h2>
            </div>
            {photos.length === 0 && (
              <div className="sub">
                A hivatalos sajtófotók a kereskedői átvételt követően frissülnek.
              </div>
            )}
          </div>
          <ModelGallery photos={photos} />
        </div>
      </section>

      {/* SPECS — unified layout for both single-spec and multi-variant models */}
      <section className="block" style={{ background: "#fbfaf6" }}>
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">02 · Műszaki adatok</div>
              <h2>
                {hasOpts ? (
                  <>Változatok <em>egymás mellett</em>.</>
                ) : (
                  <>A számok <em>egy helyen</em>.</>
                )}
              </h2>
            </div>
            {hasOpts && (
              <div className="sub">
                A modell több hajtáslánc-változatban érhető el — az adatok
                változatonként, egyetlen táblázatban.
              </div>
            )}
          </div>

          {/* Shared specs: dimensions + charging (constant across all variants) */}
          <div className="specs-grid specs-grid--shared">
            {model.length_mm != null && (
              <SpecCell icon={<Ruler size={16} />} k="Hossz" v={fmtNumber(model.length_mm)} unit="mm" />
            )}
            {model.width_mm != null && (
              <SpecCell icon={<Ruler size={16} />} k="Szélesség" v={fmtNumber(model.width_mm)} unit="mm" />
            )}
            {model.height_mm != null && (
              <SpecCell icon={<Ruler size={16} />} k="Magasság" v={fmtNumber(model.height_mm)} unit="mm" />
            )}
            {model.wheelbase_mm != null && (
              <SpecCell icon={<Ruler size={16} />} k="Tengelytáv" v={fmtNumber(model.wheelbase_mm)} unit="mm" />
            )}
            {model.acceleration_s != null && (
              <SpecCell icon={<Zap size={16} />} k="0–100 km/h" v={model.acceleration_s} unit="s" />
            )}
            {(isEV || isPHEV) && model.charging_ac_kw != null && (
              <SpecCell icon={<PlugZap size={16} />} k="AC töltés max" v={model.charging_ac_kw} unit="kW" />
            )}
            {isEV && model.charging_dc_kw != null && (
              <SpecCell icon={<BatteryCharging size={16} />} k="DC töltés max" v={model.charging_dc_kw} unit="kW" />
            )}
          </div>

          {/* Variant table — shows per-variant specs (range, power, battery, trunk, seats, consumption).
              effectiveOpts is always populated: either real engine_options rows, or a synthetic
              single "Alap" row built from the model-level spec fields. */}
          {effectiveOpts.length > 0 && (
            <VariantsTable options={effectiveOpts} />
          )}
        </div>
      </section>

      {/* TRIMS */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">03 · Felszereltségi szintek</div>
              <h2>
                Mit kapsz <em>melyik szinten</em>?
              </h2>
            </div>
            <div className="sub">
              A pontos felszereltségi listák importőrönként és időszakonként
              eltérhetnek — a hivatalos kereskedő a végleges forrás.
            </div>
          </div>
          <div className="trim-grid">
            {trims.map((t) => (
              <article
                key={t.id}
                className={`trim ${t.is_featured ? "featured" : ""}`}
              >
                <span className="lbl">{t.level_label ?? t.name}</span>
                <h4>{t.name}</h4>
                <div className="price">
                  <span className="v">{fmtPrice(t.price_m_ft)}</span>
                  <small>
                    {t.is_featured ? "becsült" : t.slug === "comfort" ? "listaártól" : "maximumig"}
                  </small>
                </div>
                <ul>
                  {t.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WARRANTY */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">04 · Garancia</div>
              <h2>
                Mire <em>vállalnak</em> garanciát?
              </h2>
            </div>
            <div className="sub">
              A kínai márkák jellemzően kiterjedt garanciát kínálnak — pontos
              részletek a hivatalos importőrnél.
            </div>
          </div>
          <div className="warranty-grid">
            <Warranty
              icon={<ShieldCheck size={18} />}
              v={`${model.warranty_years ?? 7} év / ${(model.warranty_km ?? 150000).toLocaleString("hu-HU")} km`}
              k="Általános gyári garancia"
            />
            <Warranty
              icon={
                isEV || isPHEV ? <BatteryCharging size={18} /> : <Wrench size={18} />
              }
              v={
                isEV || isPHEV
                  ? `${model.battery_warranty_years ?? 8} év / ${(model.battery_warranty_km ?? 160000).toLocaleString("hu-HU")} km`
                  : "5 év"
              }
              k={isEV || isPHEV ? "Hajtás-akkumulátor" : "Festés / karosszéria"}
            />
            <Warranty
              icon={<LifeBuoy size={18} />}
              v="12 év"
              k="Átrozsdásodás elleni garancia"
            />
          </div>
        </div>
      </section>

      {/* SOURCES — 06 */}
      <section className="block" style={{ background: "#fbfaf6" }}>
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">05 · Importőr &amp; háttér</div>
              <h2>
                Importőr és <em>márkaadatok</em>.
              </h2>
            </div>
          </div>

          {/* Info cards: importőr + brand history */}
          <div className="sources">
            <div className="source-card">
              <span className="lbl">Importőr</span>
              <h4>{brand.importer_name ?? `${brand.name} Magyarország`}</h4>
              <div className="meta">
                <div className="row">
                  <span className="k">Cím</span>
                  <span className="v">{brand.importer_addr ?? "—"}</span>
                </div>
                <div className="row">
                  <span className="k">Hivatalos oldal</span>
                  <span className="v">
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
                  </span>
                </div>
                <div className="row">
                  <span className="k">Hálózat</span>
                  <span className="v">{brand.dealers_text ?? "—"}</span>
                </div>
              </div>
            </div>
            <div className="source-card">
              <span className="lbl">Márkaháttér</span>
              <h4>{brand.name}</h4>
              <div className="meta">
                <div className="row">
                  <span className="k">Alapítás</span>
                  <span className="v">{brand.founded ?? "—"}</span>
                </div>
                <div className="row">
                  <span className="k">Központ</span>
                  <span className="v">{brand.hq ?? "—"}</span>
                </div>
                <div className="row">
                  <span className="k">Anyavállalat</span>
                  <span className="v">{brand.parent_company ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation CTA buttons */}
          <div className="sources-cta">
            <Link href={`/markak/${brand.slug}`} className="src-action-btn primary">
              <ExternalLink size={15} />
              {brand.name} márkaoldal
              <ArrowRight size={15} />
            </Link>
            <Link
              href={`/kinalat?category=${encodeURIComponent(model.category)}&drive=${encodeURIComponent(model.drive)}`}
              className="src-action-btn"
            >
              <Grid2x2 size={15} />
              Hasonló modellek böngészése
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* DEALERS — 07 */}
      <DealerSection dealers={dealers} brandName={model.brand_name} />

      {/* SIMILAR */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">07 · Hasonló modellek</div>
              <h2>
                Még <em>érdekelhet</em>.
              </h2>
            </div>
            <div className="sub">
              Hasonló kategória vagy hajtásmód — a kínálatból szűrve.
            </div>
          </div>
          {similar.length === 0 ? (
            <div style={{ color: "var(--ink-mute)", fontSize: 14 }}>
              Nincs egyértelmű hasonló modell ebben a kategóriában.
            </div>
          ) : (
            <div className="similar-grid">
              {similar.map((s) => {
                const sTone = s.brand_tone ?? "#666";
                const sPhoto = photoUrl(s.primary_photo_path);
                return (
                  <Link
                    key={s.id}
                    href={`/modellek/${s.brand_slug}/${s.slug}`}
                    className="sim-card"
                  >
                    <div className="photo">
                      {sPhoto ? (
                        <img src={sPhoto} alt={s.name} />
                      ) : (
                        <span>
                          {s.brand_name} {s.name}
                        </span>
                      )}
                    </div>
                    <div className="body">
                      <div className="brand" style={{ color: sTone }}>
                        {s.brand_name}
                      </div>
                      <div className="name">{s.name}</div>
                      <div className="price">
                        {fmtPrice(s.price_min_m_ft)} —{" "}
                        {fmtPrice(s.price_max_m_ft)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="cta-band">
            <div className="text">
              <h3>
                Mérd össze <em>több modellel</em>.
              </h3>
              <p>
                Az Összehasonlítás oldalon egymás mellé teheted ezt a modellt 3
                másikkal — méret, ár, hatótáv, csomagtartó, teljesítmény egy
                táblázatban.
              </p>
            </div>
            <div className="actions">
              <Link
                className="cta-btn primary"
                href={`/osszehasonlitas?models=${encodeURIComponent(model.brand_name)}|${encodeURIComponent(model.name)}`}
              >
                <GitCompareArrows size={16} />
                Összehasonlításhoz
              </Link>
              <Link className="cta-btn" href="/kinalat">
                <Grid2x2 size={16} />
                Vissza a kínálathoz
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SpecCell({
  icon,
  k,
  v,
  unit,
  muted,
  note,
}: {
  icon: React.ReactNode;
  k: string;
  v: string | number;
  unit?: string;
  muted?: boolean;
  note?: string;
}) {
  return (
    <div className="spec-cell">
      <div className="icon">{icon}</div>
      <span className="k">{k}</span>
      <span className={`v ${muted ? "muted" : ""}`}>
        {v}
        {unit ? <small> {unit}</small> : null}
      </span>
      {note ? <div className="note">{note}</div> : null}
    </div>
  );
}

function Warranty({
  icon,
  v,
  k,
}: {
  icon: React.ReactNode;
  v: string;
  k: string;
}) {
  return (
    <div className="warranty">
      <div className="icon">{icon}</div>
      <div>
        <div className="v">{v}</div>
        <div className="k">{k}</div>
      </div>
    </div>
  );
}
