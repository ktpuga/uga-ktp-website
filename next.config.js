/** @type {import('next').NextConfig} */
module.exports = {
    output: 'standalone',
    turbopack: {},
    webpack(config) {
        config.resolve.alias['@'] = __dirname; // ✅ __dirname now exists
        return config;
    },
    experimental: {
        // Server Actions default to a 1MB request body limit regardless of
        // what ktp-api's own multer config allows — every file upload here
        // (photos/video, profile pictures, documents, homepage photos) goes
        // through a Server Action with FormData, so without this every real
        // upload gets rejected by Next.js itself before ktp-api ever sees it.
        // Matches ktp-api's largest limit (photos/video, 250MB).
        serverActions: {
            bodySizeLimit: '250mb',
        },
    },
};
