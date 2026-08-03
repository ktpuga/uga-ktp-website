'use client';

import { LayoutDashboard, Calendar, FolderOpen, Users, Settings, MessageSquare, Vote, CalendarClock, UserSearch } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { useRushCount } from '@/lib/use-rush-count';

// No Committees: pledges don't get that tab, and /pledge/committees doesn't
// exist as a route either.
//
// The sidebar renders exactly this, in this order — no second list in
// PortalShell to keep in sync.
function buildNav(hasRushees) {
  return [
  {
    heading: 'Main',
    items: [
      { href: '/pledge', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/pledge/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    heading: 'Community',
    items: [
      { href: '/pledge/directory', label: 'Directory', icon: Users },
        // Only while rush is running — see useRushCount.
        ...(hasRushees ? [{ href: '/pledge/rushees', label: 'Rushees', icon: UserSearch }] : []),
      { href: '/pledge/meetings', label: 'Meetings', icon: CalendarClock },
      { href: '/pledge/polls', label: 'Polls', icon: Vote },
    ],
  },
  {
    heading: 'Resources',
    items: [
      { href: '/pledge/files', label: 'Files & Photos', icon: FolderOpen },
      { href: '/pledge/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    heading: 'Account',
    items: [{ href: '/pledge/settings', label: 'Settings', icon: Settings }],
  },
  ];
}

// accent="teal" renders the same blue as Member and always has. The key is kept
// only so the change stays isolated to nav wiring; it can now safely become
// 'blue' since accent no longer selects nav structure or the home href.
export default function PledgeLayout({ children }) {
  const rushCount = useRushCount();

  return (
    <PortalShell portalName="Pledge Portal" accent="teal" homeHref="/pledge" nav={buildNav(rushCount > 0)}>
      {children}
    </PortalShell>
  );
}
