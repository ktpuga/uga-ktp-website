'use client';

import PortalDashboard from '@/components/portal/PortalDashboard';

export default function AlumniDashboard() {
  return (
    <PortalDashboard
      welcomeTitle="Welcome back, Alumni!"
      welcomeSubtitle="Stay connected with KTP Phi Chapter"
      memberGroupLabel="Members"
      calendarHref="/alumni/calendar"
      filesHref="/alumni/files"
      theme="amber"
    />
  );
}
