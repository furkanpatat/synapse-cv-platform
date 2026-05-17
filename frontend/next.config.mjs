/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained server bundle (server.js + minimal
  // node_modules) so the Dockerfile can ship a tiny runtime image
  // instead of dragging the full repo into the container.
  output: "standalone",
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
