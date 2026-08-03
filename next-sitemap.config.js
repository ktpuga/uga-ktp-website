/** @type {import('next-sitemap').IConfig} */
const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://ugaktp.com';

const config = {
    siteUrl,
    generateRobotsTxt: true,           // (optional) Generate a robots.txt file

    // Every authenticated route is excluded. next-sitemap lists all static
    // routes by default, so the public sitemap at ugaktp.com/sitemap.xml was
    // advertising /admin, /member, /alumni, /pledge, /rushee and
    // /complete-profile to search engines.
    //
    // Nothing leaked — proxy.ts 307s all of them to /login — but publishing
    // the admin portal's URL is pointless for SEO (a crawler only ever sees
    // the redirect) and needlessly describes the app's shape to anyone reading
    // the sitemap. Both the bare path and its children have to be listed;
    // '/admin' alone does not cover '/admin/users'.
    exclude: [
        '/members-list',
        '/admin', '/admin/*',
        '/member', '/member/*',
        '/alumni', '/alumni/*',
        '/pledge', '/pledge/*',
        '/rushee', '/rushee/*',
        '/complete-profile', '/complete-profile/*',
        // Landing page for an attendance QR — useless without a live token.
        '/checkin/*',
        // Generated files, not pages. They were listing themselves.
        '/robots.txt', '/sitemap.xml',
        // JSON served for iOS universal links (see docs/website/universal-links).
        // A route, but never a page a human or crawler should land on.
        '/.well-known/apple-app-site-association',
    ],
    // Additional options if needed
    // transform: async (config, path) => {
    //   // Example: automatically remove trailing slash from all paths
    //   return {
    //     loc: path.replace(/\/$/, ''),
    //     changefreq: 'daily',
    //     priority: 0.7,
    //     lastmod: new Date().toISOString(),
    //   }
    // },
  };
  
  module.exports = config;
  