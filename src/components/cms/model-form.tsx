"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Lookup = { id: number; label_hu: string };
export type BrandLite = { id: string; name: string };

type Photo = { id: string; storage_path: string; kind: string; is_primary: boolean };

export type ModelInput = {
  id?: string;
  brand_id: string;
  category_id: number;
  drive_id: number;
  slug: string;
  name: string;
  price_min_m_ft: number | null;
  price_max_m_ft: number | null;
  is_deal: boolean;
  deal_text: string | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  wheelbase_mm: number | null;
  trunk_l: number | null;
  seats: number | null;
  power_hp: number | null;
  battery_kwh: number | null;
  range_km: number | null;
  consumption_text: string | null;
  charging_ac_kw: number | null;
  charging_dc_kw: number | null;
  charging_text: string | null;
  acceleration_s: number | null;
  warranty_years: number | null;
  warranty_km: number | null;
  battery_warranty_years: number | null;
  battery_warranty_km: number | null;
  source_url: string | null;
  data_updated_at: string | null;
  is_available: boolean;
  is_featured: boolean;
  archived_at: string | null;
};

export function ModelForm({
  mode,
  initial,
  brands,
  categories,
  drives,
  photos,
}: {
  mode: "create" | "edit";
  initial: ModelInput;
  brands: BrandLite[];
  categories: Lookup[];
  drives: Lookup[];
  photos?: Photo[];
}) {
  const router = useRouter();
  const [v, setV] = useState<ModelInput>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function set<K extends keyof ModelInput>(k: K, val: ModelInput[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }
  function num(s: string): number | null {
    const trimmed = s.trim();
    if (!trimmed) return null;
    const n = Number(trimmed.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  async function save() {
    setBusy(true); setErr(null); setOk(null);
    const url = mode === "create" ? "/api/cms/models" : `/api/cms/models/${v.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(j.error || "Mentés sikertelen");
    setOk("Mentve.");
    if (mode === "create" && j.id) router.push(`/c4m5s6/modellek/${j.id}`);
    else router.refresh();
  }

  async function archive(toggle: boolean) {
    if (!v.id) return;
    setBusy(true); setErr(null);
    const res = await fetch(`/api/cms/models/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived_at: toggle ? new Date().toISOString() : null }),
    });
    setBusy(false);
    if (res.ok) { router.refresh(); router.push("/c4m5s6/modellek"); }
    else setErr("Művelet sikertelen.");
  }

  async function uploadPhoto(file: File, kind: string, isPrimary: boolean) {
    if (!v.id) {
      setErr("Először mentsd a modellt, utána tölts fotót.");
      return;
    }
    setBusy(true); setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("model_id", v.id);
    fd.append("kind", kind);
    fd.append("is_primary", String(isPrimary));
    const res = await fetch("/api/cms/upload/photo", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(j.error || "Feltöltés sikertelen");
    setOk("Fotó feltöltve.");
    router.refresh();
  }

  async function deletePhoto(id: string) {
    if (!confirm("Biztosan törlöd a fotót?")) return;
    setBusy(true);
    const res = await fetch(`/api/cms/photos/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else setErr("Törlés sikertelen.");
  }

  return (
    <div className="cms-form">
      {err ? <div className="err">{err}</div> : null}
      {ok ? <div className="ok">{ok}</div> : null}

      <div className="row3">
        <label><span>Márka *</span>
          <select value={v.brand_id} onChange={(e) => set("brand_id", e.target.value)}>
            <option value="">— válassz —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label><span>Név *</span>
          <input value={v.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label><span>Slug *</span>
          <input value={v.slug} onChange={(e) => set("slug", e.target.value)} />
        </label>
      </div>

      <div className="row2">
        <label><span>Kategória *</span>
          <select value={v.category_id} onChange={(e) => set("category_id", Number(e.target.value))}>
            <option value="">— válassz —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label_hu}</option>)}
          </select>
        </label>
        <label><span>Hajtás *</span>
          <select value={v.drive_id} onChange={(e) => set("drive_id", Number(e.target.value))}>
            <option value="">— válassz —</option>
            {drives.map((d) => <option key={d.id} value={d.id}>{d.label_hu}</option>)}
          </select>
        </label>
      </div>

      <h2>Árazás</h2>
      <div className="row3">
        <label><span>Alapár (M Ft)</span>
          <input value={v.price_min_m_ft ?? ""} onChange={(e) => set("price_min_m_ft", num(e.target.value))} />
        </label>
        <label><span>Csúcsár (M Ft)</span>
          <input value={v.price_max_m_ft ?? ""} onChange={(e) => set("price_max_m_ft", num(e.target.value))} />
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={v.is_deal} onChange={(e) => set("is_deal", e.target.checked)} />
          <span style={{ textTransform: "none", letterSpacing: 0 }}>Akciós</span>
        </label>
      </div>
      <label><span>Akciószöveg</span>
        <input value={v.deal_text ?? ""} onChange={(e) => set("deal_text", e.target.value || null)} />
      </label>

      <h2>Méretek</h2>
      <div className="row3">
        <label><span>Hossz (mm)</span>
          <input value={v.length_mm ?? ""} onChange={(e) => set("length_mm", num(e.target.value))} />
        </label>
        <label><span>Szélesség (mm)</span>
          <input value={v.width_mm ?? ""} onChange={(e) => set("width_mm", num(e.target.value))} />
        </label>
        <label><span>Magasság (mm)</span>
          <input value={v.height_mm ?? ""} onChange={(e) => set("height_mm", num(e.target.value))} />
        </label>
      </div>
      <div className="row3">
        <label><span>Tengelytáv (mm)</span>
          <input value={v.wheelbase_mm ?? ""} onChange={(e) => set("wheelbase_mm", num(e.target.value))} />
        </label>
        <label><span>Csomagtartó (l)</span>
          <input value={v.trunk_l ?? ""} onChange={(e) => set("trunk_l", num(e.target.value))} />
        </label>
        <label><span>Ülőhelyek</span>
          <input value={v.seats ?? ""} onChange={(e) => set("seats", num(e.target.value))} />
        </label>
      </div>

      <h2>Hajtáslánc</h2>
      <div className="row3">
        <label><span>Teljesítmény (LE)</span>
          <input value={v.power_hp ?? ""} onChange={(e) => set("power_hp", num(e.target.value))} />
        </label>
        <label><span>Akku (kWh)</span>
          <input value={v.battery_kwh ?? ""} onChange={(e) => set("battery_kwh", num(e.target.value))} />
        </label>
        <label><span>Hatótáv (km)</span>
          <input value={v.range_km ?? ""} onChange={(e) => set("range_km", num(e.target.value))} />
        </label>
      </div>
      <div className="row2">
        <label><span>Fogyasztás (szöveg)</span>
          <input value={v.consumption_text ?? ""} onChange={(e) => set("consumption_text", e.target.value || null)} />
        </label>
        <label><span>Gyorsulás 0–100 (s)</span>
          <input value={v.acceleration_s ?? ""} onChange={(e) => set("acceleration_s", num(e.target.value))} />
        </label>
      </div>

      <h2>Töltés</h2>
      <div className="row3">
        <label><span>AC (kW)</span>
          <input value={v.charging_ac_kw ?? ""} onChange={(e) => set("charging_ac_kw", num(e.target.value))} />
        </label>
        <label><span>DC (kW)</span>
          <input value={v.charging_dc_kw ?? ""} onChange={(e) => set("charging_dc_kw", num(e.target.value))} />
        </label>
        <label><span>Töltési szöveg</span>
          <input value={v.charging_text ?? ""} onChange={(e) => set("charging_text", e.target.value || null)} />
        </label>
      </div>

      <h2>Garancia</h2>
      <div className="row2">
        <label><span>Garancia (év)</span>
          <input value={v.warranty_years ?? ""} onChange={(e) => set("warranty_years", num(e.target.value))} />
        </label>
        <label><span>Garancia (km)</span>
          <input value={v.warranty_km ?? ""} onChange={(e) => set("warranty_km", num(e.target.value))} />
        </label>
      </div>
      <div className="row2">
        <label><span>Akku-garancia (év)</span>
          <input value={v.battery_warranty_years ?? ""} onChange={(e) => set("battery_warranty_years", num(e.target.value))} />
        </label>
        <label><span>Akku-garancia (km)</span>
          <input value={v.battery_warranty_km ?? ""} onChange={(e) => set("battery_warranty_km", num(e.target.value))} />
        </label>
      </div>

      <h2>Egyéb</h2>
      <div className="row2">
        <label><span>Forrás URL</span>
          <input value={v.source_url ?? ""} onChange={(e) => set("source_url", e.target.value || null)} />
        </label>
        <label><span>Adatfrissítés dátuma (YYYY-MM-DD)</span>
          <input value={v.data_updated_at ?? ""} onChange={(e) => set("data_updated_at", e.target.value || null)} />
        </label>
      </div>

      <div className="row2">
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={v.is_available} onChange={(e) => set("is_available", e.target.checked)} />
          <span style={{ textTransform: "none", letterSpacing: 0 }}>Elérhető (publikusan látható)</span>
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={v.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
          <span style={{ textTransform: "none", letterSpacing: 0 }}>Kiemelt</span>
        </label>
      </div>

      {mode === "edit" && v.id ? (
        <div className="cms-card" style={{ padding: 14 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 14 }}>Fotók</h2>
          {photos && photos.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13 }}>
              {photos.map((p) => (
                <li key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1f2937" }}>
                  <div>
                    <code style={{ color: "#94a3b8" }}>{p.storage_path}</code>{" "}
                    <span className="pill muted">{p.kind}</span>{" "}
                    {p.is_primary ? <span className="pill ok">primary</span> : null}
                  </div>
                  <button className="cms-btn danger" onClick={() => deletePhoto(p.id)} disabled={busy}>
                    Törlés
                  </button>
                </li>
              ))}
            </ul>
          ) : <div style={{ color: "#94a3b8", fontSize: 13 }}>Nincs fotó.</div>}

          <UploadField onUpload={uploadPhoto} disabled={busy} />
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

function UploadField({
  onUpload,
  disabled,
}: {
  onUpload: (file: File, kind: string, isPrimary: boolean) => void;
  disabled: boolean;
}) {
  const [kind, setKind] = useState("exterior");
  const [primary, setPrimary] = useState(false);
  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <select value={kind} onChange={(e) => setKind(e.target.value)} disabled={disabled}>
        {["hero","exterior","interior","dashboard","rear","trunk","gallery"].map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <label style={{ display: "flex", gap: 6, alignItems: "center", color: "#cbd5e1", fontSize: 13 }}>
        <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
        primary
      </label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f, kind, primary);
        }}
      />
    </div>
  );
}
