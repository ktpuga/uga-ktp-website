'use client';

import { LayoutDashboard, Calendar, FolderOpen, Users, Settings, MessageSquare, UsersRound, Vote, QrCode, CalendarClock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import PortalShell from '@/components/portal/PortalShell';

// The sidebar renders exactly this, in this order. It used to be a flat array
// here plus a matching NAV_GROUPING entry in PortalShell keyed by accent —
// two files that had to agree, where an href in one and not the other silently
// vanished from the sidebar. Now there is only this.
const ATTENDANCE_ITEM = { href: '/member/attendance', label: 'Attendance', icon: QrCode };

function buildNav(isChair) {
  return [
    {
      heading: 'Main',
      items: [
        { href: '/member', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/member/calendar', label: 'Calendar', icon: Calendar },
      ],
    },
    {
      heading: 'Community',
      items: [
        { href: '/member/directory', label: 'Directory', icon: Users },
        { href: '/member/meetings', label: 'Meetings', icon: CalendarClock },
        { href: '/member/committees', label: 'Committees', icon: UsersRound },
        { href: '/member/polls', label: 'Polls', icon: Vote },
        // Chairs manage attendance for their own events; plain active members
        // never see this tab at all (eboard uses the /admin one instead —
        // eboard never lands on /member per proxy.ts's portal routing).
        ...(isChair ? [ATTENDANCE_ITEM] : []),
      ],
    },
    {
      heading: 'Resources',
      items: [
        { href: '/member/files', label: 'Files & Photos', icon: FolderOpen },
        { href: '/member/messages', label: 'Messages', icon: MessageSquare },
      ],
    },
    {
      heading: 'Account',
      items: [{ href: '/member/settings', label: 'Settings', icon: Settings }],
    },
  ];
}

export default function MemberLayout({ children }) {
  const { data: session } = useSession();
  const isChair = session?.user?.groups?.includes('chair') ?? false;

  return (
    <PortalShell portalName="Member Portal" accent="blue" homeHref="/member" nav={buildNav(isChair)}>
      {children}
    </PortalShell>
  );
}
