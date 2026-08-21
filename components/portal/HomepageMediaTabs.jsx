'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Image as ImageIcon, Images } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
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

export default function HomepageMediaTabs() {
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

        <div className="mt-6 flex items-center gap-1 border-b border-border" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-150',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                role="tab"
                aria-selected={isActive}
              >
                <Icon size={14} />
                {tab.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                    style={{ background: accent.base }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'web' && <HomepagePhotoManager embedded />}
      {activeTab === 'ios' && <IosHomepageSlideshowManager embedded />}
    </div>
  );
}
