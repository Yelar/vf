import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude TypeScript declaration files from being processed
    config.module.rules.push({
      test: /\.d\.ts$/,
      use: 'ignore-loader',
    });

    // Exclude problematic node_modules from being processed by webpack
    config.module.rules.push({
      test: /node_modules\/(esbuild|@esbuild)\/.*\.(js|ts|d\.ts)$/,
      use: 'ignore-loader',
    });

    // Handle Remotion's specific requirements for server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'commonjs canvas',
        'sharp': 'commonjs sharp',
        'esbuild': 'commonjs esbuild',
      });
    }

    // Improve resolve fallbacks for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
      };
    }

    // Handle specific module resolution issues
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prevent webpack from trying to bundle server-only packages on client
      '@remotion/bundler': isServer ? '@remotion/bundler' : false,
      '@remotion/renderer': isServer ? '@remotion/renderer' : false,
      // Exclude heavy packages from client bundle
      'better-sqlite3': isServer ? 'better-sqlite3' : false,
      'sqlite3': isServer ? 'sqlite3' : false,
      'aws-sdk': isServer ? 'aws-sdk' : false,
    };

    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
  // Server external packages (moved from experimental)
  serverExternalPackages: [
    '@remotion/bundler', 
    '@remotion/renderer',
    'esbuild',
    'sharp',
    'canvas',
    'mongoose',
    'better-sqlite3',
    'sqlite3',
    'aws-sdk'
  ],
  // Azure Static Web Apps specific configuration
  output: process.env.BUILD_STATIC === 'true' ? 'export' : 'standalone',
  trailingSlash: false,
  generateBuildId: async () => {
    // Use commit hash or timestamp for consistent builds
    return process.env.GITHUB_SHA?.slice(0, 7) || Date.now().toString();
  },
  // API routes configuration for Azure
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/((?!.swa).*)/api/auth/:path*',
          destination: '/api/auth/:path*',
        },
      ]
    };
  },
  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXTAUTH_URL || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
