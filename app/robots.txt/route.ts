import { NextResponse } from 'next/server';

export const revalidate = 30;

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return new NextResponse(
    `User-agent: *
Allow: /

Sitemap: KTPGeorgia.com/sitemap.xml
`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}
