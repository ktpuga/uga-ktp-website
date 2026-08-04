'use client';

import PortalDashboard from '@/components/portal/PortalDashboard';

export default function MemberDashboard() {
  return (
    <PortalDashboard
      welcomeSubtitle="Here's what's happening in KTP Phi Chapter"
      memberGroupLabel="Active Members"
      calendarHref="/member/calendar"
      filesHref="/member/files"
      announcementsHref="/member/announcements"
      theme="blue"
    />
  );
}
