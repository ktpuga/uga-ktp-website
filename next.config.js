/** @type {import('next').NextConfig} */
module.exports = {
    output: 'standalone',

    // Next 16 builds with Turbopack by default, and a custom `webpack()` block
    // makes `next build` fail outright rather than being silently ignored — so
    // the one that used to be here is gone. It only did
    // `config.resolve.alias['@'] = __dirname`, which was always redundant:
    // jsconfig.json already maps "@/*" to "./*" and Next reads that natively
    // for both bundlers.
    turbopack: {
        // Pinned because there is a stray package-lock.json in the Windows home
        // directory, and Turbopack's root inference walks up and picks THAT as
        // the workspace root — which made every module path resolve as
        // ./Documents/GitHub/uga-ktp-website/... and broke the build. Docker
        // never sees it (only the repo is copied in), so this only bites local
        // builds, but an inferred root is worth pinning either way.
        root: __dirname,
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
