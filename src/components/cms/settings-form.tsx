"use client";

import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";

type Props = {
  initial: Record<string, string>;
};

export function SettingsForm({ initial }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [showApiKey, setShowApiKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; saved: number }
    | { kind: "err"; message: string }
  >({ kind: "idle" });

  function update(k: string, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
    setStatus({ kind: "idle" });
  }

  async function save() {
    setBusy(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/cms/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setStatus({ kind: "err", message: String(j.error ?? "Mentési hiba") });
      } else {
        setStatus({ kind: "ok", saved: Number(j.saved ?? 0) });
      }
    } catch (e) {
      setStatus({ kind: "err", message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      {/* ── Resend ── */}
      <section className="cms-card">
        <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>Resend (e-mail kiküldés)</h2>
        <p style={{ margin: "0 0 18px", color: "#94a3b8", fontSize: 13 }}>
          A Resend API kulcs kell ahhoz, hogy a rendszer e-mailt tudjon küldeni a
          kereskedőknek. Hozz létre kulcsot a{" "}
          <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa" }}>
            resend.com
          </a>{" "}
          oldalon, majd másold ide.
        </p>

        <div className="cms-form">
          <label>
            <span>API kulcs</span>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type={showApiKey ? "text" : "password"}
                value={values.resend_api_key ?? ""}
                onChange={(e) => update("resend_api_key", e.target.value)}
                placeholder="re_..."
                autoComplete="off"
                style={{ flex: 1, fontFamily: "var(--font-mono), monospace" }}
              />
              <button
                type="button"
                className="cms-btn ghost"
                onClick={() => setShowApiKey((v) => !v)}
                aria-label={showApiKey ? "Elrejtés" : "Mutatás"}
                style={{ width: 40, padding: 0, justifyContent: "center" }}
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </label>

          <label>
            <span>Feladó e-mail cím</span>
            <input
              type="email"
              value={values.resend_from_email ?? ""}
              onChange={(e) => update("resend_from_email", e.target.value)}
              placeholder="ajanlat@kinaiauto.com"
            />
            <small style={{ color: "#94a3b8", fontSize: 11.5 }}>
              Ennek a domainnek verifikálva kell lennie a Resend felületén.
            </small>
          </label>

          <label>
            <span>Feladó név</span>
            <input
              type="text"
              value={values.resend_from_name ?? ""}
              onChange={(e) => update("resend_from_name", e.target.value)}
              placeholder="kinaiauto.com"
            />
          </label>
        </div>
      </section>

      {/* ── Quote settings ── */}
      <section className="cms-card">
        <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>Ajánlatkérés</h2>
        <p style={{ margin: "0 0 18px", color: "#94a3b8", fontSize: 13 }}>
          A nyilvános /ajanlatkeres oldal viselkedését szabályozó beállítások.
        </p>

        <div className="cms-form">
          <label>
            <span>Maximum kereskedő márkánként</span>
            <input
              type="number"
              min={1}
              max={20}
              value={values.quote_max_dealers_per_brand ?? "3"}
              onChange={(e) => update("quote_max_dealers_per_brand", e.target.value)}
              style={{ maxWidth: 140 }}
            />
            <small style={{ color: "#94a3b8", fontSize: 11.5 }}>
              Hány kereskedőt választhat ki a látogató egy márkához ajánlatkéréshez.
            </small>
          </label>

          <label>
            <span>E-mail tárgy sablon</span>
            <input
              type="text"
              value={values.quote_email_subject_template ?? ""}
              onChange={(e) => update("quote_email_subject_template", e.target.value)}
              placeholder="Ajánlatkérés – {brand} {models_count_text}"
            />
            <small style={{ color: "#94a3b8", fontSize: 11.5 }}>
              Helyettesítők: <code>{"{brand}"}</code>,{" "}
              <code>{"{models_count_text}"}</code>, <code>{"{customer_name}"}</code>.
            </small>
          </label>
        </div>
      </section>

      {/* ── Save ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          type="button"
          className="cms-btn primary"
          onClick={save}
          disabled={busy}
        >
          {busy ? "Mentés…" : "Beállítások mentése"}
        </button>
        {status.kind === "ok" ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#064e3b", border: "1px solid #047857", color: "#6ee7b7",
            padding: "6px 12px", borderRadius: 6, fontSize: 13,
          }}>
            <Check size={14} /> Mentve ({status.saved} mező)
          </span>
        ) : null}
        {status.kind === "err" ? (
          <span style={{
            background: "#450a0a", border: "1px solid #7f1d1d", color: "#fca5a5",
            padding: "6px 12px", borderRadius: 6, fontSize: 13,
          }}>{status.message}</span>
        ) : null}
      </div>
    </div>
  );
}
