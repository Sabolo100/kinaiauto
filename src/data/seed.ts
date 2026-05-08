// Local seed dataset — mirror of supabase/schema.sql.
// Used as a fallback when Supabase env vars are not configured (for local
// preview / Vercel preview deploys without the integration), and as the input
// to the data layer's normalization. All field names match the SQL columns,
// so swapping to a real DB row is a no-op for the UI.

import type {
  Brand,
  Category,
  Drive,
  ModelRow,
  ModelTrim,
  PriceBand,
} from "@/lib/types";

export const CATEGORIES: Category[] = [
  { id: 1, slug: "varosi-kisauto", label_hu: "Városi kisautó", sort_order: 10 },
  { id: 2, slug: "mini-suv", label_hu: "Mini SUV", sort_order: 20 },
  { id: 3, slug: "kompakt-suv", label_hu: "Kompakt SUV", sort_order: 30 },
  { id: 4, slug: "kozepmeretu-suv", label_hu: "Középméretű SUV", sort_order: 40 },
  { id: 5, slug: "nagy-suv", label_hu: "Nagy SUV", sort_order: 50 },
  { id: 6, slug: "kompakt-ferdehatu", label_hu: "Kompakt ferdehátú", sort_order: 60 },
  { id: 7, slug: "premium-limuzin", label_hu: "Prémium limuzin", sort_order: 70 },
  { id: 8, slug: "kombi", label_hu: "Kombi", sort_order: 80 },
  { id: 9, slug: "mpv", label_hu: "Egyterű / MPV", sort_order: 90 },
  { id: 10, slug: "pickup", label_hu: "Pickup", sort_order: 100 },
];

export const DRIVES: Drive[] = [
  { id: 1, slug: "benzin", label_hu: "Benzin", short_code: "ICE", sort_order: 10 },
  { id: 2, slug: "dizel", label_hu: "Dízel", short_code: "DIESEL", sort_order: 20 },
  { id: 3, slug: "onttolto-hibrid", label_hu: "Önttöltő hibrid", short_code: "HEV", sort_order: 30 },
  { id: 4, slug: "plug-in-hibrid", label_hu: "Plug-in hibrid", short_code: "PHEV", sort_order: 40 },
  { id: 5, slug: "elektromos", label_hu: "Elektromos", short_code: "BEV", sort_order: 50 },
];

export const PRICE_BANDS: PriceBand[] = [
  { id: "5-8",   label_hu: "5–8 M Ft",       min_m_ft: 0,  max_m_ft: 8.999,  sort_order: 10 },
  { id: "9-11",  label_hu: "9–11 M Ft",      min_m_ft: 9,  max_m_ft: 11.999, sort_order: 20 },
  { id: "12-15", label_hu: "12–15 M Ft",     min_m_ft: 12, max_m_ft: 15.999, sort_order: 30 },
  { id: "16-19", label_hu: "16–19 M Ft",     min_m_ft: 16, max_m_ft: 19.999, sort_order: 40 },
  { id: "20-25", label_hu: "20–25 M Ft",     min_m_ft: 20, max_m_ft: 25.999, sort_order: 50 },
  { id: "25-30", label_hu: "25–30 M Ft",     min_m_ft: 25, max_m_ft: 30.999, sort_order: 60 },
  { id: "30+",   label_hu: "30 M Ft felett", min_m_ft: 30, max_m_ft: 999,    sort_order: 70 },
];

