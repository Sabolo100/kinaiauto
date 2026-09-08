import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Statisztikák — CMS" };
export const dynamic = "force-dynamic";

// ─── Time range helper ────────────────────────────────────────────────────────
type Range = "1d" | "7d" | "30d" | "all";

function cutoff(range: Range): string | null {
  if (range === "all") return null;
  const d = new Date();
  if (range === "1d")  d.setHours(d.getHours() - 24);
  if (range === "7d")  d.setDate(d.getDate() - 7);
  if (range === "30d") d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function rangeLabel(r: Range) {
  return { "1d": "Elmúlt 24 óra", "7d": "Elmúlt 7 nap", "30d": "Elmúlt 30 nap", all: "Összesen" }[r];
}

// ─── Mini bar helper ──────────────────────────────────────────────────────────
function Bar({ pct, color = "#22c55e" }: { pct: number; color?: string }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 3, height: 6, width: "100%", marginTop: 3 }}>
      <div style={{ background: color, borderRadius: 3, height: 6, width: `${Math.min(pct, 100)}%`, transition: "width .3s" }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function StatisztikakPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range: Range =
    sp.range === "1d" || sp.range === "7d" || sp.range === "30d" || sp.range === "all"
      ? sp.range
      : "7d";

  const since = cutoff(range);
  const sql = db();

  // ── Quote stats ──────────────────────────────────────────────────────────
  type QR = { id: string; created_at: string; status: string };
  const qrRows = await (since
    ? sql<QR[]>`select id, created_at, status from quote_requests where created_at >= ${since}::timestamptz`
    : sql<QR[]>`select id, created_at, status from quote_requests`);

  type Disp = { id: string; success: boolean; sent_at: string | null; quote_request_id: string };
  const dispRows = await (since
    ? sql<Disp[]>`select id, success, sent_at, quote_request_id from quote_request_dispatches where sent_at >= ${since}::timestamptz`
    : sql<Disp[]>`select id, success, sent_at, quote_request_id from quote_request_dispatches`);
  const sentCount  = dispRows.filter((d) => d.success).length;
  const failCount  = dispRows.filter((d) => !d.success).length;

  // Quote items — group by model
  const qrIds = qrRows.map((q) => q.id as string);
  let quotesByModel: { brand: string; model: string; cnt: number }[] = [];
  if (qrIds.length > 0) {
    const items = await sql<{ brand_name_snapshot: string; model_name_snapshot: string }[]>`
      select brand_name_snapshot, model_name_snapshot from quote_request_items
      where quote_request_id = any(${qrIds})`;
    const byModel: Record<string, { brand: string; model: string; cnt: number }> = {};
    for (const it of items) {
      const key = `${it.brand_name_snapshot}||${it.model_name_snapshot}`;
      if (!byModel[key]) byModel[key] = { brand: it.brand_name_snapshot, model: it.model_name_snapshot, cnt: 0 };
      byModel[key].cnt++;
    }
    quotesByModel = Object.values(byModel).sort((a, b) => b.cnt - a.cnt);
  }
  const maxQuoteCnt = quotesByModel[0]?.cnt ?? 1;

  // ── Site events ───────────────────────────────────────────────────────────
  type Ev = { type: string; model_slug: string | null; param: string | null; val: string | null };
  const events = await (since
    ? sql<Ev[]>`select type, model_slug, param, val from site_events where ts >= ${since}::timestamptz`
    : sql<Ev[]>`select type, model_slug, param, val from site_events`);

  // Model views
  const viewCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === "model_view" && e.model_slug) {
      viewCounts[e.model_slug] = (viewCounts[e.model_slug] ?? 0) + 1;
    }
  }
  const topViews = Object.entries(viewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  const maxViewCnt = topViews[0]?.[1] ?? 1;

  // Gallery opens
  const galleryCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === "gallery_open" && e.model_slug) {
      galleryCounts[e.model_slug] = (galleryCounts[e.model_slug] ?? 0) + 1;
    }
  }
  const topGallery = Object.entries(galleryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxGalCnt = topGallery[0]?.[1] ?? 1;

  // Catalog params
  const paramCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === "catalog_param" && e.val) {
      paramCounts[e.val] = (paramCounts[e.val] ?? 0) + 1;
    }
  }
  const topParams = Object.entries(paramCounts)
    .sort((a, b) => b[1] - a[1]);
  const maxParamCnt = topParams[0]?.[1] ?? 1;

  // Catalog filters
  type FilterEntry = { param: string; val: string; cnt: number };
  const filterMap: Record<string, FilterEntry> = {};
  for (const e of events) {
    if (e.type === "filter_catalog" && e.param && e.val) {
      const key = `${e.param}||${e.val}`;
      if (!filterMap[key]) filterMap[key] = { param: e.param, val: e.val, cnt: 0 };
      filterMap[key].cnt++;
    }
  }
  const topFilters = Object.values(filterMap).sort((a, b) => b.cnt - a.cnt).slice(0, 30);
  const maxFilterCnt = topFilters[0]?.cnt ?? 1;

  const RANGES: Range[] = ["1d", "7d", "30d", "all"];

  return (
    <div className="cms-page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="cms-page-title">📊 Statisztikák</h1>
          <div style={{ color: "#64748b", fontSize: 13 }}>{rangeLabel(range)}</div>
        </div>
        {/* Range tabs */}
        <div style={{ display: "flex", gap: 4, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: 4 }}>
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/c4m5s6/statisztikak?range=${r}`}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                textDecoration: "none",
                background: r === range ? "#1e40af" : "transparent",
                color: r === range ? "#fff" : "#64748b",
              }}
            >
              {rangeLabel(r)}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Ajánlatkérés", val: qrRows.length, color: "#3b82f6" },
          { label: "E-mail elküldve", val: sentCount, color: "#22c55e" },
          { label: "Küldési hiba", val: failCount, color: "#f87171" },
          { label: "Modell megtekintés", val: topViews.reduce((s, [,c]) => s + c, 0), color: "#a78bfa" },
          { label: "Galéria megnyitás", val: topGallery.reduce((s, [,c]) => s + c, 0), color: "#fb923c" },
          { label: "Szűrő használat", val: topFilters.reduce((s, f) => s + f.cnt, 0), color: "#38bdf8" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10,
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: card.color, fontVariantNumeric: "tabular-nums" }}>
              {card.val.toLocaleString("hu")}
            </div>
            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 3 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* ── Ajánlatkérések modellenként ─────────────────────────────────── */}
        <div className="cms-card" style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#e2e8f0" }}>
            Ajánlatkérések modellenként
          </div>
          {quotesByModel.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 13 }}>Nincs adat ebben az időszakban.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {quotesByModel.slice(0, 15).map((row) => (
                <div key={`${row.brand}-${row.model}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "#94a3b8" }}>{row.brand} <strong style={{ color: "#e2e8f0" }}>{row.model}</strong></span>
                    <span style={{ color: "#3b82f6", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{row.cnt}</span>
                  </div>
                  <Bar pct={(row.cnt / maxQuoteCnt) * 100} color="#3b82f6" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Kínálat — paraméter-választás ───────────────────────────────── */}
        <div className="cms-card" style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#e2e8f0" }}>
            Kínálat megjelenítési alap
          </div>
          {topParams.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 13 }}>Nincs adat.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topParams.map(([label, cnt]) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "#e2e8f0" }}>{label}</span>
                    <span style={{ color: "#a78bfa", fontWeight: 700 }}>{cnt}</span>
                  </div>
                  <Bar pct={(cnt / maxParamCnt) * 100} color="#a78bfa" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Top modell megtekintések ─────────────────────────────────────── */}
        <div className="cms-card" style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#e2e8f0" }}>
            Modell oldal megtekintések (top 20)
          </div>
          {topViews.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 13 }}>Nincs adat.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topViews.map(([slug, cnt]) => (
                <div key={slug}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#94a3b8", fontFamily: "var(--font-mono)", fontSize: 11 }}>{slug}</span>
                    <span style={{ color: "#a78bfa", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{cnt}</span>
                  </div>
                  <Bar pct={(cnt / maxViewCnt) * 100} color="#a78bfa" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Szűrő használat ─────────────────────────────────────────────── */}
        <div className="cms-card" style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#e2e8f0" }}>
            Szűrők használata (kínálat oldal)
          </div>
          {topFilters.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 13 }}>Nincs adat.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topFilters.map((f, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span>
                      <span style={{ color: "#475569", fontSize: 10.5, marginRight: 6, fontFamily: "var(--font-mono)" }}>{f.param}</span>
                      <span style={{ color: "#e2e8f0" }}>{f.val}</span>
                    </span>
                    <span style={{ color: "#38bdf8", fontWeight: 700 }}>{f.cnt}</span>
                  </div>
                  <Bar pct={(f.cnt / maxFilterCnt) * 100} color="#38bdf8" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Galéria megnyitások ──────────────────────────────────────────── */}
        <div className="cms-card" style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#e2e8f0" }}>
            Galéria megnyitások (top 10)
          </div>
          {topGallery.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 13 }}>Nincs adat.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topGallery.map(([slug, cnt]) => (
                <div key={slug}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#94a3b8", fontFamily: "var(--font-mono)", fontSize: 11 }}>{slug}</span>
                    <span style={{ color: "#fb923c", fontWeight: 700 }}>{cnt}</span>
                  </div>
                  <Bar pct={(cnt / maxGalCnt) * 100} color="#fb923c" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── E-mail státusz bontás ────────────────────────────────────────── */}
        <div className="cms-card" style={{ padding: "16px 20px" }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#e2e8f0" }}>
            E-mail küldési státuszok
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Sikeresen elküldve", cnt: sentCount, color: "#22c55e" },
              { label: "Küldési hiba", cnt: failCount, color: "#f87171" },
              { label: "Összes kísérlet", cnt: dispRows.length, color: "#94a3b8" },
            ].map((row) => (
              <div key={row.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "#e2e8f0" }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: 700 }}>{row.cnt}</span>
                </div>
                <Bar pct={dispRows.length > 0 ? (row.cnt / dispRows.length) * 100 : 0} color={row.color} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, color: "#475569", fontSize: 12 }}>
            Összes ajánlatkérés: <strong style={{ color: "#e2e8f0" }}>{qrRows.length}</strong>
            {" "}·{" "}
            Sikeres küldési arány:{" "}
            <strong style={{ color: "#22c55e" }}>
              {dispRows.length > 0 ? Math.round((sentCount / dispRows.length) * 100) : 0}%
            </strong>
          </div>
        </div>

      </div>
    </div>
  );
}
