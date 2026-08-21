'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Image as ImageIcon, Images } from 'lucide-react';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import PageTabs from '@/components/portal/PageTabs';
import HomepagePhotoManager from '@/components/portal/HomepagePhotoManager';
import IosHomepageSlideshowManager from '@/components/portal/IosHomepageSlideshowManager';

// Merged from the separate /admin/homepage-photos and
// /admin/ios-homepage-slideshow tabs. Both answer the same question -- what a
// stranger sees when they open KTP -- so they were two sidebar entries for one
// job.
//
// Only the ROUTE is merged. They stay two managers because they read two
// different stores: the web gallery is Immich albums, the iOS slideshow keeps
// its own derivatives. Each renders its own page container and its own action
// buttons; `embedded` suppresses only their duplicate title block, so this
// wrapper owns the one heading and the tab bar above it.
const TABS = [
  {
    id: 'web',
    label: 'Website',
    icon: ImageIcon,
    subtitle: 'Manage what appears in the public gallery on the chapter homepage',
  },
  {
    id: 'ios',
    label: 'iOS App',
    icon: Images,
    subtitle: "Controls the slideshow on the KTP Life app's home screen",
  },
];

function HomepageMediaTabsInner() {
  const accent = useAccentPalette();
  const searchParams = useSearchParams();
  // ?tab=ios is where the retired /admin/ios-homepage-slideshow route redirects,
  // so an existing bookmark still opens the slideshow rather than silently
  // landing on the web gallery. Same shape as PhotoFiles' ?tab=documents.
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'ios' ? 'ios' : 'web');
  const current = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>
          Admin Panel
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Homepage Media</h1>
        <p className="mt-1 text-sm text-muted-foreground">{current.subtitle}</p>

        <PageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} className="mt-6" />
      </div>

      {activeTab === 'web' && <HomepagePhotoManager embedded />}
      {activeTab === 'ios' && <IosHomepageSlideshowManager embedded />}
    </div>
  );
}

// useSearchParams needs a boundary or it opts the whole route out of
// prerendering. This page happens to be dynamic anyway -- its auth() call sees
// to that -- but the boundary is what makes that a choice rather than a
// coincidence, and it matches PhotoFiles and RusheesTabs.
export default function HomepageMediaTabs() {
  return (
    <Suspense fallback={<div className="min-h-48" aria-busy="true" />}>
      <HomepageMediaTabsInner />
    </Suspense>
  );
}
