import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // ============================================
  // 🔗 URL Configuration
  // ============================================
  
  /**
   * Trailing Slash - URL-ების ნორმალიზაცია
   * false: /about (არა /about/)
   * ეს უზრუნველყოფს URL-ების თანმიმდევრულობას
   */
  trailingSlash: false,

  // ============================================
  // 🖼️ Images Configuration
  // ============================================
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dxvczwjbroyxpwnnwaca.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // ============================================
  // 🔄 Redirects - URL დუბლიკატების პრევენცია
  // ============================================
  
  async redirects() {
    return [
      // Trailing slash redirect (თუ ვინმე / -ით შემოვა)
      // Next.js ავტომატურად აკეთებს trailingSlash: false-ით
      
      // Legacy URL-ები (თუ გაქვთ ძველი URL-ები)
      // {
      //   source: '/old-page',
      //   destination: '/ka/new-page',
      //   permanent: true, // 301 redirect
      // },
      
      // Root redirect to default locale
      {
        source: '/',
        destination: '/ka',
        permanent: false, // 307 redirect (შეიძლება შეიცვალოს)
      },
    ];
  },

  // ============================================
  // 📋 Headers - Security & Caching
  // ============================================
  
  async headers() {
    return [
      {
        // ყველა გვერდისთვის
        source: '/:path*',
        headers: [
          // Security Headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // SEO: Allow indexing
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
      {
        // სტატიკური ფაილებისთვის - Cache
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // sitemap და robots - მოკლე cache
        source: '/(sitemap.xml|robots.txt)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate', // 1 საათი
          },
        ],
      },
      {
        // Private გვერდები - No Index
        source: '/:locale/(login|register|profile|bookings|notifications|cms|user|forgot-password)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
