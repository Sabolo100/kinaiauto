"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ShoppingBag, Users, X, ArrowRight } from "lucide-react";
import type { Brand, Dealer, ModelRow } from "@/lib/types";
import { useQuoteCart } from "@/components/quote-context";
import { ModelCard } from "@/components/model-card";
import { brandLogoUrl } from "@/lib/data";
import { DealerPicker } from "./dealer-picker";
import { ContactModal } from "./contact-modal";
import "./quote.css";

type Props = {
  brands: Brand[];
  dealers: Dealer[];
  models: ModelRow[];
  maxDealersPerBrand: number;
};

export function QuotePage({ brands, dealers, models, maxDealersPerBrand }: Props) {
  const cart = useQuoteCart();

  /** Maps for fast lookup */
  const modelById = useMemo(() => {
    const m = new Map<string, ModelRow>();
    for (const x of models) m.set(x.id, x);
    return m;
  }, [models]);

  const dealersByBrand = useMemo(() => {
    const m = new Map<string, Dealer[]>();
    for (const d of dealers) {
      if (!d.is_active) continue;
      if (!m.has(d.brand_id)) m.set(d.brand_id, []);
      m.get(d.brand_id)!.push(d);
    }
    return m;
  }, [dealers]);

  /** Brands present in the cart, sorted A-Z */
  const cartBrandIds = useMemo(
    () => Array.from(new Set(cart.items.map((i) => i.brandId))),
    [cart.items],
  );
  const cartBrands = useMemo(() => {
    return brands
      .filter((b) => cartBrandIds.includes(b.id))
      .sort((a, b) => a.name.localeCompare(b.name, "hu"));
  }, [brands, cartBrandIds]);

  /** Selected dealer IDs per brand */
  const [selectedDealers, setSelectedDealers] = useState<Record<string, string[]>>({});

  /** Which brand's dealer-picker popup is currently open */
  const [pickerBrandId, setPickerBrandId] = useState<string | null>(null);

  /** Contact modal open state */
  const [contactOpen, setContactOpen] = useState(false);

  function getSelected(brandId: string): string[] {
    return selectedDealers[brandId] ?? [];
  }

  function setSelected(brandId: string, ids: string[]) {
    setSelectedDealers((prev) => ({ ...prev, [brandId]: ids }));
  }

  /** Send button enabled only when every brand in cart has ≥1 dealer selected */
  const allBrandsHaveDealers = cartBrands.every(
    (b) => getSelected(b.id).length > 0,
  );

  const totalItems = cart.items.length;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (totalItems === 0) {
    return (
      <main className="container quote-empty">
        <div className="quote-empty-card">
          <ShoppingBag size={42} strokeWidth={1.4} aria-hidden />
          <h1>Az ajánlatkérési listád üres</h1>
          <p>
            Böngészd a modelleket, és add a kosárhoz azokat, amelyekre szívesen
            kérnél ajánlatot a kereskedőktől. A listád addig megmarad, amíg böngészed
            az oldalt.
          </p>
          <div className="quote-empty-actions">
            <Link href="/kinalat" className="quote-cta primary">
              Modellek böngészése <ArrowRight size={16} />
            </Link>
            <Link href="/markak" className="quote-cta">
              Márkák
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Active list ────────────────────────────────────────────────────────────
  return (
    <main className="container quote-page">
      <header className="quote-head">
        <div>
          <div className="quote-eyebrow">Ajánlatkérési kosár</div>
          <h1 className="quote-title">
            <em>{totalItems}</em> modell · <em>{cartBrands.length}</em>{" "}
            {cartBrands.length === 1 ? "márka" : "márka"}
          </h1>
          <p className="quote-lede">
            Válaszd ki, mely kereskedőktől szeretnél ajánlatot kérni minden márkához
            (max. {maxDealersPerBrand} kereskedő márkánként), majd küldd el egy
            kattintással.
          </p>
        </div>
        {totalItems > 0 ? (
          <button
            type="button"
            className="quote-clear"
            onClick={() => {
              if (window.confirm("Biztosan üríted az ajánlatkérési listát?")) {
                cart.clear();
                setSelectedDealers({});
              }
            }}
          >
            <X size={14} />
            Lista ürítése
          </button>
        ) : null}
      </header>

      {/* Brand groups */}
      <div className="quote-groups">
        {cartBrands.map((brand) => {
          const itemsForBrand = cart.items.filter((i) => i.brandId === brand.id);
          const brandModels = itemsForBrand
            .map((i) => modelById.get(i.modelId))
            .filter((m): m is ModelRow => Boolean(m));
          const brandDealers = dealersByBrand.get(brand.id) ?? [];
          const selectedIds = getSelected(brand.id);
          const logo = brandLogoUrl(brand.logo_path);

          return (
            <section key={brand.id} className="quote-group">
              <header className="quote-group-head">
                <div className="quote-group-brand">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="" aria-hidden className="quote-group-logo" />
                  ) : null}
                  <h2>{brand.name}</h2>
                  <span className="quote-group-count">
                    {brandModels.length}{" "}
                    {brandModels.length === 1 ? "modell" : "modell"}
                  </span>
                </div>
                <button
                  type="button"
                  className={`quote-dealer-btn ${selectedIds.length > 0 ? "on" : "off"}`}
                  onClick={() => setPickerBrandId(brand.id)}
                  disabled={brandDealers.length === 0}
                  title={
                    brandDealers.length === 0
                      ? "Ehhez a márkához nincs rögzített kereskedő"
                      : undefined
                  }
                >
                  <Users size={15} />
                  {brandDealers.length === 0
                    ? "Nincs kereskedő"
                    : `Kereskedők kiválasztása (${selectedIds.length}/${maxDealersPerBrand})`}
                </button>
              </header>

              {brandModels.length === 0 ? (
                <div className="quote-group-empty">
                  A kosárban szereplő modell már nem elérhető a katalógusban.
                </div>
              ) : (
                <div className="quote-cards">
                  {brandModels.map((m) => (
                    <ModelCard key={m.id} model={m} zoom={2} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Footer / Send action */}
      <footer className="quote-footer">
        <div className="quote-footer-left">
          <div className="quote-footer-row">
            <span className="lbl">Modellek</span>
            <span className="val">{totalItems}</span>
          </div>
          <div className="quote-footer-row">
            <span className="lbl">Márkák</span>
            <span className="val">{cartBrands.length}</span>
          </div>
          <div className="quote-footer-row">
            <span className="lbl">Kiválasztott kereskedők</span>
            <span className="val">
              {cartBrands.reduce((acc, b) => acc + getSelected(b.id).length, 0)}
            </span>
          </div>
        </div>
        <div className="quote-footer-right">
          {!allBrandsHaveDealers ? (
            <div className="quote-footer-hint">
              Válassz legalább 1 kereskedőt minden márkához az ajánlatkéréshez.
            </div>
          ) : null}
          <button
            type="button"
            className="quote-send-btn"
            disabled={!allBrandsHaveDealers}
            onClick={() => setContactOpen(true)}
          >
            Ajánlatkérések küldése
            <ArrowRight size={16} />
          </button>
        </div>
      </footer>

      {/* ── Dealer picker popup ── */}
      {pickerBrandId ? (
        <DealerPicker
          brand={cartBrands.find((b) => b.id === pickerBrandId)!}
          dealers={dealersByBrand.get(pickerBrandId) ?? []}
          selectedIds={getSelected(pickerBrandId)}
          maxSelectable={maxDealersPerBrand}
          onClose={() => setPickerBrandId(null)}
          onConfirm={(ids) => {
            setSelected(pickerBrandId, ids);
            setPickerBrandId(null);
          }}
        />
      ) : null}

      {/* ── Contact / GDPR modal ── */}
      {contactOpen ? (
        <ContactModal
          onClose={() => setContactOpen(false)}
          payload={{
            items: cart.items,
            dealerIdsByBrand: Object.fromEntries(
              cartBrands.map((b) => [b.id, getSelected(b.id)]),
            ),
          }}
          onSuccess={() => {
            setContactOpen(false);
            cart.clear();
            setSelectedDealers({});
          }}
        />
      ) : null}
    </main>
  );
}
