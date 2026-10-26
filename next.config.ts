import type { NextConfig } from "next";

// Pages are still pre-rendered as static HTML; the only server code is
// src/app/api/mir (Claude), which needs ANTHROPIC_API_KEY on Vercel.
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
