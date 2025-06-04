/** @type {import('next').NextConfig} */
module.exports = {
  webpack(config) {
    config.resolve.alias['@'] = __dirname; // ✅ __dirname now exists
    return config;
  },
};