export const BRANDS: Brand[] = [
  { id: "b-byd",       slug: "byd",       name: "BYD",       tagline: "A világ legnagyobb új energiás autógyártója.", description: "A BYD (Build Your Dreams) eredetileg akkumulátorgyártóként indult, ma a világ egyik legnagyobb új energiás autógyártója. A magyar piacon az elektromos és plug-in hibrid kínálatára épít, a városi kisautótól a hét üléses nagy SUV-ig.", founded: "1995", hq: "Shenzhen, Kína", factories: "Xi'an, Changsha, Hefei, Csongrád (épülő, EU)", parent_company: "BYD Company Ltd. (független)", importer_name: "BYD Hungary Kft.", importer_addr: "1138 Budapest, Váci út 144–150.", importer_site: "byd.com/hu", dealers_text: "10+ hivatalos márkakereskedő országosan", hero_color: "#0a3d4e", brand_tone: "#dc2626", sort_order: 10, is_active: true },
  { id: "b-chery",     slug: "chery",     name: "Chery",     tagline: "Kína egyik vezető exportőre, hatalmas globális hálózattal.", description: "A Chery Kína egyik legnagyobb és legrégebbi autógyártója, 80+ országban van jelen. A magyar piacon a Tiggo SUV-család áll a középpontban, hangsúlyos hibrid változatokkal.", founded: "1997", hq: "Wuhu, Anhui", factories: "Wuhu, Dalian, Ordos + nemzetközi CKD üzemek", parent_company: "Chery Holding (részben állami)", importer_name: "Magyar Autópiac Kft. (mychery.hu)", importer_addr: "1191 Budapest, Vak Bottyán u. 75/A", importer_site: "mychery.hu", dealers_text: "20+ kereskedő, nagyvárosokban", hero_color: "#7a2014", brand_tone: "#0f766e", sort_order: 20, is_active: true },
  { id: "b-omoda",     slug: "omoda",     name: "Omoda",     tagline: "A Chery prémiumosabb, fiatalos almárkája.", description: "Az Omoda a Chery által 2022-ben indított globális almárka, kifejezetten az európai piacra hangolt termékpalettával. Magyarországon közös kereskedői hálózaton érhető el a Jaecoo-val.", founded: "2022", hq: "Wuhu, Anhui", factories: "Chery anyavállalat üzemei", parent_company: "Chery Group", importer_name: "Omoda & Jaecoo Hungary", importer_addr: "Hivatalos hazai márkaoldal: omodajaecoo.hu", importer_site: "omodajaecoo.hu", dealers_text: "Közös Omoda & Jaecoo szalonhálózat", hero_color: "#1e293b", brand_tone: "#1e293b", sort_order: 30, is_active: true },
  { id: "b-jaecoo",    slug: "jaecoo",    name: "Jaecoo",    tagline: "Robusztus SUV-karakter, prémium technológia.", description: "A Jaecoo szintén a Chery csoport almárkája, de a klasszikus SUV-formanyelvre épít. Magyarországon az Omodával közös értékesítési hálózaton érhető el.", founded: "2023", hq: "Wuhu, Anhui", factories: "Chery anyavállalat üzemei", parent_company: "Chery Group", importer_name: "Omoda & Jaecoo Hungary", importer_addr: "Hivatalos hazai márkaoldal: omodajaecoo.hu", importer_site: "omodajaecoo.hu", dealers_text: "Közös Omoda & Jaecoo szalonhálózat", hero_color: "#3f3f46", brand_tone: "#3f3f46", sort_order: 40, is_active: true },
  { id: "b-mg",        slug: "mg",        name: "MG",        tagline: "Brit gyökerek, kínai hátszél — Európa egyik legsikeresebb kínai márkája.", description: "Az MG eredetileg brit sportkocsigyártó, ma a kínai SAIC tulajdonában. Európában és Magyarországon az egyik legrégebb óta jelen lévő, jól felépített hálózattal rendelkező kínai márka.", founded: "1924 (UK), 2007-től SAIC", hq: "Sanghaj (SAIC) / Longbridge (UK design)", factories: "Nanjing, Sanghaj, Csenghszing", parent_company: "SAIC Motor (állami)", importer_name: "MG Motor Hungary (Wallis)", importer_addr: "1117 Budapest, Hauszmann Alajos u. 3.", importer_site: "mgmotor.hu", dealers_text: "30+ kereskedő országosan", hero_color: "#7a1818", brand_tone: "#b91c1c", sort_order: 50, is_active: true },
  { id: "b-nio",       slug: "nio",       name: "NIO",       tagline: "Prémium elektromos márka csere-akkumulátoros technológiával.", description: "A NIO Kína prémium EV szegmensének egyik vezetője, jellegzetessége a NIO Power csere-akkumulátoros hálózat. Magyarországi indulását az AutoWallis hozta el 2024-ben.", founded: "2014", hq: "Sanghaj", factories: "Hefei (Jianglai)", parent_company: "NIO Inc. (független)", importer_name: "AutoWallis Group", importer_addr: "1138 Budapest, Váci út 188.", importer_site: "nio.com/hu", dealers_text: "Budapest, készülő bővítés", hero_color: "#0c5b80", brand_tone: "#0ea5e9", sort_order: 60, is_active: true },
  { id: "b-firefly",   slug: "firefly",   name: "Firefly",   tagline: "A NIO új lifestyle almárkája — városi, design-fókuszú.", description: "A Firefly a NIO 2024-ben indított almárkája, kifejezetten a városi, fiatalabb vásárlóknak. Önálló magyar oldallal jelent meg.", founded: "2024", hq: "Sanghaj", factories: "NIO partnerüzemek", parent_company: "NIO Inc.", importer_name: "AutoWallis Group", importer_addr: "1138 Budapest, Váci út 188.", importer_site: "firefly-auto.com", dealers_text: "Budapest, készülő bővítés", hero_color: "#9b2566", brand_tone: "#db2777", sort_order: 70, is_active: true },
  { id: "b-xpeng",     slug: "xpeng",     name: "XPENG",     tagline: "Tech-fókuszú prémium EV-gyártó, erős vezető-asszisztensekkel.", description: "Az XPENG (Xiaopeng Motors) Kína egyik vezető prémium EV-startupja, fókuszában a vezetőtámogató rendszerek és az autonóm vezetés. Magyarországi értékesítés szintén az AutoWallison keresztül.", founded: "2014", hq: "Kanton (Guangzhou)", factories: "Zhaoqing, Wuhan", parent_company: "XPeng Inc. (független)", importer_name: "AutoWallis Group", importer_addr: "1138 Budapest, Váci út 188.", importer_site: "xpeng.com/hu", dealers_text: "Budapest, készülő bővítés", hero_color: "#066654", brand_tone: "#059669", sort_order: 80, is_active: true },
  { id: "b-leapmotor", slug: "leapmotor", name: "Leapmotor", tagline: "A Stellantis kínai stratégiai partnere — kedvező árú EV-k.", description: "A Leapmotor a Stellantis-szal kötött globális szövetség alapján kerül Európába, ezért a Duna Autó Csoport hozza Magyarországra. Az ár-érték arányra fókuszáló kínálatot képvisel.", founded: "2015", hq: "Hangzhou", factories: "Hangzhou, Jinhua", parent_company: "Leapmotor + Stellantis (47% Stellantis)", importer_name: "Duna Autó Zrt.", importer_addr: "1239 Budapest, Európa út 24.", importer_site: "leapmotor.hu", dealers_text: "Stellantis partnerszalonok", hero_color: "#0566a0", brand_tone: "#0284c7", sort_order: 90, is_active: true },
  { id: "b-geely",     slug: "geely",     name: "Geely",     tagline: "A kínai autóipar globális óriása — Volvo, Polestar, Lotus tulajdonos.", description: "A Geely Kína egyik legnagyobb magántulajdonú autógyártója, a Volvo, Polestar, Lotus, Lynk & Co tulajdonosa. Magyarországon önálló márkaként frissen indult, hibrid és elektromos modellekkel.", founded: "1986", hq: "Hangzhou", factories: "Hangzhou, Ningbo, Csendu, sőt EU is", parent_company: "Geely Holding (független)", importer_name: "Geely Hungary", importer_addr: "Hivatalos hazai márkaoldal: geely.hu", importer_site: "geely.hu", dealers_text: "Bővülő kereskedői hálózat", hero_color: "#1f3d8a", brand_tone: "#1e40af", sort_order: 100, is_active: true },
  { id: "b-dongfeng",  slug: "dongfeng",  name: "Dongfeng",  tagline: "Kína egyik legnagyobb állami autógyártója, széles modellpalettával.", description: "A Dongfeng állami nagyvállalat, klasszikus tömegmárkák és prémium almárkák (Voyah, M-Hero) is alá tartoznak. Magyarországi képviselete személyautókat és kishaszonjárműveket egyaránt forgalmaz.", founded: "1969", hq: "Wuhan, Hubei", factories: "Wuhan, Xiangyang, Liuzhou", parent_company: "Dongfeng Motor (állami)", importer_name: "Dongfeng Motor Magyarország", importer_addr: "Miskolci hivatalos szalon", importer_site: "dongfengmotor.hu", dealers_text: "Miskolc, Budapest, bővülő hálózat", hero_color: "#5a2010", brand_tone: "#7c2d12", sort_order: 110, is_active: true },
  { id: "b-voyah",     slug: "voyah",     name: "Voyah",     tagline: "A Dongfeng prémium elektromos / range extender almárkája.", description: "A Voyah a Dongfeng csoport prémium szegmense, plug-in hibrid és range extender modellekkel. Magyarországon az importőr önálló Voyah szalont működtet.", founded: "2020", hq: "Wuhan", factories: "Wuhan", parent_company: "Dongfeng Motor", importer_name: "Voyah Magyarország", importer_addr: "Hivatalos hazai márkaoldal: voyah.hu", importer_site: "voyah.hu", dealers_text: "Budapest, kiemelt szalonokban", hero_color: "#48157a", brand_tone: "#581c87", sort_order: 120, is_active: true },
  { id: "b-baic",      slug: "baic",      name: "BAIC",      tagline: "A Pekingi Autóipar (BAIC) klasszikus tömeggyártója.", description: "A BAIC Group Kína egyik legnagyobb állami autóipari konszernje. Magyarországon a Gablini csoporton keresztül érhető el, klasszikus benzines SUV-okkal.", founded: "1958", hq: "Peking", factories: "Peking, Csucsing, Csangcsou", parent_company: "BAIC Group (állami)", importer_name: "Gablini Csoport", importer_addr: "1131 Budapest, Reitter Ferenc u. 132.", importer_site: "baic-gablini.hu", dealers_text: "Gablini szalonok", hero_color: "#3a4046", brand_tone: "#374151", sort_order: 130, is_active: true },
  { id: "b-seres",     slug: "seres",     name: "SERES",     tagline: "Csúcstechnológiás új energiás márka — Huawei partnerséggel.", description: "A SERES (eredetileg DFSK új energiás üzletág) Kínában a Huawei Smart Selection programjának egyik kulcsmárkája. Magyarországon a Duna Autón keresztül érhető el.", founded: "2016", hq: "Csungking", factories: "Csungking", parent_company: "Csungking Sokon Industry (DFSK)", importer_name: "Duna Autó Zrt.", importer_addr: "1239 Budapest, Európa út 24.", importer_site: "seres.hu", dealers_text: "Duna Autó szalonok", hero_color: "#076380", brand_tone: "#0891b2", sort_order: 140, is_active: true },
  { id: "b-maxus",     slug: "maxus",     name: "Maxus",     tagline: "A SAIC kishaszon-járműves és pickup márkája.", description: "A Maxus a SAIC tulajdonában lévő, főként haszonjárművekre, pickupokra szakosodott márka. Magyarországi kínálatát a hivatalos importőr építi.", founded: "2011 (Maxus brand)", hq: "Sanghaj (SAIC)", factories: "Sanghaj, Wuxi", parent_company: "SAIC Motor", importer_name: "Maxus Magyarország", importer_addr: "Hivatalos hazai márkaoldal: maxus.hu", importer_site: "maxus.hu", dealers_text: "Bővülő kereskedői hálózat", hero_color: "#754216", brand_tone: "#92400e", sort_order: 150, is_active: true },
];

