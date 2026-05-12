import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Topbar } from "@/components/topbar";
import { Footer } from "@/components/footer";
import { getDataLastUpdated } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/env";
import { JsonLd } from "@/components/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Találd meg a számodra megfelelő kínai modellt`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Független magyar nyelvű kínai autó-iránytű. Kategória, ársáv és hajtás alapján szűrhető 60+ modell, 15 márkától. Áttekinthető, vásárlói gondolkodásra szabva.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  keywords: [
    "kínai autó",
    "kínai autó vásárlás Magyarország",
    "BYD",
    "Chery Tiggo",
    "MG Motor",
    "elektromos autó",
    "plug-in hibrid",
    "elektromos SUV",
    "kínai elektromos autó",
    "autóvásárlás",
    "autóösszehasonlítás",
    "új autó ár",
    "kinaiauto.com",
  ],
  alternates: {
    canonical: SITE_URL,
    languages: { "hu-HU": SITE_URL },
  },
  openGraph: {
    type: "website",
    locale: "hu_HU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Találd meg a számodra megfelelő kínai modellt`,
    description:
      "Független magyar nyelvű kínai autó-iránytű. Kategória, ársáv és hajtás alapján szűrhető teljes hazai kínálat.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Magyar kínai autó iránytű`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Magyar kínai autó iránytű`,
    description:
      "Kategória, ársáv és hajtás alapján szűrhető 60+ modell, 15 márkától.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lastUpdated = await getDataLastUpdated();

  return (
    <html
      lang="hu"
      className={`${inter.variable} ${instrument.variable} ${mono.variable}`}
    >
      <body>
        <Topbar lastUpdated={lastUpdated} />
        {children}
        <Footer lastUpdated={lastUpdated} />
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
