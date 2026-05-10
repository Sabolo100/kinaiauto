// URL → plain-text extraction (server-only).
// Strategy: fetch HTML, strip <script>/<style>, decode entities, collapse
// whitespace. Good enough for LLM grounding without needing cheerio etc.
//
// If the response is application/pdf, we delegate to extractPdfText.
import "server-only";
import { extractPdfText } from "./pdf-text";

export type FetchResult = {
  kind: "html" | "pdf";
  url: string;
  text: string;
  contentType: string;
};

const UA =
  "Mozilla/5.0 (compatible; kinaiauto-cms/1.0; +https://www.kinaiauto.com)";

export async function fetchUrlText(url: string): Promise<FetchResult> {
  const u = new URL(url); // throws on invalid URL
  if (!/^https?:$/.test(u.protocol)) {
    throw new Error("Csak http(s) URL támogatott");
  }
  const res = await fetch(u.toString(), {
    headers: { "User-Agent": UA, Accept: "text/html,application/pdf,*/*" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Forrás letöltése sikertelen (${res.status})`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/pdf") || u.pathname.toLowerCase().endsWith(".pdf")) {
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      kind: "pdf",
      url: u.toString(),
      text: await extractPdfText(buf),
      contentType: "application/pdf",
    };
  }
  const html = await res.text();
  return {
    kind: "html",
    url: u.toString(),
    text: htmlToText(html),
    contentType: ct,
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|tr|h[1-6]|br)>/gi, "\n")
    .replace(/<br\s*\/?>(\n)?/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
