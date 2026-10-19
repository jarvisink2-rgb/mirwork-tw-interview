import type { NextConfig } from "next";

// Static export: the whole prototype runs in the browser (mock AI, localStorage),
// so it can be hosted on Vercel or any static host. When a real LLM / voice API is
// added, switch to a normal Next.js build and add route handlers under src/app/api.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
