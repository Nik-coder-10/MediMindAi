import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Prevents X-Powered-By: Next.js banner

  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "microphone=(self), camera=(self), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],

  experimental: {
    serverComponentsExternalPackages: ["@napi-rs/canvas", "canvas", "pdfjs-dist", "tesseract.js"],
  },

  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = {
        type: "filesystem",
        allowCollectingMemory: true,
      };
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        "@napi-rs/canvas": false,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};


export default withNextIntl(nextConfig);
