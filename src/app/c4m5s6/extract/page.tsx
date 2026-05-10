import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { ExtractForm } from "@/components/cms/extract-form";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { HAS_ANTHROPIC, HAS_OPENAI } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  status: string;
  source_kind: string;
  source_url: string | null;
  source_filename: string | null;
  llm_provider: string;
  llm_model: string | null;
  created_at: string;
  model: { name: string; brand: { name: string } | null } | null;
};

async function getData() {
  const sa = supabaseAdmin();
  const [extractions, models] = await Promise.all([
    sa
      .from("model_extractions")
      .select(
        "id, status, source_kind, source_url, source_filename, llm_provider, llm_model, created_at, model:models(name, brand:brands(name))",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    sa
      .from("models")
      .select("id, name, brand:brands(name)")
      .is("archived_at", null)
      .order("name"),
  ]);
  return {
    extractions: (extractions.data ?? []) as unknown as Row[],
    models: (models.data ?? []) as unknown as {
      id: string;
      name: string;
      brand: { name: string } | null;
    }[],
  };
}

const STATUS_PILL: Record<string, string> = {
  pending: "warn",
  approved: "ok",
  rejected: "muted",
  failed: "err",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Vár jóváhagyásra",
  approved: "Jóváhagyva",
  rejected: "Elutasítva",
  failed: "Hiba",
};

export default async function ExtractPage() {
  const { extractions, models } = await getData();
  return (
    <CmsShell>
      <h1>PDF / URL kinyerés</h1>
      <p className="lede">
        Tölts fel egy PDF-et vagy adj meg egy URL-t. A rendszer kinyeri a
        szöveget, az LLM strukturált adatokat javasol, te pedig jóváhagyod
        vagy módosítod a végleges modell-rekordot.
      </p>

      <div className="cms-card">
        <h2 style={{ margin: "0 0 12px" }}>Új kinyerés</h2>
        <ExtractForm
          models={models}
          hasClaude={HAS_ANTHROPIC}
          hasOpenAI={HAS_OPENAI}
        />
      </div>

      <h2>Történet</h2>
      <div className="cms-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Modell</th>
              <th>Forrás</th>
              <th>LLM</th>
              <th>Státusz</th>
              <th>Időpont</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {extractions.length === 0 ? (
              <tr><td colSpan={6} style={{ color: "#94a3b8" }}>Még nincs kinyerés.</td></tr>
            ) : null}
            {extractions.map((e) => (
              <tr key={e.id}>
                <td>{e.model ? `${e.model.brand?.name ?? ""} ${e.model.name}` : "—"}</td>
                <td style={{ fontSize: 12, color: "#94a3b8" }}>
                  {e.source_kind === "pdf"
                    ? `PDF · ${e.source_filename ?? "—"}`
                    : `URL · ${e.source_url ?? "—"}`}
                </td>
                <td>{e.llm_provider}{e.llm_model ? ` · ${e.llm_model}` : ""}</td>
                <td>
                  <span className={`pill ${STATUS_PILL[e.status] ?? "muted"}`}>
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>
                </td>
                <td style={{ color: "#94a3b8", fontSize: 12 }}>
                  {new Date(e.created_at).toLocaleString("hu-HU")}
                </td>
                <td>
                  <Link className="cms-btn ghost" href={`/c4m5s6/extract/${e.id}`}>
                    Megnyit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CmsShell>
  );
}
