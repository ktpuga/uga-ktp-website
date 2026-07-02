'use client';

import PortalDashboard from '@/components/portal/PortalDashboard';

export default function MemberDashboard() {
  return (
    <PortalDashboard
      welcomeSubtitle="Here's what's happening in KTP Georgia"
      memberGroupLabel="Active Members"
      calendarHref="/member/calendar"
      filesHref="/member/files"
      theme="blue"
    />
  );
}
