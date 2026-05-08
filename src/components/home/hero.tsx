"use client";

export function Hero({
  modelsCount,
  brandsCount,
}: {
  modelsCount: number;
  brandsCount: number;
}) {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-text">
          <div className="eyebrow">
            Független kínai autó-iránytű · Magyarország
          </div>
          <h1 className="headline">
            Találd meg az <em>elképzeléseidnek</em> megfelelő kínai modellt —
            kategória és költségkeret alapján.
          </h1>
          <p className="lede">
            Nem kell ismerned a márkákat vagy modellneveket. Válassz
            autókategóriát, add meg az ársávot, és nézd meg, milyen kínai autók
            érhetők el ma Magyarországon — egy helyen, áttekinthetően.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="n">{modelsCount}</div>
              <div className="l">Modell</div>
            </div>
            <div className="hero-stat">
              <div className="n">{brandsCount}</div>
              <div className="l">Márka</div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="/assets/tiggo8-green.avif"
            alt="Chery Tiggo 8 Aurora Green — illusztráció"
            width={1023}
            height={420}
          />
          <div className="hero-tags hero-tag-1">
            SUV · 7 ülés
            <br />
            Önttöltő hibrid
          </div>
          <div className="hero-tags hero-tag-2">
            15 980 000 Ft
            <br />
            alaplistaár
          </div>
          <div className="hero-tags hero-tag-3">
            {modelsCount} modell · {brandsCount} márka
            <br />
            egy szűrőfelületen
          </div>
        </div>
      </div>
    </section>
  );
}
