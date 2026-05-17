/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained server bundle (server.js + minimal
  // node_modules) so the Dockerfile can ship a tiny runtime image
  // instead of dragging the full repo into the container.
  output: "standalone",
  // Powered-by header leaks the Next version to attackers shopping
  // for known CVEs. Off in prod.
  poweredByHeader: false,
  // Cache + security headers — designed for Cloudflare (or any CDN)
  // in front of the app. Hashed static assets are immutable; HTML is
  // not cached here (Next decides per-page). The security headers are
  // cheap wins regardless of CDN.
  async headers() {
    return [
      {
        // Next.js writes hashed filenames under /_next/static so the
        // URL changes every deploy → safe to cache for a year.
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // OG image + favicon: change rarely. Day in CDN, refresh in
        // background for a week.
        source: "/og-image.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Baseline security headers — applied to every response.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
  async rewrites() {
    // In dev we proxy /api/* to the local backend so the browser
    // doesn't hit CORS. In prod the browser talks directly to the
    // backend via NEXT_PUBLIC_API_BASE_URL, so this rewrite is unused
    // there. The target can be overridden in dev via BACKEND_INTERNAL_URL.
    const backend = process.env.BACKEND_INTERNAL_URL || "http://localhost:8080";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
    ];
  },
};

export default nextConfig;
