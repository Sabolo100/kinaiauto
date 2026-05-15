"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronDown, X } from "lucide-react";
import type { QuoteItem } from "@/components/quote-context";

type Payload = {
  items: QuoteItem[];
  /** brand_id → dealer_id[] */
  dealerIdsByBrand: Record<string, string[]>;
};

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  payload: Payload;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; sentCount: number; totalDispatches: number; errors: string[] }
  | { kind: "error"; message: string };

export function ContactModal({ onClose, onSuccess, payload }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [gdprOpen, setGdprOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && status.kind !== "submitting") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, status.kind]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const phoneOk = phone.trim().replace(/[^\d+]/g, "").length >= 6;
  const nameOk = name.trim().length >= 2;
  const canSubmit =
    nameOk && emailOk && phoneOk && gdpr && status.kind !== "submitting";

  async function submit() {
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim(),
          gdpr_accepted: true,
          items: payload.items,
          dealer_ids_by_brand: payload.dealerIdsByBrand,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: String(json.error ?? "Ismeretlen hiba a küldés közben."),
        });
        return;
      }
      setStatus({
        kind: "success",
        sentCount: Number(json.sent_count ?? 0),
        totalDispatches: Number(json.total_dispatches ?? 0),
        errors: Array.isArray(json.errors) ? (json.errors as string[]) : [],
      });
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
    }
  }

  // ── Success state ──
  if (status.kind === "success") {
    return (
      <div className="quote-modal-backdrop" onClick={onClose}>
        <div
          className="quote-modal contact-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="quote-modal-head">
            <div className="cm-title-wrap">
              <div className={`cm-eyebrow ${status.sentCount > 0 ? "ok" : "warn"}`}>
                {status.sentCount > 0 ? "Ajánlatkérés elküldve" : "Küldési probléma"}
              </div>
              <h2 className="cm-title">
                {status.sentCount > 0 ? "Köszönjük!" : "Elmentve, de nem ment ki e-mail"}
              </h2>
            </div>
            <button
              type="button"
              className="quote-modal-close"
              onClick={() => {
                onSuccess();
              }}
              aria-label="Bezárás"
            >
              <X size={18} />
            </button>
          </header>
          <div className="quote-modal-body">
            {status.sentCount > 0 ? (
              <div className="cm-success">
                <div className="cm-success-icon">
                  <Check size={28} />
                </div>
                <p>
                  <strong>{status.sentCount}</strong> ajánlatkérés ment ki a
                  kiválasztott kereskedőknek. Egy másolat a megadott e-mail
                  címedre is megérkezett ({email}).
                </p>
                <p>
                  A kereskedők rövidesen felveszik veled a kapcsolatot a megadott
                  elérhetőségeken.
                </p>
              </div>
            ) : (
              <div className="cm-success">
                <p style={{ color: "#b45309", fontWeight: 600, marginBottom: 8 }}>
                  Az ajánlatkérés elmentve, de e-mail nem ment ki ({status.sentCount}/{status.totalDispatches}).
                </p>
                {status.errors.length > 0 && (
                  <ul style={{ fontSize: 13, color: "#6b7280", margin: "8px 0 0", paddingLeft: 18 }}>
                    {status.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 12 }}>
                  Kérjük, ellenőrizd a CMS-ben a kereskedők e-mail címeit,
                  vagy vedd fel a kapcsolatot közvetlenül.
                </p>
              </div>
            )}
          </div>
          <footer className="quote-modal-foot">
            <button
              type="button"
              className="dp-btn primary"
              onClick={onSuccess}
            >
              Rendben
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div
      className="quote-modal-backdrop"
      onClick={status.kind === "submitting" ? undefined : onClose}
    >
      <div
        className="quote-modal contact-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="quote-modal-head">
          <div className="cm-title-wrap">
            <div className="cm-eyebrow">Ajánlatkérés véglegesítése</div>
            <h2 className="cm-title">Add meg az elérhetőségeidet</h2>
          </div>
          <button
            type="button"
            className="quote-modal-close"
            onClick={onClose}
            disabled={status.kind === "submitting"}
            aria-label="Bezárás"
          >
            <X size={18} />
          </button>
        </header>

        <div className="quote-modal-body">
          <p className="cm-intro">
            A kereskedők ezekre az adatokra fognak válaszolni. Mindegyik mező
            kitöltése kötelező.
          </p>

          <div className="cm-fields">
            <label className="cm-field">
              <span className="cm-label">Teljes név</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="pl. Kovács János"
                autoComplete="name"
                required
                disabled={status.kind === "submitting"}
                aria-invalid={name.length > 0 && !nameOk}
              />
            </label>

            <label className="cm-field">
              <span className="cm-label">E-mail cím</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pl. kovacs.janos@example.hu"
                autoComplete="email"
                required
                disabled={status.kind === "submitting"}
                aria-invalid={email.length > 0 && !emailOk}
              />
              {email.length > 0 && !emailOk ? (
                <span className="cm-hint err">Érvénytelen e-mail cím</span>
              ) : null}
            </label>

            <label className="cm-field">
              <span className="cm-label">Telefonszám</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="pl. +36 30 123 4567"
                autoComplete="tel"
                required
                disabled={status.kind === "submitting"}
                aria-invalid={phone.length > 0 && !phoneOk}
              />
            </label>
          </div>

          {/* GDPR */}
          <div className="cm-gdpr">
            <label className="cm-gdpr-row">
              <input
                type="checkbox"
                checked={gdpr}
                onChange={(e) => setGdpr(e.target.checked)}
                disabled={status.kind === "submitting"}
              />
              <span className="cm-gdpr-checkbox" aria-hidden>
                {gdpr ? <Check size={13} /> : null}
              </span>
              <span className="cm-gdpr-text">
                Elfogadom az{" "}
                <button
                  type="button"
                  className="cm-gdpr-toggle"
                  onClick={(e) => {
                    e.preventDefault();
                    setGdprOpen((v) => !v);
                  }}
                >
                  adatkezelési nyilatkozatot{" "}
                  <ChevronDown
                    size={13}
                    style={{
                      transform: gdprOpen ? "rotate(180deg)" : undefined,
                      transition: "transform 0.15s",
                    }}
                  />
                </button>{" "}
                ehhez az ajánlatkéréshez.
              </span>
            </label>
            {gdprOpen ? (
              <div className="cm-gdpr-body">
                <p>
                  Az „Ajánlatkérések küldése” gombra kattintással hozzájárulok
                  ahhoz, hogy a kinaiauto.com (mint a kérés továbbítója) a
                  megadott személyes adataimat — <strong>nevem, e-mail címem
                  és telefonszámom</strong> — valamint az általam összeállított
                  modell- és kereskedőlistát továbbítsa a fent kiválasztott
                  márkakereskedőknek abból a célból, hogy ők közvetlenül
                  felvegyék velem a kapcsolatot és vásárlási ajánlatot tegyenek.
                </p>
                <p>
                  Tudomásul veszem, hogy a kereskedők önálló adatkezelőkként
                  járnak el a hozzájuk továbbított adataim tekintetében, és
                  saját adatkezelési tájékoztatójuk vonatkozik rájuk.
                </p>
                <p>
                  Az adatkezelés jogalapja a GDPR 6. cikk (1) bekezdés a) pontja
                  szerinti önkéntes hozzájárulás. Hozzájárulásomat bármikor
                  visszavonhatom — ennek részleteit, valamint a teljes körű
                  tájékoztatást az{" "}
                  <Link href="/adatkezeles" target="_blank" rel="noopener">
                    Adatkezelési tájékoztató
                  </Link>{" "}
                  tartalmazza.
                </p>
              </div>
            ) : null}
          </div>

          {status.kind === "error" ? (
            <div className="cm-error">{status.message}</div>
          ) : null}
        </div>

        <footer className="quote-modal-foot">
          <button
            type="button"
            className="dp-btn ghost"
            onClick={onClose}
            disabled={status.kind === "submitting"}
          >
            Mégse
          </button>
          <button
            type="button"
            className="dp-btn primary"
            onClick={submit}
            disabled={!canSubmit}
          >
            {status.kind === "submitting"
              ? "Küldés folyamatban…"
              : "Ajánlatkérések küldése"}
            {status.kind !== "submitting" ? <ArrowRight size={14} /> : null}
          </button>
        </footer>
      </div>
    </div>
  );
}
