import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Jogi nyilatkozat — kinaiauto.com",
  robots: { index: false },
};

export default function JogiNyilatkozatPage() {
  return (
    <LegalPage title="Jogi nyilatkozat">
      <p>
        A jelen jogi nyilatkozat a <strong>kinaiauto.com</strong> weboldalon elérhető tartalmakra,
        adatokra, összehasonlításokra és tájékoztató anyagokra vonatkozik.
      </p>

      <h2>1. Tájékoztató jelleg</h2>
      <p>A weboldalon megjelenő információk tájékoztató jellegűek.</p>
      <p>
        Az oldalon szereplő adatok, árak, műszaki információk, kategóriák, adózási és finanszírozási
        magyarázatok nem minősülnek hivatalos ajánlatnak, szerződéses ajánlatnak, pénzügyi
        tanácsadásnak, adótanácsadásnak vagy jogi tanácsadásnak.
      </p>

      <h2>2. Autóárak és modelladatok</h2>
      <p>
        A weboldalon szereplő árak és modelladatok nyilvánosan elérhető forrásokon, márkaoldalakon,
        importőri oldalakon, árlistákon vagy szerkesztett adatbázison alapulhatnak.
      </p>
      <p>
        Az üzemeltető törekszik arra, hogy az adatok pontosak és naprakészek legyenek, de nem
        garantálja azok teljeskörűségét, hibátlanságát vagy azonnali frissességét.
      </p>
      <p>Az autók ára, felszereltsége, elérhetősége, garanciális feltétele, műszaki adata és akciós ajánlata bármikor változhat.</p>
      <p>Vásárlás előtt minden esetben ellenőrizni kell az aktuális adatokat:</p>
      <ul>
        <li>a hivatalos márkaoldalon,</li>
        <li>importőrnél,</li>
        <li>márkakereskedőnél,</li>
        <li>finanszírozónál,</li>
        <li>vagy más illetékes szakértőnél.</li>
      </ul>

      <h2>3. Nem hivatalos márkaoldal</h2>
      <p>A <strong>kinaiauto.com</strong> független információs weboldal.</p>
      <p>
        A weboldal nem állítja, hogy bármely autómárka, importőr, márkakereskedő vagy finanszírozó
        hivatalos oldala lenne, kivéve, ha ezt külön, egyértelműen jelzi.
      </p>
      <p>
        A márkanevek, logók, modellnevek és egyéb megjelölések az adott jogosultak tulajdonát
        képezhetik. Ezek a weboldalon kizárólag az autók azonosítása és tájékoztató bemutatása
        érdekében jelenhetnek meg.
      </p>

      <h2>4. Összehasonlítások</h2>
      <p>A weboldalon található összehasonlítások célja, hogy segítsék az autók közötti eligazodást.</p>
      <p>
        Az összehasonlítások nem minősülnek vásárlási ajánlásnak. A rendszer által kiemelt értékek,
        sorrendek vagy különbségek tájékoztató jellegűek, és nem helyettesítik a személyes
        mérlegelést, próbaútat vagy szakértői tanácsadást.
      </p>

      <h2>5. Pénzügyi, adózási és lízing információk</h2>
      <p>
        A weboldalon szereplő pénzügyi, adózási, lízinggel, cégautóadóval, vagyonszerzési
        illetékkel, áfa-visszaigényléssel vagy kedvezményekkel kapcsolatos információk általános
        tájékoztatásra szolgálnak.
      </p>
      <p>Ezek a szabályok idővel változhatnak, és függhetnek:</p>
      <ul>
        <li>a jármű környezetvédelmi besorolásától,</li>
        <li>a vásárló jogállásától,</li>
        <li>a finanszírozási konstrukciótól,</li>
        <li>a használat módjától,</li>
        <li>a könyvelési és adózási körülményektől.</li>
      </ul>
      <p>
        Céges vásárlás, lízing, áfa-visszaigénylés vagy adózási döntés előtt minden esetben
        javasolt könyvelővel, adótanácsadóval, finanszírozóval vagy jogi szakértővel egyeztetni.
      </p>

      <h2>6. Külső linkek</h2>
      <p>A weboldal külső weboldalakra mutató linkeket tartalmazhat.</p>
      <p>Az üzemeltető nem felel a külső oldalak:</p>
      <ul>
        <li>tartalmáért,</li>
        <li>pontosságáért,</li>
        <li>elérhetőségéért,</li>
        <li>adatkezelési gyakorlatáért,</li>
        <li>ajánlataiért,</li>
        <li>esetleges hibáiért.</li>
      </ul>
      <p>A külső linkek használata a felhasználó saját felelősségére történik.</p>

      <h2>7. Felelősség kizárása</h2>
      <p>
        Az üzemeltető nem vállal felelősséget a weboldalon szereplő információk felhasználásából
        eredő közvetlen vagy közvetett károkért.
      </p>
      <p>Különösen nem vállal felelősséget:</p>
      <ul>
        <li>hibás vagy elavult árakért,</li>
        <li>elérhetetlen modellekért,</li>
        <li>megváltozott akciókért,</li>
        <li>módosult finanszírozási feltételekért,</li>
        <li>adózási vagy jogszabályi változásokért,</li>
        <li>külső weboldalak hibáiért,</li>
        <li>a felhasználó vásárlási döntéséért,</li>
        <li>üzleti, pénzügyi vagy adózási következményekért.</li>
      </ul>

      <h2>8. Szerzői jog és adatbázis-védelem</h2>
      <p>
        A weboldal saját szerkesztésű tartalmai, szövegei, kategorizálási rendszere, összehasonlítási
        logikája, adatstruktúrája és vizuális elemei jogi védelem alatt állhatnak.
      </p>
      <p>
        A tartalmak engedély nélküli tömeges másolása, automatizált gyűjtése, újrapublikálása
        vagy üzleti célú felhasználása tilos.
      </p>

      <h2>9. Hibajelzés</h2>
      <p>Ha a felhasználó pontatlan, elavult vagy hibás adatot talál, kérjük, jelezze az alábbi címen:</p>
      <p><strong>E-mail:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a></p>
      <p>Az üzemeltető a bejelentéseket lehetőség szerint ellenőrzi, és szükség esetén módosítja az érintett tartalmat.</p>

      <h2>10. A jogi nyilatkozat módosítása</h2>
      <p>Az üzemeltető jogosult a jelen jogi nyilatkozatot módosítani. A módosított változat a weboldalon történő közzététellel lép hatályba.</p>
    </LegalPage>
  );
}
