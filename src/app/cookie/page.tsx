import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Cookie beállítások — kinaiauto.com",
  robots: { index: false },
};

export default function CookiePage() {
  return (
    <LegalPage title="Cookie beállítások és süti tájékoztató">
      <p>
        A <strong>kinaiauto.com</strong> cookie-kat, magyarul sütiket használhat a weboldal
        működtetéséhez, a felhasználói élmény javításához, statisztikai mérésekhez és – amennyiben
        a felhasználó hozzájárul – marketing célokra.
      </p>

      <h2>1. Mi az a cookie?</h2>
      <p>A cookie egy kis adatfájl, amelyet a weboldal a felhasználó böngészőjében vagy eszközén helyezhet el.</p>
      <p>A cookie segíthet például abban, hogy:</p>
      <ul>
        <li>a weboldal megfelelően működjön,</li>
        <li>a felhasználó beállításai megmaradjanak,</li>
        <li>a rendszer emlékezzen a cookie-választásra,</li>
        <li>statisztika készüljön az oldal használatáról,</li>
        <li>a felhasználó relevánsabb tartalmakat vagy hirdetéseket kapjon.</li>
      </ul>

      <h2>2. Cookie-k típusai</h2>

      <h3>2.1. Szükséges cookie-k</h3>
      <p>Ezek a cookie-k a weboldal alapvető működéséhez szükségesek.</p>
      <p>Például:</p>
      <ul>
        <li>munkamenet kezelése,</li>
        <li>biztonsági funkciók,</li>
        <li>cookie-beállítások megjegyzése,</li>
        <li>űrlapok alapvető működése,</li>
        <li>összehasonlítás vagy kedvencek helyi működése, ha ilyen funkció aktív.</li>
      </ul>
      <p>Ezek a cookie-k nem kapcsolhatók ki a weboldalon belül, mert nélkülük a weboldal egyes funkciói nem működnének megfelelően.</p>

      <h3>2.2. Statisztikai cookie-k</h3>
      <p>Ezek a cookie-k segítenek megérteni, hogyan használják a látogatók a weboldalt.</p>
      <p>Például:</p>
      <ul>
        <li>mely oldalak a legnépszerűbbek,</li>
        <li>milyen szűrőket használnak a látogatók,</li>
        <li>milyen eszközről érkeznek,</li>
        <li>hol hagyják el az oldalt.</li>
      </ul>
      <p>Statisztikai cookie-k csak a felhasználó hozzájárulása esetén használhatók, ha nem minősülnek feltétlenül szükséges technikai mérésnek.</p>

      <h3>2.3. Marketing cookie-k</h3>
      <p>Marketing cookie-k akkor használhatók, ha a weboldal hirdetési, remarketing vagy közösségi média célú követőkódokat alkalmaz.</p>
      <p>Például:</p>
      <ul>
        <li>hirdetések hatékonyságának mérése,</li>
        <li>remarketing célú közönségépítés,</li>
        <li>közösségi média integrációk,</li>
        <li>külső hirdetési rendszerek mérései.</li>
      </ul>
      <p>Marketing cookie-kat kizárólag a felhasználó előzetes hozzájárulása alapján használunk.</p>

      <h3>2.4. Funkcionális cookie-k</h3>
      <p>Funkcionális cookie-k segíthetnek abban, hogy az oldal kényelmesebben használható legyen.</p>
      <p>Például:</p>
      <ul>
        <li>kedvenc modellek megjegyzése,</li>
        <li>összehasonlítási lista helyi mentése,</li>
        <li>szűrési beállítások megjegyzése,</li>
        <li>megjelenítési preferenciák tárolása.</li>
      </ul>

      <h2>3. Cookie beállítási lehetőségek</h2>
      <p>A látogató az első látogatáskor cookie-értesítést láthat, ahol az alábbi lehetőségek közül választhat:</p>
      <ul>
        <li><strong>Összes elfogadása</strong></li>
        <li><strong>Csak szükséges cookie-k</strong></li>
        <li><strong>Beállítások testreszabása</strong></li>
      </ul>
      <p>A cookie-beállítások később is módosíthatók a weboldal láblécében elérhető <strong>Cookie beállítások</strong> menüpontban.</p>

      <h2>4. Cookie panel szöveg</h2>
      <p>A weboldal sütiket használ a működéshez, statisztikai méréshez és – hozzájárulásod esetén – marketing célokra. A szükséges sütik nélkül az oldal nem működne megfelelően. A további sütiket csak akkor használjuk, ha ehhez hozzájárulsz.</p>

      <h2>5. Cookie-lista</h2>
      <p>Az alábbi táblázat az oldalon használt főbb cookie-kat mutatja be.</p>
      <table>
        <thead>
          <tr>
            <th>Cookie neve</th>
            <th>Típusa</th>
            <th>Célja</th>
            <th>Megőrzési idő</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>cookie_consent</code></td>
            <td>szükséges</td>
            <td>Cookie-beállítások tárolása</td>
            <td>6–12 hónap</td>
          </tr>
          <tr>
            <td><code>session_id</code></td>
            <td>szükséges</td>
            <td>Munkamenet kezelése</td>
            <td>böngésző bezárásáig</td>
          </tr>
          <tr>
            <td><code>compare_list</code></td>
            <td>funkcionális</td>
            <td>Összehasonlításra kijelölt modellek mentése</td>
            <td>helyi beállítástól függ</td>
          </tr>
          <tr>
            <td><code>favorites</code></td>
            <td>funkcionális</td>
            <td>Kedvenc modellek mentése</td>
            <td>helyi beállítástól függ</td>
          </tr>
          <tr>
            <td><code>_ga</code></td>
            <td>statisztikai</td>
            <td>Látogatottsági mérés, ha Google Analytics aktív</td>
            <td>szolgáltatótól függ</td>
          </tr>
          <tr>
            <td><code>_gid</code></td>
            <td>statisztikai</td>
            <td>Látogatottsági mérés, ha Google Analytics aktív</td>
            <td>szolgáltatótól függ</td>
          </tr>
          <tr>
            <td>marketing pixel</td>
            <td>marketing</td>
            <td>Hirdetési mérés, ha aktív</td>
            <td>szolgáltatótól függ</td>
          </tr>
        </tbody>
      </table>

      <h2>6. Böngészőszintű beállítások</h2>
      <p>A felhasználó a saját böngészőjében is törölheti vagy tilthatja a cookie-kat.</p>
      <p>Fontos, hogy a cookie-k teljes tiltása esetén a weboldal egyes funkciói nem vagy nem megfelelően működhetnek.</p>

      <h2>7. Harmadik fél cookie-k</h2>
      <p>A weboldal használhat harmadik fél által biztosított szolgáltatásokat, például:</p>
      <ul>
        <li>analitikai szolgáltatást,</li>
        <li>videóbeágyazást,</li>
        <li>térképet,</li>
        <li>hirdetési rendszert,</li>
        <li>közösségi média plugint.</li>
      </ul>
      <p>Ezek a szolgáltatók saját cookie-kat is használhatnak. Az ilyen cookie-kra az adott szolgáltató saját adatkezelési szabályai is vonatkozhatnak.</p>

      <h2>8. Hozzájárulás visszavonása</h2>
      <p>A felhasználó bármikor módosíthatja vagy visszavonhatja cookie-hozzájárulását a weboldalon elérhető <strong>Cookie beállítások</strong> menüpontban.</p>
      <p>A visszavonás nem érinti a korábbi hozzájárulás alapján végzett adatkezelés jogszerűségét.</p>
    </LegalPage>
  );
}
