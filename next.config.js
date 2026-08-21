/** @type {import('next').NextConfig} */
module.exports = {
    output: 'standalone',

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000',
                    },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                    },
                    {
                        key: 'Content-Security-Policy-Report-Only',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "img-src 'self' data: blob: https://cdn.sanity.io https://www.googletagmanager.com https://companieslogo.com https://freepnglogo.com https://images.icon-icons.com https://images.seeklogo.com https://upload.wikimedia.org https://brand.uga.edu",
                            "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.api.sanity.io",
                            "frame-src 'self' https://www.googletagmanager.com",
                            "frame-ancestors 'self'",
                            "base-uri 'self'",
                            "form-action 'self' https://auth.ugaktp.com",
                            "object-src 'none'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },

    async redirects() {
        return [
            // Alumni used to have their own portal at /alumni — the same pages
            // in amber. They now share /member, so old bookmarks and links in
            // past emails would 404 without this.
            //
            // Deliberately NOT permanent: a 308 is cached by the browser
            // indefinitely, so if the chapter ever wants an alumni-only portal
            // back, everyone who followed one of these would keep being sent
            // to /member with no way to clear it short of a hard reset.
            { source: '/alumni', destination: '/member', permanent: false },
            { source: '/alumni/:path*', destination: '/member/:path*', permanent: false },

            // Admin nav consolidation: pages that used to be their own sidebar
            // entry are now tabs on a merged page. Non-permanent for the same
            // reason as /alumni above — a 308 sticks in the browser forever, so
            // splitting one back out later would strand whoever followed it.
            //
            // The slideshow keeps ?tab=ios so an existing bookmark opens the
            // tab it named, rather than silently landing on the web gallery.
            { source: '/admin/homepage-photos', destination: '/admin/homepage-media', permanent: false },
            { source: '/admin/ios-homepage-slideshow', destination: '/admin/homepage-media?tab=ios', permanent: false },

            // Rush Signup + Rushee Data -> /admin/rushees. Note these are the
            // PAGE routes only. `/api/admin/rush-signup` is a different path
            // and an exact-match source cannot swallow it, but the two strings
            // look alike enough to be worth saying so out loud.
            { source: '/admin/rush-signup', destination: '/admin/rushees', permanent: false },
            { source: '/admin/rush-data', destination: '/admin/rushees?tab=data', permanent: false },

            // Reports + Activity Log -> /admin/oversight.
            { source: '/admin/reports', destination: '/admin/oversight', permanent: false },
            { source: '/admin/logs', destination: '/admin/oversight?tab=log', permanent: false },

            // Analytics -> the second tab on the portal root.
            { source: '/admin/analytics', destination: '/admin?tab=analytics', permanent: false },
        ];
    },

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
