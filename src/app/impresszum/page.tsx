import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Impresszum — kinaiauto.com",
  robots: { index: false },
};

export default function ImpresszumPage() {
  return (
    <LegalPage title="Impresszum">
      <p>
        Ez az impresszum a <strong>kinaiauto.com</strong> weboldal üzemeltetői adatait tartalmazza.
        A weboldal célja, hogy tájékoztató jelleggel bemutassa a Magyarországon elérhető kínai
        autómárkákat, modelleket, kategóriákat, árakat és kapcsolódó tudnivalókat.
      </p>

      <h2>1. A szolgáltató / üzemeltető adatai</h2>
      <p>
        <strong>Üzemeltető neve:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Székhely:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Levelezési cím:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Cégjegyzékszám / nyilvántartási szám:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Adószám:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Képviselő:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>E-mail:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a>
      </p>

      <h2>2. Tárhelyszolgáltató</h2>
      <p>
        <strong>Tárhelyszolgáltató neve:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Székhely:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>E-mail:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a><br />
        <strong>Weboldal:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a>
      </p>

      <h2>3. A weboldal jellege</h2>
      <p>A <strong>kinaiauto.com</strong> információs, összehasonlító és tájékoztató jellegű weboldal.</p>
      <p>A weboldal:</p>
      <ul>
        <li>nem hivatalos márkaoldal,</li>
        <li>nem autókereskedés,</li>
        <li>nem importőr,</li>
        <li>nem pénzügyi szolgáltató,</li>
        <li>nem minősül ajánlatközvetítőnek vagy hitelközvetítőnek,</li>
        <li>nem nyújt személyre szabott pénzügyi, adózási vagy jogi tanácsadást.</li>
      </ul>
      <p>
        A weboldalon szereplő autóárak, műszaki adatok, akciók, finanszírozási és adózási információk
        tájékoztató jellegűek. Vásárlási döntés előtt mindig ellenőrizni kell az aktuális adatokat
        a hivatalos márkaoldalon, importőrnél, kereskedőnél, finanszírozónál vagy illetékes szakértőnél.
      </p>

      <h2>4. Kapcsolatfelvétel</h2>
      <p>
        A weboldallal kapcsolatos kérdések, észrevételek, hibajelzések és együttműködési megkeresések
        az alábbi címen küldhetők el:
      </p>
      <p><strong>E-mail:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a></p>

      <h2>5. Szerzői jog</h2>
      <p>
        A weboldalon található szövegek, struktúrák, adatbázis-elemek, szerkesztett tartalmak és
        grafikai megoldások szerzői jogi védelem alatt állhatnak.
      </p>
      <p>
        A weboldal tartalmának másolása, újraközlése, adatbázis-szerű átvétele vagy üzleti célú
        felhasználása kizárólag az üzemeltető előzetes írásbeli engedélyével megengedett.
      </p>

      <h2>6. Hibabejelentés</h2>
      <p>
        Ha a felhasználó hibás, elavult vagy pontatlan adatot talál az oldalon, kérjük, jelezze
        az alábbi címen:
      </p>
      <p><strong>E-mail:</strong>{" "}<a href="https://www.kinaiauto.com">www.kinaiauto.com</a></p>
      <p>
        A bejelentéseket az üzemeltető lehetőség szerint ellenőrzi, és indokolt esetben javítja
        az érintett adatot.
      </p>
    </LegalPage>
  );
}
