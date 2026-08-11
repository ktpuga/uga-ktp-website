'use client';

import { LayoutDashboard, Megaphone, Calendar, FolderOpen, Users, Settings, MessageSquare, Vote, CalendarClock } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

// No Committees: pledges don't get that tab, and /pledge/committees doesn't
// exist as a route either.
//
// The sidebar renders exactly this, in this order — no second list in
// PortalShell to keep in sync.
function buildNav() {
  return [
  {
    heading: 'Main',
    items: [
      { href: '/pledge', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/pledge/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/pledge/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    heading: 'Community',
    items: [
      // Rushees used to be a sibling entry here. They're a tab inside the
      // Directory now, along with every other member group, so there is one
      // place to look people up rather than two.
      { href: '/pledge/directory', label: 'Directory', icon: Users },
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
  return (
    <PortalShell portalName="Pledge Portal" accent="teal" homeHref="/pledge" nav={buildNav()}>
      {children}
    </PortalShell>
  );
}
