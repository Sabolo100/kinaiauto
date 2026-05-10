// PDF text extraction (server-only). Uses pdf-parse v2's class API.
import "server-only";
import { PDFParse } from "pdf-parse";

export async function extractPdfText(buf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const result = await parser.getText();
    const pages = (result?.pages ?? []) as Array<{ text?: string }>;
    if (pages.length > 0) {
      return pages.map((p) => p.text ?? "").join("\n\n").trim();
    }
    return ((result as { text?: string })?.text ?? "").trim();
  } finally {
    await parser.destroy();
  }
}
