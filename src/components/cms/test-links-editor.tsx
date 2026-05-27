"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Plus, Trash2, Check, FileText, PlayCircle } from "lucide-react";

type LinkRow = {
  id: string;
  url: string;
  title: string | null;
  source_name: string | null;
  kind: "article" | "video";
  is_approved: boolean;
  found_by: "manual" | "auto";
};

export function TestLinksEditor({ modelId }: { modelId: string }) {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<"article" | "video">("article");
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/test-links");
      const json = await res.json();
      // Filter to this model's links (approved + pending)
      const allLinks: (LinkRow & { model_id: string })[] =
        Array.isArray(json?.pending) ? json.pending : [];
      // Also fetch approved — we'll get them from the model list
      const modelRes = json?.models?.find(
        (m: { id: string }) => m.id === modelId
      );
      // Reload just this model's links directly
      const r2 = await fetch(`/api/models/${modelId}/test-links`);
      const approved: LinkRow[] = await r2.json().catch(() => []);
      const pending = allLinks
        .filter((l) => l.model_id === modelId)
        .map((l) => ({ ...l, is_approved: false as const }));
      setLinks([...approved.map((l) => ({ ...l, found_by: l.found_by ?? "manual" as const })), ...pending]);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [modelId]);

  async function addLink() {
    if (!newUrl.trim()) return;
    setAdding(true);
    setAddErr("");
    try {
      const res = await fetch("/api/cms/test-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: modelId,
          url: newUrl.trim(),
          title: newTitle.trim() || null,
          kind: newKind,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNewUrl("");
      setNewTitle("");
      setNewKind("article");
      await load();
    } catch (e: unknown) {
      setAddErr(e instanceof Error ? e.message : "Hiba");
    }
    setAdding(false);
  }

  async function approve(id: string) {
    await fetch(`/api/cms/test-links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: true }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Biztosan törlöd ezt a linket?")) return;
    await fetch(`/api/cms/test-links/${id}`, { method: "DELETE" });
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  const approved = links.filter((l) => l.is_approved);
  const pending = links.filter((l) => !l.is_approved);

  return (
    <div className="cms-section">
      <div className="cms-section-head">
        <h3>Tesztlinkek</h3>
        <span className="cms-section-meta">
          {approved.length} jóváhagyott
          {pending.length > 0 && `, ${pending.length} várakozik`}
        </span>
      </div>

      {/* Add new link form */}
      <div className="tle-add-form">
        <div className="tle-add-row">
          <input
            type="url"
            placeholder="https://vezess.hu/tesztek/…"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="tle-url-input"
            onKeyDown={(e) => { if (e.key === "Enter") addLink(); }}
          />
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as "article" | "video")}
            className="tle-kind-select"
          >
            <option value="article">Cikk</option>
            <option value="video">Videó</option>
          </select>
        </div>
        <div className="tle-add-row">
          <input
            type="text"
            placeholder="Cím (opcionális — ha üres, az URL-ből automatikus)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="tle-title-input"
            onKeyDown={(e) => { if (e.key === "Enter") addLink(); }}
          />
          <button
            type="button"
            className="cms-btn primary"
            onClick={addLink}
            disabled={adding || !newUrl.trim()}
          >
            <Plus size={14} />
            {adding ? "Hozzáadás…" : "Hozzáad"}
          </button>
        </div>
        {addErr && <div className="tle-err">{addErr}</div>}
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8", fontSize: 13 }}>Betöltés…</div>
      ) : (
        <>
          {/* Approved links */}
          {approved.length > 0 && (
            <div className="tle-group">
              <div className="tle-group-head">Publikus (jóváhagyott)</div>
              {approved.map((l) => (
                <LinkRow key={l.id} link={l} onRemove={remove} />
              ))}
            </div>
          )}

          {/* Pending links (auto-found, awaiting approval) */}
          {pending.length > 0 && (
            <div className="tle-group">
              <div className="tle-group-head tle-group-head--pending">
                Jóváhagyásra vár ({pending.length} — auto-keresésből)
              </div>
              {pending.map((l) => (
                <LinkRow key={l.id} link={l} onApprove={approve} onRemove={remove} />
              ))}
            </div>
          )}

          {links.length === 0 && (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              Még nincs tesztlink rögzítve ehhez a modellhez.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LinkRow({
  link,
  onApprove,
  onRemove,
}: {
  link: LinkRow;
  onApprove?: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const Icon = link.kind === "video" ? PlayCircle : FileText;
  return (
    <div className={`tle-row${!link.is_approved ? " tle-row--pending" : ""}`}>
      <Icon size={14} className="tle-row-icon" />
      <div className="tle-row-body">
        <span className="tle-row-source">{link.source_name ?? "—"}</span>
        <span className="tle-row-title">{link.title || link.url.slice(0, 60)}</span>
      </div>
      <div className="tle-row-actions">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="cms-btn ghost"
          title="Megnyitás új lapon"
        >
          <ExternalLink size={12} />
        </a>
        {!link.is_approved && onApprove && (
          <button
            type="button"
            className="cms-btn primary"
            onClick={() => onApprove(link.id)}
            title="Jóváhagy"
          >
            <Check size={12} />
            Jóváhagy
          </button>
        )}
        <button
          type="button"
          className="cms-btn danger"
          onClick={() => onRemove(link.id)}
          title="Törlés"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
