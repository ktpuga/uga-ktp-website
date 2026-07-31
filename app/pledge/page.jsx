'use client';

import PortalDashboard from '@/components/portal/PortalDashboard';

export default function PledgeDashboard() {
  return (
    <PortalDashboard
      welcomeSubtitle="Here's what's happening during your pledge semester"
      memberGroupLabel="Chapter Members"
      calendarHref="/pledge/calendar"
      filesHref="/pledge/files"
      theme="blue"
    />
  );
}
