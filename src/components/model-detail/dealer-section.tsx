"use client";

import { useCallback, useRef, useState } from "react";
import type { Dealer } from "@/lib/types";
import { DealerMap } from "@/components/brands/dealer-map";

function DealerListItem({
  d,
  active,
  onClick,
  setRef,
}: {
  d: Dealer;
  active: boolean;
  onClick: () => void;
  setRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={setRef}
      className={`dsp-item${active ? " active" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="dsp-name">{d.name}</div>
      <address className="dsp-addr">
        {d.zip_code ? `${d.zip_code} ` : ""}
        {d.city}
        {d.street ? `, ${d.street}` : ""}
      </address>
      <div className="dsp-contacts">
        {d.phone ? (
          <a
            href={`tel:${d.phone}`}
            className="dsp-contact"
            onClick={(e) => e.stopPropagation()}
          >
            ☎ {d.phone}
          </a>
        ) : null}
        {d.email ? (
          <a
            href={`mailto:${d.email}`}
            className="dsp-contact"
            onClick={(e) => e.stopPropagation()}
          >
            ✉ {d.email}
          </a>
        ) : null}
        {d.website ? (
          <a
            href={d.website.startsWith("http") ? d.website : `https://${d.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="dsp-contact"
            onClick={(e) => e.stopPropagation()}
          >
            🌐 Honlap
          </a>
        ) : null}
        {d.lat && d.lng ? (
          <a
            href={`https://www.google.com/maps?q=${d.lat},${d.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="dsp-contact"
            onClick={(e) => e.stopPropagation()}
          >
            📍 Térkép
          </a>
        ) : null}
      </div>
      {d.contacts && d.contacts.length > 0 ? (
        <div className="dsp-persons">
          {d.contacts.map((c) => (
            <div key={c.id} className="dsp-person">
              <span className="dsp-pname">{c.name}</span>
              {c.position ? <span className="dsp-ppos">{c.position}</span> : null}
              {c.phone ? (
                <a
                  href={`tel:${c.phone}`}
                  className="dsp-contact"
                  onClick={(e) => e.stopPropagation()}
                >
                  ☎ {c.phone}
                </a>
              ) : null}
              {c.email ? (
                <a
                  href={`mailto:${c.email}`}
                  className="dsp-contact"
                  onClick={(e) => e.stopPropagation()}
                >
                  ✉ {c.email}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DealerSection({
  dealers,
  brandName,
}: {
  dealers: Dealer[];
  brandName: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Refs for scroll-into-view within the list panel
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  function scrollToDealer(id: string) {
    const el = itemRefs.current.get(id);
    const list = listRef.current;
    if (!el || !list) return;
    const elTop = el.offsetTop;
    const elBottom = elTop + el.offsetHeight;
    const scrollTop = list.scrollTop;
    const clientH = list.clientHeight;
    if (elTop < scrollTop) {
      list.scrollTop = elTop - 8;
    } else if (elBottom > scrollTop + clientH) {
      list.scrollTop = elBottom - clientH + 8;
    }
  }

  // Called when a marker on the map is clicked
  const handleMarkerClick = useCallback((id: string) => {
    setActiveId(id);
    // Small timeout lets the state flush before we measure DOM positions
    setTimeout(() => scrollToDealer(id), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dealers.length === 0) {
    return (
      <section className="block" id="kereskedok">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">07 · Kereskedők</div>
              <h2>
                <em>{brandName}</em> kereskedők
              </h2>
            </div>
          </div>
          <p style={{ color: "var(--ink-mute)", fontSize: 15 }}>
            Ehhez a márkához még nincs kereskedő rögzítve.
          </p>
        </div>
      </section>
    );
  }

  const withCoords = dealers.filter((d) => d.lat != null && d.lng != null);

  return (
    <section className="block" id="kereskedok">
      <div className="container">
        <div className="block-head">
          <div>
            <div className="step">07 · Kereskedők</div>
            <h2>
              <em>{brandName}</em> kereskedők{" "}
              <span style={{ color: "var(--ink-mute)", fontSize: ".7em" }}>
                {dealers.length} helyszín
              </span>
            </h2>
          </div>
        </div>

        <div className="dealer-split">
          {/* Left: scrollable dealer list */}
          <div className="dsp-list" ref={listRef}>
            {dealers.map((d) => (
              <DealerListItem
                key={d.id}
                d={d}
                active={activeId === d.id}
                setRef={(el) => {
                  if (el) itemRefs.current.set(d.id, el);
                  else itemRefs.current.delete(d.id);
                }}
                onClick={() => setActiveId(activeId === d.id ? null : d.id)}
              />
            ))}
          </div>

          {/* Right: always-visible map */}
          <div className="dsp-map">
            {withCoords.length > 0 ? (
              <DealerMap
                dealers={dealers}
                activeId={activeId}
                onMarkerClick={handleMarkerClick}
              />
            ) : (
              <div className="dsp-nomap">
                <span>Nincs GPS koordináta a kereskedőknél.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
