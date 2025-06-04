/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    webpack(config) {
    config.resolve.alias['@'] = __dirname;   // <—— alias “@/” → project root
    return config;
  },
};

export default nextConfig;
