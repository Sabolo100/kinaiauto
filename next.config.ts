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
};

export default config;
