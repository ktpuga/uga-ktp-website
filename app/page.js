import React from 'react';
import Page from '../components/template-page';
import { getHourlySpotlightLinks } from './spotlight/links';

export const dynamic = 'force-dynamic';

export default function Home() {
  const spotlightLinks = getHourlySpotlightLinks(3);

  return (
    <>
    <Page spotlightLinks={spotlightLinks}/>
    </>
  );
}
