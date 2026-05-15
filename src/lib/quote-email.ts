/**
 * Templates for the ajánlatkérési e-mail sent to each (brand, dealer) pair.
 *
 * One email goes out per brand per dealer. If a user picks multiple models
 * from the same brand, they all appear in the same email. If they pick from
 * multiple brands, separate emails are dispatched for each brand.
 */

import { SITE_URL } from "./env";

export type EmailModel = {
  modelName: string;
  brandName: string;
  brandSlug: string;
  modelSlug: string;
};

export type EmailParams = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  dealerName: string;
  brandName: string;
  models: EmailModel[];
  /** Optional override for the subject template (with `{brand}` and `{models_count_text}` placeholders) */
  subjectTemplate?: string;
};

function modelsCountText(n: number): string {
  if (n === 1) return "1 modell";
  return `${n} modell`;
}

export function buildSubject(p: EmailParams): string {
  const tpl =
    p.subjectTemplate?.trim() ||
    "Ajánlatkérés – {brand} {models_count_text}";
  return tpl
    .replace(/\{brand\}/g, p.brandName)
    .replace(/\{models_count_text\}/g, `(${modelsCountText(p.models.length)})`)
    .replace(/\{customer_name\}/g, p.customerName)
    .trim();
}

function modelUrl(m: EmailModel): string {
  return `${SITE_URL.replace(/\/$/, "")}/modellek/${m.brandSlug}/${m.modelSlug}`;
}

export function buildHtmlBody(p: EmailParams): string {
  const modelsList = p.models
    .map(
      (m) =>
        `<li style="margin-bottom:6px"><a href="${escapeAttr(modelUrl(m))}" style="color:#0f766e;text-decoration:underline">${escapeHtml(m.brandName)} ${escapeHtml(m.modelName)}</a></li>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<title>Ajánlatkérés</title>
</head>
<body style="margin:0;padding:0;background:#f7f6f2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#14181c">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff">
  <div style="font-family:'Times New Roman',serif;font-size:22px;line-height:1.2;color:#14181c;margin-bottom:8px">
    Új ajánlatkérés a kinaiauto.com-on keresztül
  </div>
  <div style="font-size:13px;color:#6b7280;margin-bottom:24px;letter-spacing:.04em">
    ${escapeHtml(p.brandName).toUpperCase()} · ${escapeHtml(p.dealerName)}
  </div>

  <p style="font-size:14.5px;line-height:1.55;margin:0 0 20px">
    Kedves ${escapeHtml(p.dealerName)} csapat!
  </p>

  <p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#374151">
    A kinaiauto.com oldalon keresztül egy érdeklődő ajánlatot kér Önöktől az alábbi
    <strong>${escapeHtml(p.brandName)}</strong>
    ${p.models.length === 1 ? "modellre" : "modellekre"}.
    Az érdeklődő hozzájárult ahhoz, hogy a megadott elérhetőségeit
    közvetlenül továbbítsuk a kiválasztott kereskedőkhöz.
  </p>

  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:20px 0;background:#fbfaf6;border:1px solid #e5e3dd;border-radius:6px">
    <tr>
      <td style="padding:14px 18px">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:8px">Érdeklődő adatai</div>
        <div style="font-size:14px;line-height:1.7;color:#14181c">
          <strong>${escapeHtml(p.customerName)}</strong><br>
          E-mail: <a href="mailto:${escapeAttr(p.customerEmail)}" style="color:#0f766e">${escapeHtml(p.customerEmail)}</a><br>
          Telefon: <a href="tel:${escapeAttr(p.customerPhone)}" style="color:#0f766e">${escapeHtml(p.customerPhone)}</a>
        </div>
      </td>
    </tr>
  </table>

  <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin:24px 0 8px">
    Az érdeklődést kiváltó ${p.models.length === 1 ? "modell" : "modellek"}
  </div>
  <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:1.6;color:#14181c">
    ${modelsList}
  </ul>

  <p style="font-size:13.5px;line-height:1.6;color:#374151;margin:0 0 8px">
    Kérjük, az érdeklődő részére közvetlenül a megadott e-mail címen vagy
    telefonszámon válaszoljanak. A kinaiauto.com nem közvetít az ügyletben,
    csak az ajánlatkérési igényt továbbítja.
  </p>

  <hr style="border:0;border-top:1px solid #e5e3dd;margin:28px 0">

  <p style="font-size:12px;color:#9ca3af;line-height:1.5;margin:0">
    Ezt az üzenetet a <strong>kinaiauto.com</strong> automatikusan küldte az érdeklődő hozzájárulása alapján.
    Az érdeklődő egy másolatot megkapott a saját e-mail címére (CC).<br>
    A küldés időpontja: ${new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" })}
  </p>
</div>
</body>
</html>`;
}

export function buildTextBody(p: EmailParams): string {
  const lines: string[] = [
    `Új ajánlatkérés a kinaiauto.com-on keresztül`,
    `${p.brandName} · ${p.dealerName}`,
    ``,
    `Kedves ${p.dealerName} csapat!`,
    ``,
    `A kinaiauto.com oldalon keresztül egy érdeklődő ajánlatot kér Önöktől az alábbi ${p.brandName} ${p.models.length === 1 ? "modellre" : "modellekre"}.`,
    ``,
    `Érdeklődő adatai:`,
    `  Név:     ${p.customerName}`,
    `  E-mail:  ${p.customerEmail}`,
    `  Telefon: ${p.customerPhone}`,
    ``,
    `Az érdeklődést kiváltó ${p.models.length === 1 ? "modell" : "modellek"}:`,
    ...p.models.map((m) => `  • ${m.brandName} ${m.modelName} — ${modelUrl(m)}`),
    ``,
    `Kérjük, az érdeklődő részére közvetlenül a megadott e-mail címen vagy telefonszámon válaszoljanak.`,
    ``,
    `— kinaiauto.com`,
  ];
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
