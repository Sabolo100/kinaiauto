import { CmsShell } from "@/components/cms/cms-shell";
import { BrandForm } from "@/components/cms/brand-form";

export const dynamic = "force-dynamic";

export default function NewBrandPage() {
  return (
    <CmsShell>
      <h1>Új márka</h1>
      <p className="lede">Logót a létrehozás után tudsz feltölteni.</p>
      <BrandForm
        mode="create"
        initial={{
          slug: "",
          name: "",
          tagline: "",
          description: "",
          founded: "",
          hq: "",
          factories: "",
          parent_company: "",
          importer_name: "",
          importer_addr: "",
          importer_site: "",
          dealers_text: "",
          hero_color: "",
          brand_tone: "",
          sort_order: 999,
          is_active: true,
          archived_at: null,
        }}
      />
    </CmsShell>
  );
}
