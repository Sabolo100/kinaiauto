"use client";

import Link from "next/link";
import { ArrowRight, Check, GitCompareArrows, Plus } from "lucide-react";
import type { ModelRow } from "@/lib/types";
import { fmtPrice, fmtNumber } from "@/lib/format";
import { photoUrl } from "@/lib/data";

export type CardZoom = 1 | 2 | 3;

export function ModelCard({
  model,
  zoom = 2,
  isSelected,
  onToggleCompare,
}: {
  model: ModelRow;
  zoom?: CardZoom;
  isSelected?: boolean;
  onToggleCompare?: (model: ModelRow) => void;
}) {
  const tone = model.brand_tone ?? "#374151";
  const photo = photoUrl(model.primary_photo_path);

  return (
    <article className={`card zoom-${zoom}`}>
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
        {model.is_deal ? (
          <span className="badge deal">Akció</span>
        ) : (
          <span className="badge" style={{ background: tone }}>
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
        {zoom !== 1 ? (
          <div className="photo-dots" aria-hidden>
            <span className="on" />
            <span />
          </div>
        ) : null}
      </div>
      <div className="body">
        <div className="brand">{model.brand_name}</div>
        <Link
          href={`/modellek/${model.brand_slug}/${model.slug}`}
          className="model"
        >
          {model.name}
        </Link>
        <div className="meta">
          <span className="tag">{model.category}</span>
          <span className="tag">{model.drive}</span>
        </div>
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
        <div className="actions">
          <Link
            href={`/osszehasonlitas?models=${encodeURIComponent(
              model.brand_name,
            )}|${encodeURIComponent(model.name)}`}
            className="btn"
          >
            <GitCompareArrows size={14} />
            Összevet
          </Link>
          <Link
            href={`/modellek/${model.brand_slug}/${model.slug}`}
            className="btn primary"
          >
            Részletek <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
