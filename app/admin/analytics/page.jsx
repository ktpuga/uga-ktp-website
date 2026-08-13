'use client';

import AnalyticsContent from '@/components/analytics/AnalyticsContent';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';

export default function AdminAnalyticsPage() {
  // Follows the Admin red/blue toggle rather than a hardcoded maroon — the
  // provider is PortalShell, so this resolves to whichever colour the sidebar
  // is currently showing.
  const accent = useAccentPalette();

  return (
    <AnalyticsContent
      accentBase={accent.base}
      accentGradient={accent.gradient}
      accentMuted={accent.muted}
      accentLight={accent.light}
    />
  );
}
