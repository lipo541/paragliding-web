import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // ============================================
  // 🤖 SEO: Disable metadata streaming for crawlers
  // ============================================
  
  /**
   * htmlLimitedBots - ბოტების სია რომლებისთვისაც metadata
   * უნდა იყოს <head>-ში და არა body-ში streaming-ით
   * 
   * Next.js 16-ში default-ად მხოლოდ Twitterbot, Slackbot, Bingbot
   * არიან ამ სიაში, მაგრამ Googlebot არა!
   * 
   * ეს იწვევს canonical, hreflang და სხვა meta tags
   * body-ში rendering-ს რაც Google-ს არ ესმის.
   */
  htmlLimitedBots: /Googlebot|Bingbot|Slackbot|Twitterbot|LinkedInBot|WhatsApp|facebookexternalhit|Discordbot|TelegramBot/i,

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
        // sitemap და robots - 24 საათიანი cache (Google-friendly)
        source: '/(sitemap.xml|robots.txt)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200',
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
