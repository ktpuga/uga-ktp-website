import { NextResponse } from 'next/server';

export const revalidate = 30;

export function GET() {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://ugaktp.com'
  ).replace(/\/$/, '');
  const sitemap = `${base}/sitemap.xml`;
  return new NextResponse(
    `User-agent: *
Allow: /

Sitemap: ${sitemap}
`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}
