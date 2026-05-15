"use client";

import { useEffect, useState } from "react";
import { Check, List, MapPin, X } from "lucide-react";
import type { Brand, Dealer } from "@/lib/types";
import { brandLogoUrl } from "@/lib/data";
import { SelectableDealerMap } from "./selectable-dealer-map";

type Props = {
  brand: Brand;
  dealers: Dealer[];
  selectedIds: string[];
  maxSelectable: number;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
};

export function DealerPicker({
  brand,
  dealers,
  selectedIds: initialSelected,
  maxSelectable,
  onClose,
  onConfirm,
}: Props) {
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<string[]>(initialSelected);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxSelectable) return prev; // ignore — at max
      return [...prev, id];
    });
  }

  const atMax = selected.length >= maxSelectable;
  const logo = brandLogoUrl(brand.logo_path);
  const dealersWithCoords = dealers.filter((d) => d.lat != null && d.lng != null);

  return (
    <div className="quote-modal-backdrop" onClick={onClose}>
      <div
        className="quote-modal dealer-picker"
        role="dialog"
        aria-modal="true"
        aria-label={`Kereskedők kiválasztása · ${brand.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <header className="quote-modal-head">
          <div className="dp-brand">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" aria-hidden className="dp-logo" />
            ) : null}
            <div>
              <div className="dp-eyebrow">Kereskedők · {brand.name}</div>
              <div className="dp-sub">
                {selected.length}/{maxSelectable} kiválasztva · összesen{" "}
                {dealers.length} kereskedő
              </div>
            </div>
          </div>
          <div className="dp-view-toggle">
            <button
              type="button"
              className={view === "list" ? "on" : ""}
              onClick={() => setView("list")}
            >
              <List size={14} /> Lista
            </button>
            <button
              type="button"
              className={view === "map" ? "on" : ""}
              onClick={() => setView("map")}
              disabled={dealersWithCoords.length === 0}
              title={
                dealersWithCoords.length === 0
                  ? "Egyetlen kereskedőnek sincs GPS koordinátája"
                  : undefined
              }
            >
              <MapPin size={14} /> Térkép
            </button>
          </div>
          <button
            type="button"
            className="quote-modal-close"
            onClick={onClose}
            aria-label="Bezárás"
          >
            <X size={18} />
          </button>
        </header>

        {atMax ? (
          <div className="dp-max-note">
            Maximum {maxSelectable} kereskedő választható márkánként. Vegyél le
            egyet, mielőtt másikat választanál.
          </div>
        ) : null}

        {/* Body */}
        <div className="quote-modal-body">
          {dealers.length === 0 ? (
            <div className="dp-empty">
              Ehhez a márkához nincs rögzített kereskedő.
            </div>
          ) : view === "list" ? (
            <div className="dp-list">
              {dealers.map((d) => {
                const isOn = selected.includes(d.id);
                const disabled = !isOn && atMax;
                return (
                  <label
                    key={d.id}
                    className={`dp-row ${isOn ? "on" : ""} ${disabled ? "disabled" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      disabled={disabled}
                      onChange={() => toggle(d.id)}
                    />
                    <span className="dp-checkbox" aria-hidden>
                      {isOn ? <Check size={13} /> : null}
                    </span>
                    <div className="dp-row-main">
                      <div className="dp-row-name">{d.name}</div>
                      <div className="dp-row-addr">
                        {[d.zip_code, d.city].filter(Boolean).join(" ")}
                        {d.street ? `, ${d.street}` : ""}
                      </div>
                      {d.email || d.phone ? (
                        <div className="dp-row-meta">
                          {d.email ? <span>{d.email}</span> : null}
                          {d.phone ? <span>{d.phone}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <SelectableDealerMap
              dealers={dealersWithCoords}
              selectedIds={selected}
              onToggle={toggle}
              atMax={atMax}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="quote-modal-foot">
          <button type="button" className="dp-btn ghost" onClick={onClose}>
            Mégse
          </button>
          <button
            type="button"
            className="dp-btn primary"
            onClick={() => onConfirm(selected)}
          >
            Mentés{selected.length > 0 ? ` (${selected.length})` : ""}
          </button>
        </footer>
      </div>
    </div>
  );
}
