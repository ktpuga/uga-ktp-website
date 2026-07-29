'use client';

import AnalyticsContent from '@/components/analytics/AnalyticsContent';

// Same maroon values as PortalShell.jsx's REVAMPED_ACCENTS.red — kept in
// sync manually since this page renders outside the sidebar's own scope.
const MAROON = {
  base: '#7f1d1d',
  gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
  muted: 'rgba(127,29,29,0.10)',
  light: '#991b1b',
};

export default function AdminAnalyticsPage() {
  return (
    <AnalyticsContent
      accentBase={MAROON.base}
      accentGradient={MAROON.gradient}
      accentMuted={MAROON.muted}
      accentLight={MAROON.light}
    />
  );
}
