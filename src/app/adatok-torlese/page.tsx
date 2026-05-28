import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Adatok törlése — kinaiauto.com",
  description:
    "Tájékoztató a kinaiauto.com weboldalon kezelt adatok törléséhez.",
  robots: { index: false },
};

export default function AdatokTorlese() {
  return (
    <LegalPage title="Adatok törlése">
      <p>
        A <strong>kinaiauto.com</strong> weboldal üzemeltetője biztosítja, hogy felhasználói
        kérelmezhetik a róluk tárolt adatok törlését. Ez az oldal leírja, milyen adatokat kezelünk,
        és hogyan kérheted ezek törlését.
      </p>

      <h2>1. Milyen adatokat kezelünk?</h2>
      <p>
        A kinaiauto.com egy információs, tájékoztató jellegű weboldal. Felhasználói fiókot nem
        kezelünk, regisztráció nem szükséges az oldal használatához.
      </p>
      <p>Az oldal az alábbi adatokat kezelheti — kizárólag a felhasználó beleegyezésével:</p>
      <ul>
        <li>
          <strong>Analitikai sütik (cookies):</strong> névtelen látogatottsági adatok (oldallátogatások,
          eszköztípus, böngésző) a Google Analytics rendszerén keresztül.
        </li>
        <li>
          <strong>Hirdetési sütik:</strong> a Google Ads rendszerén keresztül kezelt, hirdetések
          megjelenítéséhez és méréshez kapcsolódó adatok — csak akkor, ha a felhasználó ehhez
          hozzájárult a süti-beállítások során.
        </li>
        <li>
          <strong>Facebook Pixel / Meta-integrációhoz kapcsolódó adatok:</strong> ha a Facebook
          alkalmazáson keresztül érkező linkkel látogattad meg az oldalt, a Meta a saját adatkezelési
          szabályzata alapján kezelhet adatokat. A kinaiauto.com ezeket az adatokat közvetlenül nem
          tárolja.
        </li>
      </ul>
      <p>
        A weboldalon tárolt egyéni felhasználói adatbázis <strong>nem létezik</strong> — személyes
        adatot (név, e-mail, telefonszám) kizárólag akkor kezelünk, ha azt a felhasználó önkéntesen,
        e-mailben vagy kapcsolatfelvételkor adja meg.
      </p>

      <h2>2. Sütik törlése / beleegyezés visszavonása</h2>
      <p>
        A süti-beleegyezésen alapuló adatkezelés (analitika, hirdetések) azonnali hatállyal
        visszavonható:
      </p>
      <ul>
        <li>
          <strong>Böngészőből:</strong> töröld a kinaiauto.com weboldalhoz tartozó sütiket a böngésző
          beállításaiban (Beállítások → Adatvédelem → Sütik törlése).
        </li>
        <li>
          <strong>Google Analytics letiltása:</strong>{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Analytics Opt-out bővítmény
          </a>
        </li>
        <li>
          <strong>Google Ads személyre szabás letiltása:</strong>{" "}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google hirdetési beállítások
          </a>
        </li>
        <li>
          <strong>Meta / Facebook adatkezelés:</strong>{" "}
          <a
            href="https://www.facebook.com/privacy/policy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meta adatvédelmi irányelvek
          </a>
        </li>
      </ul>

      <h2>3. Személyes adatok törlésének kérelmezése</h2>
      <p>
        Ha e-mailben vagy egyéb módon személyes adatot adtál meg számunkra, és kéred annak törlését,
        kérjük, küldj e-mailt az alábbi elérhetőségre:
      </p>
      <p>
        <strong>E-mail:</strong>{" "}
        <a href="mailto:info@kinaiauto.com">info@kinaiauto.com</a>
      </p>
      <p>
        Kérelmezd az alábbi adatokkal:
      </p>
      <ul>
        <li>Tárgy: <em>Adattörlési kérelem</em></li>
        <li>Az érintett e-mail cím vagy az általad megadott azonosító adat</li>
        <li>A törlési kérelem indoklása (opcionális)</li>
      </ul>
      <p>
        A kérelmet <strong>30 napon belül</strong> feldolgozzuk, és visszaigazoljuk a törlés tényét,
        vagy tájékoztatunk, ha az adott adat kezeléséhez jogos érdek fűződik.
      </p>

      <h2>4. Facebook alkalmazás — adattörlési kérelem</h2>
      <p>
        Ha a kinaiauto.com Facebook-applikációján keresztül nyújtottál be adatot, és szeretnéd azokat
        töröltetni, az alábbi lépéseket kövesd:
      </p>
      <ol>
        <li>
          Lépj be a Facebook fiókodba, és menj a{" "}
          <strong>Beállítások → Biztonság és bejelentkezés → Alkalmazások és weboldalak</strong>{" "}
          menübe.
        </li>
        <li>
          Keresd meg a <strong>kinaiauto.com</strong> alkalmazást, és távolítsd el.
        </li>
        <li>
          Ha ezen felül adattörlési kérelmet is be szeretnél nyújtani, küldj e-mailt a fenti
          elérhetőségre.
        </li>
      </ol>
      <p>
        A törlési kérelem beérkezésétől számított <strong>30 napon belül</strong> eltávolítjuk az
        összes, a platformon tárolt személyes adatodat, és e-mailben visszaigazolást küldünk.
      </p>

      <h2>5. Kapcsolat</h2>
      <p>
        Adatkezeléssel kapcsolatos bármilyen kérdéssel fordulj hozzánk bizalommal:
      </p>
      <p>
        <strong>E-mail:</strong>{" "}
        <a href="mailto:info@kinaiauto.com">info@kinaiauto.com</a><br />
        <strong>Weboldal:</strong>{" "}
        <a href="https://www.kinaiauto.com">www.kinaiauto.com</a>
      </p>
    </LegalPage>
  );
}
