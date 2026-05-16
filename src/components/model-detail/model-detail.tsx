import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  Briefcase,
  Fuel,
  Gauge,
  GitCompareArrows,
  Grid2x2,
  Layers,
  Leaf,
  LifeBuoy,
  PlugZap,
  Route,
  Ruler,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import type { Brand, Dealer, ModelPhoto, ModelRow, ModelTrim } from "@/lib/types";
import { ModelGallery } from "./model-gallery";
import { DealerSection } from "./dealer-section";
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

      {/* QUICK BAND */}
      <section className="quickband">
        <div className="container">
          <div className="quickband-inner">
            <div className="qb">
              <div className="k">Kategória</div>
              <div
                className="v"
                style={{
                  fontSize: 15,
                  fontFamily: "var(--font-inter), sans-serif",
                }}
              >
                {catLabel(model.category, model.segment)}
              </div>
            </div>
            <div className="qb">
              <div className="k">Hajtás</div>
              <div
                className="v"
                style={{
                  fontSize: 15,
                  fontFamily: "var(--font-inter), sans-serif",
                }}
              >
                {model.drive}
              </div>
            </div>
            <div className="qb">
              <div className="k">Hossz</div>
              <div className="v">
                {model.length_mm ? fmtNumber(model.length_mm) : "—"}
                <small>{model.length_mm ? "mm" : ""}</small>
              </div>
            </div>
            <div className="qb">
              <div className="k">Csomagtartó</div>
              <div className="v">
                {model.trunk_l ?? "—"}
                <small>{model.trunk_l != null ? "l" : ""}</small>
              </div>
            </div>
            <div className="qb">
              <div className="k">Teljesítmény</div>
              <div className="v">
                {model.power_hp ?? "—"}
                <small>{model.power_hp ? "LE" : ""}</small>
              </div>
            </div>
            <div className="qb">
              <div className="k">{hasBattery ? "Hatótáv" : "Ülések"}</div>
              <div className="v">
                {hasBattery ? (model.range_km ?? "—") : (model.seats ?? "—")}
                <small>{hasBattery ? "km" : "fő"}</small>
              </div>
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

      {/* SPECS */}
      <section className="block" style={{ background: "#fbfaf6" }}>
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">02 · Méretek és műszaki adatok</div>
              <h2>
                A számok <em>egy helyen</em>.
              </h2>
            </div>
          </div>
          <div className="specs-grid">
            <SpecCell
              icon={<Ruler size={16} />}
              k="Hossz"
              v={model.length_mm ? fmtNumber(model.length_mm) : "—"}
              unit="mm"
            />
            <SpecCell
              icon={<Briefcase size={16} />}
              k="Csomagtartó"
              v={model.trunk_l ?? "—"}
              unit="l"
              note="Lehajtott üléssor mellett a kapacitás jelentősen bővíthető."
            />
            <SpecCell
              icon={<Users size={16} />}
              k="Ülőhelyek"
              v={model.seats ?? "—"}
              unit="fő"
            />
            <SpecCell
              icon={<Gauge size={16} />}
              k="Teljesítmény"
              v={model.power_hp ?? "—"}
              unit="LE"
            />
            <SpecCell
              icon={<BatteryCharging size={16} />}
              k="Akkumulátor"
              v={hasBattery ? (model.battery_kwh ?? "—") : "n/a"}
              unit="kWh"
              muted={!hasBattery}
              note={!hasBattery ? "Belsőégésű hajtás — nincs hajtásakkumulátor." : undefined}
            />
            <SpecCell
              icon={<Route size={16} />}
              k={isEV ? "Hatótáv (WLTP)" : "EV hatótáv (PHEV/becslés)"}
              v={model.range_km ?? "n/a"}
              unit={model.range_km ? "km" : ""}
              muted={!model.range_km}
              note={
                model.range_km
                  ? "Valós érték használati módtól, hőmérséklettől, sebességtől függően eltérhet."
                  : undefined
              }
            />
          </div>
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

      {/* ENERGY */}
      <section className="block" style={{ background: "#fbfaf6" }}>
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">04 · Energia &amp; töltés</div>
              <h2>
                {isEV
                  ? "Töltési és "
                  : isPHEV
                    ? "Töltés és "
                    : isHEV
                      ? "Üzemanyag- és "
                      : "Üzemanyag és "}
                <em>{isEV ? "fogyasztási" : isPHEV ? "kombinált" : isHEV ? "hibrid" : "fogyasztás"}</em>{" "}
                {isEV || isPHEV ? "adatok" : "jellemzők"}.
              </h2>
            </div>
          </div>
          <EnergyBlock model={model} />
        </div>
      </section>

      {/* WARRANTY */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">05 · Garancia</div>
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

      {/* DEALERS */}
      <DealerSection dealers={dealers} brandName={model.brand_name} />

      {/* SOURCES */}
      <section className="block" style={{ background: "#fbfaf6" }}>
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">07 · Hivatalos források</div>
              <h2>
                Importőr és <em>kereskedői</em> linkek.
              </h2>
            </div>
          </div>
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
            <Link
              href={`/markak/${brand.slug}`}
              className="source-card link"
            >
              <span className="lbl">Részletek</span>
              <h4>Márkaoldal a kínaiautó.com-on</h4>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--ink-soft)",
                  lineHeight: 1.5,
                }}
              >
                A teljes {brand.name} modellpaletta, importőri adatok és háttér
                egy oldalon.
              </div>
            </Link>
            <Link href="/kinalat" className="source-card link">
              <span className="lbl">Kínálat</span>
              <h4>Hasonló modellek a teljes kínálatból</h4>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--ink-soft)",
                  lineHeight: 1.5,
                }}
              >
                {catLabel(model.category, model.segment)} kategória és {model.drive.toLowerCase()} hajtás
                összes modellje, ár szerint szűrve.
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* SIMILAR */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">08 · Hasonló modellek</div>
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

