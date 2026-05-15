import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Adatkezelési tájékoztató — kinaiauto.com",
  robots: { index: false },
};

export default function AdatkezelesPage() {
  return (
    <LegalPage title="Adatkezelési tájékoztató">
      <p>
        A jelen adatkezelési tájékoztató bemutatja, hogy a <strong>kinaiauto.com</strong> weboldal
        üzemeltetője milyen személyes adatokat kezelhet, milyen célból, milyen jogalapon,
        mennyi ideig, és milyen jogai vannak a felhasználóknak.
      </p>

      <h2>1. Adatkezelő</h2>
      <p>
        <strong>Adatkezelő neve:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Székhely:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Cégjegyzékszám / nyilvántartási szám:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Adószám:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>E-mail:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a>
      </p>

      <h2>2. A kezelt adatok köre</h2>
      <p>A weboldal működése során az alábbi adatok kezelése merülhet fel.</p>

      <h3>2.1. Weboldal-látogatási adatok</h3>
      <p>A weboldal technikai működése során a szerverek automatikusan naplózhatnak bizonyos adatokat.</p>
      <p>Ilyenek lehetnek:</p>
      <ul>
        <li>IP-cím,</li>
        <li>böngésző típusa,</li>
        <li>eszköz típusa,</li>
        <li>operációs rendszer,</li>
        <li>látogatás időpontja,</li>
        <li>megtekintett oldalak,</li>
        <li>hivatkozó oldal,</li>
        <li>technikai naplóadatok.</li>
      </ul>

      <h3>2.2. Kapcsolatfelvétel</h3>
      <p>Ha a felhasználó e-mailben vagy űrlapon keresztül kapcsolatba lép az üzemeltetővel, az alábbi adatok kezelése történhet:</p>
      <ul>
        <li>név,</li>
        <li>e-mail cím,</li>
        <li>telefonszám, ha megadja,</li>
        <li>üzenet tartalma,</li>
        <li>beküldés időpontja.</li>
      </ul>

      <h3>2.3. Hírlevél</h3>
      <p>Ha a weboldalon hírlevél-feliratkozás érhető el, az alábbi adatok kezelése történhet:</p>
      <ul>
        <li>e-mail cím,</li>
        <li>név, ha megadásra kerül,</li>
        <li>feliratkozás időpontja,</li>
        <li>hozzájárulás ténye,</li>
        <li>leiratkozás időpontja.</li>
      </ul>

      <h3>2.4. Kedvencek, összehasonlítás, személyre szabott funkciók</h3>
      <p>Amennyiben a weboldalon kedvenc modellek mentése, összehasonlítási lista vagy felhasználói fiók funkció érhető el, az alábbi adatok kezelése történhet:</p>
      <ul>
        <li>mentett modellek,</li>
        <li>összehasonlításra kijelölt modellek,</li>
        <li>felhasználói beállítások,</li>
        <li>regisztrációs adatok,</li>
        <li>belépési adatok.</li>
      </ul>
      <p>Ha ezek a funkciók regisztráció nélkül, csak a böngészőben működnek, az adatok helyben, a felhasználó eszközén is tárolódhatnak.</p>

      <h3>2.5. Cookie-k és hasonló technológiák</h3>
      <p>A weboldal cookie-kat és hasonló technológiákat használhat. Ezekről külön dokumentum, a <strong>Cookie beállítások és süti tájékoztató</strong> ad részletesebb információt.</p>

      <h2>3. Az adatkezelések célja és jogalapja</h2>
      <table>
        <thead>
          <tr>
            <th>Adatkezelés</th>
            <th>Cél</th>
            <th>Jogalap</th>
            <th>Megőrzési idő</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Technikai naplóadatok</td>
            <td>Weboldal biztonságos működtetése, hibakeresés</td>
            <td>Jogos érdek</td>
            <td>Általában 30–90 nap</td>
          </tr>
          <tr>
            <td>Kapcsolatfelvétel</td>
            <td>Kérdések és megkeresések megválaszolása</td>
            <td>Hozzájárulás vagy jogos érdek</td>
            <td>Az ügy lezárásától számított legfeljebb 1 év</td>
          </tr>
          <tr>
            <td>Hírlevél</td>
            <td>Tájékoztatás újdonságokról, cikkekről, ármozgásokról</td>
            <td>Hozzájárulás</td>
            <td>Leiratkozásig</td>
          </tr>
          <tr>
            <td>Cookie hozzájárulás</td>
            <td>Cookie beállítások kezelése</td>
            <td>Hozzájárulás / jogos érdek</td>
            <td>A cookie típusától függően</td>
          </tr>
          <tr>
            <td>Kedvencek és összehasonlítás</td>
            <td>Felhasználói élmény javítása</td>
            <td>Hozzájárulás vagy jogos érdek</td>
            <td>Funkció használatáig vagy törlésig</td>
          </tr>
          <tr>
            <td>Regisztráció, ha van</td>
            <td>Felhasználói fiók működtetése</td>
            <td>Szerződés teljesítése / hozzájárulás</td>
            <td>Fiók törléséig</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Hírlevél</h2>
      <p>A hírlevélre történő feliratkozás önkéntes.</p>
      <p>A felhasználó bármikor leiratkozhat:</p>
      <ul>
        <li>a hírlevélben található leiratkozási linkkel,</li>
        <li>vagy az adatkezelőnek küldött e-mailben.</li>
      </ul>
      <p>A leiratkozás után az adatkezelő nem küld további hírlevelet, kivéve, ha a felhasználó újra feliratkozik.</p>

      <h2>5. Adattovábbítás és adatfeldolgozók</h2>
      <p>A weboldal működtetéséhez az adatkezelő adatfeldolgozókat vehet igénybe.</p>
      <p>Ilyenek lehetnek:</p>
      <ul>
        <li>tárhelyszolgáltató,</li>
        <li>e-mail szolgáltató,</li>
        <li>hírlevélküldő rendszer,</li>
        <li>analitikai szolgáltató,</li>
        <li>cookie-kezelő platform,</li>
        <li>fejlesztői / karbantartói szolgáltató.</li>
      </ul>
      <p>
        <strong>Tárhelyszolgáltató:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Hírlevél szolgáltató:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Analitikai szolgáltató:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a>
      </p>
      <p>Az adatfeldolgozók a személyes adatokat kizárólag az adatkezelő utasításai szerint kezelhetik.</p>

      <h2>6. Harmadik országba történő adattovábbítás</h2>
      <p>Bizonyos szolgáltatók, például analitikai, hírlevélküldő vagy felhőszolgáltatók, az Európai Unión kívüli adatkezelést is végezhetnek.</p>
      <p>Ilyen esetben az adatkezelő olyan szolgáltatókat választ, amelyek megfelelő adatvédelmi garanciákat alkalmaznak, például szerződéses rendelkezéseket vagy más jogszerű adattovábbítási mechanizmust.</p>

      <h2>7. Az érintettek jogai</h2>
      <p>A felhasználó jogosult:</p>
      <ul>
        <li>tájékoztatást kérni személyes adatai kezeléséről,</li>
        <li>hozzáférést kérni az adataihoz,</li>
        <li>kérni pontatlan adatai helyesbítését,</li>
        <li>kérni adatai törlését,</li>
        <li>kérni az adatkezelés korlátozását,</li>
        <li>tiltakozni bizonyos adatkezelések ellen,</li>
        <li>hozzájárulását bármikor visszavonni,</li>
        <li>adathordozhatóságot kérni, ha alkalmazható,</li>
        <li>panaszt tenni a felügyeleti hatóságnál.</li>
      </ul>
      <p>A kérelmek az alábbi címen nyújthatók be:</p>
      <p><strong>E-mail:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a></p>
      <p>Az adatkezelő a kérelmekre indokolatlan késedelem nélkül, de legfeljebb egy hónapon belül válaszol.</p>

      <h2>8. Panasztételi lehetőség</h2>
      <p>A felhasználó panaszt tehet a Nemzeti Adatvédelmi és Információszabadság Hatóságnál.</p>
      <p>
        <strong>Nemzeti Adatvédelmi és Információszabadság Hatóság</strong><br />
        Cím: 1055 Budapest, Falk Miksa utca 9–11.<br />
        Postacím: 1363 Budapest, Pf. 9.<br />
        Weboldal: <a href="https://www.naih.hu">www.naih.hu</a><br />
        E-mail: ugyfelszolgalat@naih.hu
      </p>

      <h2>9. Adatbiztonság</h2>
      <p>Az adatkezelő megfelelő technikai és szervezési intézkedéseket alkalmaz a személyes adatok védelme érdekében.</p>
      <p>Ilyen intézkedések lehetnek:</p>
      <ul>
        <li>hozzáférések korlátozása,</li>
        <li>biztonságos tárhelyszolgáltatás,</li>
        <li>titkosított kapcsolat használata,</li>
        <li>rendszeres frissítések,</li>
        <li>naplózás,</li>
        <li>jogosultságkezelés.</li>
      </ul>

      <h2>10. A tájékoztató módosítása</h2>
      <p>Az adatkezelő jogosult a jelen tájékoztatót módosítani. A módosított tájékoztató a weboldalon történő közzététellel lép hatályba.</p>
    </LegalPage>
  );
}
