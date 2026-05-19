"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Decimal-friendly controlled number input.
// Keeps a local string while typing so "5." doesn't snap back to "5".
function NumInput({
  value,
  onValue,
  placeholder,
}: {
  value: number | null;
  onValue: (n: number | null) => void;
  placeholder?: string;
}) {
  const [raw, setRaw] = useState(() => (value != null ? String(value) : ""));
  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={raw}
      onChange={(e) => {
        const s = e.target.value;
        setRaw(s);
        const norm = s.trim().replace(",", ".");
        if (!norm) { onValue(null); return; }
        if (norm.endsWith(".")) return; // user still typing decimal part
        const n = parseFloat(norm);
        if (Number.isFinite(n)) onValue(n);
      }}
      onBlur={(e) => {
        const norm = e.target.value.trim().replace(",", ".");
        const n = parseFloat(norm);
        if (Number.isFinite(n)) {
          onValue(n);
          setRaw(String(n));
        } else {
          onValue(null);
          setRaw("");
        }
      }}
    />
  );
}

export type Lookup = { id: number; slug?: string; label_hu: string };

// European segment letter auto-suggested from category slug
const CATEGORY_SEGMENT: Record<string, string> = {
  "varosi-kisauto":   "A",
  "mini-suv":         "B",
  "kompakt-suv":      "C",
  "kozepmeretu-suv":  "D",
  "nagy-suv":         "J",
  "kompakt-ferdehatu":"C",
  "premium-limuzin":  "F",
  "kombi":            "D",
  "mpv":              "M",
  "pickup":           "J",
  "sedan":            "D",
  "roadster":         "S",
};

const SEGMENTS = [
  { value: "A", label: "A – Kisváros" },
  { value: "B", label: "B – Kisautó" },
  { value: "C", label: "C – Kompakt" },
  { value: "D", label: "D – Középméretű" },
  { value: "E", label: "E – Executive" },
  { value: "F", label: "F – Luxus" },
  { value: "J", label: "J – SUV / Terepjáró" },
  { value: "M", label: "M – Egyterű (MPV)" },
  { value: "S", label: "S – Sport" },
];
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
  segment: string | null;
};

export type EngineOptionInput = {
  id?: string;
  name: string;
  range_km: number | null;
  power_hp: number | null;
  battery_kwh: number | null;
  trunk_l: number | null;
  seats: number | null;
  consumption_text: string | null;
  charging_ac_kw: number | null;
  charging_dc_kw: number | null;
  charging_text: string | null;
  acceleration_s: number | null;
};

