import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: { globalNotFound: true },
  redirects() {
    return [{ source: "/about-us", destination: "/about", permanent: true }];
  },
};

export default nextConfig;
