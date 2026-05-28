"use client";

import { useCallback, useEffect, useRef, useState, Fragment } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
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

type LinkRow = {
  id: string;
  model_id: string;
  url: string;
  title: string | null;
  source_name: string | null;
  kind: "article" | "video";
  found_by: "manual" | "auto";
  ai_ok: boolean | null;
  ai_summary: string | null;
  is_approved: boolean;
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
  // pendingLinks: all unapproved links, keyed by model_id for fast lookup
  const [pendingByModel, setPendingByModel] = useState<Record<string, LinkRow[]>>({});
  // approvedLinks: loaded on demand when a model row is expanded
  const [approvedByModel, setApprovedByModel] = useState<Record<string, LinkRow[]>>({});
  const [loadingLinks, setLoadingLinks] = useState<Set<string>>(new Set());
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("brand");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [job, setJob] = useState<JobStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/test-links");
      const json = await res.json();
      setModels(json.models ?? []);
      // Build pendingByModel map
      const raw: LinkRow[] = (json.pending ?? []).map((l: LinkRow) => ({
        ...l,
        is_approved: false,
      }));
      const byModel: Record<string, LinkRow[]> = {};
      for (const l of raw) {
        if (!byModel[l.model_id]) byModel[l.model_id] = [];
        byModel[l.model_id].push(l);
      }
      setPendingByModel(byModel);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Load approved links for a model (on demand) ───────────────────────────
  async function loadApproved(modelId: string) {
    if (approvedByModel[modelId] !== undefined) return; // already loaded
    setLoadingLinks((prev) => new Set(prev).add(modelId));
    try {
      const res = await fetch(`/api/models/${modelId}/test-links`);
      const data: LinkRow[] = await res.json();
      setApprovedByModel((prev) => ({
        ...prev,
        [modelId]: data.map((l) => ({ ...l, model_id: modelId, is_approved: true })),
      }));
    } catch {
      setApprovedByModel((prev) => ({ ...prev, [modelId]: [] }));
    }
    setLoadingLinks((prev) => {
      const next = new Set(prev);
      next.delete(modelId);
      return next;
    });
  }

  // ── Expand toggle ─────────────────────────────────────────────────────────
  function toggleExpand(modelId: string) {
    setExpandedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
        loadApproved(modelId);
      }
      return next;
    });
  }

  // ── Polling ───────────────────────────────────────────────────────────────
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
          await load();
          // Auto-expand models that got new links
          const newModels = Object.entries(data.progress)
            .filter(([, p]) => p.found > 0)
            .map(([id]) => id);
          if (newModels.length > 0) {
            setExpandedModels(new Set(newModels));
            // Clear approved cache for those models so fresh data loads
            setApprovedByModel((prev) => {
              const next = { ...prev };
              for (const id of newModels) delete next[id];
              return next;
            });
            for (const id of newModels) loadApproved(id);
          }
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
        fetch(`/api/cms/test-links/search/${jobId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
        startPolling(jobId);
      }
    } catch {}
    setStarting(false);
  }

  // ── Approve / reject pending link ──────────────────────────────────────────
  async function approveLink(link: LinkRow) {
    await fetch(`/api/cms/test-links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: true }),
    });
    // Move from pending to approved in local state
    setPendingByModel((prev) => {
      const next = { ...prev };
      next[link.model_id] = (next[link.model_id] ?? []).filter((l) => l.id !== link.id);
      return next;
    });
    setApprovedByModel((prev) => ({
      ...prev,
      [link.model_id]: [
        ...(prev[link.model_id] ?? []),
        { ...link, is_approved: true },
      ],
    }));
    setModels((prev) => prev.map((m) =>
      m.id !== link.model_id ? m
        : { ...m, approved: m.approved + 1, pending: Math.max(0, m.pending - 1) }
    ));
  }

  async function rejectLink(link: LinkRow) {
    await fetch(`/api/cms/test-links/${link.id}`, { method: "DELETE" });
    setPendingByModel((prev) => {
      const next = { ...prev };
      next[link.model_id] = (next[link.model_id] ?? []).filter((l) => l.id !== link.id);
      return next;
    });
    setModels((prev) => prev.map((m) =>
      m.id !== link.model_id ? m
        : { ...m, pending: Math.max(0, m.pending - 1) }
    ));
  }

  async function removeApproved(link: LinkRow) {
    await fetch(`/api/cms/test-links/${link.id}`, { method: "DELETE" });
    setApprovedByModel((prev) => ({
      ...prev,
      [link.model_id]: (prev[link.model_id] ?? []).filter((l) => l.id !== link.id),
    }));
    setModels((prev) => prev.map((m) =>
      m.id !== link.model_id ? m
        : { ...m, approved: Math.max(0, m.approved - 1) }
    ));
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

  // Total pending count across all models
  const totalPending = Object.values(pendingByModel).reduce((s, arr) => s + arr.length, 0);

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
          {totalPending > 0 && (
            <span className="pill warn" style={{ fontSize: 12 }}>
              {totalPending} jóváhagyásra vár
            </span>
          )}
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
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ color: "#94a3b8" }}>Nincs találat.</td></tr>
              )}
              {filtered.map((m) => {
                const isExpanded = expandedModels.has(m.id);
                const pendingLinks = pendingByModel[m.id] ?? [];
                const approvedLinks = approvedByModel[m.id];
                const isLoadingLinks = loadingLinks.has(m.id);
                const hasPending = pendingLinks.length > 0;

                return (
                  <Fragment key={m.id}>
                    {/* ── Model row ── */}
                    <tr
                      className={`${selected.has(m.id) ? "tls-row-selected" : ""} ${isExpanded ? "tls-row-expanded" : ""}`}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(m.id)}
                          onChange={() => toggleModel(m.id)}
                        />
                      </td>
                      <td style={{ color: "#cbd5e1" }}>{m.brand?.name ?? "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="tls-model-expand-btn"
                          onClick={() => toggleExpand(m.id)}
                          title={isExpanded ? "Bezár" : "Linkek megtekintése"}
                        >
                          <strong>{m.name}</strong>
                          {isExpanded
                            ? <ChevronDown size={13} style={{ marginLeft: 6, color: "#64748b" }} />
                            : <ChevronRight size={13} style={{ marginLeft: 6, color: "#475569" }} />}
                        </button>
                      </td>
                      <td>
                        {m.approved > 0
                          ? <span className="pill ok">{m.approved} link</span>
                          : <span className="pill muted">nincs</span>}
                      </td>
                      <td>
                        {hasPending
                          ? <span className="pill warn">{pendingLinks.length} várakozik</span>
                          : m.pending > 0
                            ? <span className="pill warn">{m.pending} várakozik</span>
                            : <span style={{ color: "#475569", fontSize: 12 }}>—</span>}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="tls-expand-icon-btn"
                          onClick={() => toggleExpand(m.id)}
                          aria-label={isExpanded ? "Bezár" : "Kinyit"}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>
                    </tr>

                    {/* ── Expanded links section ── */}
                    {isExpanded && (
                      <tr className="tls-expanded-row">
                        <td colSpan={6} style={{ padding: 0 }}>
                          <div className="tls-links-panel">
                            {isLoadingLinks && !approvedLinks ? (
                              <div className="tls-links-loading">
                                <Loader2 size={13} className="tls-spinner" /> Linkek betöltése…
                              </div>
                            ) : (
                              <>
                                {/* Pending links */}
                                {pendingLinks.length > 0 && (
                                  <div className="tls-links-group">
                                    <div className="tls-links-group-head tls-links-group-head--pending">
                                      Jóváhagyásra vár ({pendingLinks.length})
                                    </div>
                                    {pendingLinks.map((l) => (
                                      <LinkItem
                                        key={l.id}
                                        link={l}
                                        onApprove={() => approveLink(l)}
                                        onReject={() => rejectLink(l)}
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Approved links */}
                                {approvedLinks && approvedLinks.length > 0 && (
                                  <div className="tls-links-group">
                                    <div className="tls-links-group-head">
                                      Jóváhagyott ({approvedLinks.length})
                                    </div>
                                    {approvedLinks.map((l) => (
                                      <LinkItem
                                        key={l.id}
                                        link={l}
                                        onRemove={() => removeApproved(l)}
                                      />
                                    ))}
                                  </div>
                                )}

                                {pendingLinks.length === 0 && (!approvedLinks || approvedLinks.length === 0) && (
                                  <div className="tls-links-empty">
                                    Még nincs tesztlink ehhez a modellhez.
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── LinkItem subcomponent ─────────────────────────────────────────────────────
function LinkItem({
  link,
  onApprove,
  onReject,
  onRemove,
}: {
  link: LinkRow;
  onApprove?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
}) {
  const Icon = link.kind === "video" ? PlayCircle : FileText;
  const isPending = !!onApprove;

  return (
    <div className={`tls-link-item${isPending ? " tls-link-item--pending" : ""}`}>
      <Icon size={13} className="tls-link-icon" />
      <div className="tls-link-meta">
        <span className="tls-source-badge">{link.source_name ?? "?"}</span>
        <span className="tls-pending-title">{link.title || link.url.slice(0, 70)}</span>
        {link.ai_summary && (
          <span className="tls-ai-summary">✦ {link.ai_summary}</span>
        )}
      </div>
      <div className="tls-pending-actions">
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="cms-btn ghost" title="Megnyitás">
          <ExternalLink size={12} />
        </a>
        {onApprove && (
          <button type="button" className="cms-btn primary" onClick={onApprove}>
            <Check size={12} /> Jóváhagy
          </button>
        )}
        {(onReject || onRemove) && (
          <button type="button" className="cms-btn danger" onClick={onReject ?? onRemove}>
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
