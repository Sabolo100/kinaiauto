"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Loader2,
  Newspaper,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type BrandLite = { id: string; name: string; slug: string; importer_site: string | null };

type Source = {
  url: string;
  title: string | null;
  date: string | null;
  kind: "official" | "news" | "other";
};

type Candidate = {
  id: string;
  brand_id: string;
  name: string;
  category_guess: string | null;
  drive_guess: string | null;
  reason: string | null;
  sources: Source[];
  confidence: "high" | "medium" | "low";
  brand: { id: string; name: string; slug: string } | null;
};

type ExistingModel = { id: string; name: string; slug: string };

type JobStatus = {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  current_brand: string | null;
  progress: Record<string, { found: number; done: boolean; error?: string }>;
  total_found: number;
  brand_ids: string[];
  error_msg: string | null;
};

type Provider = "perplexity" | "serper+claude" | "none";

// ─── Component ─────────────────────────────────────────────────────────────────
export function ModelDiscoveryPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandLite[]>([]);
  const [existingByBrand, setExistingByBrand] = useState<Record<string, ExistingModel[]>>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [provider, setProvider] = useState<Provider>("none");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [promoting, setPromoting] = useState<Set<string>>(new Set());
  const [popupBrand, setPopupBrand] = useState<BrandLite | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cms/model-discovery");
      const json = await res.json();
      const b: BrandLite[] = json.brands ?? [];
      setBrands(b);
      setExistingByBrand(json.existingByBrand ?? {});
      setCandidates(json.candidates ?? []);
      setProvider(json.provider ?? "none");
      // Default: all brands selected for the next search
      setSelected((prev) => (prev.size === 0 ? new Set(b.map((x) => x.id)) : prev));
      // Resume polling if a job is still running
      const lj: JobStatus | null = json.latestJob ?? null;
      if (lj && (lj.status === "pending" || lj.status === "running")) {
        setJob(lj);
        startPolling(lj.id);
      }
    } catch {}
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Polling ───────────────────────────────────────────────────────────────
  function startPolling(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/cms/model-discovery/search/${jobId}`);
        const data: JobStatus = await res.json();
        setJob(data);
        if (data.status === "completed" || data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          await load();
        }
      } catch {}
    }, 2500);
  }

  // ── Brand selection ─────────────────────────────────────────────────────────
  function toggleBrand(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const allSelected = brands.length > 0 && selected.size === brands.length;
  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(brands.map((b) => b.id)));
  }

  // ── Start search ─────────────────────────────────────────────────────────────
  async function startSearch() {
    if (selected.size === 0) return;
    setStarting(true);
    try {
      const res = await fetch("/api/cms/model-discovery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_ids: Array.from(selected) }),
      });
      const json = await res.json();
      if (json.jobId) {
        const jobId: string = json.jobId;
        setJob({
          id: jobId,
          status: "pending",
          current_brand: null,
          progress: {},
          total_found: 0,
          brand_ids: Array.from(selected),
          error_msg: null,
        });
        fetch(`/api/cms/model-discovery/search/${jobId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
        startPolling(jobId);
      }
    } catch {}
    setStarting(false);
  }

  // ── Promote / dismiss ─────────────────────────────────────────────────────────
  async function promote(c: Candidate) {
    setPromoting((prev) => new Set(prev).add(c.id));
    try {
      const res = await fetch(`/api/cms/model-discovery/${c.id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.model_id) {
        router.push(`/c4m5s6/modellek/${json.model_id}`);
        return;
      }
      alert(json.error ?? "Az átemelés nem sikerült.");
    } catch {
      alert("Az átemelés nem sikerült.");
    }
    setPromoting((prev) => { const n = new Set(prev); n.delete(c.id); return n; });
  }

  async function dismiss(c: Candidate) {
    setCandidates((prev) => prev.filter((x) => x.id !== c.id));
    try {
      await fetch(`/api/cms/model-discovery/${c.id}`, { method: "DELETE" });
    } catch {}
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const jobBrandCount = job?.brand_ids?.length ?? 0;
  const doneCount = job ? Object.values(job.progress).filter((p) => p.done).length : 0;
  const pct = jobBrandCount > 0 ? Math.round((doneCount / jobBrandCount) * 100) : 0;
  const isJobRunning = job && (job.status === "pending" || job.status === "running");

  // Candidates grouped by brand for display, brand order from `brands`
  const byBrandName = (c: Candidate) => c.brand?.name ?? brands.find((b) => b.id === c.brand_id)?.name ?? "—";

  return (
    <div className="mdisc">
      {/* ── Provider notice ───────────────────────────────────────────────── */}
      {provider === "none" ? (
        <div className="mdisc-provider warn">
          <AlertTriangle size={15} />
          <span>
            Nincs kutatási API beállítva. Add meg a <code>PERPLEXITY_API_KEY</code> környezeti
            változót (ajánlott), vagy a <code>SERPER_API_KEY</code> + <code>ANTHROPIC_API_KEY</code> párost.
            A kulcs szerveroldali titok — sosem kerül ki a böngészőbe.
          </span>
        </div>
      ) : (
        <div className="mdisc-provider">
          <Sparkles size={14} />
          <span>Kutatómotor: <strong>{provider === "perplexity" ? "Perplexity (sonar)" : "Serper + Claude"}</strong></span>
        </div>
      )}

      {/* ── Search launcher ───────────────────────────────────────────────── */}
      <div className="cms-card mdisc-launch">
        <div className="mdisc-launch-head">
          <div>
            <strong>Mely márkáknál keressen?</strong>
            <div className="mdisc-muted">Alapból minden aktív márka ki van jelölve.</div>
          </div>
          <div className="mdisc-launch-actions">
            <button type="button" className="cms-btn ghost" onClick={toggleAll} disabled={!!isJobRunning}>
              {allSelected ? "Egyik se" : "Mind"}
            </button>
            <button
              type="button"
              className="cms-btn primary"
              onClick={startSearch}
              disabled={selected.size === 0 || !!isJobRunning || starting || provider === "none"}
            >
              {starting || isJobRunning ? <Loader2 size={14} className="tls-spinner" /> : <Search size={14} />}
              {isJobRunning ? "Keresés folyamatban…" : `Új modellek keresése (${selected.size} márka)`}
            </button>
          </div>
        </div>
        <div className="mdisc-brand-chips">
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`mdisc-chip${selected.has(b.id) ? " on" : ""}`}
              onClick={() => toggleBrand(b.id)}
              disabled={!!isJobRunning}
            >
              {selected.has(b.id) && <Check size={12} />}
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Job progress banner ───────────────────────────────────────────── */}
      {job && (
        <div className={`tls-job-banner${job.status === "completed" ? " done" : job.status === "failed" ? " error" : ""}`}>
          <div className="tls-job-top">
            {isJobRunning ? <Loader2 size={15} className="tls-spinner" /> : job.status === "completed" ? <Check size={15} /> : <X size={15} />}
            <span>
              {job.status === "pending" && "Keresés előkészítése…"}
              {job.status === "running" && (
                <>Keresés folyamatban — most: <strong>{job.current_brand ?? "…"}</strong> · {doneCount}/{jobBrandCount} márka · {job.total_found} új modell</>
              )}
              {job.status === "completed" && <>Keresés kész — {job.total_found} új modell a munkatáblában ({jobBrandCount} márka átvizsgálva)</>}
              {job.status === "failed" && `Hiba: ${job.error_msg ?? "ismeretlen"}`}
            </span>
            {(job.status === "completed" || job.status === "failed") && (
              <button type="button" className="tls-job-close" onClick={() => setJob(null)}><X size={13} /></button>
            )}
          </div>
          {isJobRunning && (
            <div className="tls-job-bar"><div className="tls-job-bar-fill" style={{ width: `${pct}%` }} /></div>
          )}
        </div>
      )}

      {/* ── Work table ────────────────────────────────────────────────────── */}
      <div className="cms-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="mdisc-table-head">
          <Layers size={14} />
          Munkatábla — talált új modellek
          {candidates.length > 0 && <span className="pill warn" style={{ fontSize: 12 }}>{candidates.length}</span>}
        </div>

        {loading ? (
          <div className="mdisc-empty">Betöltés…</div>
        ) : candidates.length === 0 ? (
          <div className="mdisc-empty">
            Még nincs talált modell. Jelöld ki a márkákat és indíts egy keresést — a
            rendszer az adatbázisban még nem szereplő modelleket gyűjti ide.
          </div>
        ) : (
          <table className="cms-table mdisc-tbl">
            <thead>
              <tr>
                <th>Márka</th>
                <th>Modell</th>
                <th style={{ width: 110 }}>Megbízhatóság</th>
                <th>Források</th>
                <th style={{ width: 220 }}>Művelet</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const isPromoting = promoting.has(c.id);
                const conf = c.confidence;
                return (
                  <tr key={c.id}>
                    <td style={{ color: "#cbd5e1", whiteSpace: "nowrap" }}>{byBrandName(c)}</td>
                    <td>
                      <strong>{c.name}</strong>
                      {(c.category_guess || c.drive_guess) && (
                        <div className="mdisc-guess">
                          {[c.drive_guess, c.category_guess].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      {c.reason && <div className="mdisc-reason">✦ {c.reason}</div>}
                    </td>
                    <td>
                      <span className={`pill ${conf === "high" ? "ok" : conf === "low" ? "muted" : "warn"}`}>
                        {conf === "high" ? "magas" : conf === "low" ? "alacsony" : "közepes"}
                      </span>
                    </td>
                    <td>
                      {c.sources.length === 0 ? (
                        <span className="mdisc-muted">nincs forrás</span>
                      ) : (
                        <div className="mdisc-sources">
                          {c.sources.map((s, i) => (
                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className={`mdisc-src ${s.kind}`}>
                              {s.kind === "official" ? <Globe size={12} /> : s.kind === "news" ? <Newspaper size={12} /> : <FileText size={12} />}
                              <span className="mdisc-src-host">{hostOf(s.url)}</span>
                              {s.date && <span className="mdisc-src-date">{fmtDate(s.date)}</span>}
                              <ExternalLink size={10} className="mdisc-src-ext" />
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="mdisc-actions">
                        <button
                          type="button"
                          className="cms-btn ghost mdisc-list-btn"
                          title="Jelenlegi modellek ennél a márkánál"
                          onClick={() => setPopupBrand(brands.find((b) => b.id === c.brand_id) ?? { id: c.brand_id, name: byBrandName(c), slug: "", importer_site: null })}
                        >
                          <Layers size={13} />
                        </button>
                        <button type="button" className="cms-btn primary" onClick={() => promote(c)} disabled={isPromoting}>
                          {isPromoting ? <Loader2 size={12} className="tls-spinner" /> : <ArrowRight size={12} />}
                          Átemelés
                        </button>
                        <button type="button" className="cms-btn danger" onClick={() => dismiss(c)} title="Elvetés">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Current-models popup ──────────────────────────────────────────── */}
      {popupBrand && (
        <div className="mdisc-modal-overlay" onClick={() => setPopupBrand(null)}>
          <div className="mdisc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mdisc-modal-head">
              <strong>{popupBrand.name} — jelenlegi modellek</strong>
              <button type="button" className="tls-job-close" onClick={() => setPopupBrand(null)}><X size={15} /></button>
            </div>
            <div className="mdisc-modal-body">
              {(existingByBrand[popupBrand.id] ?? []).length === 0 ? (
                <div className="mdisc-muted">Ennél a márkánál még nincs modell az adatbázisban.</div>
              ) : (
                <ul className="mdisc-model-list">
                  {(existingByBrand[popupBrand.id] ?? []).map((m) => (
                    <li key={m.id}>{m.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 24);
  }
}
function fmtDate(d: string): string {
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d.slice(0, 10);
  return new Date(t).toISOString().slice(0, 10).replace(/-/g, ".");
}
