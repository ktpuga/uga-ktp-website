/** @type {import('next-sitemap').IConfig} */
const config = {
    siteUrl: 'https://ktpgeorgia.com', // Your production website domain
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
  