type SeedRow = {
  brand_slug: string;
  cat_slug: string;
  drive_slug: string;
  slug: string;
  name: string;
  price_min: number;
  price_max: number;
  length_mm: number | null;
  trunk_l: number | null;
  battery_kwh: number | null;
  range_km: number | null;
  power_hp: number | null;
  seats: number | null;
  is_deal?: boolean;
  is_featured?: boolean;
};

const SEED: SeedRow[] = [
  // BYD
  { brand_slug:"byd", cat_slug:"varosi-kisauto",     drive_slug:"elektromos",      slug:"dolphin-surf",       name:"Dolphin Surf",       price_min:7.9,  price_max:9.4,  length_mm:3990, trunk_l:308, battery_kwh:43.2, range_km:322, power_hp:156, seats:5, is_deal:true },
  { brand_slug:"byd", cat_slug:"kompakt-ferdehatu", drive_slug:"elektromos",      slug:"dolphin",            name:"Dolphin",            price_min:10.9, price_max:13.2, length_mm:4290, trunk_l:345, battery_kwh:60.4, range_km:427, power_hp:204, seats:5 },
  { brand_slug:"byd", cat_slug:"mini-suv",           drive_slug:"elektromos",      slug:"atto-2",             name:"Atto 2",             price_min:11.9, price_max:13.9, length_mm:4310, trunk_l:400, battery_kwh:45.1, range_km:312, power_hp:177, seats:5 },
  { brand_slug:"byd", cat_slug:"mini-suv",           drive_slug:"plug-in-hibrid",  slug:"atto-2-dm-i",        name:"Atto 2 DM-i",        price_min:12.5, price_max:14.6, length_mm:4310, trunk_l:400, battery_kwh:18.3, range_km:90,  power_hp:163, seats:5 },
  { brand_slug:"byd", cat_slug:"kompakt-suv",        drive_slug:"elektromos",      slug:"atto-3",             name:"Atto 3",             price_min:13.9, price_max:15.9, length_mm:4455, trunk_l:440, battery_kwh:60.5, range_km:420, power_hp:204, seats:5 },
  { brand_slug:"byd", cat_slug:"premium-limuzin",    drive_slug:"elektromos",      slug:"seal",               name:"Seal",               price_min:16.9, price_max:21.9, length_mm:4800, trunk_l:402, battery_kwh:82.5, range_km:570, power_hp:530, seats:5 },
  { brand_slug:"byd", cat_slug:"premium-limuzin",    drive_slug:"plug-in-hibrid",  slug:"seal-6-dm-i",        name:"Seal 6 DM-i",        price_min:14.9, price_max:18.5, length_mm:4840, trunk_l:500, battery_kwh:18.3, range_km:105, power_hp:218, seats:5 },
  { brand_slug:"byd", cat_slug:"kombi",              drive_slug:"plug-in-hibrid",  slug:"seal-6-dm-i-touring",name:"Seal 6 DM-i Touring",price_min:15.4, price_max:19.0, length_mm:4840, trunk_l:520, battery_kwh:18.3, range_km:105, power_hp:218, seats:5 },
  { brand_slug:"byd", cat_slug:"kozepmeretu-suv",    drive_slug:"elektromos",      slug:"seal-u",             name:"Seal U",             price_min:17.9, price_max:20.9, length_mm:4785, trunk_l:552, battery_kwh:87,   range_km:500, power_hp:218, seats:5 },
  { brand_slug:"byd", cat_slug:"kozepmeretu-suv",    drive_slug:"plug-in-hibrid",  slug:"seal-u-dm-i",        name:"Seal U DM-i",        price_min:14.9, price_max:18.9, length_mm:4785, trunk_l:552, battery_kwh:18.3, range_km:125, power_hp:218, seats:5 },
  { brand_slug:"byd", cat_slug:"kozepmeretu-suv",    drive_slug:"elektromos",      slug:"sealion-7",          name:"Sealion 7",          price_min:19.9, price_max:24.9, length_mm:4830, trunk_l:520, battery_kwh:91.3, range_km:482, power_hp:530, seats:5 },
  { brand_slug:"byd", cat_slug:"nagy-suv",           drive_slug:"elektromos",      slug:"tang",               name:"Tang",               price_min:24.9, price_max:28.9, length_mm:4870, trunk_l:235, battery_kwh:108.8,range_km:530, power_hp:517, seats:7 },
  // MG
  { brand_slug:"mg",  cat_slug:"varosi-kisauto",     drive_slug:"onttolto-hibrid", slug:"mg3-hybrid-plus",    name:"MG3 Hybrid+",        price_min:7.4,  price_max:8.9,  length_mm:4113, trunk_l:293, battery_kwh:null, range_km:null, power_hp:194, seats:5, is_deal:true },
  { brand_slug:"mg",  cat_slug:"kompakt-ferdehatu", drive_slug:"elektromos",      slug:"mg4-electric",       name:"MG4 Electric",       price_min:11.9, price_max:15.9, length_mm:4287, trunk_l:363, battery_kwh:64,   range_km:435, power_hp:204, seats:5 },
  { brand_slug:"mg",  cat_slug:"kompakt-suv",        drive_slug:"onttolto-hibrid", slug:"mg-zs-hybrid-plus",  name:"MG ZS Hybrid+",      price_min:9.9,  price_max:11.9, length_mm:4430, trunk_l:443, battery_kwh:null, range_km:null, power_hp:196, seats:5 },
  { brand_slug:"mg",  cat_slug:"kompakt-suv",        drive_slug:"elektromos",      slug:"mgs5-ev",            name:"MGS5 EV",            price_min:13.9, price_max:16.5, length_mm:4476, trunk_l:453, battery_kwh:64,   range_km:430, power_hp:170, seats:5 },
  { brand_slug:"mg",  cat_slug:"kozepmeretu-suv",    drive_slug:"onttolto-hibrid", slug:"mg-hs-hybrid-plus",  name:"MG HS Hybrid+",      price_min:13.4, price_max:15.9, length_mm:4670, trunk_l:507, battery_kwh:null, range_km:null, power_hp:220, seats:5 },
  { brand_slug:"mg",  cat_slug:"kozepmeretu-suv",    drive_slug:"plug-in-hibrid",  slug:"mg-hs-phev",         name:"MG HS PHEV",         price_min:15.9, price_max:17.9, length_mm:4670, trunk_l:441, battery_kwh:24.7, range_km:120, power_hp:299, seats:5 },
  { brand_slug:"mg",  cat_slug:"premium-limuzin",    drive_slug:"elektromos",      slug:"mg-cyberster",       name:"MG Cyberster",       price_min:24.9, price_max:29.9, length_mm:4535, trunk_l:249, battery_kwh:77,   range_km:519, power_hp:510, seats:2 },
  // Omoda
  { brand_slug:"omoda", cat_slug:"kompakt-suv",      drive_slug:"benzin",          slug:"omoda-5",            name:"Omoda 5",            price_min:9.9,  price_max:12.4, length_mm:4400, trunk_l:380, battery_kwh:null, range_km:null, power_hp:147, seats:5 },
  { brand_slug:"omoda", cat_slug:"kompakt-suv",      drive_slug:"elektromos",      slug:"omoda-e5",           name:"Omoda E5",           price_min:13.9, price_max:15.9, length_mm:4424, trunk_l:380, battery_kwh:61,   range_km:430, power_hp:204, seats:5 },
  { brand_slug:"omoda", cat_slug:"kompakt-suv",      drive_slug:"onttolto-hibrid", slug:"omoda-5-shs-h",      name:"Omoda 5 SHS-H",      price_min:11.9, price_max:13.5, length_mm:4400, trunk_l:380, battery_kwh:null, range_km:null, power_hp:204, seats:5 },
  { brand_slug:"omoda", cat_slug:"kozepmeretu-suv",  drive_slug:"plug-in-hibrid",  slug:"omoda-7-shs",        name:"Omoda 7 SHS",        price_min:14.9, price_max:17.9, length_mm:4620, trunk_l:480, battery_kwh:18.3, range_km:90,  power_hp:204, seats:5 },
  { brand_slug:"omoda", cat_slug:"nagy-suv",         drive_slug:"plug-in-hibrid",  slug:"omoda-9-shs-p",      name:"Omoda 9 SHS-P",      price_min:19.9, price_max:23.9, length_mm:4775, trunk_l:660, battery_kwh:34.5, range_km:150, power_hp:449, seats:5 },
  // Jaecoo
  { brand_slug:"jaecoo", cat_slug:"kompakt-suv",     drive_slug:"benzin",          slug:"jaecoo-5",           name:"Jaecoo 5",           price_min:10.9, price_max:12.9, length_mm:4380, trunk_l:480, battery_kwh:null, range_km:null, power_hp:147, seats:5 },
  { brand_slug:"jaecoo", cat_slug:"kompakt-suv",     drive_slug:"elektromos",      slug:"jaecoo-5-ev",        name:"Jaecoo 5 EV",        price_min:13.9, price_max:15.9, length_mm:4380, trunk_l:480, battery_kwh:61,   range_km:401, power_hp:204, seats:5 },
  { brand_slug:"jaecoo", cat_slug:"kozepmeretu-suv", drive_slug:"benzin",          slug:"jaecoo-7",           name:"Jaecoo 7",           price_min:12.9, price_max:15.4, length_mm:4500, trunk_l:500, battery_kwh:null, range_km:null, power_hp:184, seats:5 },
  { brand_slug:"jaecoo", cat_slug:"kozepmeretu-suv", drive_slug:"plug-in-hibrid",  slug:"jaecoo-7-shs-p",     name:"Jaecoo 7 SHS-P",     price_min:14.9, price_max:17.9, length_mm:4500, trunk_l:500, battery_kwh:18.3, range_km:90,  power_hp:204, seats:5 },
  // Chery
  { brand_slug:"chery", cat_slug:"kompakt-suv",      drive_slug:"onttolto-hibrid", slug:"tiggo-4",            name:"Tiggo 4",            price_min:9.5,  price_max:11.5, length_mm:4318, trunk_l:380, battery_kwh:null, range_km:null, power_hp:204, seats:5, is_deal:true },
  { brand_slug:"chery", cat_slug:"kozepmeretu-suv",  drive_slug:"onttolto-hibrid", slug:"tiggo-7",            name:"Tiggo 7",            price_min:12.9, price_max:15.9, length_mm:4500, trunk_l:475, battery_kwh:null, range_km:null, power_hp:204, seats:5 },
  { brand_slug:"chery", cat_slug:"nagy-suv",         drive_slug:"onttolto-hibrid", slug:"tiggo-8",            name:"Tiggo 8",            price_min:15.9, price_max:18.9, length_mm:4722, trunk_l:889, battery_kwh:null, range_km:null, power_hp:204, seats:7, is_featured:true },
  { brand_slug:"chery", cat_slug:"nagy-suv",         drive_slug:"plug-in-hibrid",  slug:"tiggo-9",            name:"Tiggo 9",            price_min:18.9, price_max:22.9, length_mm:4820, trunk_l:660, battery_kwh:34.5, range_km:150, power_hp:449, seats:7 },
  // NIO
  { brand_slug:"nio", cat_slug:"premium-limuzin",    drive_slug:"elektromos",      slug:"et5",                name:"ET5",                price_min:21.9, price_max:25.9, length_mm:4790, trunk_l:386, battery_kwh:75,   range_km:456, power_hp:489, seats:5 },
  { brand_slug:"nio", cat_slug:"kombi",              drive_slug:"elektromos",      slug:"et5-touring",        name:"ET5 Touring",        price_min:22.9, price_max:26.9, length_mm:4790, trunk_l:450, battery_kwh:75,   range_km:445, power_hp:489, seats:5 },
  { brand_slug:"nio", cat_slug:"nagy-suv",           drive_slug:"elektromos",      slug:"el6",                name:"EL6",                price_min:26.9, price_max:31.9, length_mm:4854, trunk_l:579, battery_kwh:100,  range_km:529, power_hp:489, seats:5 },
  // Firefly
  { brand_slug:"firefly", cat_slug:"varosi-kisauto", drive_slug:"elektromos",      slug:"firefly",            name:"Firefly",            price_min:11.9, price_max:13.9, length_mm:4003, trunk_l:404, battery_kwh:42,   range_km:330, power_hp:142, seats:5 },
  // XPENG
  { brand_slug:"xpeng", cat_slug:"premium-limuzin",  drive_slug:"elektromos",      slug:"p7",                 name:"P7",                 price_min:22.9, price_max:27.9, length_mm:4888, trunk_l:440, battery_kwh:82.7, range_km:576, power_hp:341, seats:5 },
  { brand_slug:"xpeng", cat_slug:"premium-limuzin",  drive_slug:"elektromos",      slug:"p7-plus",            name:"P7+",                price_min:24.9, price_max:29.9, length_mm:5056, trunk_l:725, battery_kwh:76,   range_km:602, power_hp:241, seats:5 },
  { brand_slug:"xpeng", cat_slug:"kozepmeretu-suv",  drive_slug:"elektromos",      slug:"g6",                 name:"G6",                 price_min:18.9, price_max:22.9, length_mm:4753, trunk_l:571, battery_kwh:87.5, range_km:570, power_hp:296, seats:5 },
  { brand_slug:"xpeng", cat_slug:"nagy-suv",         drive_slug:"elektromos",      slug:"g9",                 name:"G9",                 price_min:27.9, price_max:33.9, length_mm:4891, trunk_l:660, battery_kwh:98,   range_km:570, power_hp:551, seats:5 },
  // Leapmotor
  { brand_slug:"leapmotor", cat_slug:"varosi-kisauto", drive_slug:"elektromos",    slug:"t03",                name:"T03",                price_min:7.9,  price_max:8.9,  length_mm:3620, trunk_l:210, battery_kwh:37.3, range_km:265, power_hp:95,  seats:4, is_deal:true },
  { brand_slug:"leapmotor", cat_slug:"kompakt-suv",  drive_slug:"elektromos",      slug:"b10",                name:"B10",                price_min:13.9, price_max:15.9, length_mm:4515, trunk_l:430, battery_kwh:67.1, range_km:434, power_hp:218, seats:5 },
  { brand_slug:"leapmotor", cat_slug:"kozepmeretu-suv", drive_slug:"elektromos",   slug:"c10",                name:"C10",                price_min:15.9, price_max:18.9, length_mm:4739, trunk_l:435, battery_kwh:69.9, range_km:420, power_hp:218, seats:5 },
  { brand_slug:"leapmotor", cat_slug:"kozepmeretu-suv", drive_slug:"plug-in-hibrid", slug:"c10-hibrid-ev",    name:"C10 Hibrid-EV",      price_min:14.9, price_max:17.9, length_mm:4739, trunk_l:435, battery_kwh:28.4, range_km:145, power_hp:215, seats:5 },
  // Geely
  { brand_slug:"geely", cat_slug:"kozepmeretu-suv",  drive_slug:"elektromos",      slug:"e5",                 name:"E5",                 price_min:13.9, price_max:16.4, length_mm:4615, trunk_l:438, battery_kwh:60.2, range_km:430, power_hp:218, seats:5 },
  { brand_slug:"geely", cat_slug:"kozepmeretu-suv",  drive_slug:"plug-in-hibrid",  slug:"starray-em-i",       name:"Starray EM-i",       price_min:13.9, price_max:16.9, length_mm:4655, trunk_l:540, battery_kwh:18.4, range_km:125, power_hp:204, seats:5 },
  // Dongfeng
  { brand_slug:"dongfeng", cat_slug:"premium-limuzin", drive_slug:"benzin",        slug:"shine-gs",           name:"Shine GS",           price_min:8.9,  price_max:10.9, length_mm:4690, trunk_l:470, battery_kwh:null, range_km:null, power_hp:184, seats:5 },
  { brand_slug:"dongfeng", cat_slug:"kompakt-suv",   drive_slug:"benzin",          slug:"forthing-t5-evo",    name:"Forthing T5 EVO",    price_min:9.9,  price_max:12.4, length_mm:4626, trunk_l:402, battery_kwh:null, range_km:null, power_hp:197, seats:5 },
  { brand_slug:"dongfeng", cat_slug:"kompakt-suv",   drive_slug:"onttolto-hibrid", slug:"forthing-t5-evo-hev",name:"Forthing T5 EVO HEV",price_min:11.9, price_max:13.9, length_mm:4626, trunk_l:402, battery_kwh:null, range_km:null, power_hp:218, seats:5 },
  { brand_slug:"dongfeng", cat_slug:"mpv",           drive_slug:"onttolto-hibrid", slug:"forthing-u-tour-hev",name:"Forthing U-Tour HEV",price_min:13.9, price_max:15.9, length_mm:5095, trunk_l:340, battery_kwh:null, range_km:null, power_hp:218, seats:7 },
  { brand_slug:"dongfeng", cat_slug:"varosi-kisauto",drive_slug:"elektromos",      slug:"box-e1",             name:"Box E1",             price_min:7.4,  price_max:8.9,  length_mm:3995, trunk_l:326, battery_kwh:42.3, range_km:330, power_hp:95,  seats:4 },
  // Voyah
  { brand_slug:"voyah", cat_slug:"kozepmeretu-suv",  drive_slug:"elektromos",      slug:"courage-ev",         name:"Courage EV",         price_min:21.9, price_max:25.9, length_mm:4680, trunk_l:580, battery_kwh:82,   range_km:520, power_hp:435, seats:5 },
  { brand_slug:"voyah", cat_slug:"nagy-suv",         drive_slug:"plug-in-hibrid",  slug:"free-rev-318",       name:"Free REV 318",       price_min:23.9, price_max:27.9, length_mm:4905, trunk_l:560, battery_kwh:43,   range_km:200, power_hp:455, seats:5 },
  { brand_slug:"voyah", cat_slug:"mpv",              drive_slug:"plug-in-hibrid",  slug:"dream-phev",         name:"Dream PHEV",         price_min:29.9, price_max:34.9, length_mm:5315, trunk_l:380, battery_kwh:43,   range_km:180, power_hp:435, seats:7 },
  // BAIC
  { brand_slug:"baic", cat_slug:"kompakt-suv",       drive_slug:"benzin",          slug:"x55",                name:"X55",                price_min:9.9,  price_max:11.9, length_mm:4585, trunk_l:480, battery_kwh:null, range_km:null, power_hp:177, seats:5 },
  // SERES
  { brand_slug:"seres", cat_slug:"mini-suv",         drive_slug:"elektromos",      slug:"seres-3",            name:"Seres 3",            price_min:10.9, price_max:12.9, length_mm:4385, trunk_l:330, battery_kwh:53.6, range_km:329, power_hp:163, seats:5 },
  { brand_slug:"seres", cat_slug:"kozepmeretu-suv",  drive_slug:"elektromos",      slug:"seres-5",            name:"Seres 5",            price_min:18.9, price_max:22.9, length_mm:4760, trunk_l:445, battery_kwh:80,   range_km:483, power_hp:430, seats:5 },
  // Maxus
  { brand_slug:"maxus", cat_slug:"pickup",           drive_slug:"dizel",           slug:"t60-max-pickup",     name:"T60 MAX Pickup",     price_min:13.9, price_max:15.9, length_mm:5365, trunk_l:0,   battery_kwh:null, range_km:null, power_hp:218, seats:5 },
];

