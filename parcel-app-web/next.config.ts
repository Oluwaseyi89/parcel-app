import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake large icon/component packages so only imported symbols are compiled
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
