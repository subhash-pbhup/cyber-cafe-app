import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep this as a server-rendered Next.js app.
  // Do not use `output: "export"` because this project uses API routes and MongoDB.
  cacheComponents: true,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