function EnergyBlock({ model }: { model: ModelRow }) {
  const isEV = model.drive === "Elektromos";
  const isPHEV = model.drive === "Plug-in hibrid";
  const isHEV = model.drive === "Önttöltő hibrid";

  if (isEV) {
    const acTime = model.battery_kwh
      ? Math.round((model.battery_kwh / 11) * 10) / 10
      : "—";
    const dcTime = model.battery_kwh
      ? Math.round(((model.battery_kwh * 0.6) / 90) * 60)
      : "—";
    const cons =
      model.battery_kwh && model.range_km
        ? ((model.battery_kwh / model.range_km) * 100).toFixed(1)
        : "—";
    return (
      <div className="energy-grid">
        <div className="energy-card">
          <h4>
            AC töltés{" "}
            <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
              otthoni / fali
            </span>
          </h4>
          <div className="row">
            <span className="k">Maximum AC teljesítmény</span>
            <span className="v big">11 kW</span>
          </div>
          <div className="row">
            <span className="k">Kapcsolat</span>
            <span className="v">Type 2</span>
          </div>
          <div className="row">
            <span className="k">10 → 100 % becsült idő</span>
            <span className="v">~ {acTime} óra</span>
          </div>
        </div>
        <div className="energy-card">
          <h4>
            DC gyorstöltés{" "}
            <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>nyilvános</span>
          </h4>
          <div className="row">
            <span className="k">Csúcs DC teljesítmény</span>
            <span className="v big">90 kW</span>
          </div>
          <div className="row">
            <span className="k">Kapcsolat</span>
            <span className="v">CCS</span>
          </div>
          <div className="row">
            <span className="k">10 → 80 % becsült idő</span>
            <span className="v">~ {dcTime} perc</span>
          </div>
        </div>
        <div className="energy-card" style={{ gridColumn: "1 / -1" }}>
          <h4>
            Fogyasztás{" "}
            <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
              WLTP-becslés
            </span>
          </h4>
          <div className="row">
            <span className="k">Vegyes ciklus</span>
            <span className="v big">{cons} kWh / 100 km</span>
          </div>
          <div className="row">
            <span className="k">Akkumulátor</span>
            <span className="v">{model.battery_kwh ?? "—"} kWh</span>
          </div>
          <div className="row">
            <span className="k">Hatótáv (WLTP)</span>
            <span className="v">{model.range_km ?? "—"} km</span>
          </div>
        </div>
      </div>
    );
  }

  if (isPHEV) {
    return (
      <div className="energy-grid">
        <div className="energy-card">
          <h4>AC töltés</h4>
          <div className="row">
            <span className="k">AC teljesítmény</span>
            <span className="v big">3,7–6,6 kW</span>
          </div>
          <div className="row">
            <span className="k">EV hatótáv (becslés)</span>
            <span className="v">{model.range_km ?? "—"} km</span>
          </div>
          <div className="row">
            <span className="k">Kapcsolat</span>
            <span className="v">Type 2</span>
          </div>
        </div>
        <div className="energy-card">
          <h4>Kombinált fogyasztás</h4>
          <div className="row">
            <span className="k">Hibrid mód</span>
            <span className="v big">~ 5,5 l / 100 km</span>
          </div>
          <div className="row">
            <span className="k">EV módban</span>
            <span className="v">~ 16 kWh / 100 km</span>
          </div>
          <div className="row">
            <span className="k">Akkumulátor</span>
            <span className="v">{model.battery_kwh ?? "—"} kWh</span>
          </div>
        </div>
      </div>
    );
  }

  if (isHEV) {
    return (
      <div className="energy-grid">
        <div className="energy-card">
          <h4>Fogyasztás (WLTP)</h4>
          <div className="row">
            <span className="k">Vegyes ciklus</span>
            <span className="v big">~ 5,5 l / 100 km</span>
          </div>
          <div className="row">
            <span className="k">Városban</span>
            <span className="v">~ 5,0 l / 100 km</span>
          </div>
          <div className="row">
            <span className="k">Üzemanyagtartály</span>
            <span className="v">~ 50 l</span>
          </div>
        </div>
        <div className="energy-card">
          <h4>Hajtáslánc</h4>
          <div className="row">
            <span className="k">Üzemanyag</span>
            <span className="v">Benzin (95)</span>
          </div>
          <div className="row">
            <span className="k">Külső töltés</span>
            <span className="v">nincs</span>
          </div>
          <div className="row">
            <span className="k">Rendszerteljesítmény</span>
            <span className="v">{model.power_hp ?? "—"} LE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="energy-grid">
      <div className="energy-card">
        <h4>Fogyasztás (WLTP)</h4>
        <div className="row">
          <span className="k">Vegyes ciklus</span>
          <span className="v big">~ 7,0 l / 100 km</span>
        </div>
        <div className="row">
          <span className="k">Üzemanyag</span>
          <span className="v">
            {model.drive === "Dízel" ? "Dízel" : "Benzin (95)"}
          </span>
        </div>
        <div className="row">
          <span className="k">Üzemanyagtartály</span>
          <span className="v">~ 55 l</span>
        </div>
      </div>
      <div className="energy-card">
        <h4>Hajtáslánc</h4>
        <div className="row">
          <span className="k">Motor</span>
          <span className="v">{model.power_hp ?? "—"} LE</span>
        </div>
        <div className="row">
          <span className="k">Külső töltés</span>
          <span className="v">nincs</span>
        </div>
        <div className="row">
          <span className="k">Hatótáv (becslés)</span>
          <span className="v">~ 700–800 km</span>
        </div>
      </div>
    </div>
  );
}
