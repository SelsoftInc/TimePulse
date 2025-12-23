/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Enable SWC minification for faster builds
  
  // Optimize on-demand entries
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // Increased for better caching
    pagesBufferLength: 5, // Increased buffer
  },
  
  // API proxy to backend server
  // Exclude NextAuth routes from proxy
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy all API routes to backend EXCEPT /api/auth/*
        {
          source: '/api/:path((?!auth).*)*',
          destination: 'http://44.222.217.57:5001/api/:path*',
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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://44.222.217.57:5001',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://44.222.217.57:5001',
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
    // Remove React properties in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Modularize imports for tree shaking
  modularizeImports: {
    '@fortawesome/react-fontawesome': {
      transform: '@fortawesome/react-fontawesome',
    },
  },
  
  // Experimental features for performance
  experimental: {
    // optimizeCss disabled - requires 'critters' package
    optimizePackageImports: ['@fortawesome/react-fontawesome', 'react-icons'],
  },
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
  }),
};

module.exports = nextConfig;
