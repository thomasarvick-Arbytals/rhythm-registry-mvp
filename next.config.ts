import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Next.js from picking up a different workspace root due to other lockfiles.
    root: __dirname,
  },
};

export default nextConfig;
