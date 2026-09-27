import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Topbar } from "@/components/topbar";
import { Footer } from "@/components/footer";
import { QuoteProvider } from "@/components/quote-context";
import { QuoteToast } from "@/components/quote-toast";
import { CookieBanner } from "@/components/cookie-banner";
import { WelcomePopupWrapper } from "@/components/welcome-popup-wrapper";
import { TutorialWrapper } from "@/components/tutorial-wrapper";
import { AppShell } from "@/components/app-shell/app-shell";
import { getDataLastUpdated } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/env";
import { JsonLd } from "@/components/json-ld";
import { DEFAULT_OG_IMAGE, ORG_DESCRIPTION, siteGraph } from "@/lib/seo";
import "./globals.css";
import "./welcome-popup.css";
import "./tutorial.css";
import "./mobile-app.css";

const GA_ID  = process.env.NEXT_PUBLIC_GA_ID         ?? "";
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";
// Primary tracking ID for the gtag.js src URL
const GTAG_SRC_ID = GA_ID || ADS_ID;

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
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Pages set their own title/description/canonical/OG via pageMeta() in
  // lib/seo.ts. Keep page-specific fields (canonical, hreflang, og:url,
  // og:title) OUT of the root layout: Next.js would inherit them into every
  // page that does not override them (e.g. og:url = homepage everywhere).
  title: {
    default: `${SITE_NAME} — kínai autók Magyarországon`,
    template: `%s — ${SITE_NAME}`,
  },
  description: ORG_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "kínaiautó",
  },
  icons: {
    // Declared explicitly: once `icons` is set, the app/icon file convention
    // is no longer emitted, so every icon has to be listed here.
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    // Older iOS still keys off this vendor meta for standalone mode.
    "apple-mobile-web-app-capable": "yes",
  },
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: SITE_NAME,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
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
        {/* ── Consent Mode v2 — must run before any GA/Ads tags ─────────────────
            Sets default denied state, then immediately restores a previous
            user choice from localStorage so returning visitors are not
            re-prompted and tracking resumes without a flash.                    */}
        <Script id="consent-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage:        'denied',
              analytics_storage: 'denied',
              ad_user_data:      'denied',
              ad_personalization:'denied',
              wait_for_update:    500,
            });
            try {
              if (localStorage.getItem('cookie_consent') === 'all') {
                gtag('consent', 'update', {
                  ad_storage:        'granted',
                  analytics_storage: 'granted',
                  ad_user_data:      'granted',
                  ad_personalization:'granted',
                });
              }
            } catch(e) {}
          `}
        </Script>

        <QuoteProvider>
          <Topbar />
          <AppShell lastUpdated={lastUpdated}>
            {children}
            <Footer lastUpdated={lastUpdated} />
          </AppShell>
          <QuoteToast />
          <CookieBanner />
          <WelcomePopupWrapper />
          <TutorialWrapper />
        </QuoteProvider>
        <JsonLd data={siteGraph()} />

        {/* ── Google Analytics + Ads ─────────────────────────────────────────── */}
        {GTAG_SRC_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_SRC_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {[
                "window.dataLayer = window.dataLayer || [];",
                "function gtag(){dataLayer.push(arguments);}",
                "gtag('js', new Date());",
                GA_ID  ? `gtag('config', '${GA_ID}');`  : "",
                ADS_ID ? `gtag('config', '${ADS_ID}');` : "",
              ].filter(Boolean).join("\n")}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
