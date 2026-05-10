"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ModelOpt = { id: string; name: string; brand: { name: string } | null };

export function ExtractForm({
  models,
  hasClaude,
  hasOpenAI,
}: {
  models: ModelOpt[];
  hasClaude: boolean;
  hasOpenAI: boolean;
}) {
  const router = useRouter();
  const [modelId, setModelId] = useState("");
  const [provider, setProvider] = useState<"claude" | "openai">(
    hasClaude ? "claude" : hasOpenAI ? "openai" : "claude",
  );
  const [kind, setKind] = useState<"pdf" | "url">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setErr(null); setFailedId(null);
    if (!modelId) { setErr("Válassz modellt."); setBusy(false); return; }
    const fd = new FormData();
    fd.append("model_id", modelId);
    fd.append("provider", provider);
    fd.append("source_kind", kind);
    if (kind === "pdf") {
      if (!file) { setErr("Csatolj PDF-et."); setBusy(false); return; }
      fd.append("file", file);
    } else {
      if (!url.trim()) { setErr("Adj meg egy URL-t."); setBusy(false); return; }
      fd.append("url", url.trim());
    }

    let res: Response;
    try {
      res = await fetch("/api/cms/extract", { method: "POST", body: fd });
    } catch (netErr) {
      setBusy(false);
      setErr(`Hálózati hiba: ${(netErr as Error).message}`);
      return;
    }

    let j: Record<string, unknown> = {};
    try {
      j = await res.json();
    } catch {
      setBusy(false);
      setErr(`Szerver válasz nem értelmezhető (HTTP ${res.status})`);
      return;
    }

    setBusy(false);

    if (!res.ok) {
      setErr(`Hiba (HTTP ${res.status}): ${j.error ?? "ismeretlen hiba"}`);
      return;
    }

    if (j.status === "failed") {
      setFailedId(String(j.id));
      setErr(`LLM kinyerés sikertelen: ${j.error_message ?? "ismeretlen LLM hiba"}`);
      return;
    }

    router.push(`/c4m5s6/extract/${j.id}`);
  }

  return (
    <div className="cms-form">
      {err ? (
        <div className="err" style={{ whiteSpace: "pre-wrap" }}>
          {err}
          {failedId ? (
            <div style={{ marginTop: 8 }}>
              <Link className="cms-btn ghost" href={`/c4m5s6/extract/${failedId}`}>
                Részletek megtekintése →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="row3">
        <label><span>Modell *</span>
          <select value={modelId} onChange={(e) => setModelId(e.target.value)}>
            <option value="">— válassz —</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {(m.brand?.name ?? "") + " "}{m.name}
              </option>
            ))}
          </select>
        </label>
        <label><span>LLM</span>
          <select value={provider} onChange={(e) => setProvider(e.target.value as "claude" | "openai")}>
            <option value="claude" disabled={!hasClaude}>Claude {hasClaude ? "" : "(API kulcs hiányzik)"}</option>
            <option value="openai" disabled={!hasOpenAI}>OpenAI {hasOpenAI ? "" : "(API kulcs hiányzik)"}</option>
          </select>
        </label>
        <label><span>Forrás típus</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as "pdf" | "url")}>
            <option value="pdf">PDF feltöltés</option>
            <option value="url">URL</option>
          </select>
        </label>
      </div>

      {kind === "pdf" ? (
        <label><span>PDF</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <label><span>URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.gyarto.hu/modell-arlista"
          />
        </label>
      )}

      <div className="cms-actions">
        <button className="cms-btn primary" onClick={submit} disabled={busy}>
          {busy ? "Feldolgozás…" : "Kinyerés indítása"}
        </button>
      </div>
    </div>
  );
}
