export const dynamic = "force-dynamic";

import { CmsShell } from "@/components/cms/cms-shell";
import { TestLinksSearchPage } from "@/components/cms/test-links-search-page";

export default function TesztlinkekPage() {
  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Tesztlinkek kezelése</h1>
      </div>
      <p className="lede" style={{ marginBottom: 24 }}>
        Modellenkénti tesztlink lista. Jelöld ki a modelleket és indítsd el az
        automatikus webes keresést — a rendszer megkeresi a magyar nyelvű
        autóteszteket (cikkek és YouTube videók), és jóváhagyásra felkínálja
        őket.
      </p>
      <TestLinksSearchPage />
    </CmsShell>
  );
}