export function ModelForm({
  mode,
  initial,
  initialEngineOptions,
  brands,
  categories,
  drives,
  photos,
}: {
  mode: "create" | "edit";
  initial: ModelInput;
  initialEngineOptions?: EngineOptionInput[];
  brands: BrandLite[];
  categories: Lookup[];
  drives: Lookup[];
  photos?: Photo[];
}) {
  const router = useRouter();
  const [v, setV] = useState<ModelInput>(initial);
  const [engineOptions, setEngineOptions] = useState<EngineOptionInput[]>(
    initialEngineOptions ?? [],
  );
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

  function addEngineOption() {
    setEngineOptions((arr) => [
      ...arr,
      {
        name: arr.length === 0 ? "Base" : "",
        range_km: null,
        power_hp: null,
        battery_kwh: null,
        trunk_l: null,
        seats: null,
        consumption_text: null,
        charging_ac_kw: null,
        charging_dc_kw: null,
        charging_text: null,
        acceleration_s: null,
      },
    ]);
  }
  function updateEngineOption(i: number, patch: Partial<EngineOptionInput>) {
    setEngineOptions((arr) =>
      arr.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    );
  }
  function removeEngineOption(i: number) {
    setEngineOptions((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function save() {
    setBusy(true); setErr(null); setOk(null);
    const url = mode === "create" ? "/api/cms/models" : `/api/cms/models/${v.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...v, engine_options: engineOptions }),
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

      <div className="row3">
        <label><span>Kategória *</span>
          <select value={v.category_id} onChange={(e) => {
            const id = Number(e.target.value);
            const cat = categories.find((c) => c.id === id);
            const suggested = cat?.slug ? (CATEGORY_SEGMENT[cat.slug] ?? null) : null;
            setV((s) => ({
              ...s,
              category_id: id,
              // auto-fill segment only when it is currently empty
              segment: s.segment ? s.segment : suggested,
            }));
          }}>
            <option value="">— válassz —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label_hu}</option>)}
          </select>
        </label>
        <label><span>Szegmens (EU)</span>
          <select value={v.segment ?? ""} onChange={(e) => set("segment", e.target.value || null)}>
            <option value="">— válassz —</option>
            {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
          <NumInput value={v.price_min_m_ft} onValue={(n) => set("price_min_m_ft", n)} />
        </label>
        <label><span>Csúcsár (M Ft)</span>
          <NumInput value={v.price_max_m_ft} onValue={(n) => set("price_max_m_ft", n)} />
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
          <NumInput value={v.length_mm} onValue={(n) => set("length_mm", n)} />
        </label>
        <label><span>Szélesség (mm)</span>
          <NumInput value={v.width_mm} onValue={(n) => set("width_mm", n)} />
        </label>
        <label><span>Magasság (mm)</span>
          <NumInput value={v.height_mm} onValue={(n) => set("height_mm", n)} />
        </label>
      </div>
      <div className="row3">
        <label><span>Tengelytáv (mm)</span>
          <NumInput value={v.wheelbase_mm} onValue={(n) => set("wheelbase_mm", n)} />
        </label>
        <label><span>Csomagtartó (l)</span>
          <NumInput value={v.trunk_l} onValue={(n) => set("trunk_l", n)} />
        </label>
        <label><span>Ülőhelyek</span>
          <NumInput value={v.seats} onValue={(n) => set("seats", n)} />
        </label>
      </div>

      <h2>Hajtáslánc</h2>
      <div className="row3">
        <label><span>Teljesítmény (LE)</span>
          <NumInput value={v.power_hp} onValue={(n) => set("power_hp", n)} />
        </label>
        <label><span>Akku (kWh)</span>
          <NumInput value={v.battery_kwh} onValue={(n) => set("battery_kwh", n)} />
        </label>
        <label><span>Hatótáv (km)</span>
          <NumInput value={v.range_km} onValue={(n) => set("range_km", n)} />
        </label>
      </div>
      <div className="row2">
        <label><span>Fogyasztás (szöveg)</span>
          <input value={v.consumption_text ?? ""} onChange={(e) => set("consumption_text", e.target.value || null)} />
        </label>
        <label><span>Gyorsulás 0–100 (s)</span>
          <NumInput value={v.acceleration_s} onValue={(n) => set("acceleration_s", n)} />
        </label>
      </div>

      <h2>Modellváltozatok <small style={{ fontWeight: 400, color: "#888" }}>(opcionális)</small></h2>
      <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
        Ha a modellnek több hajtáslánc-változata van (pl. Alap / Long Range),
        add meg itt külön. Üres lista esetén a fenti alap adatok jelennek meg.
      </p>
      {engineOptions.map((o, i) => (
        <div key={i} className="cms-card" style={{ padding: 14, marginBottom: 10 }}>
          <div className="row3" style={{ alignItems: "flex-end" }}>
            <label style={{ gridColumn: "span 2" }}>
              <span>Változat neve *</span>
              <input
                value={o.name}
                placeholder={i === 0 ? "Base" : "Long Range"}
                onChange={(e) => updateEngineOption(i, { name: e.target.value })}
              />
            </label>
            <button
              type="button"
              className="cms-btn danger"
              onClick={() => removeEngineOption(i)}
              style={{ height: 36 }}
            >
              × Törlés
            </button>
          </div>
          <div className="row3">
            <label><span>Hatótáv (km)</span>
              <NumInput value={o.range_km ?? null} onValue={(n) => updateEngineOption(i, { range_km: n })} />
            </label>
            <label><span>Teljesítmény (LE)</span>
              <NumInput value={o.power_hp ?? null} onValue={(n) => updateEngineOption(i, { power_hp: n })} />
            </label>
            <label><span>Akku (kWh)</span>
              <NumInput value={o.battery_kwh ?? null} onValue={(n) => updateEngineOption(i, { battery_kwh: n })} />
            </label>
          </div>
          <div className="row3">
            <label><span>Csomagtartó (l)</span>
              <NumInput value={o.trunk_l ?? null} onValue={(n) => updateEngineOption(i, { trunk_l: n })} />
            </label>
            <label><span>Ülések</span>
              <NumInput value={o.seats ?? null} onValue={(n) => updateEngineOption(i, { seats: n })} />
            </label>
            <label><span>Fogyasztás (szöveg)</span>
              <input
                value={o.consumption_text ?? ""}
                onChange={(e) => updateEngineOption(i, { consumption_text: e.target.value || null })}
              />
            </label>
          </div>
          <div className="row3">
            <label><span>AC töltés (kW)</span>
              <NumInput value={o.charging_ac_kw ?? null} onValue={(n) => updateEngineOption(i, { charging_ac_kw: n })} />
            </label>
            <label><span>DC töltés (kW)</span>
              <NumInput value={o.charging_dc_kw ?? null} onValue={(n) => updateEngineOption(i, { charging_dc_kw: n })} />
            </label>
            <label><span>0–100 km/h (s)</span>
              <NumInput value={o.acceleration_s ?? null} onValue={(n) => updateEngineOption(i, { acceleration_s: n })} />
            </label>
          </div>
          <div className="row2">
            <label><span>Töltési infó (szöveg)</span>
              <input value={o.charging_text ?? ""} onChange={(e) => updateEngineOption(i, { charging_text: e.target.value || null })} />
            </label>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="cms-btn ghost"
        onClick={addEngineOption}
        style={{ marginBottom: 16 }}
      >
        + Új változat hozzáadása
      </button>

      <h2>Töltés</h2>
      <div className="row3">
        <label><span>AC (kW)</span>
          <NumInput value={v.charging_ac_kw} onValue={(n) => set("charging_ac_kw", n)} />
        </label>
        <label><span>DC (kW)</span>
          <NumInput value={v.charging_dc_kw} onValue={(n) => set("charging_dc_kw", n)} />
        </label>
        <label><span>Töltési szöveg</span>
          <input value={v.charging_text ?? ""} onChange={(e) => set("charging_text", e.target.value || null)} />
        </label>
      </div>

      <h2>Garancia</h2>
      <div className="row2">
        <label><span>Garancia (év)</span>
          <NumInput value={v.warranty_years} onValue={(n) => set("warranty_years", n)} />
        </label>
        <label><span>Garancia (km)</span>
          <NumInput value={v.warranty_km} onValue={(n) => set("warranty_km", n)} />
        </label>
      </div>
      <div className="row2">
        <label><span>Akku-garancia (év)</span>
          <NumInput value={v.battery_warranty_years} onValue={(n) => set("battery_warranty_years", n)} />
        </label>
        <label><span>Akku-garancia (km)</span>
          <NumInput value={v.battery_warranty_km} onValue={(n) => set("battery_warranty_km", n)} />
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
          <PhotoGallery modelId={v.id} initialPhotos={photos ?? []} />
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KINDS = ["hero", "exterior", "interior", "dashboard", "rear", "trunk", "gallery"] as const;
const KIND_LABELS: Record<string, string> = {
  hero: "Hero", exterior: "Exterior", interior: "Interior",
  dashboard: "Műszerfal", rear: "Hátul", trunk: "Csomagtartó", gallery: "Galéria",
};

function thumbUrl(path: string) {
  if (!SUPABASE_URL) return "";
  return `${SUPABASE_URL}/storage/v1/object/public/car-photos/${path}`;
}

type QueueItem = { file: File; preview: string; kind: string; isPrimary: boolean; id: string };

function PhotoGallery({ modelId, initialPhotos }: { modelId: string; initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const items: QueueItem[] = Array.from(files).map((file) => ({
      file, preview: URL.createObjectURL(file),
      kind: "exterior", isPrimary: false, id: Math.random().toString(36).slice(2),
    }));
    setQueue((q) => [...q, ...items]);
  }

  function removeFromQueue(id: string) {
    setQueue((q) => {
      const item = q.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return q.filter((x) => x.id !== id);
    });
  }

  function updateQueue(id: string, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((x) => x.id === id ? { ...x, ...patch } : x));
  }

  async function uploadAll() {
    if (queue.length === 0) return;
    setUploading(true); setErr(null);
    for (const item of queue) {
      const fd = new FormData();
      fd.append("file", item.file);
      fd.append("model_id", modelId);
      fd.append("kind", item.kind);
      fd.append("is_primary", String(item.isPrimary));
      const res = await fetch("/api/cms/upload/photo", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) { setErr(`Feltöltési hiba (${item.file.name}): ${j.error ?? res.status}`); setUploading(false); return; }
      const row = j.row as Photo;
      if (item.isPrimary) {
        setPhotos((p) => p.map((x) => ({ ...x, is_primary: false })));
      }
      setPhotos((p) => [...p, row]);
      URL.revokeObjectURL(item.preview);
    }
    setQueue([]);
    setUploading(false);
  }

  async function patchPhoto(id: string, patch: { kind?: string; is_primary?: boolean }) {
    const res = await fetch(`/api/cms/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})) as Record<string, unknown>; setErr(String(j.error ?? "Mentés sikertelen")); return; }
    if (patch.is_primary) {
      setPhotos((p) => p.map((x) => ({ ...x, is_primary: x.id === id })));
    } else {
      setPhotos((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x));
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm("Biztosan törlöd a fotót?")) return;
    const res = await fetch(`/api/cms/photos/${id}`, { method: "DELETE" });
    if (res.ok) setPhotos((p) => p.filter((x) => x.id !== id));
    else setErr("Törlés sikertelen.");
  }

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDrag(true); }, []);
  const onDragLeave = useCallback(() => setDrag(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    addFiles(e.dataTransfer.files);
  }, []);

  return (
    <div>
      {err ? <div className="err" style={{ marginBottom: 8 }}>{err}</div> : null}

      {/* Existing photos */}
      {photos.length > 0 ? (
        <div className="photo-grid">
          {photos.map((p) => (
            <div key={p.id} className={`photo-card${p.is_primary ? " is-primary" : ""}`}>
              {SUPABASE_URL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl(p.storage_path)} alt={p.kind} loading="lazy" />
              ) : (
                <div style={{ aspectRatio: "16/9", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#475569" }}>no preview</div>
              )}
              <div className="photo-controls">
                <select
                  value={p.kind}
                  onChange={(e) => patchPhoto(p.id, { kind: e.target.value })}
                >
                  {KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
                </select>
                <div className="photo-row">
                  <label className={`photo-primary${p.is_primary ? " active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={p.is_primary}
                      onChange={(e) => { if (e.target.checked) patchPhoto(p.id, { is_primary: true }); }}
                    />
                    Primary
                  </label>
                  <button className="photo-del" onClick={() => deletePhoto(p.id)} title="Törlés">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Még nincs feltöltött fotó.</div>
      )}

      {/* Upload drop zone */}
      <div
        className={`photo-upload-drop${drag ? " drag-over" : ""}`}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={(e) => addFiles(e.target.files)}
          onClick={(e) => e.stopPropagation()}
        />
        <span>Kattints vagy húzd ide a fotókat (PNG / JPEG / WEBP / AVIF, max 10 MB/db)</span>
      </div>

      {/* Upload queue */}
      {queue.length > 0 ? (
        <>
          <div className="photo-queue" style={{ marginTop: 10 }}>
            {queue.map((item) => (
              <div key={item.id} className={`photo-queue-item${uploading ? " photo-uploading" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt="preview" />
                <div className="photo-controls">
                  <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.file.name}
                  </div>
                  <select
                    value={item.kind}
                    onChange={(e) => updateQueue(item.id, { kind: e.target.value })}
                    disabled={uploading}
                  >
                    {KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
                  </select>
                  <div className="photo-row">
                    <label className={`photo-primary${item.isPrimary ? " active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={item.isPrimary}
                        onChange={(e) => updateQueue(item.id, { isPrimary: e.target.checked })}
                        disabled={uploading}
                      />
                      Primary
                    </label>
                    <button className="photo-del" onClick={() => removeFromQueue(item.id)} disabled={uploading} title="Eltávolítás">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="cms-actions" style={{ marginTop: 10 }}>
            <button className="cms-btn primary" onClick={uploadAll} disabled={uploading}>
              {uploading ? "Feltöltés…" : `${queue.length} fotó feltöltése`}
            </button>
            <button className="cms-btn ghost" onClick={() => { queue.forEach((i) => URL.revokeObjectURL(i.preview)); setQueue([]); }} disabled={uploading}>
              Mégse
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