// Build the joined ModelRow array (matching v_models output)
function buildModels(): ModelRow[] {
  return SEED.map((s, i) => {
    const brand = BRANDS.find((b) => b.slug === s.brand_slug)!;
    const cat = CATEGORIES.find((c) => c.slug === s.cat_slug)!;
    const drive = DRIVES.find((d) => d.slug === s.drive_slug)!;
    return {
      id: `m-${i + 1}`,
      slug: s.slug,
      name: s.name,
      is_deal: s.is_deal ?? false,
      is_available: true,
      is_featured: s.is_featured ?? false,
      price_min_m_ft: s.price_min,
      price_max_m_ft: s.price_max,
      length_mm: s.length_mm,
      width_mm: null,
      height_mm: null,
      wheelbase_mm: null,
      trunk_l: s.trunk_l,
      seats: s.seats,
      power_hp: s.power_hp,
      battery_kwh: s.battery_kwh,
      range_km: s.range_km,
      acceleration_s: null,
      consumption_text: null,
      charging_ac_kw: null,
      charging_dc_kw: null,
      charging_text: null,
      warranty_years: 7,
      warranty_km: 150_000,
      battery_warranty_years: s.drive_slug === "elektromos" || s.drive_slug === "plug-in-hibrid" ? 8 : null,
      battery_warranty_km: s.drive_slug === "elektromos" || s.drive_slug === "plug-in-hibrid" ? 160_000 : null,
      data_updated_at: "2026-05-04",
      updated_at: "2026-05-04T00:00:00Z",
      brand_id: brand.id,
      brand_slug: brand.slug,
      brand_name: brand.name,
      brand_tone: brand.brand_tone,
      brand_hero_color: brand.hero_color,
      brand_importer_name: brand.importer_name,
      brand_importer_addr: brand.importer_addr,
      brand_importer_site: brand.importer_site,
      brand_dealers_text: brand.dealers_text,
      category_id: cat.id,
      category_slug: cat.slug,
      category: cat.label_hu,
      drive_id: drive.id,
      drive_slug: drive.slug,
      drive: drive.label_hu,
      drive_code: drive.short_code,
      // Tiggo 8 has the supplied photo
      primary_photo_path:
        s.is_featured ? "models/tiggo-8/hero.avif" : null,
    };
  });
}

