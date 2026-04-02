/** @type {import('next').NextConfig} */
const nextConfig = {
  // Leaflet uses browser globals — exclude from SSR bundling
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "leaflet"];
    }
    return config;
  },

  // Proxy API calls to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
