import type { NextConfig } from "next";

// Public media (car photos, brand logos) is served from S3-compatible object
// storage. Allow-list its host for next/image in case it is used later.
const mediaBase = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE ?? "";
let mediaHost = "";
let mediaProtocol: "https" | "http" = "https";
try {
  if (mediaBase) {
    const u = new URL(mediaBase);
    mediaHost = u.hostname;
    mediaProtocol = u.protocol === "http:" ? "http" : "https";
  }
} catch {}

const config: NextConfig = {
  reactStrictMode: true,
  // No "X-Powered-By: Next.js" header.
  poweredByHeader: false,
  // Next.js 15.2+ streams metadata into <body> for user agents it does not
  // recognise as bots — Googlebot and the AI crawlers included. Canonical and
  // hreflang are only honoured in <head>, so every UA gets blocking metadata.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: mediaHost
      ? [{ protocol: mediaProtocol, hostname: mediaHost, pathname: "/**" }]
      : [],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        // Service worker must never be served stale, otherwise updates stall.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      {
        // CMS and API must never be indexed. Sent as a header so the CMS path
        // does not have to be advertised in robots.txt.
        source: "/c4m5s6/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/c4m5s6",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default config;
