'use client';

import PortalDashboard from '@/components/portal/PortalDashboard';

export default function AlumniDashboard() {
  return (
    <PortalDashboard
      welcomeTitle="Welcome back, Alumni!"
      welcomeSubtitle="Stay connected with KTP Phi Chapter"
      memberGroup="alumni"
      memberGroupLabel="Alumni Network"
      calendarHref="/alumni/calendar"
      filesHref="/alumni/files"
      theme="amber"
    />
  );
}