export const MODELS: ModelRow[] = buildModels();

// 3 generic trims per model (matches the seed-09 SQL)
export function trimsForModel(model: ModelRow): ModelTrim[] {
  const minP = model.price_min_m_ft ?? 0;
  const maxP = model.price_max_m_ft ?? 0;
  const midP = Math.round(((minP + maxP) / 2) * 10) / 10;
  return [
    {
      id: `${model.id}-comfort`,
      model_id: model.id,
      slug: "comfort",
      name: "Comfort",
      level_label: "Alapszint",
      is_featured: false,
      price_m_ft: minP,
      deal_price_m_ft: null,
      features: [
        "LED fényszórók",
        "Digitális műszerfal",
        "Tempomat",
        "Légkondicionáló",
        "Tolatóradar + kamera",
        "Multimédia érintőképernyővel",
      ],
      sort_order: 10,
    },
    {
      id: `${model.id}-style`,
      model_id: model.id,
      slug: "style",
      name: "Style",
      level_label: "Középszint",
      is_featured: true,
      price_m_ft: midP,
      deal_price_m_ft: null,
      features: [
        "Adaptív tempomat",
        "360° kamera",
        "Bőr / textil ülőgarnitúra",
        "Elektromos vezetőülés",
        "Vezeték nélküli telefontöltő",
        "Sávtartó és holttér-figyelő",
        "Apple CarPlay / Android Auto",
      ],
      sort_order: 20,
    },
    {
      id: `${model.id}-lounge`,
      model_id: model.id,
      slug: "lounge",
      name: "Lounge",
      level_label: "Csúcsszint",
      is_featured: false,
      price_m_ft: maxP,
      deal_price_m_ft: null,
      features: [
        "Panorámatető",
        "Prémium audio",
        "Szellőztetett & fűthető ülések",
        "Head-up display",
        "Asszisztált sávváltás",
        "Memória vezetőülés",
        "Nagyobb felni opció",
      ],
      sort_order: 30,
    },
  ];
}

