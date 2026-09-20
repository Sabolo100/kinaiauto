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
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default config;
