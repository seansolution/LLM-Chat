/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for Docker standalone build (Dockerfile.frontend)
  output: 'standalone',
  // Next.js handles chat/auth/admin/share APIs in app routes.
  // Keep only endpoints that should proxy to FastAPI backend.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8001'
    return [
      {
        source: '/api/documents/:path*',
        destination: `${backendUrl}/documents/:path*`,
      },
      {
        source: '/api/health',
        destination: `${backendUrl}/health`,
      },
    ]
  },
}

module.exports = nextConfig
