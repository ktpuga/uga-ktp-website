import React from 'react';
import Page from '../components/template-page';
import { getHourlySpotlightLinks } from './spotlight/links';
import { getRotatingHeroPhotos } from '@/lib/hero-photos';

export const dynamic = 'force-dynamic';

// `force-dynamic` alone would drop the default for every fetch on this route to
// no-store, which would defeat the 10-minute revalidate in lib/hero-photos.js
// and put a ktp-api call on the single most-visited page in the site, per
// visitor. This puts each fetch back in charge of its own caching. The page
// still renders per request -- the spotlight rotates hourly and depends on it.
//
// Only the hero fetch is affected: nothing else here fetches, and
// template-page.jsx is a client component whose requests run in the browser.
export const fetchCache = 'default-cache';

export default async function Home() {
  const spotlightLinks = getHourlySpotlightLinks(3);
  // Resolved here rather than in the client component so the collage is right
  // on the first paint. Returns [] on any failure -- a slow or unreachable
  // ktp-api falls back to the hardcoded photos rather than delaying the page.
  const heroPhotos = await getRotatingHeroPhotos();

  return (
    <>
    <Page spotlightLinks={spotlightLinks} heroPhotos={heroPhotos} />
    </>
  );
}
