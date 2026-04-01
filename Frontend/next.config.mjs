/** @type {import('next').NextConfig} */
const nextConfig = {
  // Leaflet uses browser globals — exclude from SSR bundling
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "leaflet"];
    }
    return config;
  },
};

export default nextConfig;
