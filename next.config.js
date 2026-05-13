/** @type {import('next').NextConfig} */
module.exports = {
    output: 'standalone',
    turbopack: {},
    webpack(config) {
        config.resolve.alias['@'] = __dirname; // ✅ __dirname now exists
        return config;
    },
};
