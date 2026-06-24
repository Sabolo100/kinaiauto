// Shown by Next.js while the server fetches catalog data on navigation.
// We render the REAL page header (static text, identical to page.tsx) so it
// stays pixel-stable during the transition, then a single quiet spinner where
// the data-driven content will appear — no placeholder cards that look like a
// different page flashing in.

export default function Loading() {
  return (
    <main>
      <section className="pagehead">
        <div className="container-wide">
          <div className="breadcrumbs">
            <span>Főoldal</span> · Kínálat
          </div>
          <div className="eyebrow">
            A teljes kínai kínálat egyetlen vizuális hasábon
          </div>
          <h1>
            Lásd a <em>tényleges</em> különbségeket.
          </h1>
          <p className="lede">
            Szűrj kategóriára, hajtásra, márkára, ársávra. Válaszd ki, melyik
            adatot mutassuk: ár, hatótáv, csomagtartó, teljesítmény. A modellek
            a függőleges hasábon arányosan helyezkednek el a kiválasztott érték
            szerint.
          </p>
        </div>
      </section>

      <div
        style={{
          minHeight: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "#8b9197",
          fontSize: 14,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          style={{ animation: "kspin 0.9s linear infinite", flexShrink: 0 }}
        >
          <circle cx="9" cy="9" r="7" fill="none" stroke="#e5e2da" strokeWidth="2.5" />
          <path
            d="M9 2 A7 7 0 0 1 16 9"
            fill="none"
            stroke="#8b9197"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        Kínálat betöltése…
        <style>{`@keyframes kspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  );
}
