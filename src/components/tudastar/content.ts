// Tudástár content — structured for both rendering and FAQ JSON-LD.
// This is the source-of-truth content from the design prototype (tudastar.html).
// When the user adds the article CMS, these can move to the `articles` table.

/** Last editorial change of the Tudástár text (bump when the content changes).
 *  Used for sitemap lastmod and Article dateModified. */
export const TUDASTAR_UPDATED = "2026-05-08";

/** Chapters of /tudastar (section ids on the page) — used by llms.txt. */
export const TUDASTAR_CHAPTERS = [
  { id: "technika", title: "Hajtástípusok érthetően", summary: "benzin, öntöltő hibrid, plug-in hibrid és elektromos hajtás — kinek melyik való" },
  { id: "hatotav", title: "Hatótáv papíron és valóságban", summary: "mitől függ a valós hatótáv (tél, autópálya, fűtés), egyszerű értelmezés" },
  { id: "toltes", title: "Töltés", summary: "otthoni töltés (konnektor, wallbox, napelem), nyilvános töltés, töltési szintek és költség" },
  { id: "penzugy", title: "Pénzügy, adózás, lízing", summary: "cégautóadó, vagyonszerzési illeték, gépjárműadó, Széchenyi Lízing MAX+" },
  { id: "dontes", title: "Döntési szempontok", summary: "melyik hajtás kinek éri meg a használati mód szerint" },
  { id: "osszehasonlitas", title: "Hajtások összehasonlítása", summary: "a négy hajtástípus egy táblázatban" },
] as const;

export const TUDASTAR_FAQ = [
  {
    question: "Magyarországon érdemes kínai autót venni?",
    answer:
      "Ha a használati módodhoz illik a hajtástípus és az ársáv, akkor igen. A kínai gyártók ár-érték aránya kedvező, a garancia jellemzően kiterjedt (általában 7 év / 150 000 km), és a hazai importőri hálózat egyre stabilabb. A kérdés nem márka-, hanem szempontkérdés.",
  },
  {
    question: "Cégautóadó-mentes-e a kínai elektromos autó?",
    answer:
      "Igen. A tisztán elektromos és nulla emissziós autók környezetkímélő gépkocsinak számítanak — nem tartoznak a cégautóadó alá. A plug-in hibrid (5P) és növelt hatótávú hibrid (5N) viszont 2025-től főszabály szerint cégautóadó-köteles.",
  },
  {
    question: "Mennyivel csökken az EV hatótávja télen?",
    answer:
      "Az ADAC szerint fagypont körül átlagosan 15–25%-kal. A Recurrent elemzése szerint 0 °C-on a maximális hatótáv kb. 78%-a, –7 °C-on kb. 70%-a érhető el. Hőszivattyú és akku-előmelegítés sokat javít.",
  },
  {
    question: "Mire elég 1000 km energiaköltsége elektromosnál?",
    answer:
      "Otthoni töltővel (~70 Ft/kWh, 17 kWh/100 km) kb. 12 000 Ft. Nyilvános töltővel (~200 Ft/kWh) kb. 34 000 Ft. Egy átlagos benzines SUV-é kb. 52 000 Ft. Az EV előnye otthoni töltés mellett a legnagyobb.",
  },
  {
    question: "Mi a különbség a zárt végű és a nyílt végű lízing között?",
    answer:
      "A zárt végű lízing vásárlásszerű konstrukció: a futamidő végén a tulajdonjog jellemzően automatikusan a lízingbevevőhöz kerül. A nyílt végű áfa szempontból szolgáltatás — a futamidő végén több opció van. Céges használatnál áfa szempontból gyakran a nyílt végű kedvezőbb.",
  },
  {
    question: "Van állami támogatás kínai elektromos autóra?",
    answer:
      "Igen, a Széchenyi Lízing MAX+ tisztán elektromos autóra fix 3% / év kamattal és akár 500 millió Ft finanszírozási kerettel áll rendelkezésre. Bruttó max. 25M Ft vételárig, 36–60 hónap futamidő, vállalkozásonként max. 10 EV.",
  },
];
