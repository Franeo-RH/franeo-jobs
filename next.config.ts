import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les CV déposés par les candidats peuvent peser jusqu'à 5 Mo
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
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
