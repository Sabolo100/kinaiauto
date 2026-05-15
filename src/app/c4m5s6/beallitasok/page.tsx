export const dynamic = "force-dynamic";

import { CmsShell } from "@/components/cms/cms-shell";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/cms/settings-form";

const KEYS = [
  "resend_api_key",
  "resend_from_email",
  "resend_from_name",
  "quote_max_dealers_per_brand",
  "quote_email_subject_template",
] as const;

export default async function CmsSettingsPage() {
  const initial = await getSettings([...KEYS], {
    resend_from_email: "ajanlat@kinaiauto.com",
    resend_from_name: "kinaiauto.com",
    quote_max_dealers_per_brand: "3",
    quote_email_subject_template: "Ajánlatkérés – {brand} {models_count_text}",
  });

  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Beállítások</h1>
      </div>
      <p className="lede" style={{ maxWidth: 720 }}>
        Az ajánlatkérési rendszer és az e-mail kiküldés (Resend) konfigurációja.
        Az API kulcs csak ezen a felületen jelenik meg, és csak ide írható –
        sosem kerül a publikus oldalra.
      </p>
      <SettingsForm initial={initial} />
    </CmsShell>
  );
}