// Articles index (used on /tudastar bottom block + as the content index)
export const ARTICLE_INDEX = [
  { slug: "hajtastipusok-egyszeruen",            num: "7.1 · Technika",  title: "Hajtástípusok egyszerűen",                 excerpt: "Benzin, hibrid, PHEV, EV — melyik hogy működik és kinek való." },
  { slug: "miert-nem-annyi-a-valos-hatotav",     num: "7.2 · Hatótáv",   title: "Miért nem annyi a valós hatótáv?",         excerpt: "Hideg, meleg, autópálya, fűtés, vezetési stílus hatása." },
  { slug: "plug-in-hibrid-zsenialis-vagy-felreertett", num: "7.3 · Hibrid", title: "Plug-in hibrid: zseniális vagy félreértett?", excerpt: "Csak akkor igazán jó, ha rendszeresen töltik." },
  { slug: "otthoni-toltes-konnektor-wallbox-napelem", num: "7.4 · Töltés", title: "Otthoni töltés: konnektor, wallbox, napelem", excerpt: "Gyakorlati útmutató vásárlás előtti ellenőrzéshez." },
  { slug: "nyilvanos-toltes-magyarorszagon",     num: "7.5 · Töltés",    title: "Nyilvános töltés Magyarországon",          excerpt: "Szolgáltatók, applikációk, töltőtípusok és árlogika." },
  { slug: "elektromos-auto-ceges-vasarlasa",     num: "7.6 · Pénzügy",   title: "Elektromos autó céges vásárlása",          excerpt: "Adózási, finanszírozási és lízing szempontok." },
  { slug: "maganvasarlokent-mire-figyelj",       num: "7.7 · Magán",     title: "Magánvásárlóként mire figyelj?",           excerpt: "Ár, hatótáv, garancia, töltés, szerviz, biztosítás, értékvesztés." },
  { slug: "kinai-auto-garancia-es-szervizhatter",num: "7.8 · Garancia",  title: "Kínai autó garancia és szervizháttér",     excerpt: "Márkánként eltérő — vásárlás előtt ellenőrizendő." },
];
