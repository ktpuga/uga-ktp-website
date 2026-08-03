'use client';

import { LayoutDashboard, Calendar, FolderOpen, Users, Settings, MessageSquare, UsersRound, Vote, CalendarClock } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

// The sidebar renders exactly this, in this order — no second list in
// PortalShell to keep in sync.
const NAV = [
  {
    heading: 'Main',
    items: [
      { href: '/alumni', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/alumni/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    heading: 'Community',
    items: [
      { href: '/alumni/directory', label: 'Directory', icon: Users },
      { href: '/alumni/meetings', label: 'Meetings', icon: CalendarClock },
      { href: '/alumni/committees', label: 'Committees', icon: UsersRound },
      { href: '/alumni/polls', label: 'Polls', icon: Vote },
    ],
  },
  {
    heading: 'Resources',
    items: [
      { href: '/alumni/files', label: 'Files & Photos', icon: FolderOpen },
      { href: '/alumni/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    heading: 'Account',
    items: [{ href: '/alumni/settings', label: 'Settings', icon: Settings }],
  },
];

export default function AlumniLayout({ children }) {
  return (
    <PortalShell portalName="Alumni Portal" accent="amber" homeHref="/alumni" nav={NAV}>
      {children}
    </PortalShell>
  );
}
