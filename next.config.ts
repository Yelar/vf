import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Azure Static Web Apps
  output: 'standalone',
  
  // Add trailing slash handling
  trailingSlash: false,
  
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
    };

    return config;
  },
  // Server external packages (moved from experimental)
  serverExternalPackages: [
    '@remotion/bundler', 
    '@remotion/renderer',
    'esbuild',
    'sharp',
    'canvas'
  ],
};

export default nextConfig;
