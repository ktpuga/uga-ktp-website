'use client';

import PortalDashboard from '@/components/portal/PortalDashboard';

export default function MemberDashboard() {
  return (
    <PortalDashboard
      welcomeTitle="Welcome back, Member!"
      welcomeSubtitle="Here's what's happening in KTP Georgia"
      memberGroup="active"
      memberGroupLabel="Active Members"
      calendarHref="/member/calendar"
      filesHref="/member/files"
      theme="blue"
    />
  );
}
