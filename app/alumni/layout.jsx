'use client';

import { LayoutDashboard, Megaphone, Calendar, FolderOpen, Users, Settings, MessageSquare, UsersRound, Vote, CalendarClock, UserSearch } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { useRushCount } from '@/lib/use-rush-count';

// The sidebar renders exactly this, in this order — no second list in
// PortalShell to keep in sync.
function buildNav(hasRushees) {
  return [
  {
    heading: 'Main',
    items: [
      { href: '/alumni', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/alumni/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/alumni/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    heading: 'Community',
    items: [
      { href: '/alumni/directory', label: 'Directory', icon: Users },
        // Only while rush is running — see useRushCount.
        ...(hasRushees ? [{ href: '/alumni/rushees', label: 'Rushees', icon: UserSearch }] : []),
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
}

export default function AlumniLayout({ children }) {
  const rushCount = useRushCount();

  return (
    <PortalShell portalName="Alumni Portal" accent="amber" homeHref="/alumni" nav={buildNav(rushCount > 0)}>
      {children}
    </PortalShell>
  );
}
