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
  const [kind, setKind] = useState<"pdf" | "url" | "image">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setErr(null); setFailedId(null); setStep(null);

    if (!modelId) { setErr("Válassz modellt."); setBusy(false); return; }

    let body: Record<string, unknown>;

    if (kind === "pdf" || kind === "image") {
      if (!file) {
        setErr(kind === "pdf" ? "Csatolj PDF-et." : "Csatolj képet.");
        setBusy(false); return;
      }

      // Step 1: get presigned upload URL from server
      setStep("1/3 — Feltöltési URL lekérése…");
      let presignRes: Response;
      try {
        presignRes = await fetch(
          `/api/cms/extract/presign?model_id=${encodeURIComponent(modelId)}&filename=${encodeURIComponent(file.name)}`,
        );
      } catch (e) {
        setBusy(false); setStep(null);
        setErr(`Hálózati hiba (presign): ${(e as Error).message}`);
        return;
      }
      if (!presignRes.ok) {
        const pj = await presignRes.json().catch(() => ({})) as Record<string, unknown>;
        setBusy(false); setStep(null);
        setErr(`Presigned URL hiba (HTTP ${presignRes.status}): ${pj.error ?? "ismeretlen"}`);
        return;
      }
      const { path, signedUrl } = await presignRes.json() as { path: string; signedUrl: string };

      // Step 2: upload file directly to Supabase Storage (bypasses Vercel body limit)
      const contentType = kind === "pdf" ? "application/pdf" : (file.type || "image/jpeg");
      setStep(`2/3 — ${kind === "pdf" ? "PDF" : "Kép"} feltöltése (${(file.size / 1024 / 1024).toFixed(1)} MB)…`);
      try {
        const upRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });
        if (!upRes.ok) {
          throw new Error(`HTTP ${upRes.status}`);
        }
      } catch (e) {
        setBusy(false); setStep(null);
        setErr(`${kind === "pdf" ? "PDF" : "Kép"} feltöltési hiba a Storage-ba: ${(e as Error).message}`);
        return;
      }

      if (kind === "pdf") {
        body = {
          model_id: modelId,
          provider,
          source_kind: "pdf",
          storage_path: path,
          source_filename: file.name,
        };
      } else {
        body = {
          model_id: modelId,
          provider,
          source_kind: "image",
          storage_path: path,
          source_filename: file.name,
          image_media_type: file.type || "image/jpeg",
        };
      }
    } else {
      if (!url.trim()) { setErr("Adj meg egy URL-t."); setBusy(false); return; }
      body = { model_id: modelId, provider, source_kind: "url", url: url.trim() };
    }

    // Step 3: trigger LLM extraction
    setStep(kind === "pdf" ? "3/3 — LLM kinyerés…" : kind === "image" ? "3/3 — Képelemzés (LLM)…" : "LLM kinyerés…");
    let res: Response;
    try {
      res = await fetch("/api/cms/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      setBusy(false); setStep(null);
      setErr(`Hálózati hiba (extract): ${(e as Error).message}`);
      return;
    }

    let j: Record<string, unknown> = {};
    try {
      j = await res.json();
    } catch {
      setBusy(false); setStep(null);
      setErr(`Szerver válasz nem értelmezhető (HTTP ${res.status})`);
      return;
    }

    setBusy(false); setStep(null);

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
          <select value={kind} onChange={(e) => { setKind(e.target.value as "pdf" | "url" | "image"); setFile(null); }}>
            <option value="pdf">PDF feltöltés</option>
            <option value="url">URL</option>
            <option value="image">Kép / specifikáció (JPG, PNG)</option>
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
          {file ? (
            <span style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, display: "block" }}>
              {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          ) : null}
        </label>
      ) : kind === "image" ? (
        <label><span>Kép feltöltése</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <span style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, display: "block" }}>
              {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "block" }}>
              Adj meg egy specifikációs lapot vagy árlistát képként (max. ~5 MB). A Claude vision API elemzi.
            </span>
          )}
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
          {step ?? "Kinyerés indítása"}
        </button>
      </div>
    </div>
  );
}
