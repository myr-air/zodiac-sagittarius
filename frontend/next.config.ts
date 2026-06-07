import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const internalApiBaseUrl =
  process.env.SAGITTARIUS_INTERNAL_API_BASE_URL?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  turbopack: {
    root,
  },
  async rewrites() {
    if (!internalApiBaseUrl) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${internalApiBaseUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
