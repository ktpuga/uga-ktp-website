'use client';

import PortalDashboard from '@/components/portal/PortalDashboard';
import { usePortalAccent } from '@/components/portal/PortalAccentContext';

export default function AdminDashboard() {
  // The same dashboard the member, pledge and rush portals land on. Analytics
  // used to be the landing page; it kept its own tab at /admin/analytics.
  //
  // Accent comes from the context rather than a hardcoded 'red' so the hero and
  // stat cards follow the Admin red/blue toggle, like every other admin surface.
  const accent = usePortalAccent();

  return (
    <PortalDashboard
      welcomeSubtitle="Here's what's happening in KTP Phi Chapter"
      memberGroupLabel="Chapter Members"
      calendarHref="/admin/calendar"
      filesHref="/admin/files"
      announcementsHref="/admin/announcements"
      theme={accent}
    />
  );
}
