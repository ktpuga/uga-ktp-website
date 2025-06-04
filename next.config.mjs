/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
   webpack(config) {
    // __dirname shim
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    config.resolve.alias['@'] = dirname;
    return config;
   },
};

export default nextConfig;
