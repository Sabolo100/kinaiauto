"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BatteryCharging,
  Car,
  CircleDot,
  Fan,
  Fuel,
  Gauge,
  Info,
  Leaf,
  Map,
  Plug,
  PlugZap,
  Route,
  Smartphone,
  Snowflake,
  Thermometer,
  ThermometerSnowflake,
  User,
  Weight,
  Zap,
  ZapOff,
} from "lucide-react";
import "./tudastar.css";

const SECTIONS = [
  { id: "technika", label: "Technika · hajtástípusok" },
  { id: "hatotav", label: "Hatótáv és fogyasztás" },
  { id: "toltes", label: "Töltési opciók" },
  { id: "penzugy", label: "Pénzügy, adózás, lízing" },
  { id: "dontes", label: "Gyors döntési segítség" },
  { id: "osszehasonlitas", label: "Összehasonlító táblázat" },
  { id: "cikkek", label: "Kapcsolódó cikkek" },
  { id: "figyelmeztetes", label: "Figyelmeztetés" },
];

type ArticleIdx = {
  slug: string;
  num: string;
  title: string;
  excerpt: string;
};

export function TudastarPage({
  articleIndex,
  lastUpdated,
}: {
  articleIndex: ArticleIdx[];
  lastUpdated: string;
}) {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [chargeTab, setChargeTab] = useState<"ac" | "dc" | "ultra">("ac");

  useEffect(() => {
    function onScroll() {
      const fromTop = window.scrollY + 140;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= fromTop) current = s.id;
      }
      setActiveId(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <section className="pagehead pagehead-tudastar">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Főoldal</Link> · Tudástár
          </div>
          <div className="pagehead-inner">
            <div>
              <div className="eyebrow">
                Vásárlói útmutató · 8 fejezet · ~12 perc olvasás
              </div>
              <h1>
                Kínai autók vásárlása <em>érthetően</em>.
              </h1>
              <p className="lede">
                Nem az a kérdés, hogy van-e választék — hanem az, hogy a saját
                használati logikádhoz melyik hajtás, ársáv és finanszírozási
                forma illik. Ez a Tudástár ehhez ad gyakorlati támpontot.
              </p>
            </div>
            <aside className="head-meta">
              <div className="row">
                <span className="k">Fejezetek</span>
                <span className="v">8</span>
              </div>
              <div className="row">
                <span className="k">Témák</span>
                <span className="v" style={{ fontSize: 14 }}>
                  Technika · Hatótáv · Töltés · Adózás
                </span>
              </div>
              <div className="row">
                <span className="k">Forrás</span>
                <span className="v" style={{ fontSize: 14 }}>
                  NAV · ADAC · Recurrent · KAVOSZ
                </span>
              </div>
              <div className="row">
                <span className="k">Utolsó frissítés</span>
                <span
                  className="v"
                  style={{
                    fontSize: 14,
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {lastUpdated}
                </span>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="doc">
          <aside className="toc">
            <div className="toc-h">Tartalom</div>
            <ol>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={activeId === s.id ? "on" : ""}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <div className="doc-main">
            {/* 1. TECHNIKA */}
            <section className="chap" id="technika">
              <div className="chap-h">
                <span className="chap-num">01 · Technika</span>
                <h2>
                  Hajtástípusok <em>érthetően</em>.
                </h2>
                <p className="sub">
                  A választásnál nem az a kérdés, hogy „melyik a legmodernebb",
                  hanem az, hogy a saját használati szokásaidhoz melyik illik
                  legjobban.
                </p>
              </div>

              <div className="pt-grid">
                <PtCard
                  kind="ice"
                  title="Benzines"
                  badge="ICE · belsőégésű"
                  icon={<Fuel size={24} />}
                  desc="Egyszerű és jól ismert megoldás. Nincs töltés, nincs hatótávtervezés, bármelyik benzinkúton gyorsan tankolható."
                  pros={[
                    "Kiszámítható, ismerős használat",
                    "Sok hosszú út, hiányzó otthoni töltés esetén ideális",
                  ]}
                  cons={[
                    "Városban magasabb fogyasztás",
                    "Több mozgó alkatrész, több szerviztétel",
                    "Cégautóadó jelentős tétel lehet",
                  ]}
                />
                <PtCard
                  kind="hev"
                  title="Öntöltő hibrid"
                  badge="HEV · self-charging"
                  icon={<Leaf size={24} />}
                  desc="Benzinmotor, elektromotor és kis akkumulátor. A rendszer fékezéskor és lassításkor tölti az akkut — külső töltőre nem kell dugni."
                  pros={[
                    "Városban érezhetően kisebb fogyasztás",
                    "Sok megállás-elindulásnál tud elektromosan segíteni",
                    "Nem igényel új szokásokat",
                  ]}
                  cons={[
                    "Nem elektromos autó: csak rövid szakaszokat megy tisztán EV módban",
                    "Nagyobb hatótáv külső töltéssel sem érhető el",
                  ]}
                />
                <PtCard
                  kind="phev"
                  title="Plug-in hibrid"
                  badge="PHEV · külső töltés"
                  icon={<PlugZap size={24} />}
                  desc="Átmenet a benzines és teljes EV között. Nagyobb akkumulátor, külső töltés. Kínai modelleknél gyakori, hogy városban elsősorban elektromosan jár."
                  pros={[
                    "Napi 30–80 km-es útnál sok használat áram nélkül megoldható",
                    "Hosszú úton sincs hatótáv-stressz",
                  ]}
                  cons={[
                    "Csak akkor takarékos, ha tényleg töltik",
                    "Töltés nélkül nehezebb benzinesként viselkedik",
                    "2025-től főszabály szerint cégautóadó-köteles",
                  ]}
                />
                <PtCard
                  kind="ev"
                  title="Teljesen elektromos"
                  badge="BEV · csak áram"
                  icon={<Zap size={24} />}
                  desc="Nincs benzin- vagy dízelmotor. Nagy akkumulátor és elektromotor. Otthoni töltéssel a legolcsóbb üzemeltetésű kategória."
                  pros={[
                    "Csendes, gyors válaszú, helyi kibocsátás nélkül",
                    "Kevesebb karbantartási elem (nincs olaj, kuplung, kipufogó)",
                    "Mentes a cégautóadó és gépjárműadó alól",
                  ]}
                  cons={[
                    "Töltési lehetőség kulcskérdés",
                    "Csak nyilvános töltőre támaszkodva drágábban üzemel",
                    "Nehezebb autó: gyorsabb gumi- és futóműkopás",
                  ]}
                />
              </div>
            </section>

            {/* 2. HATÓTÁV */}
            <section className="chap" id="hatotav">
              <div className="chap-h">
                <span className="chap-num">02 · Papíron és valóságban</span>
                <h2>
                  Mi a <em>valós</em> hatótáv?
                </h2>
                <p className="sub">
                  A gyári adat szabványos mérési ciklusból származik — jó
                  összehasonlítási alap, de nem mindig azt mutatja, amit a
                  tulajdonos a mindennapokban tapasztal.
                </p>
              </div>

              <h4 className="sub-sub-h">A valós hatótávot befolyásolja</h4>
              <div className="factor-cloud">
                {[
                  ["Külső hőmérséklet", <ThermometerSnowflake key="t" size={14} />],
                  ["Sebesség", <Gauge key="g" size={14} />],
                  ["Autópálya aránya", <Route key="r" size={14} />],
                  ["Fűtés / klíma", <Fan key="f" size={14} />],
                  ["Gumiabroncs", <CircleDot key="c" size={14} />],
                  ["Terhelés", <Weight key="w" size={14} />],
                  ["Vezetési stílus", <User key="u" size={14} />],
                  ["Akku-előmelegítés", <BatteryCharging key="b" size={14} />],
                  ["Hőszivattyú", <Thermometer key="th" size={14} />],
                ].map(([txt, icon]) => (
                  <span key={txt as string} className="factor-chip">
                    {icon}
                    {txt}
                  </span>
                ))}
              </div>

              <div className="callout">
                <Snowflake size={18} />
                <div>
                  <strong>Hideg időben az EV hatótáv csökken.</strong> Az ADAC
                  szerint fagypont körül átlagosan kb.{" "}
                  <strong>15–25%</strong> a veszteség. Egy nagy
                  Recurrent-elemzés szerint 0&nbsp;°C-on a maximális hatótáv
                  kb. <strong>78%-a</strong>, –7&nbsp;°C-on kb.{" "}
                  <strong>70%-a</strong> érhető el.{" "}
                  <a
                    href="https://www.fiaregion1.com/adac-reassures-ev-drivers-of-range-during-winter-conditions/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    fiaregion1.com →
                  </a>
                </div>
              </div>

              <h3 className="sub-h">Egyszerű hatótáv-értelmezés</h3>
              <p className="body">
                Ha egy elektromos autó papíron 500 km-t ígér, a valóságban
                érdemes így gondolkodni:
              </p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "38%" }}>Helyzet</th>
                    <th style={{ width: "24%" }}>Hatótáv-arány</th>
                    <th>Reális használati logika</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="label">Város, enyhe idő</td>
                    <td>
                      <span className="badge-ok">~100%</span>
                    </td>
                    <td>Közel lehet a gyári értékhez</td>
                  </tr>
                  <tr>
                    <td className="label">Vegyes használat</td>
                    <td>
                      <span className="badge-ok">80–90%</span>
                    </td>
                    <td>Gyakran 10–20%-kal kevesebb</td>
                  </tr>
                  <tr>
                    <td className="label">Autópálya</td>
                    <td>
                      <span className="badge-warn">~70%</span>
                    </td>
                    <td>Jelentősen csökkenhet</td>
                  </tr>
                  <tr>
                    <td className="label">Tél, hideg idő</td>
                    <td>
                      <span className="badge-warn">70–80%</span>
                    </td>
                    <td>20–30%-os csökkenés vagy nagyobb is lehet</td>
                  </tr>
                  <tr>
                    <td className="label">Rövid téli utak</td>
                    <td>
                      <span className="badge-bad">&lt; 70%</span>
                    </td>
                    <td>
                      Különösen kedvezőtlen — a fűtés aránya nagy
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3 className="sub-h">Fogyasztási költség 1000 km-re</h3>
              <p className="body">
                A különböző hajtások fogyasztása nem azonos mértékegységben
                jelenik meg (l/100&nbsp;km vs. kWh/100&nbsp;km). Költség alapon
                viszont közvetlenül összehasonlítható — egyszerűsített példa:
              </p>
              <div className="cost-chart">
                <div className="title">
                  <h4>1000&nbsp;km becsült energiaköltsége</h4>
                  <span className="axis">
                    0 &nbsp;····· &nbsp;60&nbsp;000&nbsp;Ft
                  </span>
                </div>
                {[
                  {
                    cls: "hi",
                    lbl: "Benzines SUV",
                    sub: "8 l/100km · 650 Ft/l",
                    width: "87%",
                    label: "52 000 Ft",
                    val: "52 000",
                  },
                  {
                    cls: "",
                    lbl: "Öntöltő hibrid SUV",
                    sub: "6 l/100km · 650 Ft/l",
                    width: "65%",
                    label: "39 000 Ft",
                    val: "39 000",
                  },
                  {
                    cls: "",
                    lbl: "EV · nyilvános töltővel",
                    sub: "17 kWh/100km · 200 Ft/kWh",
                    width: "57%",
                    label: "34 000 Ft",
                    val: "34 000",
                  },
                  {
                    cls: "",
                    lbl: "Plug-in hibrid · töltve",
                    sub: "vegyes: áram + benzin",
                    width: "42%",
                    label: "20–30 000 Ft",
                    val: "20–30k",
                  },
                  {
                    cls: "lo",
                    lbl: "EV · otthoni töltéssel",
                    sub: "17 kWh/100km · 70 Ft/kWh",
                    width: "20%",
                    label: "12 000 Ft",
                    val: "12 000",
                  },
                ].map((r) => (
                  <div key={r.lbl} className={`cost-row ${r.cls}`}>
                    <div className="lbl">
                      {r.lbl}
                      <small>{r.sub}</small>
                    </div>
                    <div className="bar-track">
                      <div className="bar" style={{ width: r.width }}>
                        {r.label}
                      </div>
                    </div>
                    <div className="val">{r.val}</div>
                  </div>
                ))}
              </div>
              <p
                className="body"
                style={{ color: "var(--ink-soft)", fontSize: 14 }}
              >
                <strong style={{ color: "var(--ink)" }}>A lényeg:</strong> az
                EV akkor a legolcsóbb, ha a töltés nagy része otthon vagy
                kedvező díjú munkahelyi töltőn történik. Csak nyilvános töltővel
                az előny érzékelhetően kisebb.
              </p>

              <h3 className="sub-h">EV szervizköltség</h3>
              <p className="body">
                A teljesen elektromos autókban kevesebb klasszikus karbantartási
                elem van — nincs motorolaj, gyújtógyertya, turbó, kipufogó,
                kuplung, sőt a fékek is lassabban kopnak. Ettől még nem lesz
                „nulla szervizköltségű&rdquo; az autó:
              </p>
              <ul className="checklist">
                {[
                  "Gumiabroncs (gyorsabban kophat)",
                  "Futómű",
                  "Fékfolyadék, fékek ellenőrzése",
                  "Pollenszűrő",
                  "Klímarendszer",
                  "Akku & nagyfeszültségű rendszer",
                  "Szoftverfrissítések",
                  "Garanciális vizsgálatok",
                ].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>

            {/* 3. TÖLTÉS */}
            <section className="chap" id="toltes">
              <div className="chap-h">
                <span className="chap-num">03 · Töltés</span>
                <h2>
                  Otthon vagy <em>úton</em>.
                </h2>
                <p className="sub">
                  EV és plug-in hibrid akkor a legkényelmesebb, ha otthon is
                  tölthető. Hosszú úton viszont a nyilvános hálózat és az
                  alkalmazásismeret számít.
                </p>
              </div>

              <h3 className="sub-h">Otthoni töltés</h3>
              <p className="body">
                Sima konnektor lassú, de PHEV vagy kis akkus EV-nél sokszor
                elég. Nagyobb EV-nél praktikusabb a wallbox: gyorsabb,
                biztonságosabb, jobban szabályozható.
              </p>

              <h4 className="sub-sub-h">Vásárlás előtt érdemes ellenőrizni</h4>
              <ul className="checklist">
                {[
                  "Hány amper áll rendelkezésre",
                  "Egy- vagy háromfázisú-e a hálózat",
                  "Kell-e villanyszerelői bővítés",
                  "Milyen AC teljesítményt fogad az autó",
                  "Van-e társasházi engedélyezési kérdés",
                  "Lehet-e külön mérni a fogyasztást",
                ].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>

              <h3 className="sub-h">Nyilvános töltés — három szint</h3>
              <div className="tabs">
                <button
                  type="button"
                  className={chargeTab === "ac" ? "on" : ""}
                  onClick={() => setChargeTab("ac")}
                >
                  <Plug size={14} />
                  AC <span className="speed">≤ 22 kW</span>
                </button>
                <button
                  type="button"
                  className={chargeTab === "dc" ? "on" : ""}
                  onClick={() => setChargeTab("dc")}
                >
                  <Zap size={14} />
                  DC <span className="speed">50–100 kW</span>
                </button>
                <button
                  type="button"
                  className={chargeTab === "ultra" ? "on" : ""}
                  onClick={() => setChargeTab("ultra")}
                >
                  <ZapOff size={14} />
                  Ultra <span className="speed">100+ kW</span>
                </button>
              </div>

              {chargeTab === "ac" ? (
                <div className="tab-pane on">
                  <div className="toltes-spec">
                    <div className="cell">
                      <div className="k">Teljesítmény</div>
                      <div className="v">
                        3,7–22 <small>kW</small>
                      </div>
                    </div>
                    <div className="cell">
                      <div className="k">Tipikus idő</div>
                      <div className="v">
                        4–8 <small>óra</small>
                      </div>
                    </div>
                    <div className="cell">
                      <div className="k">Hol</div>
                      <div className="v" style={{ fontSize: 15 }}>
                        Munkahely, plaza, otthon
                      </div>
                    </div>
                  </div>
                  <p className="body">
                    Lassabb tempó. Bevásárlás, munkahely, parkolás vagy hosszabb
                    városi tartózkodás közben hasznos — amíg úgyis ott állsz.
                  </p>
                </div>
              ) : null}
              {chargeTab === "dc" ? (
                <div className="tab-pane on">
                  <div className="toltes-spec">
                    <div className="cell">
                      <div className="k">Teljesítmény</div>
                      <div className="v">
                        50–100 <small>kW</small>
                      </div>
                    </div>
                    <div className="cell">
                      <div className="k">Tipikus idő</div>
                      <div className="v">
                        30–60 <small>perc</small>
                      </div>
                    </div>
                    <div className="cell">
                      <div className="k">Hol</div>
                      <div className="v" style={{ fontSize: 15 }}>
                        Főutak, nagyvárosok
                      </div>
                    </div>
                  </div>
                  <p className="body">
                    Hosszabb utaknál fontos. Autópálya mellett, főútvonalakon és
                    nagyobb városokban érdemes rá támaszkodni.
                  </p>
                </div>
              ) : null}
              {chargeTab === "ultra" ? (
                <div className="tab-pane on">
                  <div className="toltes-spec">
                    <div className="cell">
                      <div className="k">Teljesítmény</div>
                      <div className="v">
                        100–350 <small>kW</small>
                      </div>
                    </div>
                    <div className="cell">
                      <div className="k">Tipikus idő</div>
                      <div className="v">
                        15–25 <small>perc</small>
                      </div>
                    </div>
                    <div className="cell">
                      <div className="k">Hol</div>
                      <div className="v" style={{ fontSize: 15 }}>
                        Autópálya pihenők
                      </div>
                    </div>
                  </div>
                  <p className="body">
                    Az autó típusa és akku-állapota függvényében rövid idő alatt
                    sok hatótáv tölthető vissza. Nem minden modell tudja
                    kihasználni a teljes csúcsteljesítményt.
                  </p>
                </div>
              ) : null}

              <div className="callout">
                <Info size={18} />
                <div>
                  Magyarországon több szolgáltató működtet hálózatot —{" "}
                  <strong>
                    MOL Plugee, Mobiliti, drivE.ON, IONITY, EDRI
                  </strong>
                  . Az árak szolgáltatónként, teljesítményszintenként és
                  díjcsomagonként változnak.{" "}
                  <a
                    href="https://molplugee.hu/hu/araink"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    MOL Plugee árlista →
                  </a>
                </div>
              </div>

              <h3 className="sub-h">Töltőkereső appok</h3>
              <p className="body">
                Érdemes többet is használni — nem minden töltő látszik ugyanúgy
                minden rendszerben.
              </p>
              <div className="app-grid">
                {[
                  ["MOL Plugee", <Smartphone key="mp" size={13} />],
                  ["Mobiliti", <Smartphone key="m" size={13} />],
                  ["drivE.ON", <Smartphone key="d" size={13} />],
                  ["IONITY", <Smartphone key="i" size={13} />],
                  ["PlugShare", <Smartphone key="p" size={13} />],
                  ["Google Maps", <Map key="g" size={13} />],
                  ["Apple Maps", <Map key="a" size={13} />],
                  ["A Better Routeplanner", <Route key="r" size={13} />],
                  ["Beépített nav", <Car key="c" size={13} />],
                ].map(([n, ic]) => (
                  <span key={n as string} className="app-badge">
                    {ic}
                    {n}
                  </span>
                ))}
              </div>
            </section>

            {/* 4. PÉNZÜGY */}
            <section className="chap" id="penzugy">
              <div className="chap-h">
                <span className="chap-num">04 · Pénzügy, adózás, lízing</span>
                <h2>
                  Az ár csak a <em>kezdet</em>.
                </h2>
                <p className="sub">
                  Céges vásárlóknak és vállalkozóknak különösen fontos rész. A
                  szabályok időről időre változnak — ezt a blokkot évente
                  érdemes frissíteni, és könyvelővel egyeztetni.
                </p>
              </div>

              <details className="fin" open>
                <summary>Magánemberként kell cégautóadót fizetni?</summary>
                <div className="body">
                  <p className="body">
                    Magánszemély saját használatra vásárolt autója után{" "}
                    <strong>általában nem</strong> merül fel cégautóadó. Akkor
                    merülhet fel, ha utána számviteli vagy szja szerinti
                    költséget számolnak el. Pénzügyi lízingbe vett
                    személygépkocsira a tulajdonban lévő szgk. szabályait kell
                    alkalmazni.
                  </p>
                </div>
              </details>

              <details className="fin">
                <summary>Elektromos autó és cégautóadó</summary>
                <div className="body">
                  <p className="body">
                    A tisztán elektromos és nulla emissziós autók
                    környezetkímélő gépkocsinak számítanak — nem tartoznak a
                    cégautóadó alá.
                  </p>
                  <div className="callout warn" style={{ margin: "14px 0" }}>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Fontos változás 2025-től:</strong> a plug-in
                      hibrid (5P) és a növelt hatótávú hibrid (5N) főszabály
                      szerint cégautóadó-kötelesek. A 2025 előtt forgalomba
                      helyezett 5P/5N járművekre{" "}
                      <strong>2026. december 31-ig</strong> átmeneti mentesség
                      maradhat fenn.
                    </div>
                  </div>
                </div>
              </details>

              <details className="fin">
                <summary>Cégautóadó szintek 2026</summary>
                <div className="body">
                  <p className="body">
                    A havi összeg a teljesítménytől és környezetvédelmi
                    osztálytól függ.
                  </p>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Teljesítmény</th>
                        <th className="num">Köv. „0–4&rdquo;</th>
                        <th className="num">Köv. „6–10&rdquo;</th>
                        <th className="num">Köv. „5&rdquo;, „14–15&rdquo;</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["0–50 kW", "38 500", "20 000", "17 500"],
                        ["51–90 kW", "51 000", "25 000", "20 000"],
                        ["91–120 kW", "76 000", "51 000", "25 000"],
                        ["120 kW felett", "101 000", "76 000", "51 000"],
                      ].map(([row, a, b, c]) => (
                        <tr key={row}>
                          <td className="label">{row}</td>
                          <td className="num">{a}</td>
                          <td className="num">{b}</td>
                          <td className="num">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p
                    className="body"
                    style={{ fontSize: 13.5, color: "var(--ink-mute)" }}
                  >
                    Értékek Ft/hó. Egy erősebb, nem tisztán elektromos autó havi
                    adóterhe több tízezer forint lehet.
                  </p>
                </div>
              </details>

              <details className="fin">
                <summary>Vagyonszerzési illeték</summary>
                <div className="body">
                  <p className="body">
                    Vásárláskor visszterhes vagyonátruházási illeték merülhet
                    fel. Az illeték a teljesítménytől és a jármű korától függ —
                    pl. újabb autóknál 0–40 kW között <strong>550 Ft/kW</strong>
                    , 120 kW felett akár <strong>950 Ft/kW</strong>.
                  </p>
                  <div className="callout">
                    <BadgeCheck size={18} />
                    <div>
                      <strong>Mentesség:</strong> a környezetkímélő gépkocsi (5E
                      tisztán elektromos, 5Z nulla emissziós) tulajdonjogának
                      megszerzése mentes a visszterhes vagyonátruházási illeték
                      alól.
                    </div>
                  </div>
                </div>
              </details>

              <details className="fin">
                <summary>Gépjárműadó</summary>
                <div className="body">
                  <p className="body">
                    A környezetkímélő gépkocsi után{" "}
                    <strong>nem kell gépjárműadót fizetni</strong>.
                    Környezetkímélőnek a tisztán elektromos (5E) és a nulla
                    emissziós (5Z) gépkocsi számít.
                  </p>
                </div>
              </details>

              <details className="fin">
                <summary>Széchenyi Lízing MAX+ — elektromos autóra</summary>
                <div className="body">
                  <p className="body">
                    Kiemelt állami kamat- és kezelési költségtámogatás. A KAVOSZ
                    kondíciója szerint <strong>fix 3% / év</strong> nettó ügyleti
                    kamat, akár <strong>500 millió Ft</strong> finanszírozott
                    összeggel és <strong>7 éves</strong> futamidővel.
                  </p>
                  <p className="body">
                    Elektromos szgk-ra külön konstrukció: forint alapú zárt- és
                    nyílt végű pénzügyi lízing, tisztán elektromos új autókra,{" "}
                    <strong>legfeljebb bruttó 25M Ft</strong> vételárig. Min.
                    3M, max. 500M Ft, egy vállalkozás max. 10 EV-re, 36–60
                    hónap futamidő, 3% / év kamat.
                  </p>
                </div>
              </details>
            </section>

            {/* 5. DÖNTÉS */}
            <section className="chap" id="dontes">
              <div className="chap-h">
                <span className="chap-num">05 · Gyors döntési segítség</span>
                <h2>
                  Mikor melyik <em>illik hozzád</em>?
                </h2>
                <p className="sub">
                  Nincs „legjobb&rdquo; hajtás — csak a használati helyzeted
                  szerint legmegfelelőbb. Négy gyors forgatókönyv:
                </p>
              </div>

              <div className="decision-grid">
                {[
                  {
                    icon: <Fuel size={18} />,
                    h: "benzines",
                    t: "Nincs otthoni töltési lehetőség, sok a hosszú út, kevés a városi használat — vagy nem szeretnél töltéssel foglalkozni.",
                  },
                  {
                    icon: <Leaf size={18} />,
                    h: "öntöltő hibrid",
                    t: "Sok a városi és elővárosi használat, de nincs lehetőség rendszeres külső töltésre.",
                  },
                  {
                    icon: <PlugZap size={18} />,
                    h: "plug-in hibrid",
                    t: "A napi utak nagy része elektromosan megtehető, és tényleg rendszeresen tölteni fogod az autót.",
                  },
                  {
                    icon: <Zap size={18} />,
                    h: "elektromos",
                    t: "Van otthoni vagy munkahelyi töltés, sok a városi-elővárosi használat, és fontos az alacsony üzemeltetési költség.",
                  },
                ].map((d) => (
                  <article key={d.h} className="decision-card">
                    <div className="icon">{d.icon}</div>
                    <h4>
                      Ha <em>{d.h}</em> jó
                    </h4>
                    <p>{d.t}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* 6. ÖSSZEHASONLÍTÁS */}
            <section className="chap" id="osszehasonlitas">
              <div className="chap-h">
                <span className="chap-num">06 · Összehasonlítás</span>
                <h2>Költségmátrix.</h2>
                <p className="sub">
                  Szemléltető jellegű — a pontos értékek autótól, használattól,
                  áramártól, üzemanyagártól, biztosítástól, finanszírozástól és
                  adózási helyzettől függnek.
                </p>
              </div>

              <div style={{ overflowX: "auto", margin: "16px 0" }}>
                <table className="matrix">
                  <thead>
                    <tr>
                      <th className="head-row" style={{ width: "24%" }}>
                        Költségtípus
                      </th>
                      <th className="head-cat">
                        Benzines / hibrid<small>ICE · HEV</small>
                      </th>
                      <th className="head-cat">
                        Plug-in hibrid<small>PHEV</small>
                      </th>
                      <th className="head-cat">
                        Teljesen elektromos<small>BEV</small>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Üzemanyag / energia", "lvl-1 magasabb, literalapú", "lvl-2 változó, töltéstől függ", "lvl-3 otthoni töltéssel alacsony"],
                      ["Nyilvános töltés", "nem releváns", "részben releváns", "fontos költségtényező"],
                      ["Otthoni töltés", "nem releváns", "előnyös", "nagyon fontos előny"],
                      ["Szerviz", "lvl-1 több tétel", "lvl-2 két rendszer", "lvl-3 kevesebb karbantartás"],
                      ["Cégautóadó", "jellemzően fizetendő", "2025-től főszabály szerint igen", "ok mentes"],
                      ["Vagyonszerzési illeték", "fizetendő", "szabályozástól függ", "ok mentes"],
                      ["Gépjárműadó", "fizetendő", "szabályozástól függ", "ok mentes"],
                      ["Hatótávtervezés", "nem szükséges", "részben szükséges", "hosszabb útnál fontos"],
                      ["Városi használat", "lvl-2 közepes", "lvl-3 jó, ha töltik", "lvl-3 nagyon jó"],
                      ["Hosszú út", "lvl-3 egyszerű", "lvl-3 rugalmas", "lvl-2 töltéstervezést igényel"],
                    ].map(([label, ...cells]) => (
                      <tr key={label}>
                        <td className="row-h">{label}</td>
                        {cells.map((c, i) => (
                          <td key={i}>{renderMatrixCell(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. CIKKEK */}
            <section className="chap" id="cikkek">
              <div className="chap-h">
                <span className="chap-num">07 · Részletesebben</span>
                <h2>
                  Tovább <em>olvasásra</em>.
                </h2>
                <p className="sub">
                  Mélyebb tudástár-cikkek minden témakörhöz — tervezett bővítés.
                </p>
              </div>

              <div className="related">
                {articleIndex.map((a) => (
                  <Link key={a.slug} href={`/tudastar/${a.slug}`}>
                    <span className="num">{a.num}</span>
                    <h5>{a.title}</h5>
                    <p>{a.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* 8. DISCLAIMER */}
            <section className="chap" id="figyelmeztetes">
              <div className="chap-h">
                <span className="chap-num">08 · Figyelmeztetés</span>
                <h2>
                  Tájékoztató jellegű <em>információk</em>.
                </h2>
              </div>
              <div className="disclaimer">
                <Info size={20} />
                <div>
                  Az oldalon szereplő pénzügyi, adózási és üzemeltetési
                  információk <strong>tájékoztató jellegűek</strong>. A
                  szabályok idővel változhatnak, az egyes kedvezmények pedig
                  függhetnek a jármű környezetvédelmi besorolásától, a vásárló
                  jogállásától, a finanszírozási formától és a konkrét
                  használati módtól. Vásárlás, lízing vagy céges elszámolás
                  előtt minden esetben érdemes{" "}
                  <strong>
                    könyvelővel, adótanácsadóval, finanszírozóval vagy
                    hivatalos márkakereskedővel
                  </strong>{" "}
                  egyeztetni.
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function PtCard({
  kind,
  title,
  badge,
  icon,
  desc,
  pros,
  cons,
}: {
  kind: "ev" | "phev" | "hev" | "ice";
  title: string;
  badge: string;
  icon: React.ReactNode;
  desc: string;
  pros: string[];
  cons: string[];
}) {
  return (
    <article className="pt-card" data-kind={kind}>
      <div className="head">
        <div>
          <h4>{title}</h4>
          <span className="badge">{badge}</span>
        </div>
        <div className="icon">{icon}</div>
      </div>
      <p className="desc">{desc}</p>
      <span className="lbl">Mellette szól</span>
      <ul className="pros">
        {pros.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <span className="lbl">Ellene szól</span>
      <ul className="cons">
        {cons.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </article>
  );
}

function renderMatrixCell(raw: string) {
  if (raw.startsWith("lvl-")) {
    const lvl = Number(raw[4]);
    const text = raw.slice(6);
    return (
      <span className="lvl" data-lvl={lvl}>
        <span className="dots">
          <span />
          <span />
          <span />
        </span>
        {text}
      </span>
    );
  }
  if (raw.startsWith("ok ")) {
    return (
      <span
        className="badge-ok"
        style={{
          background: "var(--good-soft)",
          color: "oklch(34% 0.10 150)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          padding: "2px 8px",
          borderRadius: 3,
        }}
      >
        {raw.slice(3)}
      </span>
    );
  }
  return raw;
}
