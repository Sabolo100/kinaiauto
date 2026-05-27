"use client";

import { useEffect, useState } from "react";
import { ExternalLink, PlayCircle, FileText, ChevronRight } from "lucide-react";

type TestLink = {
  id: string;
  url: string;
  title: string | null;
  source_name: string | null;
  kind: "article" | "video";
};

export function TestLinksSection({ modelId }: { modelId: string }) {
  const [links, setLinks] = useState<TestLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/models/${modelId}/test-links`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setLinks(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [modelId]);

  if (loading || links.length === 0) return null;

  const articles = links.filter((l) => l.kind === "article");
  const videos = links.filter((l) => l.kind === "video");

  return (
    <section className="block test-links-section">
      <div className="container">
        <div className="block-head">
          <div>
            <div className="step">· Tesztek és vélemények</div>
            <h2>
              Mit mondanak <em>a tesztelők</em>?
            </h2>
          </div>
          <div className="sub">
            Magyar autós szakportálok és YouTube-csatornák tesztjei erről a
            modellről. Külső forrásokra mutatnak — új lapon nyílnak meg.
          </div>
        </div>

        <div className="tls-grid">
          {articles.length > 0 && (
            <div className="tls-col">
              <div className="tls-col-head">
                <FileText size={14} />
                <span>Cikkek</span>
              </div>
              <ul className="tls-list">
                {articles.map((l) => (
                  <li key={l.id}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tls-link"
                    >
                      <span className="tls-source">{l.source_name ?? "külső forrás"}</span>
                      <span className="tls-title">{l.title || l.url.replace(/^https?:\/\//, "").slice(0, 60)}</span>
                      <ChevronRight size={14} className="tls-arrow" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {videos.length > 0 && (
            <div className="tls-col">
              <div className="tls-col-head">
                <PlayCircle size={14} />
                <span>Videók</span>
              </div>
              <ul className="tls-list">
                {videos.map((l) => (
                  <li key={l.id}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tls-link tls-link--video"
                    >
                      <span className="tls-source">{l.source_name ?? "YouTube"}</span>
                      <span className="tls-title">{l.title || "Videó megtekintése"}</span>
                      <ExternalLink size={13} className="tls-arrow" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
