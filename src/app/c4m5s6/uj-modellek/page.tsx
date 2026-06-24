export const dynamic = "force-dynamic";

import { CmsShell } from "@/components/cms/cms-shell";
import { ModelDiscoveryPage } from "@/components/cms/model-discovery-page";

export default function UjModellekPage() {
  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Új modellek keresése</h1>
      </div>
      <p className="lede" style={{ marginBottom: 24 }}>
        A rendszer végigvizsgálja a kiválasztott márkák hivatalos magyar oldalait
        és a friss (egy hónapnál nem régebbi) híreket, és összeveti azokat az
        adatbázisban már szereplő modellekkel. Az így talált, még hiányzó
        modellek a lenti munkatáblába kerülnek — innen egy kattintással átemelheted
        őket az éles adatbázisba, majd a megszokott szerkesztővel töltheted fel adatokkal.
      </p>
      <ModelDiscoveryPage />
    </CmsShell>
  );
}
