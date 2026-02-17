/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ["next-auth"],
  },
  webpack: (config) => {
    const path = require("path");
    config.resolve = config.resolve || {};
    config.resolve.alias = { ...config.resolve.alias };
    const root = path.resolve(__dirname);
    const na = path.join(root, "node_modules", "next-auth");
    config.resolve.alias["next-auth"] = na;
    config.resolve.alias["next-auth/middleware"] = path.join(na, "middleware.js");
    config.resolve.alias["next-auth/providers/credentials"] = path.join(na, "providers", "credentials.js");
    config.resolve.alias["next-auth/providers/google"] = path.join(na, "providers", "google.js");
    return config;
  },
};

module.exports = nextConfig;
