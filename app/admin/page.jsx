'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutDashboard, BarChart2 } from 'lucide-react';
import PortalDashboard from '@/components/portal/PortalDashboard';
import AnalyticsContent from '@/components/analytics/AnalyticsContent';
import PageTabs from '@/components/portal/PageTabs';
import { usePortalAccent, useAccentPalette } from '@/components/portal/PortalAccentContext';

// The portal root, now carrying Analytics as a second tab rather than as its
// own sidebar entry.
//
// Dashboard is deliberately FIRST. Analytics used to be the landing page and
// was split out on 2026-08-03 so eboard sees the chapter at a glance first, the
// way every other portal opens; tab order is what preserves that, so do not
// reorder these.
//
// Neither half is modified to sit here: the dashboard's gradient hero already
// acts as its heading, and AnalyticsContent brings its own. That is why there is
// no page heading above the switcher, and why PortalDashboard -- shared with the
// member, pledge and rushee portals -- needed no `embedded` prop.
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

function AdminHomeInner() {
  // Accent comes from the context rather than a hardcoded 'red' so the hero and
  // stat cards follow the Admin red/blue toggle, like every other admin surface.
  const accent = usePortalAccent();
  const palette = useAccentPalette();
  const searchParams = useSearchParams();
  // ?tab=analytics is where the retired /admin/analytics route redirects.
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'analytics' ? 'analytics' : 'dashboard');

  return (
    <div className="space-y-6">
      <PageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'dashboard' && (
        <PortalDashboard
          welcomeSubtitle="Here's what's happening in KTP Phi Chapter"
          memberGroupLabel="Chapter Members"
          calendarHref="/admin/calendar"
          filesHref="/admin/files"
          announcementsHref="/admin/announcements"
          theme={accent}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsContent
          accentBase={palette.base}
          accentGradient={palette.gradient}
          accentMuted={palette.muted}
          accentLight={palette.light}
        />
      )}
    </div>
  );
}

// useSearchParams needs a boundary or it opts the whole route out of
// prerendering. Same shape as the other merged pages.
export default function AdminHome() {
  return (
    <Suspense fallback={<div className="min-h-48" aria-busy="true" />}>
      <AdminHomeInner />
    </Suspense>
  );
}
