import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't pick up an unrelated
  // yarn.lock in a parent directory (C:\Users\265735).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
