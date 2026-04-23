/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['v3b.fal.media', 'fal.media', 'storage.googleapis.com'],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limit referrer data to same origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable sensor APIs
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // HSTS — 2 years, preload-ready
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-inline' required for Next.js inline scripts; 'unsafe-eval' required for Next.js RSC hydration
              // Whitelisted external scripts: Google Tag Manager (analytics, consent-gated) + Stripe.js (payments)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              // fal.media CDN for AI-generated images; Google Analytics pixel; self for Next.js image optimiser
              "img-src 'self' data: blob: https://v3b.fal.media https://fal.media https://storage.googleapis.com https://www.google-analytics.com",
              // fal.ai API + Stripe API + Google Analytics collect endpoint
              "connect-src 'self' https://api.fal.ai https://fal.run https://*.fal.media https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com",
              // Stripe 3-D Secure and payment iframes
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "frame-ancestors 'none'",
              "worker-src 'self' blob:",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
