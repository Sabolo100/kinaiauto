"use client";

import Link from "next/link";
import { ArrowUpRight, Check, GitCompareArrows, Plus, ShoppingBag } from "lucide-react";
import type { ModelPhoto, ModelRow } from "@/lib/types";
import { fmtPrice, fmtNumber, catLabel } from "@/lib/format";
import { photoUrl } from "@/lib/data";
import { useQuoteCart } from "./quote-context";

/** Returns #fff or #1a1a1a depending on which has better contrast against `hex`. */
function contrastColor(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#1a1a1a" : "#ffffff";
}

export type CardZoom = 1 | 2 | 3;

export function ModelCard({
  model,
  zoom = 2,
  isSelected,
  onToggleCompare,
  photos,
  hideTags,
}: {
  model: ModelRow;
  zoom?: CardZoom;
  isSelected?: boolean;
  onToggleCompare?: (model: ModelRow) => void;
  photos?: ModelPhoto[];
  hideTags?: { category?: boolean; drive?: boolean };
}) {
  const tone = model.brand_tone ?? "#374151";
  const photo = photoUrl(model.primary_photo_path);
  const hoverPhoto = photos?.find((p) => !p.is_primary && p.kind !== "hero") ?? null;
  const hoverUrl = hoverPhoto ? photoUrl(hoverPhoto.storage_path) : null;

  const quoteCart = useQuoteCart();
  const isInQuote = quoteCart.has(model.id);

  function handleQuoteToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const item = {
      modelId: model.id,
      brandId: model.brand_id,
      modelName: model.name,
      brandName: model.brand_name,
      modelSlug: model.slug,
      brandSlug: model.brand_slug,
    };
    if (!isInQuote) quoteCart.showToast("Ajánlatkérésekhez hozzáadva");
    quoteCart.toggle(item);
  }

  return (
    <article className={`card zoom-${zoom}`}>
      {/* Stretch-link: makes the whole card a clickable area; interactive children sit above it via z-index */}
      <Link
        href={`/modellek/${model.brand_slug}/${model.slug}`}
        className="card-link"
        aria-label={`${model.brand_name} ${model.name} részletei`}
        tabIndex={-1}
      />
      <div className={`photo ${photo ? "" : "placeholder"}`}>
        {photo ? (
          <img
            src={photo}
            alt={`${model.brand_name} ${model.name}`}
            loading="lazy"
          />
        ) : (
          <span>
            {model.brand_name} {model.name} — fotó
          </span>
        )}
        {hoverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hoverUrl}
            alt=""
            className="photo-secondary"
            aria-hidden
            loading="lazy"
          />
        )}
        {model.is_deal ? (
          <span className="badge deal">Akció</span>
        ) : (
          <span className="badge" style={{ background: tone, color: contrastColor(tone) }}>
            {model.brand_name}
          </span>
        )}
        {onToggleCompare ? (
          <button
            type="button"
            className={`compare-btn ${isSelected ? "on" : ""}`}
            aria-label={
              isSelected
                ? "Eltávolítás az összehasonlításból"
                : "Hozzáadás az összehasonlításhoz"
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCompare(model);
            }}
          >
            {isSelected ? <Check size={14} /> : <Plus size={14} />}
          </button>
        ) : null}
        <button
          type="button"
          className={`quote-photo-btn ${isInQuote ? "on" : ""}`}
          aria-label={
            isInQuote
              ? "Eltávolítás az ajánlatkérési listából"
              : "Hozzáadás az ajánlatkérési listához"
          }
          aria-pressed={isInQuote}
          onClick={handleQuoteToggle}
        >
          {isInQuote ? <Check size={13} /> : <ShoppingBag size={13} />}
        </button>
        {zoom !== 1 ? (
          <div className="photo-dots" aria-hidden>
            <span className="on" />
            <span />
          </div>
        ) : null}
      </div>
      <div className="body">
        <div className="brand">
          {model.brand_name}
          <ArrowUpRight size={13} className="card-goto-icon" aria-hidden />
        </div>
        <Link
          href={`/modellek/${model.brand_slug}/${model.slug}`}
          className="model"
        >
          {model.name}
        </Link>
        {(!hideTags?.category || !hideTags?.drive) && (
          <div className="meta">
            {!hideTags?.category && <span className="tag">{catLabel(model.category, model.segment)}</span>}
            {!hideTags?.drive && <span className="tag">{model.drive}</span>}
          </div>
        )}
        <div className="price">
          <span className="from">Listaár</span>
          <span className="val">{fmtPrice(model.price_min_m_ft)}</span>
          <span className="max">— {fmtPrice(model.price_max_m_ft)}</span>
        </div>
        <div className="specs">
          <div className="spec">
            <div className="k">Hossz</div>
            <div className="v">
              {model.length_mm ? `${fmtNumber(model.length_mm)} mm` : "—"}
            </div>
          </div>
          <div className="spec">
            <div className="k">Csomagtartó</div>
            <div className="v">
              {model.trunk_l != null ? `${fmtNumber(model.trunk_l)} l` : "—"}
            </div>
          </div>
          <div className="spec">
            <div className="k">Teljesítmény</div>
            <div className="v">
              {model.power_hp ? `${model.power_hp} LE` : "—"}
            </div>
          </div>
          <div className="spec">
            <div className="k">
              {model.battery_kwh ? "Hatótáv" : "Ülések"}
            </div>
            <div className="v">
              {model.battery_kwh
                ? model.range_km
                  ? `${model.range_km} km`
                  : "—"
                : (model.seats ?? "—")}
            </div>
          </div>
        </div>
        <div className="actions" style={{ position: "relative", zIndex: 1 }}>
          <Link
            href={`/osszehasonlitas?models=${encodeURIComponent(
              model.brand_name,
            )}|${encodeURIComponent(model.name)}`}
            className="btn"
          >
            <GitCompareArrows size={14} />
            Összevet
          </Link>
          <button
            type="button"
            className={`btn quote-btn ${isInQuote ? "on" : ""}`}
            aria-pressed={isInQuote}
            aria-label={
              isInQuote
                ? "Eltávolítás az ajánlatkérési listából"
                : "Hozzáadás az ajánlatkérési listához"
            }
            onClick={handleQuoteToggle}
          >
            {isInQuote ? <Check size={14} /> : <ShoppingBag size={14} />}
            {isInQuote ? "Kosárban" : "Ajánlat"}
          </button>
          <Link
            href={`/modellek/${model.brand_slug}/${model.slug}`}
            className="btn primary"
          >
            Részletek <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
