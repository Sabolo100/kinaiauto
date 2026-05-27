"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ExternalLink,
  FileText,
  Loader2,
  PlayCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ModelMeta = {
  id: string;
  name: string;
  slug: string;
  brand: { id: string; name: string; slug: string } | null;
  approved: number;
  pending: number;
};

type PendingLink = {
  id: string;
  model_id: string;
  url: string;
  title: string | null;
  source_name: string | null;
  kind: "article" | "video";
  found_by: "manual" | "auto";
};

type JobStatus = {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  current_model: string | null;
  progress: Record<string, { found: number; done: boolean }>;
  total_found: number;
  model_ids: string[];
  error_msg: string | null;
};

type SortKey = "brand" | "model" | "approved" | "pending";
type SortDir = "asc" | "desc";

// ─── Main component ───────────────────────────────────────────────────────────
export function TestLinksSearchPage() {
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [pending, setPending] = useState<PendingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("brand");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [job, setJob] = useState<JobStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/test-links");
      const json = await res.json();
      setModels(json.models ?? []);
      setPending(json.pending ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Polling for active job ─────────────────────────────────────────────────
  function startPolling(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/cms/test-links/search/${jobId}`);
        const data: JobStatus = await res.json();
        setJob(data);
        if (data.status === "completed" || data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          await load(); // refresh model list + pending links
        }
      } catch {}
    }, 2500);
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Sorting ────────────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = models
    .filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.brand?.name ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "brand") cmp = (a.brand?.name ?? "").localeCompare(b.brand?.name ?? "", "hu") || a.name.localeCompare(b.name, "hu");
      else if (sortKey === "model") cmp = a.name.localeCompare(b.name, "hu");
      else if (sortKey === "approved") cmp = a.approved - b.approved;
      else if (sortKey === "pending") cmp = a.pending - b.pending;
      return sortDir === "asc" ? cmp : -cmp;
    });

  // ── Selection helpers ──────────────────────────────────────────────────────
  function toggleModel(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectWithoutLinks() {
    const ids = filtered.filter((m) => m.approved === 0 && m.pending === 0).map((m) => m.id);
    setSelected(new Set(ids));
  }
  function clearSelection() { setSelected(new Set()); }
  function toggleAll() {
    if (selected.size === filtered.length) clearSelection();
    else setSelected(new Set(filtered.map((m) => m.id)));
  }

  // ── Start search ───────────────────────────────────────────────────────────
  async function startSearch() {
    if (selected.size === 0) return;
    setStarting(true);
    try {
      // 1. Create the job record
      const res = await fetch("/api/cms/test-links/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_ids: Array.from(selected) }),
      });
      const json = await res.json();
      if (json.jobId) {
        const jobId: string = json.jobId;
        const modelIds = Array.from(selected);

        setJob({ id: jobId, status: "pending", current_model: null, progress: {}, total_found: 0, model_ids: modelIds, error_msg: null });
        clearSelection();

        // 2. Trigger the /run endpoint from the browser (fire-and-forget).
        //    The browser keeps the request alive independently of React rendering.
        //    We don't await this — it runs in the background while we poll.
        fetch(`/api/cms/test-links/search/${jobId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true, // ensures request survives page navigation
        }).catch(() => {});

        // 3. Start polling for progress
        startPolling(jobId);
      }
    } catch {}
    setStarting(false);
  }

  // ── Approve / reject pending link ──────────────────────────────────────────
  async function approveLink(id: string) {
    await fetch(`/api/cms/test-links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: true }),
    });
    setPending((prev) => prev.filter((l) => l.id !== id));
    setModels((prev) => prev.map((m) => {
      const link = pending.find((l) => l.id === id);
      if (!link || m.id !== link.model_id) return m;
      return { ...m, approved: m.approved + 1, pending: Math.max(0, m.pending - 1) };
    }));
  }

  async function rejectLink(id: string) {
    await fetch(`/api/cms/test-links/${id}`, { method: "DELETE" });
    setPending((prev) => prev.filter((l) => l.id !== id));
    setModels((prev) => prev.map((m) => {
      const link = pending.find((l) => l.id === id);
      if (!link || m.id !== link.model_id) return m;
      return { ...m, pending: Math.max(0, m.pending - 1) };
    }));
  }

  // ── Th helper ─────────────────────────────────────────────────────────────
  function Th({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    const Icon = active ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
    return (
      <th className="cms-th-sort" onClick={() => toggleSort(col)} aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
        {label} <Icon size={11} className={active ? undefined : "cms-th-sort-idle"} />
      </th>
    );
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  const jobModelCount = job?.model_ids?.length ?? 0;
  const doneCount = job ? Object.values(job.progress).filter((p) => p.done).length : 0;
  const pct = jobModelCount > 0 ? Math.round((doneCount / jobModelCount) * 100) : 0;
  const isJobRunning = job && (job.status === "pending" || job.status === "running");

  // Group pending links by model
  const pendingByModel = pending.reduce<Record<string, { modelMeta: ModelMeta | undefined; links: PendingLink[] }>>((acc, l) => {
    if (!acc[l.model_id]) {
      acc[l.model_id] = { modelMeta: models.find((m) => m.id === l.model_id), links: [] };
    }
    acc[l.model_id].links.push(l);
    return acc;
  }, {});

  return (
    <div className="tls-mgr">
      {/* ── Job progress banner ─────────────────────────────────────────────── */}
      {job && (
        <div className={`tls-job-banner${job.status === "completed" ? " done" : job.status === "failed" ? " error" : ""}`}>
          <div className="tls-job-top">
            {isJobRunning ? <Loader2 size={15} className="tls-spinner" /> : job.status === "completed" ? <Check size={15} /> : <X size={15} />}
            <span>
              {job.status === "pending" && "Keresés előkészítése…"}
              {job.status === "running" && (
                <>Keresés folyamatban — most: <strong>{job.current_model ?? "…"}</strong> · {doneCount}/{jobModelCount} modell · {job.total_found} link találva</>
              )}
              {job.status === "completed" && (
                <>Keresés kész — összesen {job.total_found} új link találva ({jobModelCount} modellnél)</>
              )}
              {job.status === "failed" && `Hiba: ${job.error_msg ?? "ismeretlen"}`}
            </span>
            {(job.status === "completed" || job.status === "failed") && (
              <button type="button" className="tls-job-close" onClick={() => setJob(null)}><X size={13} /></button>
            )}
          </div>
          {isJobRunning && (
            <div className="tls-job-bar">
              <div className="tls-job-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      )}

      {/* ── Pending approvals ─────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="cms-card tls-pending-section">
          <div className="tls-pending-head">
            <h2>Jóváhagyásra váró linkek</h2>
            <span className="pill">{pending.length}</span>
          </div>
          {Object.entries(pendingByModel).map(([modelId, { modelMeta, links }]) => (
            <div key={modelId} className="tls-pending-group">
              <div className="tls-pending-model">
                {modelMeta?.brand?.name} <strong>{modelMeta?.name}</strong>
              </div>
              {links.map((l) => (
                <div key={l.id} className="tls-pending-row">
                  {l.kind === "video" ? <PlayCircle size={13} /> : <FileText size={13} />}
                  <div className="tls-pending-meta">
                    <span className="tls-source-badge">{l.source_name ?? "?"}</span>
                    <span className="tls-pending-title">{l.title || l.url.slice(0, 70)}</span>
                  </div>
                  <div className="tls-pending-actions">
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="cms-btn ghost" title="Megnyitás">
                      <ExternalLink size={12} />
                    </a>
                    <button type="button" className="cms-btn primary" onClick={() => approveLink(l.id)}>
                      <Check size={12} /> Jóváhagy
                    </button>
                    <button type="button" className="cms-btn danger" onClick={() => rejectLink(l.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Model list ────────────────────────────────────────────────────── */}
      <div className="cms-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tls-toolbar">
          <input
            type="search"
            placeholder="Keresés márka, modell…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tls-search"
          />
          <div style={{ flex: 1 }} />
          <button type="button" className="cms-btn ghost" onClick={selectWithoutLinks} disabled={!!isJobRunning}>
            Jelöld ki a link nélkülieket
          </button>
          <button type="button" className="cms-btn ghost" onClick={clearSelection} disabled={selected.size === 0}>
            Jelölés törlése
          </button>
          <button
            type="button"
            className="cms-btn primary"
            onClick={startSearch}
            disabled={selected.size === 0 || !!isJobRunning || starting}
          >
            <Search size={14} />
            {starting ? "Indítás…" : `Tesztlinkek keresése (${selected.size} modell)`}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Betöltés…</div>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
                  />
                </th>
                <Th col="brand" label="Márka" />
                <Th col="model" label="Modell" />
                <Th col="approved" label="Jóváhagyott" />
                <Th col="pending" label="Várakozik" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ color: "#94a3b8" }}>Nincs találat.</td></tr>
              )}
              {filtered.map((m) => (
                <tr key={m.id} className={selected.has(m.id) ? "tls-row-selected" : undefined} onClick={() => toggleModel(m.id)} style={{ cursor: "pointer" }}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleModel(m.id)} readOnly />
                  </td>
                  <td style={{ color: "#cbd5e1" }}>{m.brand?.name ?? "—"}</td>
                  <td><strong>{m.name}</strong></td>
                  <td>
                    {m.approved > 0
                      ? <span className="pill ok">{m.approved} link</span>
                      : <span className="pill muted">nincs</span>}
                  </td>
                  <td>
                    {m.pending > 0
                      ? <span className="pill warn">{m.pending} várakozik</span>
                      : <span style={{ color: "#475569", fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
