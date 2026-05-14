"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type DealerContact = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  position: string;
};

export type DealerInput = {
  id?: string;
  brand_id: string;
  name: string;
  city: string;
  zip_code: string;
  street: string;
  lat: string;
  lng: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  is_active: boolean;
  sort_order: number;
  contacts: DealerContact[];
};

type BrandOpt = { id: string; name: string };

export function DealerForm({
  mode,
  initial,
  brands,
  hasClaude,
  hasOpenAI,
}: {
  mode: "create" | "edit";
  initial: DealerInput;
  brands: BrandOpt[];
  hasClaude: boolean;
  hasOpenAI: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState<DealerInput>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Extract section state
  const [exProvider, setExProvider] = useState<"claude" | "openai">(hasClaude ? "claude" : "openai");
  const [exKind, setExKind] = useState<"url" | "pdf" | "image">("url");
  const [exUrl, setExUrl] = useState("");
  const [exFile, setExFile] = useState<File | null>(null);
  const [exBusy, setExBusy] = useState(false);
  const [exStep, setExStep] = useState<string | null>(null);
  const [exErr, setExErr] = useState<string | null>(null);

  function set<K extends keyof DealerInput>(k: K, val: DealerInput[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }

  function setContact(i: number, patch: Partial<DealerContact>) {
    setV((s) => {
      const contacts = [...s.contacts];
      contacts[i] = { ...contacts[i], ...patch };
      return { ...s, contacts };
    });
  }

  function addContact() {
    setV((s) => ({ ...s, contacts: [...s.contacts, { name: "", email: "", phone: "", position: "" }] }));
  }

  function removeContact(i: number) {
    setV((s) => ({ ...s, contacts: s.contacts.filter((_, idx) => idx !== i) }));
  }

  async function geocode() {
    const addr = [v.street, v.city, v.zip_code].filter(Boolean).join(", ");
    if (!addr) { setErr("Adj meg utcát vagy várost a geokódoláshoz."); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr + ", Hungary")}&limit=1`);
      const data = await res.json();
      if (data[0]) {
        set("lat", data[0].lat);
        set("lng", data[0].lon);
        setOk("GPS koordináta lekérve: " + data[0].display_name.slice(0, 60));
      } else {
        setErr("Nem található GPS koordináta erre a címre.");
      }
    } catch {
      setErr("Geocoding hiba.");
    }
  }

  async function extract() {
    setExBusy(true); setExErr(null); setExStep(null);
    const selectedBrand = brands.find((b) => b.id === v.brand_id);
    const brandHint = selectedBrand?.name ?? "";
    let storagePath = "";

    if (exKind === "pdf" || exKind === "image") {
      if (!exFile) { setExErr("Csatolj fájlt."); setExBusy(false); return; }
      setExStep("1/3 — Feltöltési URL lekérése…");
      let presignRes: Response;
      try {
        presignRes = await fetch(`/api/cms/extract/presign?model_id=dealer-extract&filename=${encodeURIComponent(exFile.name)}`);
      } catch (e) { setExErr(`Presign hiba: ${(e as Error).message}`); setExBusy(false); return; }
      if (!presignRes.ok) { setExErr("Presign hiba"); setExBusy(false); return; }
      const { path, signedUrl } = await presignRes.json() as { path: string; signedUrl: string };
      storagePath = path;
      setExStep(`2/3 — Fájl feltöltése…`);
      const upRes = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": exFile.type || "application/pdf" }, body: exFile });
      if (!upRes.ok) { setExErr("Feltöltési hiba"); setExBusy(false); return; }
    }

    setExStep("3/3 — Kinyerés…");
    const body: Record<string, unknown> = { provider: exProvider, source_kind: exKind, brand_hint: brandHint };
    if (exKind === "url") body.url = exUrl.trim();
    else { body.storage_path = storagePath; body.source_filename = exFile!.name; if (exKind === "image") body.image_media_type = exFile!.type; }

    const res = await fetch("/api/cms/dealers/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({})) as Record<string, unknown>;
    setExBusy(false); setExStep(null);
    if (!res.ok) { setExErr(`Kinyerési hiba: ${j.error ?? "ismeretlen"}`); return; }

    const d = j.data as Partial<DealerInput & { contacts: DealerContact[] }>;
    setV((prev) => ({
      ...prev,
      name: d.name || prev.name,
      city: d.city || prev.city,
      zip_code: d.zip_code || prev.zip_code,
      street: d.street || prev.street,
      phone: d.phone || prev.phone,
      email: d.email || prev.email,
      website: d.website || prev.website,
      lat: d.lat ? String(d.lat) : prev.lat,
      lng: d.lng ? String(d.lng) : prev.lng,
      notes: d.notes || prev.notes,
      contacts: d.contacts?.map((c) => ({ name: c.name ?? "", email: c.email ?? "", phone: c.phone ?? "", position: c.position ?? "" })) ?? prev.contacts,
    }));
    setOk("Kinyerve — ellenőrizd és mentsd az adatokat.");
  }

  async function save() {
    setBusy(true); setErr(null); setOk(null);
    if (!v.brand_id || !v.name || !v.city) { setErr("Márka, kereskedés neve és város kötelező."); setBusy(false); return; }

    const payload = {
      ...v,
      lat: v.lat ? Number(v.lat) : null,
      lng: v.lng ? Number(v.lng) : null,
      sort_order: Number(v.sort_order) || 0,
      contacts: v.contacts.filter((c) => c.name || c.phone || c.email),
    };

    const url = mode === "create" ? "/api/cms/dealers" : `/api/cms/dealers/${v.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json().catch(() => ({})) as Record<string, unknown>;
    setBusy(false);
    if (!res.ok) return setErr(String(j.error ?? "Mentés sikertelen"));
    setOk("Mentve.");
    if (mode === "create" && j.id) router.push(`/c4m5s6/kereskedok/${j.id}`);
    else router.refresh();
  }

  async function del() {
    if (!v.id || !confirm("Biztosan törlöd ezt a kereskedőt?")) return;
    setBusy(true);
    const res = await fetch(`/api/cms/dealers/${v.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push("/c4m5s6/kereskedok");
    else setErr("Törlés sikertelen.");
  }

  return (
    <div className="cms-form">
      {err ? <div className="err">{err}</div> : null}
      {ok ? <div className="ok">{ok}</div> : null}

      {/* ── Extract section ── */}
      <div className="cms-card" style={{ padding: 14, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 14, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--ink-mute)" }}>Kinyerés forrásból (opcionális)</h2>
        <div className="row3">
          <label><span>LLM</span>
            <select value={exProvider} onChange={(e) => setExProvider(e.target.value as "claude" | "openai")}>
              <option value="claude" disabled={!hasClaude}>Claude {hasClaude ? "" : "(hiányzik)"}</option>
              <option value="openai" disabled={!hasOpenAI}>OpenAI {hasOpenAI ? "" : "(hiányzik)"}</option>
            </select>
          </label>
          <label><span>Forrás típus</span>
            <select value={exKind} onChange={(e) => { setExKind(e.target.value as "url"|"pdf"|"image"); setExFile(null); }}>
              <option value="url">URL</option>
              <option value="pdf">PDF</option>
              <option value="image">Kép (JPG/PNG)</option>
            </select>
          </label>
          {exKind === "url" ? (
            <label><span>URL</span>
              <input type="url" value={exUrl} onChange={(e) => setExUrl(e.target.value)} placeholder="https://…" />
            </label>
          ) : (
            <label><span>Fájl</span>
              <input type="file" accept={exKind === "pdf" ? "application/pdf" : "image/jpeg,image/png,image/webp"} onChange={(e) => setExFile(e.target.files?.[0] ?? null)} />
            </label>
          )}
        </div>
        {exErr ? <div className="err" style={{ marginTop: 8 }}>{exErr}</div> : null}
        <div className="cms-actions" style={{ marginTop: 8 }}>
          <button className="cms-btn ghost" onClick={extract} disabled={exBusy}>{exStep ?? "Kinyerés"}</button>
        </div>
      </div>

      {/* ── Basic info ── */}
      <h2>Alapadatok</h2>
      <div className="row3">
        <label><span>Márka *</span>
          <select value={v.brand_id} onChange={(e) => set("brand_id", e.target.value)}>
            <option value="">— válassz —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label><span>Kereskedés neve *</span>
          <input value={v.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label><span>Város *</span>
          <input value={v.city} onChange={(e) => set("city", e.target.value)} />
        </label>
      </div>
      <div className="row3">
        <label><span>Irányítószám</span>
          <input value={v.zip_code} onChange={(e) => set("zip_code", e.target.value)} placeholder="1234" />
        </label>
        <label style={{ gridColumn: "span 2" }}><span>Utca, házszám</span>
          <input value={v.street} onChange={(e) => set("street", e.target.value)} placeholder="Váci út 15" />
        </label>
      </div>

      <h2>Elérhetőség</h2>
      <div className="row3">
        <label><span>Telefon</span>
          <input value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+36 1 234 5678" />
        </label>
        <label><span>E-mail</span>
          <input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label><span>Honlap</span>
          <input value={v.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
        </label>
      </div>

      <h2>GPS koordináta</h2>
      <div className="row3">
        <label><span>Szélességi fok (lat)</span>
          <input value={v.lat} onChange={(e) => set("lat", e.target.value)} placeholder="47.4979" />
        </label>
        <label><span>Hosszúsági fok (lng)</span>
          <input value={v.lng} onChange={(e) => set("lng", e.target.value)} placeholder="19.0402" />
        </label>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
          <button type="button" className="cms-btn ghost" onClick={geocode} title="Cím alapján keres GPS koordinátát (OpenStreetMap)">
            📍 Geokódolás
          </button>
        </div>
      </div>

      {/* ── Contacts ── */}
      <h2>Kontaktszemélyek</h2>
      {v.contacts.map((c, i) => (
        <div key={i} className="cms-card" style={{ padding: "12px 14px", marginBottom: 8 }}>
          <div className="row3" style={{ marginBottom: 0 }}>
            <label><span>Név</span>
              <input value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} />
            </label>
            <label><span>Pozíció</span>
              <input value={c.position} onChange={(e) => setContact(i, { position: e.target.value })} placeholder="Értékesítési vezető" />
            </label>
            <label><span>Telefon</span>
              <input value={c.phone} onChange={(e) => setContact(i, { phone: e.target.value })} />
            </label>
          </div>
          <div className="row2" style={{ marginTop: 8, marginBottom: 0 }}>
            <label><span>E-mail</span>
              <input type="email" value={c.email} onChange={(e) => setContact(i, { email: e.target.value })} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="button" className="cms-btn danger" style={{ fontSize: 12 }} onClick={() => removeContact(i)}>Törlés</button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="cms-btn ghost" onClick={addContact}>+ Kontakt hozzáadása</button>

      <h2>Egyéb</h2>
      <label><span>Megjegyzés</span>
        <input value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </label>
      <div className="row2">
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={v.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          <span style={{ textTransform: "none", letterSpacing: 0 }}>Aktív (publikusan látható)</span>
        </label>
        <label><span>Sorrend</span>
          <input type="number" value={v.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} style={{ width: 80 }} />
        </label>
      </div>

      <div className="cms-actions">
        <button className="cms-btn primary" onClick={save} disabled={busy}>{busy ? "Mentés…" : mode === "create" ? "Létrehozás" : "Mentés"}</button>
        {mode === "edit" && v.id ? (
          <button className="cms-btn danger" onClick={del} disabled={busy}>Törlés</button>
        ) : null}
      </div>
    </div>
  );
}
