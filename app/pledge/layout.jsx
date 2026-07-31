'use client';

import { LayoutDashboard, Calendar, FolderOpen, Users, Settings, MessageSquare, Vote } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

const NAV = [
  { href: '/pledge', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pledge/calendar', label: 'Calendar', icon: Calendar },
  { href: '/pledge/directory', label: 'Directory', icon: Users },
  { href: '/pledge/polls', label: 'Polls', icon: Vote },
  { href: '/pledge/files', label: 'Files & Photos', icon: FolderOpen },
  { href: '/pledge/messages', label: 'Messages', icon: MessageSquare },
  { href: '/pledge/settings', label: 'Settings', icon: Settings },
];

export default function PledgeLayout({ children }) {
  return (
    <PortalShell portalName="Pledge Portal" accent="blue" nav={NAV}>
      {children}
    </PortalShell>
  );
}
