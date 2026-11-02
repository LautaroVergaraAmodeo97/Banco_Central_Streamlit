/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const API_PUBLICA = process.env.NEXT_PUBLIC_API_URL || ''
const desarrollo = process.env.NODE_ENV !== 'production'

// Política de contenido: solo recursos propios (Next.js necesita 'unsafe-inline'
// para sus scripts de hidratación y 'unsafe-eval' en desarrollo)
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${desarrollo ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${API_PUBLICA ? ` ${API_PUBLICA}` : ''}${desarrollo ? ' ws:' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const cabecerasDeSeguridad = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig = {
  poweredByHeader: false,

  async headers() {
    return [{ source: '/:path*', headers: cabecerasDeSeguridad }]
  },

  // Reenvía /api/* al backend FastAPI, así el navegador no necesita CORS
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
