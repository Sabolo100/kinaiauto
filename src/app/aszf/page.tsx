import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Általános Felhasználási Feltételek — kinaiauto.com",
  robots: { index: false },
};

export default function AszfPage() {
  return (
    <LegalPage title="Általános Felhasználási Feltételek">
      <p>
        A jelen dokumentum a <strong>kinaiauto.com</strong> weboldal használatának általános
        feltételeit tartalmazza.
      </p>
      <p>
        A weboldal használatával a látogató elfogadja az itt leírt feltételeket. Ha a felhasználó
        nem ért egyet ezekkel a feltételekkel, kérjük, ne használja a weboldalt.
      </p>

      <h2>1. A weboldal célja</h2>
      <p>
        A <strong>kinaiauto.com</strong> célja, hogy segítse a felhasználókat a Magyarországon
        elérhető kínai autómárkák és modellek közötti eligazodásban.
      </p>
      <p>A weboldal elsősorban kategória, ársáv, hajtásmód és egyéb praktikus szempontok alapján mutatja be az autókat.</p>
      <p>A weboldalon található tartalmak:</p>
      <ul>
        <li>autómodellek bemutatása,</li>
        <li>kategória szerinti keresés,</li>
        <li>ársáv szerinti keresés,</li>
        <li>hajtástípus szerinti keresés,</li>
        <li>modelladatok és árak megjelenítése,</li>
        <li>összehasonlítási lehetőség,</li>
        <li>tudástár és vásárlási tájékoztatók,</li>
        <li>márkákkal kapcsolatos háttérinformációk.</li>
      </ul>

      <h2>2. A szolgáltatás jellege</h2>
      <p>A weboldal információs és tájékoztató szolgáltatás.</p>
      <p>A weboldal nem minősül:</p>
      <ul>
        <li>autókereskedésnek,</li>
        <li>hivatalos importőri vagy márkakereskedői oldalnak,</li>
        <li>pénzügyi szolgáltatásnak,</li>
        <li>hitel- vagy lízingközvetítésnek,</li>
        <li>jogi, adózási vagy pénzügyi tanácsadásnak,</li>
        <li>hivatalos ajánlattételnek.</li>
      </ul>
      <p>A weboldalon megjelenő adatok nem minősülnek kötelező érvényű ajánlatnak.</p>

      <h2>3. Regisztráció és felhasználói fiók</h2>
      <p>
        Amennyiben a weboldalon később regisztráció, kedvenc modellek mentése, értesítések vagy
        személyre szabott funkciók érhetők el, ezek használata külön felhasználói fiókhoz köthető.
      </p>
      <p>
        A felhasználó köteles valós és pontos adatokat megadni. A felhasználó felelős a saját
        belépési adatainak biztonságáért.
      </p>
      <p>
        Az üzemeltető jogosult a nyilvánvalóan hamis, visszaélésszerű vagy jogsértő regisztrációkat
        törölni.
      </p>

      <h2>4. Autóadatok, árak és műszaki információk</h2>
      <p>A weboldalon szereplő adatok több forrásból származhatnak, például:</p>
      <ul>
        <li>hivatalos márkaoldalakról,</li>
        <li>importőri oldalakról,</li>
        <li>kereskedői oldalakról,</li>
        <li>árlistákból,</li>
        <li>katalógusokból,</li>
        <li>nyilvánosan elérhető információkból,</li>
        <li>az üzemeltető által szerkesztett adatbázisból.</li>
      </ul>
      <p>
        Az üzemeltető törekszik az adatok pontosságára és frissességére, de nem garantálja, hogy
        minden adat minden pillanatban teljes, aktuális vagy hibamentes.
      </p>
      <p>Különösen változhatnak:</p>
      <ul>
        <li>listaárak,</li>
        <li>akciós árak,</li>
        <li>felszereltségi szintek,</li>
        <li>garanciális feltételek,</li>
        <li>finanszírozási ajánlatok,</li>
        <li>elérhetőség,</li>
        <li>műszaki adatok,</li>
        <li>importőri vagy kereskedői információk.</li>
      </ul>
      <p>
        Vásárlási döntés előtt minden esetben a hivatalos márkaoldalon, importőrnél vagy
        márkakereskedőnél kell ellenőrizni az aktuális adatokat.
      </p>

      <h2>5. Összehasonlító funkció</h2>
      <p>
        A weboldalon elérhető összehasonlítási funkció célja, hogy a felhasználók könnyebben
        áttekintsék az egyes modellek közötti különbségeket.
      </p>
      <p>
        Az összehasonlítás tájékoztató jellegű. Az ott szereplő kiemelések, sorrendek, ár- vagy
        adatkülönbségek nem minősülnek vásárlási ajánlásnak.
      </p>
      <p>A felhasználó saját felelősségére hoz vásárlási döntést.</p>

      <h2>6. Tudástár és szakmai tartalmak</h2>
      <p>
        A Tudástárban szereplő cikkek, magyarázatok és példatáblázatok általános tájékoztatást
        szolgálnak.
      </p>
      <p>Ezek nem helyettesítik:</p>
      <ul>
        <li>a hivatalos kereskedői tájékoztatást,</li>
        <li>a finanszírozói ajánlatot,</li>
        <li>könyvelői vagy adótanácsadói egyeztetést,</li>
        <li>jogi tanácsadást,</li>
        <li>műszaki szakvéleményt.</li>
      </ul>

      <h2>7. Külső linkek</h2>
      <p>A weboldal külső weboldalakra mutató linkeket tartalmazhat.</p>
      <p>
        Az üzemeltető nem vállal felelősséget a külső oldalak tartalmáért, működéséért,
        elérhetőségéért vagy adatkezelési gyakorlatáért.
      </p>

      <h2>8. Szellemi tulajdon</h2>
      <p>
        A weboldalon található szerkesztett tartalmak, szövegek, adatstruktúrák, vizuális elemek,
        adatbázis-elemek és grafikai megoldások jogi védelem alatt állhatnak.
      </p>
      <p>
        A weboldal tartalma nem másolható, nem gyűjthető automatizált módon, nem publikálható
        újra és nem használható üzleti célra az üzemeltető előzetes írásbeli engedélye nélkül.
      </p>

      <h2>9. Tiltott felhasználás</h2>
      <p>A felhasználó nem jogosult:</p>
      <ul>
        <li>a weboldal működését zavarni,</li>
        <li>automatizált adatgyűjtést végezni az üzemeltető engedélye nélkül,</li>
        <li>hamis vagy félrevezető adatot beküldeni,</li>
        <li>a weboldal tartalmát jogosulatlanul lemásolni,</li>
        <li>a weboldalt jogellenes célra használni.</li>
      </ul>

      <h2>10. Felelősség korlátozása</h2>
      <p>
        Az üzemeltető nem felel a weboldalon szereplő adatok felhasználásából eredő közvetlen
        vagy közvetett károkért.
      </p>
      <p>Különösen nem felel:</p>
      <ul>
        <li>hibás vagy elavult árakért,</li>
        <li>módosult kereskedői ajánlatokért,</li>
        <li>készlethiányért,</li>
        <li>finanszírozási feltételek változásáért,</li>
        <li>adózási szabályok változásáért,</li>
        <li>külső weboldalak hibáiért,</li>
        <li>a felhasználó vásárlási döntéséért.</li>
      </ul>

      <h2>11. A feltételek módosítása</h2>
      <p>
        Az üzemeltető jogosult a jelen feltételeket egyoldalúan módosítani. A módosítás a
        weboldalon történő közzététellel lép hatályba.
      </p>

      <h2>12. Kapcsolat</h2>
      <p>A weboldal használatával kapcsolatos kérdések az alábbi címen jelezhetők:</p>
      <p><strong>E-mail:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a></p>
    </LegalPage>
  );
}
