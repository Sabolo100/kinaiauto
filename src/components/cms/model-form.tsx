"use client";

import { useState, useRef, useCallback } from "react";
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
