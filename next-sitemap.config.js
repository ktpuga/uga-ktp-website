/** @type {import('next-sitemap').IConfig} */
const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://ugaktp.com';

const config = {
    siteUrl,
    generateRobotsTxt: true,           // (optional) Generate a robots.txt file
    // Exclude specific (optional)
    // exclude: ['/secret-page', '/admin/*'],
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
  