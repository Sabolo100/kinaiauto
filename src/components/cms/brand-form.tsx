"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type BrandInput = {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  founded: string;
  hq: string;
  factories: string;
  parent_company: string;
  importer_name: string;
  importer_addr: string;
  importer_site: string;
  dealers_text: string;
  hero_color: string;
  brand_tone: string;
  sort_order: number;
  is_active: boolean;
  archived_at: string | null;
  logo_path?: string | null;
};

export function BrandForm({
  initial,
  mode,
}: {
  initial: BrandInput;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [v, setV] = useState<BrandInput>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function set<K extends keyof BrandInput>(k: K, val: BrandInput[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }

  async function save() {
    setBusy(true); setErr(null); setOk(null);
    const url = mode === "create" ? "/api/cms/brands" : `/api/cms/brands/${v.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(j.error || "Mentés sikertelen");
      return;
    }
    setOk("Mentve.");
    if (mode === "create" && j.id) {
      router.push(`/c4m5s6/markak/${j.id}`);
    } else {
      router.refresh();
    }
  }

  async function archive(toggle: boolean) {
    if (!v.id) return;
    setBusy(true); setErr(null);
    const res = await fetch(`/api/cms/brands/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived_at: toggle ? new Date().toISOString() : null }),
    });
    setBusy(false);
    if (res.ok) { router.refresh(); router.push("/c4m5s6/markak"); }
    else setErr("Művelet sikertelen.");
  }

  async function uploadLogo(file: File) {
    if (!v.id) {
      setErr("Először mentsd a márkát, utána tölts logót.");
      return;
    }
    setBusy(true); setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("brand_id", v.id);
    const res = await fetch("/api/cms/upload/brand-logo", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(j.error || "Feltöltés sikertelen"); return; }
    set("logo_path", j.storage_path);
    setOk("Logó feltöltve.");
    router.refresh();
  }

  return (
    <div className="cms-form">
      {err ? <div className="err">{err}</div> : null}
      {ok ? <div className="ok">{ok}</div> : null}

      <div className="row2">
        <label><span>Név *</span>
          <input value={v.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label><span>Slug *</span>
          <input value={v.slug} onChange={(e) => set("slug", e.target.value)} />
        </label>
      </div>

      <label><span>Tagline</span>
        <input value={v.tagline} onChange={(e) => set("tagline", e.target.value)} />
      </label>

      <label><span>Leírás</span>
        <textarea value={v.description} onChange={(e) => set("description", e.target.value)} />
      </label>

      <div className="row3">
        <label><span>Alapítva</span>
          <input value={v.founded} onChange={(e) => set("founded", e.target.value)} />
        </label>
        <label><span>Központ</span>
          <input value={v.hq} onChange={(e) => set("hq", e.target.value)} />
        </label>
        <label><span>Anyacég</span>
          <input value={v.parent_company} onChange={(e) => set("parent_company", e.target.value)} />
        </label>
      </div>

      <label><span>Gyárak</span>
        <input value={v.factories} onChange={(e) => set("factories", e.target.value)} />
      </label>

      <div className="row2">
        <label><span>Importőr neve</span>
          <input value={v.importer_name} onChange={(e) => set("importer_name", e.target.value)} />
        </label>
        <label><span>Importőr cím</span>
          <input value={v.importer_addr} onChange={(e) => set("importer_addr", e.target.value)} />
        </label>
      </div>

      <div className="row2">
        <label><span>Importőr weboldal</span>
          <input value={v.importer_site} onChange={(e) => set("importer_site", e.target.value)} placeholder="byd.com/hu" />
        </label>
        <label><span>Kereskedő-szöveg</span>
          <input value={v.dealers_text} onChange={(e) => set("dealers_text", e.target.value)} />
        </label>
      </div>

      <div className="row3">
        <label><span>Hero szín</span>
          <input value={v.hero_color} onChange={(e) => set("hero_color", e.target.value)} placeholder="#0a3d4e" />
        </label>
        <label><span>Brand tone</span>
          <input value={v.brand_tone} onChange={(e) => set("brand_tone", e.target.value)} placeholder="#dc2626" />
        </label>
        <label><span>Sorrend</span>
          <input type="number" value={v.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} />
        </label>
      </div>

      <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
        <span style={{ textTransform: "none", letterSpacing: 0 }}>Aktív (publikusan látható)</span>
      </label>

      {mode === "edit" && v.id ? (
        <div className="cms-card" style={{ padding: 14 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 14 }}>Logó</h2>
          {v.logo_path ? (
            <div style={{ marginBottom: 10, fontSize: 13, color: "#94a3b8" }}>
              Jelenlegi: <code>{v.logo_path}</code>
            </div>
          ) : (
            <div style={{ marginBottom: 10, fontSize: 13, color: "#94a3b8" }}>
              Nincs logó.
            </div>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadLogo(f);
            }}
          />
        </div>
      ) : null}

      <div className="cms-actions">
        <button className="cms-btn primary" onClick={save} disabled={busy}>
          {busy ? "Mentés…" : mode === "create" ? "Létrehozás" : "Mentés"}
        </button>
        {mode === "edit" && v.id ? (
          v.archived_at ? (
            <button className="cms-btn ghost" onClick={() => archive(false)} disabled={busy}>
              Visszaállítás
            </button>
          ) : (
            <button className="cms-btn danger" onClick={() => archive(true)} disabled={busy}>
              Archiválás
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
