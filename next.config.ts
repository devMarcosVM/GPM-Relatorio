import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: {
      ignore: [/\/login/, /\/_next/, /\/api\/auth/],
    },
  },
};

export default nextConfig;
