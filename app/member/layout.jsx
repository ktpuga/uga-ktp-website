'use client';

import { LayoutDashboard, Calendar, FolderOpen, Users, Settings, MessageSquare, UsersRound, Vote, QrCode, CalendarClock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import PortalShell from '@/components/portal/PortalShell';

const BASE_NAV = [
  { href: '/member', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/member/calendar', label: 'Calendar', icon: Calendar },
  { href: '/member/directory', label: 'Directory', icon: Users },
  { href: '/member/meetings', label: 'Meetings', icon: CalendarClock },
  { href: '/member/committees', label: 'Committees', icon: UsersRound },
  { href: '/member/polls', label: 'Polls', icon: Vote },
  { href: '/member/files', label: 'Files & Photos', icon: FolderOpen },
  { href: '/member/messages', label: 'Messages', icon: MessageSquare },
  { href: '/member/settings', label: 'Settings', icon: Settings },
];

const ATTENDANCE_ITEM = { href: '/member/attendance', label: 'Attendance', icon: QrCode };

export default function MemberLayout({ children }) {
  const { data: session } = useSession();
  // Chairs manage attendance for their own events; plain active members
  // never see this tab at all (eboard uses the /admin one instead — eboard
  // never actually lands on /member per middleware.ts's portal routing).
  const isChair = session?.user?.groups?.includes('chair') ?? false;

  const nav = isChair
    ? [...BASE_NAV.slice(0, 4), ATTENDANCE_ITEM, ...BASE_NAV.slice(4)]
    : BASE_NAV;

  return (
    <PortalShell portalName="Member Portal" accent="blue" nav={nav}>
      {children}
    </PortalShell>
  );
}
