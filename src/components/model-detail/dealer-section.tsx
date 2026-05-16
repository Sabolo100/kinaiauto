"use client";

import { useState } from "react";
import { List, MapPin } from "lucide-react";
import type { Dealer } from "@/lib/types";
import { DealerMap } from "@/components/brands/dealer-map";

export function DealerSection({ dealers, brandName }: { dealers: Dealer[]; brandName: string }) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <section className="block" id="kereskedok">
      <div className="container">
        <div className="block-head">
          <div>
            <div className="step">06 · Kereskedők</div>
            <h2>
              <em>{brandName}</em> kereskedők{" "}
              <span style={{ color: "var(--ink-mute)", fontSize: ".7em" }}>
                {dealers.length} helyszín
              </span>
            </h2>
          </div>
          {dealers.length > 0 && (
            <div className="zoom-toggle">
              <button
                type="button"
                onClick={() => setView("list")}
                className={view === "list" ? "on" : ""}
              >
                <List size={14} /> Lista
              </button>
              <button
                type="button"
                onClick={() => setView("map")}
                className={view === "map" ? "on" : ""}
              >
                <MapPin size={14} /> Térkép
              </button>
            </div>
          )}
        </div>

        {dealers.length === 0 ? (
          <p style={{ color: "var(--ink-mute)", fontSize: 15 }}>
            Ehhez a márkához még nincs kereskedő rögzítve.
          </p>
        ) : view === "map" ? (
          <DealerMap dealers={dealers} />
        ) : (
          <div className="dealer-grid">
            {dealers.map((d) => (
              <div key={d.id} className="dealer-card">
                <div className="dealer-name">{d.name}</div>
                <address className="dealer-addr">
                  {d.zip_code ? <span>{d.zip_code} </span> : null}
                  <span>{d.city}</span>
                  {d.street ? (
                    <>
                      <br />
                      <span>{d.street}</span>
                    </>
                  ) : null}
                </address>
                <div className="dealer-contacts-list">
                  {d.phone ? (
                    <a href={`tel:${d.phone}`} className="dealer-contact-row">
                      <span className="dc-icon">☎</span>
                      {d.phone}
                    </a>
                  ) : null}
                  {d.email ? (
                    <a href={`mailto:${d.email}`} className="dealer-contact-row">
                      <span className="dc-icon">✉</span>
                      {d.email}
                    </a>
                  ) : null}
                  {d.website ? (
                    <a
                      href={d.website.startsWith("http") ? d.website : `https://${d.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dealer-contact-row"
                    >
                      <span className="dc-icon">🌐</span>
                      Honlap
                    </a>
                  ) : null}
                </div>
                {d.contacts && d.contacts.length > 0 ? (
                  <div className="dealer-persons">
                    {d.contacts.map((c) => (
                      <div key={c.id} className="dealer-person">
                        <span className="dp-name">{c.name}</span>
                        {c.position ? (
                          <span className="dp-pos">{c.position}</span>
                        ) : null}
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} className="dp-contact">
                            ☎ {c.phone}
                          </a>
                        ) : null}
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="dp-contact">
                            ✉ {c.email}
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                {d.lat && d.lng ? (
                  <a
                    className="dealer-map-link"
                    href={`https://www.google.com/maps?q=${d.lat},${d.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📍 Térkép
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
