'use client';

import { LayoutDashboard, Calendar, FolderOpen, Users, Settings, MessageSquare, Vote, CalendarClock } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

const NAV = [
  { href: '/pledge', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pledge/calendar', label: 'Calendar', icon: Calendar },
  { href: '/pledge/directory', label: 'Directory', icon: Users },
  { href: '/pledge/meetings', label: 'Meetings', icon: CalendarClock },
  { href: '/pledge/polls', label: 'Polls', icon: Vote },
  { href: '/pledge/files', label: 'Files & Photos', icon: FolderOpen },
  { href: '/pledge/messages', label: 'Messages', icon: MessageSquare },
  { href: '/pledge/settings', label: 'Settings', icon: Settings },
];

export default function PledgeLayout({ children }) {
  return (
    <PortalShell portalName="Pledge Portal" accent="teal" nav={NAV}>
      {children}
    </PortalShell>
  );
}
