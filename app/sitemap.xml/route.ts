import { groq } from 'next-sanity';
import { NextResponse } from 'next/server';
import { client } from '../../sanity/client'; // or '@/sanity/client'
                                                   
export const revalidate = 30;                            // <= ISR window

/* --- 1. Query all blog slugs ---------------------------------------- */
const POST_QUERY = groq`
  *[_type == "post" && defined(slug.current)]{
    "slug": slug.current,
    publishedAt
  }
`;

/* --- 2. Hard-code any non-blog routes you want indexed -------------- */
const STATIC_PAGES = [
  '/',                     // home
  '/#about',
  '/#contact',
  '/#alumni',
  '/#leadership',
  '/rush',
  '/hackathon',
  '/links',
  '/code-of-conduct',
  '/blog',                 // blog index
  '/sponsorship',
];

export async function GET() {
  const base  = "https://KTPGeorgia.com";
  const posts = await client.fetch<{ slug: string; publishedAt: string }[]>(POST_QUERY);

  /* --- Static page <url> blocks ------------------------------------ */
  const staticXml = STATIC_PAGES.map(
    (path) => `
  <url>
    <loc>${base}${path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>${path === '/' ? '1.0' : '0.7'}</priority>
  </url>`
  ).join('');

  /* --- Blog post <url> blocks -------------------------------------- */
  const postXml = posts.map(
    ({ slug, publishedAt }) => `
  <url>
    <loc>${base}/blog/${slug}</loc>
    <lastmod>${new Date(publishedAt).toISOString()}</lastmod>
  </url>`
  ).join('');

  /* --- Final XML --------------------------------------------------- */
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${postXml}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
