'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ScrollText } from 'lucide-react';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import PageTabs from '@/components/portal/PageTabs';
import ModerationQueue from '@/components/portal/ModerationQueue';
import ActivityLogPage from '@/components/portal/ActivityLogPage';

// Merged from the separate /admin/reports and /admin/logs tabs. Both answer
// "who did that": one is what members flagged, the other is what everyone did.
//
// Reports brings its own Open/History tab bar, which is why the page level here
// is a segmented control -- see PageTabs for the reasoning. The two tabs keep
// their own content widths (3xl and 4xl), so the column shifts slightly when
// switching; that is each component's natural measure rather than an oversight.
const TABS = [
  {
    id: 'reports',
    label: 'Reports',
    icon: ShieldAlert,
    subtitle: 'What members flagged for the eboard to look at',
  },
  {
    id: 'log',
    label: 'Activity Log',
    icon: ScrollText,
    subtitle: 'Everything created, edited or deleted across the site, newest first. Direct messages and group chat conversations are deliberately excluded.',
  },
];

function OversightTabsInner() {
  const accent = useAccentPalette();
  const searchParams = useSearchParams();
  // ?tab=log is where the retired /admin/logs route redirects.
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'log' ? 'log' : 'reports');
  const current = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>
          Admin Panel
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Oversight</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{current.subtitle}</p>

        <PageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} className="mt-6" />
      </div>

      {activeTab === 'reports' && <ModerationQueue embedded />}
      {activeTab === 'log' && <ActivityLogPage embedded />}
    </div>
  );
}

// useSearchParams needs a boundary or it opts the whole route out of
// prerendering. Same shape as PhotoFiles and the other merged pages.
export default function OversightTabs() {
  return (
    <Suspense fallback={<div className="min-h-48" aria-busy="true" />}>
      <OversightTabsInner />
    </Suspense>
  );
}
