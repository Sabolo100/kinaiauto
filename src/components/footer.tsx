import Link from "next/link";

export function Footer({ lastUpdated }: { lastUpdated: string }) {
  return (
    <footer className="foot">
      <div className="container">
        <div className="foot-grid">
          <div>
            <Link
              href="/"
              className="logo"
              style={{ marginBottom: 14, display: "inline-flex" }}
            >
              <b>kínaiautó</b>
              <span className="dot" />
              <span className="tld">.com</span>
            </Link>
            <p
              style={{
                color: "var(--ink-soft)",
                fontSize: 13.5,
                maxWidth: 400,
                lineHeight: 1.6,
                margin: "14px 0 18px",
              }}
            >
              Független kínai-autó iránytű a magyar piacra. Minden modell, egy
              logikán, gyorsan szűrhetően. Nem márka-, hanem vásárlói oldalról.
            </p>
          </div>
          <div>
            <h5>Felfedezés</h5>
            <ul>
              <li>
                <Link href="/kinalat">Kínálat</Link>
              </li>
              <li>
                <Link href="/osszehasonlitas">Összehasonlítás</Link>
              </li>
              <li>
                <Link href="/markak">Márkák</Link>
              </li>
              <li>
                <Link href="/modellek">Modellek</Link>
              </li>
              <li>
                <Link href="/tudastar">Tudástár</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Jogi</h5>
            <ul>
              <li>
                <Link href="/impresszum">Impresszum</Link>
              </li>
              <li>
                <Link href="/aszf">ÁSZF</Link>
              </li>
              <li>
                <Link href="/adatkezeles">Adatkezelési tájékoztató</Link>
              </li>
              <li>
                <Link href="/cookie">Cookie beállítások</Link>
              </li>
              <li>
                <Link href="/jogi-nyilatkozat">Jogi nyilatkozat</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Tartalom</h5>
            <ul>
              <li>
                <Link href="/tudastar">Tudástár</Link>
              </li>
              <li>
                <Link href="/markak">Márka-háttér</Link>
              </li>
              <li>
                <Link href="/llms.txt">LLM iránytű (llms.txt)</Link>
              </li>
              <li>
                <Link href="/sitemap.xml">Webhelytérkép</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-disclaimer">
          <span>
            Az árak tájékoztató jellegűek. Vásárlás előtt minden esetben
            ellenőrizd az aktuális ajánlatot a hivatalos márkaoldalon vagy
            kereskedőnél.
          </span>
          <span className="mono">
            © {new Date().getFullYear()} kínaiautó.com · adatok {lastUpdated}
          </span>
        </div>
      </div>
    </footer>
  );
}
