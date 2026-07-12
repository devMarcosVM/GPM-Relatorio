import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  logging: {
    incomingRequests: {
      ignore: [/\/login/, /\/_next/, /\/api\/auth/],
    },
  },
};

export default nextConfig;
