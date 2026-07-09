'use client';

import { LayoutDashboard, Calendar, FolderOpen, Users, Settings, MessageSquare, UsersRound } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

const NAV = [
  { href: '/member', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/member/calendar', label: 'Calendar', icon: Calendar },
  { href: '/member/directory', label: 'Directory', icon: Users },
  { href: '/member/committees', label: 'Committees', icon: UsersRound },
  { href: '/member/files', label: 'Files & Photos', icon: FolderOpen },
  { href: '/member/messages', label: 'Messages', icon: MessageSquare },
  { href: '/member/settings', label: 'Settings', icon: Settings },
];

export default function MemberLayout({ children }) {
  return (
    <PortalShell portalName="Member Portal" accent="blue" nav={NAV}>
      {children}
    </PortalShell>
  );
}
