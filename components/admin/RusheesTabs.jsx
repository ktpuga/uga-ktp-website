'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { QrCode, Table2 } from 'lucide-react';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import PageTabs from '@/components/portal/PageTabs';
import RushSignupManager from '@/components/admin/RushSignupManager';
import RushInterestTable from '@/components/rush/RushInterestTable';

// Merged from the separate /admin/rush-signup and /admin/rush-data tabs. Both
// are the intake side of rush -- one hands out the signup link, the other reads
// what came back through it -- so they were two sidebar entries for one job.
//
// Only the ROUTE is merged. RushInterestTable stays shared with
// /member/rush-data, which is why its `embedded` prop defaults off; see the
// note on that component.
const TABS = [
  {
    id: 'signup',
    label: 'Signup Links',
    icon: QrCode,
    subtitle: 'Create and expire the links rushees use to sign themselves up',
  },
  {
    id: 'data',
    label: 'Rushee Data',
    icon: Table2,
    subtitle: 'What every rushee filled in while building their profile. Export it to open in Google Sheets or Excel.',
  },
];

function RusheesTabsInner() {
  const accent = useAccentPalette();
  const searchParams = useSearchParams();
  // ?tab=data is where the retired /admin/rush-data route redirects, so an
  // existing bookmark still opens the table rather than the signup form.
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'data' ? 'data' : 'signup');
  const current = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>
          Admin Panel
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Rushees</h1>
        <p className="mt-1 text-sm text-muted-foreground">{current.subtitle}</p>

        <PageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} className="mt-6" />
      </div>

      {activeTab === 'signup' && <RushSignupManager embedded />}
      {activeTab === 'data' && <RushInterestTable embedded />}
    </div>
  );
}

// useSearchParams needs a boundary or it opts the whole route out of
// prerendering. Same shape PhotoFiles uses for its ?tab= handling.
export default function RusheesTabs() {
  return (
    <Suspense fallback={<div className="min-h-48" aria-busy="true" />}>
      <RusheesTabsInner />
    </Suspense>
  );
}
