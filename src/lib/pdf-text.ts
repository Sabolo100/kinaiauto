// PDF text extraction (server-only). Uses unpdf — serverless/edge-friendly.
import "server-only";
import { extractText } from "unpdf";

export async function extractPdfText(buf: Buffer): Promise<string> {
  const { text } = await extractText(new Uint8Array(buf), { mergePages: true });
  return (text ?? "").trim();
}
