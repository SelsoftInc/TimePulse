/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Disable caching in development for instant UI updates
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // API proxy to backend server
  // Exclude NextAuth routes from proxy
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy all API routes to backend EXCEPT /api/auth/*
        {
          source: '/api/:path((?!auth).*)*',
          destination: 'http://localhost:5001/api/:path*',
        },
      ],
    };
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001',
  },
  
  // Webpack configuration for PDF and other file handling
  webpack: (config, { isServer, dev }) => {
    // Handle canvas for jspdf
    config.resolve.alias.canvas = false;
    
    // Handle PDF.js worker
    config.resolve.alias['pdfjs-dist'] = 'pdfjs-dist/legacy/build/pdf';
    
    // Disable caching in development
    if (dev) {
      config.cache = false;
    }
    
    return config;
  },
  
  // Disable static optimization for better hot reload
  ...(process.env.NODE_ENV === 'development' && {
    generateBuildId: async () => {
      return 'development-' + Date.now();
    },
  }),
  
  // Compiler options for better performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Experimental features
  experimental: {
    // Enable faster refresh
    optimizeCss: false,
    // Disable SWC minification in dev for faster builds
    ...(process.env.NODE_ENV === 'development' && {
      swcMinify: false,
    }),
  },
};

module.exports = nextConfig;
